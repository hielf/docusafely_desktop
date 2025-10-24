#!/bin/bash

# Integration Test Runner Script
# Runs comprehensive tests for PDF processing and desktop app functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --pdf-only     Run only PDF processing tests"
    echo "  --integration  Run only integration tests"
    echo "  --all          Run all tests (default)"
    echo "  --coverage     Run with coverage reporting"
    echo "  --verbose      Run with verbose output"
    echo "  --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --pdf-only"
    echo "  $0 --coverage --verbose"
    echo "  $0 --integration"
}

# Parse command line arguments
RUN_PDF_ONLY=false
RUN_INTEGRATION_ONLY=false
RUN_COVERAGE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --pdf-only)
            RUN_PDF_ONLY=true
            shift
            ;;
        --integration)
            RUN_INTEGRATION_ONLY=true
            shift
            ;;
        --coverage)
            RUN_COVERAGE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option $1"
            show_usage
            exit 1
            ;;
    esac
done

print_status "Starting DocuSafely Desktop Integration Tests..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if backend processor exists
PROCESSOR_PATH="backend/dist/processor"
if [ ! -f "$PROCESSOR_PATH" ]; then
    print_warning "Backend processor not found at $PROCESSOR_PATH"
    print_status "Please build the backend first:"
    echo "  cd ../docusafely_core"
    echo "  python build_interactive.py --frontend-path $(pwd)"
    echo ""
) {
        print_error "Backend processor is required for integration tests"
        exit 1
    }
fi

print_success "Backend processor found: $PROCESSOR_PATH"

# Check if test PDF exists
TEST_PDF_PATH="../docusafely_core/test_documents/quote.pdf"
if [ ! -f "$TEST_PDF_PATH" ]; then
    print_warning "Test PDF not found at $TEST_PDF_PATH"
    print_status "Some tests may be skipped"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Prepare test command
JEST_CMD="npx jest"
JEST_ARGS=""

if [ "$VERBOSE" = true ]; then
    JEST_ARGS="$JEST_ARGS --verbose"
fi

if [ "$RUN_COVERAGE" = true ]; then
    JEST_ARGS="$JEST_ARGS --coverage"
fi

# Determine which tests to run
if [ "$RUN_PDF_ONLY" = true ]; then
    JEST_ARGS="$JEST_ARGS tests/integration/pdf-processing.test.js tests/integration/pdf-content-analysis.test.js"
elif [ "$RUN_INTEGRATION_ONLY" = true ]; then
    JEST_ARGS="$JEST_ARGS tests/integration/"
else
    JEST_ARGS="$JEST_ARGS tests/"
fi

# Run the tests
print_status "Running tests with command: $JEST_CMD $JEST_ARGS"
echo ""

$JEST_CMD $JEST_ARGS

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All tests passed! ✅"
    
    if [ "$RUN_COVERAGE" = true ]; then
        print_status "Coverage report generated in coverage/"
    fi
    
    # Show summary
    echo ""
    print_status "Test Summary:"
    echo "  - PDF Processing: ✅"
    echo "  - Desktop App Integration: ✅"
    echo "  - Content Analysis: ✅"
    echo ""
    
    if [ "$RUN_PDF_ONLY" = false ] && [ "$RUN_INTEGRATION_ONLY" = false ]; then
        print_status "To run specific test suites:"
        echo "  ./scripts/run-integration-tests.sh --pdf-only"
        echo "  ./scripts/run-integration-tests.sh --integration"
        echo ""
    fi
    
else
    print_error "Some tests failed! ❌"
    echo ""
    print_status "Troubleshooting tips:"
    echo "  1. Check that the backend processor is built and executable"
    echo "  2. Verify that test PDF files are available"
    echo "  3. Check file permissions on test directories"
    echo "  4. Run with --verbose for more detailed output"
    echo ""
    exit 1
fi
