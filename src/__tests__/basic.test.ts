import { I18nGenerator } from '../i18n-generator';
import { CsvParser } from '../csv-parser';
import { Validator } from '../validator';

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
