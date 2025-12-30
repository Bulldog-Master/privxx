#!/usr/bin/env node

/**
 * Checks that all UI components in src/components/ui use React.forwardRef
 * for Radix UI compatibility.
 * 
 * Usage: node scripts/check-forward-ref.js [--fix]
 * 
 * This script scans UI component files and warns about components that
 * don't use forwardRef, which can cause issues with Radix primitives.
 */

const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(__dirname, '..', 'src', 'components', 'ui');

// Components that are known exceptions (can't use forwardRef due to library limitations)
const EXCEPTIONS = [
  'ResizableHandle', // react-resizable-panels limitation
];

// Files to skip entirely (re-exports, configs, etc.)
const SKIP_FILES = [
  'use-toast.ts',
  'index.ts',
];

function checkFile(filePath) {
  const fileName = path.basename(filePath);
  
  if (SKIP_FILES.includes(fileName)) {
    return { file: fileName, issues: [], skipped: true };
  }

  if (!fileName.endsWith('.tsx')) {
    return { file: fileName, issues: [], skipped: true };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  // Find all exported const components (function declarations)
  // Pattern: export const ComponentName = ... (not using forwardRef)
  const exportConstRegex = /export\s+const\s+(\w+)\s*[=:]/g;
  const forwardRefRegex = /React\.forwardRef|forwardRef\s*[<(]/;
  
  // Find component definitions that should use forwardRef
  const componentExports = [];
  let match;
  
  while ((match = exportConstRegex.exec(content)) !== null) {
    const componentName = match[1];
    
    // Skip non-component exports (hooks, utilities, variants)
    if (
      componentName.startsWith('use') || // hooks
      componentName.endsWith('Variants') || // CVA variants
      componentName.endsWith('variants') ||
      componentName === 'toast' || // utility functions
      /^[a-z]/.test(componentName) // starts with lowercase (not a component)
    ) {
      continue;
    }
    
    componentExports.push(componentName);
  }

  // Check each component for forwardRef usage
  for (const componentName of componentExports) {
    if (EXCEPTIONS.includes(componentName)) {
      continue;
    }

    // Look for the component definition and check if it uses forwardRef
    const componentDefRegex = new RegExp(
      `(const|export\\s+const)\\s+${componentName}\\s*=\\s*([^;]+)`,
      's'
    );
    const defMatch = content.match(componentDefRegex);
    
    if (defMatch) {
      const definition = defMatch[2];
      
      // Check if this specific component uses forwardRef
      if (!forwardRefRegex.test(definition)) {
        // Additional check: is this a simple re-export or alias?
        const isSimpleAssignment = /^\s*\w+(\.\w+)?\s*$/.test(definition.trim());
        const isObjectDestructure = /^\s*\{/.test(definition.trim());
        
        if (!isSimpleAssignment && !isObjectDestructure) {
          issues.push({
            component: componentName,
            message: `Component "${componentName}" should use React.forwardRef for Radix compatibility`,
          });
        }
      }
    }
  }

  return { file: fileName, issues, skipped: false };
}

function main() {
  console.log('🔍 Checking UI components for forwardRef usage...\n');

  if (!fs.existsSync(UI_DIR)) {
    console.log('⚠️  UI directory not found:', UI_DIR);
    process.exit(0);
  }

  const files = fs.readdirSync(UI_DIR);
  const results = [];
  let totalIssues = 0;

  for (const file of files) {
    const filePath = path.join(UI_DIR, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      const result = checkFile(filePath);
      if (!result.skipped && result.issues.length > 0) {
        results.push(result);
        totalIssues += result.issues.length;
      }
    }
  }

  if (totalIssues === 0) {
    console.log('✅ All UI components properly use forwardRef\n');
    process.exit(0);
  }

  console.log(`⚠️  Found ${totalIssues} component(s) missing forwardRef:\n`);
  
  for (const result of results) {
    console.log(`  📄 ${result.file}:`);
    for (const issue of result.issues) {
      console.log(`     - ${issue.message}`);
    }
    console.log('');
  }

  console.log('💡 To fix: Wrap the component with React.forwardRef<ElementType, PropsType>((props, ref) => ...)');
  console.log('   See: https://react.dev/reference/react/forwardRef\n');
  
  // Exit with error code to fail the pre-commit hook
  process.exit(1);
}

main();
