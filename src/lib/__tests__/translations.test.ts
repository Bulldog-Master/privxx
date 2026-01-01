/**
 * Translation Quality Tests
 * 
 * These tests ensure all translation files are properly synchronized
 * and do not contain placeholder markers that indicate untranslated content.
 * 
 * Run with: npx vitest run src/lib/__tests__/translations.test.ts
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.resolve(process.cwd(), 'public/locales');

// Pattern to detect placeholder markers like [AR], [BN], [DE], etc.
const PLACEHOLDER_PATTERN = /^\[(AR|BN|DE|ES|FR|HE|HI|ID|IT|JA|KO|NL|PL|PT|RU|TR|UR|YI|ZH|XX)\]/;

// Forbidden terms that over-promise privacy capabilities
const FORBIDDEN_TERMS = [
  'anonymous',
  'anonymity', 
  'untraceable',
  'guaranteed',
  'perfect privacy',
  'absolute privacy',
  '100% private',
  'completely anonymous',
  'total anonymity',
  'fully anonymous',
];

// Brand terms that should never be translated
const BRAND_TERMS = ['Privxx', 'cMixx', 'xxDK', 'XX Network'];

// Get all keys from nested object
function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce((o: unknown, k: string) => {
    if (o && typeof o === 'object' && k in (o as Record<string, unknown>)) {
      return (o as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

// Get list of language directories
function getLanguages(): string[] {
  try {
    return fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {
    return [];
  }
}

// Load translation file
function loadTranslation(lang: string): Record<string, unknown> | null {
  const filePath = path.join(LOCALES_DIR, lang, 'ui.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

describe('Translation Quality', () => {
  const languages = getLanguages();
  const enTranslation = loadTranslation('en');
  
  it('should have English reference file', () => {
    expect(enTranslation).not.toBeNull();
  });

  it('should have at least 20 supported languages', () => {
    expect(languages.length).toBeGreaterThanOrEqual(20);
  });

  describe('Key Synchronization', () => {
    if (!enTranslation) return;
    
    const enKeys = getKeys(enTranslation);
    
    languages.filter(lang => lang !== 'en').forEach(lang => {
      it(`${lang}: should have all keys from English reference`, () => {
        const translation = loadTranslation(lang);
        expect(translation).not.toBeNull();
        
        if (!translation) return;
        
        const langKeys = getKeys(translation);
        const missingKeys = enKeys.filter(k => !langKeys.includes(k));
        
        expect(missingKeys).toEqual([]);
      });

      it(`${lang}: should not have extra keys not in English reference`, () => {
        const translation = loadTranslation(lang);
        expect(translation).not.toBeNull();
        
        if (!translation) return;
        
        const langKeys = getKeys(translation);
        const extraKeys = langKeys.filter(k => !enKeys.includes(k));
        
        expect(extraKeys).toEqual([]);
      });
    });
  });

  describe('Placeholder Markers', () => {
    languages.filter(lang => lang !== 'en').forEach(lang => {
      it(`${lang}: should not contain placeholder markers like [XX]`, () => {
        const translation = loadTranslation(lang);
        expect(translation).not.toBeNull();
        
        if (!translation) return;
        
        const keys = getKeys(translation);
        const placeholders: { key: string; value: string }[] = [];
        
        for (const key of keys) {
          const value = getNestedValue(translation, key);
          if (typeof value === 'string' && PLACEHOLDER_PATTERN.test(value)) {
            placeholders.push({ key, value: value.substring(0, 60) });
          }
        }
        
        expect(placeholders).toEqual([]);
      });
    });
  });

  describe('Forbidden Terms', () => {
    languages.forEach(lang => {
      it(`${lang}: should not contain forbidden privacy over-claims`, () => {
        const translation = loadTranslation(lang);
        expect(translation).not.toBeNull();
        
        if (!translation) return;
        
        const content = JSON.stringify(translation).toLowerCase();
        const violations: string[] = [];
        
        for (const term of FORBIDDEN_TERMS) {
          if (content.includes(term.toLowerCase())) {
            violations.push(term);
          }
        }
        
        expect(violations).toEqual([]);
      });
    });
  });

  describe('Brand Terms Preservation', () => {
    languages.filter(lang => lang !== 'en').forEach(lang => {
      it(`${lang}: should preserve brand terms (Privxx, cMixx, xxDK, XX Network)`, () => {
        const translation = loadTranslation(lang);
        const enContent = loadTranslation('en');
        
        if (!translation || !enContent) return;
        
        const enKeys = getKeys(enContent);
        
        for (const key of enKeys) {
          const enValue = getNestedValue(enContent, key);
          const langValue = getNestedValue(translation, key);
          
          if (typeof enValue !== 'string' || typeof langValue !== 'string') continue;
          
          // Check each brand term
          for (const brand of BRAND_TERMS) {
            if (enValue.includes(brand)) {
              // The translation should also contain this brand term
              expect(langValue).toContain(brand);
            }
          }
        }
      });
    });
  });

  describe('Valid JSON Structure', () => {
    languages.forEach(lang => {
      it(`${lang}: should have valid JSON structure`, () => {
        const filePath = path.join(LOCALES_DIR, lang, 'ui.json');
        
        expect(() => {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content);
        }).not.toThrow();
      });
    });
  });

  describe('Coverage Statistics', () => {
    it('should report translation coverage for all languages', () => {
      if (!enTranslation) return;
      
      const enKeys = getKeys(enTranslation);
      const stats: { lang: string; keys: number; placeholders: number; coverage: string }[] = [];
      
      for (const lang of languages) {
        const translation = loadTranslation(lang);
        if (!translation) continue;
        
        const langKeys = getKeys(translation);
        let placeholders = 0;
        
        for (const key of langKeys) {
          const value = getNestedValue(translation, key);
          if (typeof value === 'string' && PLACEHOLDER_PATTERN.test(value)) {
            placeholders++;
          }
        }
        
        const translated = langKeys.length - placeholders;
        const coverage = ((translated / enKeys.length) * 100).toFixed(1);
        
        stats.push({
          lang,
          keys: langKeys.length,
          placeholders,
          coverage: `${coverage}%`
        });
      }
      
      // Log coverage report
      console.log('\n📊 Translation Coverage Report:');
      console.log('================================');
      for (const s of stats.sort((a, b) => a.lang.localeCompare(b.lang))) {
        const status = s.placeholders === 0 ? '✅' : '⚠️';
        console.log(`${status} ${s.lang.toUpperCase()}: ${s.keys} keys, ${s.placeholders} placeholders (${s.coverage})`);
      }
      console.log('================================\n');
      
      // All languages should have 100% coverage (no placeholders)
      const incompleteLanguages = stats.filter(s => s.placeholders > 0);
      expect(incompleteLanguages).toEqual([]);
    });
  });
});
