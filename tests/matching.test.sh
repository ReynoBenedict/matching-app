#!/bin/bash

# Matching MVP Tests
# Tests the Phase 4B implementation

BASE_URL="http://localhost:3000"
AUTH_TOKEN=""

echo "=== PHASE 4B MATCHING MVP TESTS ==="
echo ""

# Helper function to make authenticated requests
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  curl -s -X "$method" \
    -H "Content-Type: application/json" \
    -H "Cookie: session=$AUTH_TOKEN" \
    ${data:+-d "$data"} \
    "$BASE_URL$endpoint"
}

# ============================================
# STEP 0: Authentication
# ============================================
echo "[STEP 0] Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' \
  "$BASE_URL/api/auth/login")

AUTH_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"session":"[^"]*' | cut -d'"' -f4)
if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi
echo "✓ Authenticated (token: ${AUTH_TOKEN:0:10}...)"
echo ""

# ============================================
# STEP 1: Get READY datasets
# ============================================
echo "[T1] Fetching READY datasets..."
DATASETS=$(make_request GET "/api/datasets?status=READY&limit=100")
echo "Response: $DATASETS" | head -c 200
echo "..."
echo ""

# Extract dataset IDs
DATASET_A_ID=$(echo $DATASETS | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
DATASET_B_ID=$(echo $DATASETS | grep -o '"id":[0-9]*' | head -2 | tail -1 | grep -o '[0-9]*')

if [ -z "$DATASET_A_ID" ] || [ -z "$DATASET_B_ID" ]; then
  echo "❌ No READY datasets found. Skipping remaining tests."
  exit 1
fi

echo "✓ Found datasets: A=$DATASET_A_ID, B=$DATASET_B_ID"
echo ""

# ============================================
# STEP 2: Get columns for Dataset A
# ============================================
echo "[T2] Fetching columns for Dataset A..."
COLUMNS_A=$(make_request GET "/api/datasets/$DATASET_A_ID/columns")
echo "Response (first 300 chars):"
echo "$COLUMNS_A" | head -c 300
echo "..."
echo ""

# ============================================
# STEP 3: Get columns for Dataset B
# ============================================
echo "[T3] Fetching columns for Dataset B..."
COLUMNS_B=$(make_request GET "/api/datasets/$DATASET_B_ID/columns")
echo "Response (first 300 chars):"
echo "$COLUMNS_B" | head -c 300
echo "..."
echo ""

# ============================================
# TEST: Valid matching request
# ============================================
echo "[TEST 1] Valid matching request with one column mapping..."
MATCHING_RESPONSE=$(make_request POST "/api/matching" '{
  "datasetAId": '$DATASET_A_ID',
  "datasetBId": '$DATASET_B_ID',
  "columnMappings": [{"columnA":"nama_usaha","columnB":"nama_usaha"}],
  "threshold": 0.7
}')

SUCCESS=$(echo $MATCHING_RESPONSE | grep -o '"success":[^,]*' | grep -o 'true\|false')
if [ "$SUCCESS" = "true" ]; then
  CANDIDATES=$(echo $MATCHING_RESPONSE | grep -o '"totalCandidates":[0-9]*' | grep -o '[0-9]*')
  echo "✓ TEST 1 PASSED: $CANDIDATES candidates found"
else
  ERROR=$(echo $MATCHING_RESPONSE | grep -o '"error":"[^"]*' | head -1)
  echo "✗ TEST 1 FAILED: $ERROR"
fi
echo ""

# ============================================
# TEST: Same dataset error
# ============================================
echo "[TEST 2] Reject when Dataset A == Dataset B..."
SAME_DATASET=$(make_request POST "/api/matching" '{
  "datasetAId": '$DATASET_A_ID',
  "datasetBId": '$DATASET_A_ID',
  "columnMappings": [{"columnA":"nama_usaha","columnB":"nama_usaha"}],
  "threshold": 0.7
}')

ERROR=$(echo $SAME_DATASET | grep -o '"error":"[^"]*' | head -1)
if [ -n "$ERROR" ]; then
  echo "✓ TEST 2 PASSED: Correctly rejected - $ERROR"
else
  echo "✗ TEST 2 FAILED: Should have rejected same dataset"
fi
echo ""

# ============================================
# TEST: No mappings error
# ============================================
echo "[TEST 3] Reject when no column mappings..."
NO_MAPPINGS=$(make_request POST "/api/matching" '{
  "datasetAId": '$DATASET_A_ID',
  "datasetBId": '$DATASET_B_ID',
  "columnMappings": [],
  "threshold": 0.7
}')

ERROR=$(echo $NO_MAPPINGS | grep -o '"error":"[^"]*' | head -1)
if [ -n "$ERROR" ]; then
  echo "✓ TEST 3 PASSED: Correctly rejected - $ERROR"
else
  echo "✗ TEST 3 FAILED: Should have rejected no mappings"
fi
echo ""

# ============================================
# TEST: Invalid threshold
# ============================================
echo "[TEST 4] Reject invalid threshold..."
INVALID_THRESHOLD=$(make_request POST "/api/matching" '{
  "datasetAId": '$DATASET_A_ID',
  "datasetBId": '$DATASET_B_ID',
  "columnMappings": [{"columnA":"nama_usaha","columnB":"nama_usaha"}],
  "threshold": 1.5
}')

ERROR=$(echo $INVALID_THRESHOLD | grep -o '"error":"[^"]*' | head -1)
if [ -n "$ERROR" ]; then
  echo "✓ TEST 4 PASSED: Correctly rejected invalid threshold"
else
  echo "✗ TEST 4 FAILED: Should have rejected invalid threshold"
fi
echo ""

# ============================================
# TEST: Unauthorized access
# ============================================
echo "[TEST 5] Unauthorized access (no auth)..."
UNAUTHORIZED=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"datasetAId":'$DATASET_A_ID',"datasetBId":'$DATASET_B_ID',"columnMappings":[{"columnA":"nama_usaha","columnB":"nama_usaha"}],"threshold":0.7}' \
  "$BASE_URL/api/matching")

if echo "$UNAUTHORIZED" | grep -q "Unauthorized\|error"; then
  echo "✓ TEST 5 PASSED: Correctly blocked unauthorized access"
else
  echo "✗ TEST 5 FAILED: Should have blocked unauthorized access"
fi
echo ""

echo "=== ALL TESTS COMPLETE ==="
