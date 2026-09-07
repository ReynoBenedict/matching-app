/**
 * Phase 4B Matching MVP Tests
 * Tests the matching implementation end-to-end
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
}

let authToken = '';
const results: TestResult[] = [];

// Helper: Make authenticated requests
async function makeRequest(
  method: string,
  endpoint: string,
  body?: Record<string, any>,
  withAuth = true
) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (withAuth && authToken) {
    options.headers = {
      ...options.headers,
      Cookie: `session=${authToken}`,
    };
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Helper: Record test result
function recordTest(
  name: string,
  expected: string,
  actual: string,
  pass: boolean
) {
  results.push({
    name,
    expected,
    actual,
    status: pass ? 'PASS' : 'FAIL',
  });
  console.log(`${pass ? '✓' : '✗'} ${name}`);
}

async function runTests() {
  console.log('=== PHASE 4B MATCHING MVP TESTS ===\n');

  // ==========================================
  // AUTHENTICATE
  // ==========================================
  console.log('[AUTH] Authenticating...');
  const authRes = await makeRequest('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123456',
  }, false);

  if (authRes.status === 200 && authRes.data.success) {
    // Extract token from response - in real app would be in Set-Cookie
    authToken = 'test-token'; // Placeholder - in real curl tests would come from cookie
    console.log('✓ Authenticated\n');
  } else {
    console.log('✗ Authentication failed\n');
    return;
  }

  // ==========================================
  // FETCH DATASETS
  // ==========================================
  console.log('[SETUP] Fetching READY datasets...');
  const datasetsRes = await makeRequest('GET', '/api/datasets?status=READY&limit=100');

  if (datasetsRes.status !== 200) {
    console.log('✗ Failed to fetch datasets\n');
    return;
  }

  const datasets = datasetsRes.data.data || [];
  console.log(`✓ Found ${datasets.length} READY datasets\n`);

  if (datasets.length < 2) {
    console.log('⚠ Need at least 2 READY datasets for testing\n');
    console.log('Available datasets:', datasets);
    return;
  }

  const DATASET_A_ID = datasets[0].id;
  const DATASET_B_ID = datasets[1].id;

  console.log(`Using Dataset A: ${DATASET_A_ID}`);
  console.log(`Using Dataset B: ${DATASET_B_ID}\n`);

  // ==========================================
  // TEST 1: Fetch columns for Dataset A
  // ==========================================
  console.log('[T1] Fetch columns for Dataset A...');
  const colARes = await makeRequest('GET', `/api/datasets/${DATASET_A_ID}/columns`);

  if (colARes.status === 200 && colARes.data.success) {
    const columns = colARes.data.data;
    recordTest(
      'T1: Columns endpoint returns data',
      'status=200, data array present',
      `status=${colARes.status}, ${columns?.length || 0} columns`,
      colARes.status === 200 && Array.isArray(columns)
    );

    if (columns && columns.length > 0) {
      recordTest(
        'T1: Columns have required fields',
        'columnName, dataType, isRequired, isPrimaryKey present',
        `First column: ${JSON.stringify(columns[0])}`,
        columns[0].columnName &&
          columns[0].dataType &&
          typeof columns[0].isRequired === 'boolean' &&
          typeof columns[0].isPrimaryKey === 'boolean'
      );
    }
  } else {
    recordTest('T1: Columns endpoint', 'success', `failed with ${colARes.status}`, false);
  }
  console.log();

  // ==========================================
  // TEST 2: Fetch columns for Dataset B
  // ==========================================
  console.log('[T2] Fetch columns for Dataset B...');
  const colBRes = await makeRequest('GET', `/api/datasets/${DATASET_B_ID}/columns`);
  recordTest(
    'T2: Dataset B columns retrieved',
    'status=200',
    `status=${colBRes.status}`,
    colBRes.status === 200
  );
  console.log();

  // ==========================================
  // TEST 3: Valid matching request
  // ==========================================
  console.log('[T3] Valid matching request...');
  const matchRes = await makeRequest('POST', '/api/matching', {
    datasetAId: DATASET_A_ID,
    datasetBId: DATASET_B_ID,
    columnMappings: [
      { columnA: 'nama_usaha', columnB: 'nama_usaha' },
    ],
    threshold: 0.7,
  });

  recordTest(
    'T3: Matching request succeeds',
    'success=true',
    `success=${matchRes.data.success}`,
    matchRes.data.success === true
  );

  if (matchRes.data.data) {
    const { summary, candidates } = matchRes.data.data;
    recordTest(
      'T3: Returns candidate count',
      'totalCandidates >= 0',
      `totalCandidates=${summary?.totalCandidates}`,
      typeof summary?.totalCandidates === 'number'
    );

    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      recordTest(
        'T3: Candidate has required fields',
        'recordAId, recordBId, idsbrA, idsbrB, overallScore',
        `Fields present: ${Object.keys(candidate).join(', ')}`,
        candidate.recordAId &&
          candidate.recordBId &&
          candidate.idsbrA &&
          candidate.idsbrB &&
          typeof candidate.overallScore === 'number'
      );

      recordTest(
        'T3: Overall score in valid range',
        '0 <= score <= 1',
        `overallScore=${candidate.overallScore}`,
        candidate.overallScore >= 0 && candidate.overallScore <= 1
      );

      if (candidate.fieldScores && candidate.fieldScores.length > 0) {
        const fieldScore = candidate.fieldScores[0];
        recordTest(
          'T3: Field score structure',
          'columnA, columnB, score present',
          `First field score: ${JSON.stringify(fieldScore)}`,
          fieldScore.columnA && fieldScore.columnB && typeof fieldScore.score === 'number'
        );
      }
    }
  }
  console.log();

  // ==========================================
  // TEST 4: Multiple column mappings
  // ==========================================
  console.log('[T4] Multiple column mappings...');
  const multiMapRes = await makeRequest('POST', '/api/matching', {
    datasetAId: DATASET_A_ID,
    datasetBId: DATASET_B_ID,
    columnMappings: [
      { columnA: 'nama_usaha', columnB: 'nama_usaha' },
      { columnA: 'alamat_usaha', columnB: 'alamat_usaha' },
    ],
    threshold: 0.7,
  });

  recordTest(
    'T4: Multiple mappings accepted',
    'success=true',
    `success=${multiMapRes.data.success}`,
    multiMapRes.data.success === true
  );

  if (multiMapRes.data.data?.candidates?.length > 0) {
    const candidate = multiMapRes.data.data.candidates[0];
    recordTest(
      'T4: Returns multiple field scores',
      'fieldScores.length >= 2',
      `fieldScores.length=${candidate.fieldScores?.length}`,
      candidate.fieldScores?.length >= 2
    );
  }
  console.log();

  // ==========================================
  // TEST 5: Reject same dataset
  // ==========================================
  console.log('[T5] Reject same dataset...');
  const sameDatasetRes = await makeRequest('POST', '/api/matching', {
    datasetAId: DATASET_A_ID,
    datasetBId: DATASET_A_ID,
    columnMappings: [
      { columnA: 'nama_usaha', columnB: 'nama_usaha' },
    ],
    threshold: 0.7,
  });

  recordTest(
    'T5: Reject same dataset',
    'success=false, error message',
    `success=${sameDatasetRes.data.success}, error=${sameDatasetRes.data.error}`,
    sameDatasetRes.data.success === false && sameDatasetRes.data.error
  );
  console.log();

  // ==========================================
  // TEST 6: Reject no mappings
  // ==========================================
  console.log('[T6] Reject no column mappings...');
  const noMappingsRes = await makeRequest('POST', '/api/matching', {
    datasetAId: DATASET_A_ID,
    datasetBId: DATASET_B_ID,
    columnMappings: [],
    threshold: 0.7,
  });

  recordTest(
    'T6: Reject empty mappings',
    'success=false',
    `success=${noMappingsRes.data.success}`,
    noMappingsRes.data.success === false
  );
  console.log();

  // ==========================================
  // TEST 7: Invalid threshold
  // ==========================================
  console.log('[T7] Invalid threshold...');
  const invalidThreshRes = await makeRequest('POST', '/api/matching', {
    datasetAId: DATASET_A_ID,
    datasetBId: DATASET_B_ID,
    columnMappings: [
      { columnA: 'nama_usaha', columnB: 'nama_usaha' },
    ],
    threshold: 1.5,
  });

  recordTest(
    'T7: Reject invalid threshold',
    'success=false',
    `success=${invalidThreshRes.data.success}`,
    invalidThreshRes.data.success === false
  );
  console.log();

  // ==========================================
  // TEST 8: Different thresholds
  // ==========================================
  console.log('[T8] Different threshold values...');
  const high = await makeRequest('POST', '/api/matching', {
    datasetAId: DATASET_A_ID,
    datasetBId: DATASET_B_ID,
    columnMappings: [
      { columnA: 'nama_usaha', columnB: 'nama_usaha' },
    ],
    threshold: 0.95,
  });

  const low = await makeRequest('POST', '/api/matching', {
    datasetAId: DATASET_A_ID,
    datasetBId: DATASET_B_ID,
    columnMappings: [
      { columnA: 'nama_usaha', columnB: 'nama_usaha' },
    ],
    threshold: 0.5,
  });

  const highCount = high.data.data?.summary?.totalCandidates || 0;
  const lowCount = low.data.data?.summary?.totalCandidates || 0;

  recordTest(
    'T8: Higher threshold reduces candidates',
    'highThreshold_candidates <= lowThreshold_candidates',
    `high(0.95)=${highCount}, low(0.5)=${lowCount}`,
    highCount <= lowCount
  );
  console.log();

  // ==========================================
  // PRINT SUMMARY
  // ==========================================
  console.log('\n=== TEST SUMMARY ===\n');
  console.log('| Test | Expected | Actual | Status |');
  console.log('|------|----------|--------|--------|');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  results.forEach((r) => {
    console.log(`| ${r.name} | ${r.expected} | ${r.actual} | ${r.status} |`);
  });

  console.log('\n' + `PASSED: ${passed}/${results.length}`);
  console.log(`FAILED: ${failed}/${results.length}\n`);

  if (failed === 0) {
    console.log('✓ ALL TESTS PASSED');
  } else {
    console.log(`✗ ${failed} TESTS FAILED`);
  }
}

runTests().catch(console.error);
