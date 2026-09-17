import os, re, unicodedata
from typing import Any
import numpy as np
import psycopg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from rapidfuzz.fuzz import ratio
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import faiss

app = FastAPI(title="BPS Matching Model Service", version="1.0.0")

class Mapping(BaseModel):
    columnA: str
    columnB: str

class MatchRequest(BaseModel):
    datasetAId: int
    datasetBId: int
    columnMappings: list[Mapping] = Field(min_length=1)
    threshold: float = Field(ge=0, le=1)


def db_conn():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg.connect(url)


def normalize(value: Any) -> str:
    if value is None:
        return ""
    text = unicodedata.normalize("NFKC", str(value)).lower()
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_records(dataset_id: int):
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, idsbr, raw_data FROM dataset_records WHERE dataset_id=%s ORDER BY id",
                (dataset_id,),
            )
            return cur.fetchall()


def row_value(row: tuple, column: str) -> str:
    raw = row[2] or {}
    if isinstance(raw, dict) and column in raw:
        return normalize(raw[column])
    # Backwards compatibility with the legacy database columns.
    aliases = {
        "idsbr": row[1],
    }
    return normalize(aliases.get(column, ""))


def combined_text(row: tuple, mappings: list[Mapping], side: str) -> str:
    parts = []
    for m in mappings:
        column = m.columnA if side == "A" else m.columnB
        v = row_value(row, column)
        if v:
            weight = 2 if any(x in column.lower() for x in ("nama", "name")) else 1
            parts.append((v + " ") * weight)
    return " ".join(parts)


def candidate_indices(text_a: list[str], text_b: list[str], top_k: int):
    corpus = text_a + text_b
    vectorizer = TfidfVectorizer(analyzer="char", ngram_range=(3, 5), min_df=1, max_features=200_000, sublinear_tf=True)
    X = vectorizer.fit_transform(corpus).astype(np.float32)
    A = X[:len(text_a)]
    B = X[len(text_a):]

    # FAISS requires dense vectors. Reduce to a compact latent representation
    # before indexing so large datasets do not trigger the dense-matrix memory
    # explosion that the previous implementation suffered from.
    n_components = min(128, max(2, min(A.shape[1] - 1, A.shape[0] - 1, B.shape[0] - 1)))
    if n_components >= 2 and X.shape[1] > n_components:
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        all_dense = svd.fit_transform(X).astype(np.float32)
        A_dense = all_dense[:len(text_a)]
        B_dense = all_dense[len(text_a):]
    else:
        A_dense = A.toarray().astype(np.float32)
        B_dense = B.toarray().astype(np.float32)

    faiss.normalize_L2(B_dense)
    index = faiss.IndexFlatIP(B_dense.shape[1])
    index.add(B_dense)

    pairs = []
    batch_size = 256
    k = min(top_k, len(text_b))
    for start in range(0, len(A_dense), batch_size):
        batch = A_dense[start:start + batch_size].copy()
        faiss.normalize_L2(batch)
        scores, inds = index.search(batch, k)
        for i, (row_scores, row_inds) in enumerate(zip(scores, inds)):
            for score, j in zip(row_scores, row_inds):
                if j >= 0:
                    # FAISS score is inner product after L2 normalization of the
                    # SVD representation, i.e. cosine similarity in latent space.
                    tfidf_score = float(A[start + i].multiply(B[int(j)]).sum())
                    pairs.append((
                        start + i,
                        int(j),
                        float(max(0.0, min(1.0, score))),
                        float(max(0.0, min(1.0, tfidf_score))),
                    ))
    return pairs


def field_similarity(row_a: tuple, row_b: tuple, mapping: Mapping) -> float:
    a = row_value(row_a, mapping.columnA)
    b = row_value(row_b, mapping.columnB)
    if not a or not b:
        return 0.0
    return ratio(a, b) / 100.0

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/match")
def match(req: MatchRequest):
    if req.datasetAId == req.datasetBId:
        raise HTTPException(400, "Dataset A and Dataset B must be different")

    rows_a = get_records(req.datasetAId)
    rows_b = get_records(req.datasetBId)
    if not rows_a or not rows_b:
        return {"success": False, "error": "Salah satu dataset tidak memiliki record."}

    # Candidate generation is intentionally small; exact field scoring is done
    # only for these likely pairs.
    top_k = max(1, int(os.getenv("MATCHING_TOP_K", "10")))
    texts_a = [combined_text(r, req.columnMappings, "A") for r in rows_a]
    texts_b = [combined_text(r, req.columnMappings, "B") for r in rows_b]
    pairs = candidate_indices(texts_a, texts_b, top_k)

    candidates = []
    for ia, ib, faiss_score, tfidf_score in pairs:
        scores = []
        for m in req.columnMappings:
            s = field_similarity(rows_a[ia], rows_b[ib], m)
            scores.append({"columnA": m.columnA, "columnB": m.columnB, "score": round(s, 4)})
        overall = sum(x["score"] for x in scores) / len(scores) if scores else 0.0
        if overall >= req.threshold:
            candidates.append({
                "recordAId": int(rows_a[ia][0]),
                "recordBId": int(rows_b[ib][0]),
                "idsbrA": str(rows_a[ia][1] or ""),
                "idsbrB": str(rows_b[ib][1] or ""),
                "fieldScores": scores,
                "tfidfSimilarity": round(tfidf_score, 4),
                "faissSimilarity": round(faiss_score, 4),
                "rapidfuzzSimilarity": round(overall, 4),
                "overallScore": round(overall, 4),
            })

    candidates.sort(key=lambda x: x["overallScore"], reverse=True)
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id,name FROM datasets WHERE id IN (%s,%s)", (req.datasetAId, req.datasetBId))
            names = {int(i): str(n) for i, n in cur.fetchall()}

    return {
        "success": True,
        "data": {
            "datasetA": {"id": req.datasetAId, "name": names.get(req.datasetAId, "Dataset A")},
            "datasetB": {"id": req.datasetBId, "name": names.get(req.datasetBId, "Dataset B")},
            "config": {"columnMappings": [m.model_dump() for m in req.columnMappings], "threshold": req.threshold},
            "summary": {"totalCandidates": len(candidates)},
            "candidates": candidates,
        },
    }
