# Matching APP integration notes

This version integrates the flexible upload and matching engine work.

## Upload
- CSV limit is 200 MB.
- Unknown columns are allowed.
- Duplicate/blank headers and malformed CSV rows are still rejected.
- Legacy BPS fields are validated only when present.
- The complete original row is preserved in `dataset_records.raw_data`.
- Inserts are batched in groups of 1,000 rows.

## Matching
The Docker Compose stack now includes `model_service`, enabled with:

```env
MATCHING_PROVIDER=model_service
MODEL_SERVICE_URL=http://model:8000
```

Pipeline:
1. normalize text
2. TF-IDF character n-grams (3-5)
3. TruncatedSVD compact representation
4. FAISS cosine Top-K candidate generation
5. RapidFuzz field similarity
6. mean weighted field score / threshold

`MATCHING_TOP_K` controls candidate generation and defaults to 10.

## Persistence
Every completed matching job is stored in:
- `matching_runs`
- `matching_candidates`

The superadmin matching-results service reads the latest persisted run for the requested dataset pair and threshold instead of recalculating it.

## Database
Apply migrations before using the new features:

```bash
npm run db:migrate
```

or apply the SQL files in `drizzle/` using your migration process.

## Docker
Start the complete stack:

```bash
docker compose up --build
```

The model service is available internally at `http://model:8000` and exposes `/health` and `/match`.
