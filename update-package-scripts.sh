#!/bin/bash
# Script to add missing npm scripts to package.json

echo "Updating package.json scripts..."

# Create a backup
cp package.json package.json.backup

# Use node to update package.json
node << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add missing scripts
pkg.scripts.lint = pkg.scripts.lint || "echo 'No ESLint configured' && exit 0";
pkg.scripts.typecheck = pkg.scripts.typecheck || "tsc --noEmit";

// Keep existing check script but ensure typecheck exists
if (!pkg.scripts.typecheck && pkg.scripts.check) {
  pkg.scripts.typecheck = "tsc --noEmit";
}

// Write back
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Updated package.json scripts:');
console.log('  - lint:', pkg.scripts.lint);
console.log('  - typecheck:', pkg.scripts.typecheck);
console.log('  - build:', pkg.scripts.build);
EOF

echo ""
echo "Changes applied! Review the diff:"
git diff package.json

echo ""
echo "If everything looks good, the changes will be auto-committed by Replit."
