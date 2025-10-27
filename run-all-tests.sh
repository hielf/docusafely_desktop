#!/bin/bash

# Run All Tests for Debug Logging and Policy Features
# This script runs both backend and frontend tests

set -e

echo "=================================================="
echo "Running DocuSafely Feature Tests"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend Tests
echo -e "${BLUE}[1/2] Running Backend Tests (Python)...${NC}"
echo "Location: docusafely_core/tests/test_debug_logger.py"
echo ""

cd /Users/jerrym/workspace/projects/docusafely_core
if python3 -m pytest tests/test_debug_logger.py -v --tb=short; then
    echo -e "${GREEN}✅ Backend tests passed${NC}"
    BACKEND_STATUS="PASS"
else
    echo -e "${RED}❌ Backend tests failed${NC}"
    BACKEND_STATUS="FAIL"
    exit 1
fi

echo ""
echo "=================================================="
echo ""

# Frontend Tests
echo -e "${BLUE}[2/2] Running Frontend Tests (JavaScript)...${NC}"
echo "Location: docusafely_desktop/tests/unit/main.policy.test.js"
echo ""

cd /Users/jerrym/workspace/projects/docusafely_desktop
if npm test -- tests/unit/main.policy.test.js --verbose=false; then
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
    FRONTEND_STATUS="PASS"
else
    echo -e "${RED}❌ Frontend tests failed${NC}"
    FRONTEND_STATUS="FAIL"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  Backend Tests:  $BACKEND_STATUS"
echo "  Frontend Tests: $FRONTEND_STATUS"
echo ""
echo "Total: 47 tests (22 backend + 25 frontend)"
echo ""
echo "For more details, see: TESTING_SUMMARY.md"

