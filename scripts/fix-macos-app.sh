#!/bin/bash

# macOS App Fix Script for DocuSafely
# Removes quarantine attributes that cause "app is damaged" error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
    echo "Usage: $0 [path-to-app] [options]"
    echo ""
    echo "Arguments:"
    echo "  path-to-app    Path to DocuSafely.app (optional)"
    echo ""
    echo "Options:"
    echo "  --help         Show this help message"
    echo "  --auto         Automatically find and fix DocuSafely.app"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Interactive mode"
    echo "  $0 /path/to/DocuSafely.app           # Fix specific app"
    echo "  $0 --auto                            # Auto-find and fix"
    echo ""
    echo "This script removes quarantine attributes that cause"
    echo "the 'app is damaged' error on macOS."
}

# Function to find DocuSafely.app
find_app() {
    local search_paths=(
        "$HOME/Downloads"
        "$HOME/Desktop"
        "$HOME/Applications"
        "/Applications"
    )
    
    for path in "${search_paths[@]}"; do
        if [ -d "$path" ]; then
            local found=$(find "$path" -name "DocuSafely.app" -type d 2>/dev/null | head -1)
            if [ -n "$found" ]; then
                echo "$found"
                return 0
            fi
        fi
    done
    
    return 1
}

# Function to fix app
fix_app() {
    local app_path="$1"
    
    if [ ! -d "$app_path" ]; then
        print_error "App not found: $app_path"
        return 1
    fi
    
    if [ ! -d "$app_path/Contents" ]; then
        print_error "Invalid app bundle: $app_path"
        return 1
    fi
    
    print_status "Fixing app: $app_path"
    
    # Remove quarantine attributes
    xattr -cr "$app_path" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Successfully removed quarantine attributes"
        
        # Check if the fix worked
        local quarantine_attrs=$(xattr "$app_path" 2>/dev/null | grep -i quarantine)
        if [ -z "$quarantine_attrs" ]; then
            print_success "App is now safe to open!"
            echo ""
            print_status "You can now:"
            echo "  1. Double-click the app to open it"
            echo "  2. Or right-click and select 'Open'"
            return 0
        else
            print_warning "Some quarantine attributes remain:"
            echo "$quarantine_attrs"
            return 1
        fi
    else
        print_error "Failed to remove quarantine attributes"
        return 1
    fi
}

# Parse command line arguments
AUTO_MODE=false
APP_PATH=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$APP_PATH" ]; then
                APP_PATH="$1"
            else
                print_error "Multiple app paths specified"
                exit 1
            fi
            shift
            ;;
    esac
done

# Main execution
print_status "DocuSafely macOS App Fix Script"
echo ""

# Auto mode
if [ "$AUTO_MODE" = true ]; then
    print_status "Searching for DocuSafely.app..."
    APP_PATH=$(find_app)
    
    if [ -z "$APP_PATH" ]; then
        print_error "DocuSafely.app not found in common locations"
        print_status "Searched in:"
        echo "  - ~/Downloads"
        echo "  - ~/Desktop"
        echo "  - ~/Applications"
        echo "  - /Applications"
        echo ""
        print_status "Please specify the path manually:"
        echo "  $0 /path/to/DocuSafely.app"
        exit 1
    fi
    
    print_status "Found: $APP_PATH"
fi

# Interactive mode - no app path specified
if [ -z "$APP_PATH" ]; then
    print_status "Searching for DocuSafely.app..."
    APP_PATH=$(find_app)
    
    if [ -n "$APP_PATH" ]; then
        print_status "Found: $APP_PATH"
        echo ""
        read -p "Fix this app? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Cancelled by user"
            exit 0
        fi
    else
        print_warning "DocuSafely.app not found automatically"
        echo ""
        print_status "Please enter the path to DocuSafely.app:"
        read -p "Path: " APP_PATH
        
        if [ -z "$APP_PATH" ]; then
            print_error "No path provided"
            exit 1
        fi
        
        # Expand tilde if present
        APP_PATH="${APP_PATH/#\~/$HOME}"
    fi
fi

# Fix the app
echo ""
fix_app "$APP_PATH"

if [ $? -eq 0 ]; then
    echo ""
    print_success "Fix completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Try opening the app by double-clicking it"
    echo "  2. If you still get an error, try right-clicking and selecting 'Open'"
    echo "  3. You may need to move the app to your Applications folder"
else
    echo ""
    print_error "Fix failed. Please try the manual methods:"
    echo ""
    print_status "Manual fixes:"
    echo "  1. Right-click the app and select 'Open'"
    echo "  2. Go to System Settings → Privacy & Security → Security"
    echo "  3. Click 'Open Anyway' for DocuSafely"
    exit 1
fi
