#!/bin/bash

# Script to restore empty files from .history folder
cd "/Users/macbookprom1/Documents/Kuliah/Projek /CatatJasamu"

# Function to restore a file
restore_file() {
    local file_path="$1"
    local file_name=$(basename "$file_path" .jsx)
    local dir_path=$(dirname "$file_path")
    local history_dir=".history/${dir_path}"
    
    # Find latest NON-EMPTY backup
    local latest=$(find "$history_dir" -name "${file_name}_*.jsx" -type f -size +10c 2>/dev/null | sort -r | head -1)
    
    if [ -n "$latest" ]; then
        cp "$latest" "$file_path"
        local size=$(wc -l < "$file_path" | tr -d ' ')
        echo "✓ Restored: $file_path ($size lines)"
        return 0
    else
        echo "✗ No backup found: $file_path"
        return 1
    fi
}

echo "========================================="
echo "Restoring Empty Files from .history"
echo "========================================="
echo ""

# List of empty files to restore
FILES=(
    "frontend/src/components/Auth/ProtectedRoute.jsx"
    "frontend/src/components/Auth/RoleBasedRoute.jsx"
    "frontend/src/components/Layout/AdminLayout.jsx"
    "frontend/src/components/Layout/UserLayout.jsx"
    "frontend/src/components/Admin/AdminNavbar.jsx"
    "frontend/src/components/User/AddBookingModal.jsx"
    "frontend/src/components/User/CompanySettingsModal.jsx"
    "frontend/src/components/User/EditBookingModal.jsx"
    "frontend/src/components/User/UserSidebar.jsx"
    "frontend/src/components/User/GenerateInvoiceModal.jsx"
    "frontend/src/components/User/UserNavbar.jsx"
    "frontend/src/components/Common/PinModal.jsx"
    "frontend/src/components/Common/NoPinNotificationModal.jsx"
    "frontend/src/components/Common/CountryCodeDropdown.jsx"
    "frontend/src/components/Common/ResetPasswordWithPinModal.jsx"
    "frontend/src/components/Common/SearchableDropdown.jsx"
    "frontend/src/components/CalendarView.jsx"
    "frontend/src/main.jsx"
    "frontend/src/pages/Auth/Login.jsx"
    "frontend/src/pages/Auth/Register.jsx"
    "frontend/src/pages/NotFound.jsx"
    "frontend/src/pages/User/SettingsPage.jsx"
)

# Counter
total=${#FILES[@]}
restored=0
not_found=0

# Restore each file
for file in "${FILES[@]}"; do
    if restore_file "$file"; then
        ((restored++))
    else
        ((not_found++))
    fi
done

echo ""
echo "========================================="
echo "Summary:"
echo "  Total files:    $total"
echo "  Restored:       $restored"
echo "  Not found:      $not_found"
echo "========================================="
