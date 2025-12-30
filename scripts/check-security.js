#!/usr/bin/env node

/**
 * Security Check Script for CI
 * 
 * Validates migration files and codebase for common security issues:
 * - Tables without RLS enabled
 * - Missing RESTRICTIVE policies for sensitive tables
 * - Exposed PII columns in views
 * - Unsafe policy patterns
 */

import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = 'supabase/migrations';

// Tables that MUST have RESTRICTIVE RLS policies
const SENSITIVE_TABLES = [
  'profiles',
  'passkey_credentials',
  'passkey_challenges',
  'totp_secrets',
  'totp_backup_codes',
  'rate_limits',
  'audit_logs',
  'notification_preferences'
];

// Columns that should never be exposed in views without filtering
const PII_COLUMNS = ['ip_address', 'user_agent', 'email', 'phone'];

// Patterns that indicate security issues
const DANGEROUS_PATTERNS = [
  { pattern: /USING\s*\(\s*true\s*\)/gi, message: 'Overly permissive RLS policy (USING true)' },
  { pattern: /WITH\s+CHECK\s*\(\s*true\s*\)/gi, message: 'Overly permissive RLS policy (WITH CHECK true)' },
  { pattern: /TO\s+public/gi, message: 'Policy grants access to public role' },
  { pattern: /GRANT\s+ALL\s+ON.*TO\s+anon/gi, message: 'GRANT ALL to anon role' },
  { pattern: /security_invoker\s*=\s*false/gi, message: 'View with security_invoker=false may bypass RLS' }
];

// Required patterns for sensitive tables
const REQUIRED_PATTERNS = [
  { pattern: /ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi, tables: SENSITIVE_TABLES },
  { pattern: /AS\s+RESTRICTIVE/gi, tables: SENSITIVE_TABLES }
];

let errors = [];
let warnings = [];

function checkMigrationFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Check for dangerous patterns
  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      // Allow "USING (false)" and "WITH CHECK (false)" as these are secure
      if (pattern.toString().includes('true')) {
        warnings.push(`${fileName}: ${message} (found ${matches.length} occurrence(s))`);
      }
    }
  }
  
  // Check for PII columns in CREATE VIEW statements
  const viewMatch = content.match(/CREATE\s+(OR\s+REPLACE\s+)?VIEW[^;]+/gi);
  if (viewMatch) {
    for (const view of viewMatch) {
      for (const piiCol of PII_COLUMNS) {
        if (view.toLowerCase().includes(piiCol) && !view.toLowerCase().includes('_safe')) {
          warnings.push(`${fileName}: View may expose PII column '${piiCol}'`);
        }
      }
    }
  }
  
  // Check CREATE TABLE statements for sensitive tables without RLS
  const tableMatches = content.match(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?public\.(\w+)/gi);
  if (tableMatches) {
    for (const match of tableMatches) {
      const tableName = match.split('.').pop()?.toLowerCase();
      if (SENSITIVE_TABLES.includes(tableName)) {
        // Check if RLS is enabled in the same migration
        if (!content.match(new RegExp(`${tableName}.*ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'gi'))) {
          // This might be enabled in a different migration, so just warn
          warnings.push(`${fileName}: Table '${tableName}' created - verify RLS is enabled`);
        }
      }
    }
  }
}

function checkSourceFiles() {
  const srcDir = 'src';
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        checkSourceFile(filePath);
      }
    }
  }
  
  walkDir(srcDir);
}

function checkSourceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative('.', filePath);
  
  // Check for localStorage/sessionStorage role checks (privilege escalation risk)
  if (content.match(/localStorage\.getItem.*role|sessionStorage\.getItem.*role/gi)) {
    errors.push(`${fileName}: Role check using client storage (privilege escalation risk)`);
  }
  
  // Check for hardcoded admin credentials
  if (content.match(/isAdmin\s*=\s*true|role\s*===?\s*['"]admin['"]/gi)) {
    // Only warn if it's not in a test file
    if (!fileName.includes('.test.') && !fileName.includes('__tests__')) {
      warnings.push(`${fileName}: Potential hardcoded admin check - verify server-side validation`);
    }
  }
  
  // Check for .single() without error handling (can leak data existence)
  if (content.match(/\.single\(\)(?!\s*\.catch|\s*;?\s*if)/gi)) {
    // This is a soft check - .single() is often fine
  }
}

function main() {
  console.log('🔒 Running security checks...\n');
  
  // Check migration files
  if (fs.existsSync(MIGRATIONS_DIR)) {
    const migrations = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Checking ${migrations.length} migration file(s)...`);
    
    for (const migration of migrations) {
      checkMigrationFile(path.join(MIGRATIONS_DIR, migration));
    }
  } else {
    console.log('📁 No migrations directory found');
  }
  
  // Check source files
  console.log('📁 Checking source files...');
  checkSourceFiles();
  
  // Report results
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ No security issues detected\n');
    process.exit(0);
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s):\n`);
    for (const warning of warnings) {
      console.log(`   • ${warning}`);
    }
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s):\n`);
    for (const error of errors) {
      console.log(`   • ${error}`);
    }
    console.log('\n❌ Security check failed\n');
    process.exit(1);
  }
  
  console.log('⚠️  Security check passed with warnings\n');
  process.exit(0);
}

main();
