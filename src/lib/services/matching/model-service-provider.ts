/**
 * Model Service Matching Provider
 *
 * Transport adapter that delegates matching to the external Model Service
 * (`MODEL_SERVICE_URL`) and maps its HTTP response onto the application's
 * `IMatchingProvider` contract.
 *
 * This module contains NO matching algorithm. It only moves data to and from
 * the Model Service.
 *
 * HOW IT IS ENABLED
 * It is opt-in and disabled by default so the current development fallback
 * keeps working: set `MATCHING_PROVIDER=model_service`. Because the Model
 * Service does not exist yet, enabling it without a reachable service produces
 * an explicit FAILED result — this provider never fabricates candidates.
 *
 * LONG-RUNNING CALLS
 * The request is issued with `node:http`/`node:https` (not `fetch`) so the
 * call has no built-in 5-minute ceiling. A configured timeout only measures
 * socket inactivity, and `MODEL_SERVICE_TIMEOUT_MS=0` removes even that, for
 * datasets the Model Service legitimately needs several minutes to process.
 *
 * ASSUMED CONTRACT (to be confirmed when the Model Service is delivered)
 * - POST `${MODEL_SERVICE_URL}${MODEL_SERVICE_MATCH_PATH ?? '/match'}`
 * - Request body: { datasetAId, datasetBId, columnMappings, threshold }
 * - Response body: { success: true, data: <MatchingResponse.data> } or
 *   { success: false, error: string }
 * Both the path and the payload shape are configurable/offset by the adapter
 * rather than duplicated throughout the app.
 *
 * SERVICE ADDRESSING
 * The host comes exclusively from `MODEL_SERVICE_URL` (e.g. `http://model:8000`
 * in Docker Compose) — never a hardcoded `localhost`.
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import {
  isMatchingResponseData,
  type IMatchingProvider,
  type MatchingRequest,
  type MatchingResponse,
} from './provider';

/** Generous default: large datasets may take several minutes. 0 disables it. */
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_MATCH_PATH = '/match';

function readTimeoutMs(): number {
  const raw = process.env.MODEL_SERVICE_TIMEOUT_MS;
  if (raw === undefined || raw.trim() === '') return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_TIMEOUT_MS;
  return parsed;
}

function readMatchPath(): string {
  const raw = (process.env.MODEL_SERVICE_MATCH_PATH ?? '').trim();
  if (raw === '') return DEFAULT_MATCH_PATH;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function describeConnectionError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'ECONNREFUSED':
      return 'Model Service tidak dapat dihubungi (koneksi ditolak).';
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return 'Model Service tidak dapat dihubungi (alamat tidak ditemukan).';
    case 'EHOSTUNREACH':
    case 'ENETUNREACH':
      return 'Model Service tidak dapat dijangkau dari jaringan.';
    case 'ECONNRESET':
      return 'Koneksi ke Model Service terputus.';
    case 'ETIMEDOUT':
      return 'Koneksi ke Model Service kehabisan waktu.';
    default:
      return error instanceof Error && error.message
        ? `Model Service gagal diproses: ${error.message}`
        : 'Model Service gagal diproses.';
  }
}

function postJson(
  target: URL,
  payload: unknown,
  timeoutMs: number
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    const isHttps = target.protocol === 'https:';
    const client = isHttps ? https : http;

    const request = client.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port !== '' ? target.port : isHttps ? 443 : 80,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(body.byteLength),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () =>
          resolve({
            statusCode: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        );
        response.on('error', reject);
      }
    );

    if (timeoutMs > 0) {
      request.setTimeout(timeoutMs, () => {
        request.destroy(
          new Error(
            `Model Service tidak merespons dalam ${Math.round(timeoutMs / 1000)} detik`
          )
        );
      });
    }

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

export class ModelServiceMatchingProvider implements IMatchingProvider {
  async validateRequest(
    req: MatchingRequest
  ): Promise<{ valid: boolean; error?: string }> {
    if (!Number.isInteger(req.datasetAId) || !Number.isInteger(req.datasetBId)) {
      return { valid: false, error: 'Dataset IDs must be integers' };
    }

    if (req.datasetAId === req.datasetBId) {
      return { valid: false, error: 'Dataset A and Dataset B must be different' };
    }

    if (!req.columnMappings || req.columnMappings.length === 0) {
      return { valid: false, error: 'At least one column mapping is required' };
    }

    if (
      typeof req.threshold !== 'number' ||
      req.threshold < 0 ||
      req.threshold > 1
    ) {
      return { valid: false, error: 'Threshold must be a number between 0 and 1' };
    }

    return { valid: true };
  }

  async runMatching(req: MatchingRequest): Promise<MatchingResponse> {
    const baseUrl = (process.env.MODEL_SERVICE_URL ?? '').trim();
    if (baseUrl === '') {
      return {
        success: false,
        error: 'Model Service belum dikonfigurasi (MODEL_SERVICE_URL kosong).',
      };
    }

    let target: URL;
    try {
      target = new URL(readMatchPath(), baseUrl);
    } catch {
      return {
        success: false,
        error: 'MODEL_SERVICE_URL tidak valid.',
      };
    }

    const timeoutMs = readTimeoutMs();
    let response: { statusCode: number; body: string };
    try {
      response = await postJson(target, req, timeoutMs);
    } catch (error) {
      return { success: false, error: describeConnectionError(error) };
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return {
        success: false,
        error: `Model Service mengembalikan status ${response.statusCode}.`,
      };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(response.body);
    } catch {
      return {
        success: false,
        error: 'Respons Model Service tidak valid (bukan JSON).',
      };
    }

    if (!payload || typeof payload !== 'object') {
      return {
        success: false,
        error: 'Respons Model Service tidak sesuai kontrak.',
      };
    }

    const parsed = payload as { success?: unknown; data?: unknown; error?: unknown };

    if (parsed.success !== true) {
      return {
        success: false,
        error:
          typeof parsed.error === 'string' && parsed.error
            ? parsed.error
            : 'Model Service melaporkan proses pencocokan gagal.',
      };
    }

    if (!isMatchingResponseData(parsed.data)) {
      return {
        success: false,
        error: 'Respons Model Service tidak sesuai kontrak.',
      };
    }

    return { success: true, data: parsed.data };
  }
}
