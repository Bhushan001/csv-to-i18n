import { I18nGenerator } from '../i18n-generator';
import { CsvParser } from '../csv-parser';
import { Validator } from '../validator';
import { JsonGenerator } from '../json-generator';
import * as fs from 'fs';
import * as path from 'path';

describe('I18nGenerator', () => {
  test('should create instance with config', () => {
    const config = {
      inputFile: 'test.csv',
      outputDir: 'test-output',
      languages: ['en', 'es']
    };
    
    const generator = new I18nGenerator(config);
    expect(generator).toBeInstanceOf(I18nGenerator);
  });
});

describe('CsvParser', () => {
  test('should validate headers correctly', () => {
    const validHeaders = ['path', 'description', 'en', 'es'];
    const result = CsvParser.validateHeaders(validHeaders);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect invalid headers', () => {
    const invalidHeaders = ['path']; // missing description and languages
    const result = CsvParser.validateHeaders(invalidHeaders);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Validator', () => {
  test('should validate CSV data', () => {
    const headers = ['path', 'description', 'en', 'es'];
    const rows = [
      { path: 'common.buttons.save', description: 'Save button', en: 'Save', es: 'Guardar' }
    ];
    const languages = ['en', 'es'];
    
    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.errors).toHaveLength(0);
  });
});

describe('JsonGenerator - from-json functionality', () => {
  const testDir = path.join(__dirname, 'temp');
  const englishJsonPath = path.join(testDir, 'en.json');
  const outputCsvPath = path.join(testDir, 'output.csv');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create sample English JSON
    const englishJson = {
      common: {
        loading: "Loading...",
        error: "An error occurred",
        success: "Success"
      },
      auth: {
        login: "Login",
        logout: "Logout"
      }
    };

    fs.writeFileSync(englishJsonPath, JSON.stringify(englishJson, null, 2));
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should generate CSV from English JSON', async () => {
    await JsonGenerator.generateCsvFromEnglishJson(
      englishJsonPath,
      outputCsvPath,
      ['en', 'mr']
    );

    expect(fs.existsSync(outputCsvPath)).toBe(true);

    const csvContent = fs.readFileSync(outputCsvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    // Check header
    expect(lines[0]).toBe('path,description,en,mr');
    
    // Check that English translations are included
    expect(csvContent).toContain('common.loading');
    expect(csvContent).toContain('Loading...');
    expect(csvContent).toContain('auth.login');
    expect(csvContent).toContain('Login');
  });

  test('should throw error for non-existent JSON file', async () => {
    const nonExistentPath = path.join(testDir, 'non-existent.json');
    
    await expect(
      JsonGenerator.generateCsvFromEnglishJson(nonExistentPath, outputCsvPath)
    ).rejects.toThrow('English JSON file not found');
  });
});
