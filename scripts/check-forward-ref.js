#!/usr/bin/env node

/**
 * Checks that all UI and shared components use React.forwardRef
 * for Radix UI compatibility.
 * 
 * Usage: node scripts/check-forward-ref.js [--fix]
 * 
 * This script scans component files and warns about components that
 * don't use forwardRef, which can cause issues with Radix primitives.
 */

const fs = require('fs');
const path = require('path');

// Directories to scan for forwardRef compliance
const SCAN_DIRS = [
  { path: path.join(__dirname, '..', 'src', 'components', 'ui'), name: 'UI Components' },
  { path: path.join(__dirname, '..', 'src', 'components', 'shared'), name: 'Shared Components' },
  { path: path.join(__dirname, '..', 'src', 'features', 'identity', 'components'), name: 'Identity Components' },
];

// Components that are known exceptions (can't use forwardRef due to library limitations)
const EXCEPTIONS = [
  'ResizableHandle', // react-resizable-panels limitation
];

// Files to skip entirely (re-exports, configs, hooks, providers, etc.)
const SKIP_FILES = [
  'use-toast.ts',
  'index.ts',
  'RtlProvider.tsx', // Context provider, not a DOM component
];

// Components that don't render DOM elements directly (wrappers, logic components)
const NON_DOM_COMPONENTS = [
  'AppErrorBoundary', // Error boundary class component
  'SkipToContent', // Renders anchor, forwardRef not needed
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
    if (EXCEPTIONS.includes(componentName) || NON_DOM_COMPONENTS.includes(componentName)) {
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

function scanDirectory(dirPath, dirName) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const results = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      const result = checkFile(filePath);
      if (!result.skipped && result.issues.length > 0) {
        result.directory = dirName;
        results.push(result);
      }
    }
  }

  return results;
}

function main() {
  console.log('🔍 Checking components for forwardRef usage...\n');

  let allResults = [];
  let totalIssues = 0;

  for (const dir of SCAN_DIRS) {
    const results = scanDirectory(dir.path, dir.name);
    allResults = allResults.concat(results);
    totalIssues += results.reduce((sum, r) => sum + r.issues.length, 0);
  }

  if (totalIssues === 0) {
    console.log('✅ All components properly use forwardRef (100% compliance)\n');
    process.exit(0);
  }

  console.log(`❌ Found ${totalIssues} component(s) missing forwardRef:\n`);
  
  for (const result of allResults) {
    console.log(`  📄 ${result.directory} → ${result.file}:`);
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
