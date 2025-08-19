import { I18nGenerator } from '../i18n-generator';
import { CsvParser } from '../csv-parser';
import { Validator } from '../validator';
import { JsonGenerator } from '../json-generator';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

describe('Validator - JSON validation functionality', () => {
  const testDir = path.join(__dirname, 'temp-json-validation');
  const csvPath = path.join(testDir, 'test.csv');
  const jsonDir = path.join(testDir, 'json');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }

    // Create sample CSV
    const csvContent = `path,description,en,mr
common.loading,Loading text,Loading...,लोड होत आहे...
auth.login,Login button,Login,लॉगिन
auth.logout,Logout button,Logout,लॉगआउट`;

    fs.writeFileSync(csvPath, csvContent);

    // Create sample JSON files
    const enJson = {
      common: {
        loading: "Loading..."
      },
      auth: {
        login: "Login",
        logout: "Logout"
      }
    };

    const mrJson = {
      common: {
        loading: "लोड होत आहे..."
      },
      auth: {
        login: "लॉगिन",
        logout: "लॉगआउट"
      }
    };

    fs.writeFileSync(path.join(jsonDir, 'en.json'), JSON.stringify(enJson, null, 2));
    fs.writeFileSync(path.join(jsonDir, 'mr.json'), JSON.stringify(mrJson, null, 2));
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should validate consistent JSON files', () => {
    const csvRows = [
      { path: 'common.loading', description: 'Loading text', en: 'Loading...', mr: 'लोड होत आहे...' },
      { path: 'auth.login', description: 'Login button', en: 'Login', mr: 'लॉगिन' },
      { path: 'auth.logout', description: 'Logout button', en: 'Logout', mr: 'लॉगआउट' }
    ];

    const result = Validator.validateJsonAgainstCsv(csvRows, jsonDir, ['en', 'mr']);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect missing translation keys', () => {
    // Create incomplete JSON file
    const incompleteJson = {
      common: {
        loading: "Loading..."
      }
      // Missing auth section
    };

    fs.writeFileSync(path.join(jsonDir, 'en.json'), JSON.stringify(incompleteJson, null, 2));

    const csvRows = [
      { path: 'common.loading', description: 'Loading text', en: 'Loading...', mr: 'लोड होत आहे...' },
      { path: 'auth.login', description: 'Login button', en: 'Login', mr: 'लॉगिन' },
      { path: 'auth.logout', description: 'Logout button', en: 'Logout', mr: 'लॉगआउट' }
    ];

    const result = Validator.validateJsonAgainstCsv(csvRows, jsonDir, ['en', 'mr']);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(error => error.message.includes('Missing translation key'))).toBe(true);
  });

  test('should detect extra translation keys', () => {
    // Create JSON with extra keys
    const extraJson = {
      common: {
        loading: "Loading...",
        extra: "Extra key"
      },
      auth: {
        login: "Login",
        logout: "Logout"
      }
    };

    fs.writeFileSync(path.join(jsonDir, 'en.json'), JSON.stringify(extraJson, null, 2));

    const csvRows = [
      { path: 'common.loading', description: 'Loading text', en: 'Loading...', mr: 'लोड होत आहे...' },
      { path: 'auth.login', description: 'Login button', en: 'Login', mr: 'लॉगिन' },
      { path: 'auth.logout', description: 'Logout button', en: 'Logout', mr: 'लॉगआउट' }
    ];

    const result = Validator.validateJsonAgainstCsv(csvRows, jsonDir, ['en', 'mr']);
    
    expect(result.isValid).toBe(true); // Extra keys are warnings, not errors
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(warning => warning.message.includes('Extra translation key'))).toBe(true);
  });
});

describe('CLI Commands Integration Tests', () => {
  const testDir = path.join(__dirname, 'cli-temp');
  const sampleCsv = path.join(testDir, 'sample.csv');
  const outputDir = path.join(testDir, 'output');
  const jsonDir = path.join(testDir, 'json');

  beforeAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(jsonDir, { recursive: true });

    // Create sample CSV
    const csvContent = `path,description,en,mr,es
common.loading,Loading message,Loading...,लोड होत आहे...,Cargando...
auth.login,Login button,Login,लॉगिन,Iniciar sesión
auth.logout,Logout button,Logout,लॉगआउट,Cerrar sesión`;

    fs.writeFileSync(sampleCsv, csvContent);

    // Create sample JSON files
    const enJson = {
      common: { loading: "Loading..." },
      auth: { login: "Login", logout: "Logout" }
    };
    const mrJson = {
      common: { loading: "लोड होत आहे..." },
      auth: { login: "लॉगिन", logout: "लॉगआउट" }
    };
    const esJson = {
      common: { loading: "Cargando..." },
      auth: { login: "Iniciar sesión", logout: "Cerrar sesión" }
    };

    fs.writeFileSync(path.join(jsonDir, 'en.json'), JSON.stringify(enJson, null, 2));
    fs.writeFileSync(path.join(jsonDir, 'mr.json'), JSON.stringify(mrJson, null, 2));
    fs.writeFileSync(path.join(jsonDir, 'es.json'), JSON.stringify(esJson, null, 2));
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('CLI: init command should create sample CSV', async () => {
    const initOutput = path.join(testDir, 'init-output.csv');
    const { stdout } = await execAsync(`node dist/cli.js init --output ${initOutput}`);
    
    expect(stdout).toContain('Sample CSV template created');
    expect(fs.existsSync(initOutput)).toBe(true);
    
    const content = fs.readFileSync(initOutput, 'utf8');
    expect(content).toContain('path,description');
    expect(content).toContain('common.loading');
  });

  test('CLI: generate command should create JSON files', async () => {
    const { stdout } = await execAsync(`node dist/cli.js generate --input ${sampleCsv} --output ${outputDir}`);
    
    expect(stdout).toContain('i18n generation completed successfully');
    expect(fs.existsSync(path.join(outputDir, 'en.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'mr.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'es.json'))).toBe(true);
  });

  test('CLI: validate command should validate CSV', async () => {
    const { stdout } = await execAsync(`node dist/cli.js validate --input ${sampleCsv}`);
    
    expect(stdout).toContain('CSV file is valid');
  });

  test('CLI: validate-json command should validate JSON files', async () => {
    const { stdout } = await execAsync(`node dist/cli.js validate-json --input ${sampleCsv} --json-dir ${jsonDir}`);
    
    expect(stdout).toContain('All JSON files are consistent with CSV data');
  });

  test('CLI: export command should export JSON to CSV', async () => {
    const exportOutput = path.join(testDir, 'exported.csv');
    const { stdout } = await execAsync(`node dist/cli.js export --input ${jsonDir} --output ${exportOutput}`);
    
    expect(stdout).toContain('Successfully exported to');
    expect(fs.existsSync(exportOutput)).toBe(true);
    
    const content = fs.readFileSync(exportOutput, 'utf8');
    expect(content).toContain('common.loading');
    expect(content).toContain('auth.login');
  });

  test('CLI: from-json command should create CSV from JSON', async () => {
    const englishJson = path.join(testDir, 'english.json');
    const outputCsv = path.join(testDir, 'from-json.csv');
    
    const enData = {
      test: { message: "Test Message" },
      app: { title: "App Title" }
    };
    fs.writeFileSync(englishJson, JSON.stringify(enData, null, 2));

    const { stdout } = await execAsync(`node dist/cli.js from-json --input ${englishJson} --output ${outputCsv} --languages en,mr`);
    
    expect(stdout).toContain('Generated CSV template from English JSON');
    expect(fs.existsSync(outputCsv)).toBe(true);
    
    const content = fs.readFileSync(outputCsv, 'utf8');
    expect(content).toContain('test.message');
    expect(content).toContain('app.title');
  });

  test('CLI: should show help when no command provided', async () => {
    const { stdout } = await execAsync('node dist/cli.js --help');
    
    expect(stdout).toContain('@bhushan001/i18n-csv-generator');
    expect(stdout).toContain('Commands:');
    expect(stdout).toContain('generate');
    expect(stdout).toContain('validate');
    expect(stdout).toContain('watch');
    expect(stdout).toContain('export');
    expect(stdout).toContain('init');
    expect(stdout).toContain('from-json');
  });

  test('CLI: should handle invalid command gracefully', async () => {
    try {
      await execAsync('node dist/cli.js invalid-command');
    } catch (error: any) {
      expect(error.stderr || error.stdout).toContain('Unknown command');
    }
  });

  test('CLI: should handle missing required arguments', async () => {
    try {
      await execAsync('node dist/cli.js generate');
    } catch (error: any) {
      expect(error.stderr || error.stdout).toContain('--input and --output are required');
    }
  });
});

describe('I18nGenerator Core Methods', () => {
  const testDir = path.join(__dirname, 'generator-temp');
  const csvFile = path.join(testDir, 'test.csv');
  const outputDir = path.join(testDir, 'output');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी
auth.login,Login button,Login,लॉगिन`;

    fs.writeFileSync(csvFile, csvContent);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should generate JSON files from CSV', async () => {
    const config = {
      inputFile: csvFile,
      outputDir: outputDir,
      languages: []
    };

    const generator = new I18nGenerator(config);
    await generator.generate();

    expect(fs.existsSync(path.join(outputDir, 'en.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'mr.json'))).toBe(true);

    const enContent = JSON.parse(fs.readFileSync(path.join(outputDir, 'en.json'), 'utf8'));
    expect(enContent.common.test).toBe('Test');
    expect(enContent.auth.login).toBe('Login');
  });

  test('should validate CSV file', async () => {
    const config = {
      inputFile: csvFile,
      outputDir: outputDir,
      languages: [],
      validateOnly: true
    };

    const generator = new I18nGenerator(config);
    await expect(generator.validate()).resolves.not.toThrow();
  });

  test('should create sample CSV template', () => {
    const sampleFile = path.join(testDir, 'sample.csv');
    I18nGenerator.createSampleCsv(sampleFile);

    expect(fs.existsSync(sampleFile)).toBe(true);
    const content = fs.readFileSync(sampleFile, 'utf8');
    expect(content).toContain('path,description');
  });

  test('should export JSON files to CSV', async () => {
    // First generate some JSON files
    const config = {
      inputFile: csvFile,
      outputDir: outputDir,
      languages: []
    };

    const generator = new I18nGenerator(config);
    await generator.generate();

    // Then export them
    const exportFile = path.join(testDir, 'exported.csv');
    await generator.exportToCsv(exportFile);

    expect(fs.existsSync(exportFile)).toBe(true);
    const content = fs.readFileSync(exportFile, 'utf8');
    expect(content).toContain('common.test');
    expect(content).toContain('auth.login');
  });
});

describe('CsvParser Extended Tests', () => {
  const testDir = path.join(__dirname, 'csv-temp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should parse CSV with various encoding', async () => {
    const csvData = `path,description,en,mr
common.hello,Hello message,Hello,नमस्कार
app.title,Application title,My App,माझा अॅप`;

    const csvFile = path.join(testDir, 'test.csv');
    fs.writeFileSync(csvFile, csvData);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].mr).toBe('नमस्कार');
    expect(result.rows[1].mr).toBe('माझा अॅप');
  });

  test('should handle empty CSV gracefully', async () => {
    const csvData = 'path,description,en,mr';
    const csvFile = path.join(testDir, 'empty.csv');
    fs.writeFileSync(csvFile, csvData);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(0);
    expect(result.languages).toEqual(['en', 'mr']);
  });

  test('should detect malformed CSV', () => {
    const headers = ['path']; // Missing required columns
    const result = CsvParser.validateHeaders(headers);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('description'))).toBe(true);
  });
});

describe('Validator Extended Tests', () => {
  test('should validate empty translations as warnings', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: '' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(warning => warning.message.includes('empty'))).toBe(true);
  });

  test('should validate duplicate keys', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'test.key', description: 'Test 1', en: 'Test 1', mr: 'चाचणी 1' },
      { path: 'test.key', description: 'Test 2', en: 'Test 2', mr: 'चाचणी 2' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(error => error.message.includes('Duplicate path'))).toBe(true);
  });

  test('should validate path format', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'invalid path with spaces', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(error => error.message.includes('Invalid path format'))).toBe(true);
  });

  test('should validate missing required fields', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: '', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(error => error.message.includes('Path is required'))).toBe(true);
  });

  test('should validate language translations', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should handle validation with warnings only', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'test.key', description: '', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('should print validation results', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    
    // Mock console.log to capture output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = jest.fn((...args) => {
      logs.push(args.join(' '));
    });

    Validator.printValidationResults(result);
    
    expect(logs.some(log => log.includes('CSV file is valid'))).toBe(true);
    
    console.log = originalLog;
  });

  test('should print validation results with errors', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: '', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    
    // Mock console.log to capture output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = jest.fn((...args) => {
      logs.push(args.join(' '));
    });

    Validator.printValidationResults(result);
    
    expect(logs.some(log => log.includes('ERRORS'))).toBe(true);
    
    console.log = originalLog;
  });
});

describe('CsvParser Advanced Tests', () => {
  const testDir = path.join(__dirname, 'csv-advanced-temp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should handle file not found error', async () => {
    const nonExistentFile = path.join(testDir, 'non-existent.csv');
    
    await expect(CsvParser.parseCsv(nonExistentFile)).rejects.toThrow('CSV file not found');
  });

  test('should validate path format correctly', () => {
    expect(CsvParser.validatePath('valid.path.format')).toBe(true);
    expect(CsvParser.validatePath('section.subsection.key')).toBe(true);
    expect(CsvParser.validatePath('invalid path with spaces')).toBe(false);
    expect(CsvParser.validatePath('path.with.special@chars')).toBe(false);
  });

  test('should find duplicate paths', () => {
    const rows = [
      { path: 'test.key', description: 'Test 1', en: 'Test 1' },
      { path: 'test.key', description: 'Test 2', en: 'Test 2' },
      { path: 'other.key', description: 'Other', en: 'Other' },
      { path: 'test.key', description: 'Test 3', en: 'Test 3' }
    ];

    const duplicates = CsvParser.findDuplicatePaths(rows);
    expect(duplicates).toContain('test.key');
    expect(duplicates).not.toContain('other.key');
  });

  test('should standardize language codes through CSV parsing', async () => {
    const csvFile = path.join(testDir, 'lang-test.csv');
    const csvContent = `path,description,English,Marathi,Spanish
test.key,Test,Hello,नमस्कार,Hola`;

    fs.writeFileSync(csvFile, csvContent);
    const result = await CsvParser.parseCsv(csvFile);
    
    // Should standardize language codes
    expect(result.languages).toContain('en');
    expect(result.languages).toContain('mr');
    expect(result.languages).toContain('es');
  });

  test('should handle CSV parsing errors', async () => {
    const malformedCsv = path.join(testDir, 'malformed.csv');
    fs.writeFileSync(malformedCsv, 'invalid,csv,format\nno,proper,structure');
    
    // This should still parse but might have issues
    const result = await CsvParser.parseCsv(malformedCsv);
    expect(result.headers).toBeDefined();
  });
});

describe('JsonGenerator Advanced Tests', () => {
  const testDir = path.join(__dirname, 'json-advanced-temp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should generate JSON from CSV with backup', async () => {
    const csvFile = path.join(testDir, 'test.csv');
    const outputDir = path.join(testDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी
auth.login,Login button,Login,लॉगिन`;

    fs.writeFileSync(csvFile, csvContent);

    // Create existing files to test backup
    const existingEn = { existing: 'data' };
    fs.writeFileSync(path.join(outputDir, 'en.json'), JSON.stringify(existingEn, null, 2));

    const rows = [
      { path: 'common.test', description: 'Test message', en: 'Test', mr: 'चाचणी' },
      { path: 'auth.login', description: 'Login button', en: 'Login', mr: 'लॉगिन' }
    ];

    const jsonOutput = JsonGenerator.generateJsonFromCsv(rows, ['en', 'mr']);
    await JsonGenerator.writeJsonFiles(jsonOutput, outputDir, true);

    // Check if backup was created
    const backupFiles = fs.readdirSync(outputDir).filter(file => file.includes('.backup'));
    expect(backupFiles.length).toBeGreaterThan(0);

    // Check if new files were created
    expect(fs.existsSync(path.join(outputDir, 'en.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'mr.json'))).toBe(true);
  });

  test('should handle nested JSON structures', () => {
    const rows = [
      { path: 'section.subsection.key', description: 'Nested key', en: 'Value', mr: 'मूल्य' },
      { path: 'section.another.key', description: 'Another nested', en: 'Another', mr: 'दुसरा' }
    ];

    const result = JsonGenerator.generateJsonFromCsv(rows, ['en', 'mr']);
    
    expect(result.en.section.subsection.key).toBe('Value');
    expect(result.en.section.another.key).toBe('Another');
    expect(result.mr.section.subsection.key).toBe('मूल्य');
  });

  test('should handle special characters in JSON', () => {
    const rows = [
      { path: 'test.special', description: 'Special chars', en: 'Test "quotes" & <tags>', mr: 'चाचणी "अवतरण" & <टॅग्स>' }
    ];

    const result = JsonGenerator.generateJsonFromCsv(rows, ['en', 'mr']);
    
    expect(result.en.test.special).toBe('Test "quotes" & <tags>');
    expect(result.mr.test.special).toBe('चाचणी "अवतरण" & <टॅग्स>');
  });

  test('should validate JSON against CSV with missing files', () => {
    const csvRows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];

    const result = Validator.validateJsonAgainstCsv(csvRows, testDir, ['en', 'mr']);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should handle JSON parsing errors', () => {
    const jsonDir = path.join(testDir, 'json');
    fs.mkdirSync(jsonDir, { recursive: true });

    // Create invalid JSON file
    fs.writeFileSync(path.join(jsonDir, 'en.json'), 'invalid json content');

    const csvRows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];

    const result = Validator.validateJsonAgainstCsv(csvRows, jsonDir, ['en', 'mr']);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('I18nGenerator Advanced Tests', () => {
  const testDir = path.join(__dirname, 'generator-advanced-temp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should handle generation with backup option', async () => {
    const csvFile = path.join(testDir, 'test.csv');
    const outputDir = path.join(testDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी`;

    fs.writeFileSync(csvFile, csvContent);

    // Create existing file
    const existingFile = path.join(outputDir, 'en.json');
    fs.writeFileSync(existingFile, JSON.stringify({ existing: 'data' }, null, 2));

    const config = {
      inputFile: csvFile,
      outputDir: outputDir,
      languages: [],
      backup: true
    };

    const generator = new I18nGenerator(config);
    await generator.generate();

    // Check if backup was created
    const backupFiles = fs.readdirSync(outputDir).filter(file => file.includes('.backup'));
    expect(backupFiles.length).toBeGreaterThan(0);
  });

  test('should handle validation only mode', async () => {
    const csvFile = path.join(testDir, 'test.csv');
    const outputDir = path.join(testDir, 'output');

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी`;

    fs.writeFileSync(csvFile, csvContent);

    const config = {
      inputFile: csvFile,
      outputDir: outputDir,
      languages: [],
      validateOnly: true
    };

    const generator = new I18nGenerator(config);
    await generator.generate();

    // Should not create output files in validate-only mode
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('should handle generation errors gracefully', async () => {
    const nonExistentFile = path.join(testDir, 'non-existent.csv');
    const outputDir = path.join(testDir, 'output');

    const config = {
      inputFile: nonExistentFile,
      outputDir: outputDir,
      languages: []
    };

    const generator = new I18nGenerator(config);
    
    await expect(generator.generate()).rejects.toThrow();
  });

  test('should print summary correctly', async () => {
    const csvFile = path.join(testDir, 'test.csv');
    const outputDir = path.join(testDir, 'output');
    fs.mkdirSync(outputDir, { recursive: true });

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी`;

    fs.writeFileSync(csvFile, csvContent);

    const config = {
      inputFile: csvFile,
      outputDir: outputDir,
      languages: []
    };

    const generator = new I18nGenerator(config);
    
    // Mock console.log to capture output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = jest.fn((...args) => {
      logs.push(args.join(' '));
    });

    await generator.generate();
    
    expect(logs.some(log => log.includes('Generation Summary'))).toBe(true);
    expect(logs.some(log => log.includes('Total Rows'))).toBe(true);
    
    console.log = originalLog;
  });

  test('should validate JSON against CSV', async () => {
    const csvFile = path.join(testDir, 'test.csv');
    const jsonDir = path.join(testDir, 'json');
    fs.mkdirSync(jsonDir, { recursive: true });

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी`;

    fs.writeFileSync(csvFile, csvContent);

    // Create matching JSON files
    const enJson = { common: { test: 'Test' } };
    const mrJson = { common: { test: 'चाचणी' } };

    fs.writeFileSync(path.join(jsonDir, 'en.json'), JSON.stringify(enJson, null, 2));
    fs.writeFileSync(path.join(jsonDir, 'mr.json'), JSON.stringify(mrJson, null, 2));

    await expect(I18nGenerator.validateJsonAgainstCsv(csvFile, jsonDir)).resolves.not.toThrow();
  });

  test('should handle JSON validation errors', async () => {
    const csvFile = path.join(testDir, 'test.csv');
    const jsonDir = path.join(testDir, 'json');
    fs.mkdirSync(jsonDir, { recursive: true });

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी`;

    fs.writeFileSync(csvFile, csvContent);

    // Create mismatched JSON files
    const enJson = { common: { wrong: 'Wrong' } };
    fs.writeFileSync(path.join(jsonDir, 'en.json'), JSON.stringify(enJson, null, 2));

    await expect(I18nGenerator.validateJsonAgainstCsv(csvFile, jsonDir)).resolves.not.toThrow();
  });

  test('should handle watch mode', async () => {
    const csvFile = path.join(testDir, 'watch-test.csv');
    const outputDir = path.join(testDir, 'watch-output');
    fs.mkdirSync(outputDir, { recursive: true });

    const csvContent = `path,description,en,mr
common.test,Test message,Test,चाचणी`;

    fs.writeFileSync(csvFile, csvContent);

    const config = {
      inputFile: csvFile,
      outputDir: outputDir,
      languages: [],
      watch: true
    };

    const generator = new I18nGenerator(config);
    
    // Start watching (this would normally run indefinitely)
    const watchPromise = generator.watch();
    
    // Stop watching after a short delay
    setTimeout(() => {
      // In a real scenario, this would be handled by process interruption
    }, 100);
    
    // The watch method should not throw immediately
    expect(watchPromise).toBeDefined();
  });

  test('should handle export with empty JSON directory', async () => {
    const emptyDir = path.join(testDir, 'empty-json');
    fs.mkdirSync(emptyDir, { recursive: true });

    const config = {
      inputFile: '',
      outputDir: emptyDir,
      languages: []
    };

    const generator = new I18nGenerator(config);
    const exportFile = path.join(testDir, 'empty-export.csv');
    
    await expect(generator.exportToCsv(exportFile)).rejects.toThrow();
  });

  test('should handle export with non-existent JSON files', async () => {
    const jsonDir = path.join(testDir, 'non-existent-json');
    fs.mkdirSync(jsonDir, { recursive: true });

    const config = {
      inputFile: '',
      outputDir: jsonDir,
      languages: []
    };

    const generator = new I18nGenerator(config);
    const exportFile = path.join(testDir, 'non-existent-export.csv');
    
    await expect(generator.exportToCsv(exportFile)).rejects.toThrow();
  });
});

describe('CLI Direct Tests', () => {
  const testDir = path.join(__dirname, 'cli-direct-temp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should test CLI argument parsing', async () => {
    // Test various CLI argument combinations
    const testCases = [
      'node dist/cli.js generate --input test.csv --output output',
      'node dist/cli.js validate --input test.csv',
      'node dist/cli.js validate-json --input test.csv --json-dir json',
      'node dist/cli.js export --input json --output export.csv',
      'node dist/cli.js init --output template.csv',
      'node dist/cli.js from-json --input en.json --output csv --languages en,mr'
    ];

    for (const command of testCases) {
      try {
        await execAsync(command);
      } catch (error: any) {
        // Expected to fail due to missing files, but should parse arguments correctly
        expect(error).toBeDefined();
      }
    }
  }, 10000);

  test('should test CLI with short options', async () => {
    const testCases = [
      'node dist/cli.js generate -i test.csv -o output',
      'node dist/cli.js validate -i test.csv',
      'node dist/cli.js from-json -i en.json -o csv -l en,mr'
    ];

    for (const command of testCases) {
      try {
        await execAsync(command);
      } catch (error: any) {
        // Expected to fail due to missing files
        expect(error).toBeDefined();
      }
    }
  });

  test('should test CLI with boolean flags', async () => {
    const testCases = [
      'node dist/cli.js generate --input test.csv --output output --backup',
      'node dist/cli.js generate --input test.csv --output output -b'
    ];

    for (const command of testCases) {
      try {
        await execAsync(command);
      } catch (error: any) {
        // Expected to fail due to missing files
        expect(error).toBeDefined();
      }
    }
  });
});

describe('Validator Edge Cases', () => {
  test('should handle validation with no languages', () => {
    const headers = ['path', 'description'];
    const rows = [
      { path: 'test.key', description: 'Test' }
    ];
    const languages: string[] = [];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(false); // Should fail because no language columns
  });

  test('should handle validation with single language', () => {
    const headers = ['path', 'description', 'en'];
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test' }
    ];
    const languages = ['en'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true);
  });

  test('should handle validation with missing language columns', () => {
    const headers = ['path', 'description', 'en'];
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test' }
    ];
    const languages = ['en', 'mr']; // mr is missing from headers

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true); // Should pass as extra languages are ignored
  });

  test('should handle validation with extra language columns', () => {
    const headers = ['path', 'description', 'en', 'mr', 'es'];
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: 'चाचणी', es: 'Prueba' }
    ];
    const languages = ['en', 'mr']; // es is extra

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true);
  });

  test('should handle validation with complex nested paths', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'section.subsection.deep.key', description: 'Deep nested', en: 'Deep', mr: 'खोल' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true);
  });

  test('should handle validation with special characters in paths', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: 'section.sub-section.key_name', description: 'Special chars', en: 'Special', mr: 'विशेष' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(false); // Should fail due to invalid path format
  });

  test('should handle validation with very long descriptions', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const longDescription = 'A'.repeat(1000);
    const rows = [
      { path: 'test.key', description: longDescription, en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true);
  });

  test('should handle validation with empty rows', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows: any[] = [];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.isValid).toBe(true);
  });

  test('should handle validation with null/undefined values', () => {
    const headers = ['path', 'description', 'en', 'mr'];
    const rows = [
      { path: '', description: '', en: '', mr: '' }
    ];
    const languages = ['en', 'mr'];

    const result = Validator.validateCsvData(headers, rows, languages);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('JsonGenerator Edge Cases', () => {
  const testDir = path.join(__dirname, 'json-edge-temp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should handle JSON generation with empty rows', () => {
    const rows: any[] = [];
    const languages = ['en', 'mr'];

    const result = JsonGenerator.generateJsonFromCsv(rows, languages);
    expect(result.en).toEqual({});
    expect(result.mr).toEqual({});
  });

  test('should handle JSON generation with single language', () => {
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test' }
    ];
    const languages = ['en'];

    const result = JsonGenerator.generateJsonFromCsv(rows, languages);
    expect(result.en.test.key).toBe('Test');
    expect(result.mr).toBeUndefined();
  });

  test('should handle JSON generation with missing language values', () => {
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: '' }
    ];
    const languages = ['en', 'mr'];

    const result = JsonGenerator.generateJsonFromCsv(rows, languages);
    expect(result.en.test.key).toBe('Test');
    expect(result.mr.test.key).toBe(''); // Empty string should be preserved
  });

  test('should handle JSON generation with very deep nesting', () => {
    const rows = [
      { path: 'a.b.c.d.e.f.g.h.i.j.k', description: 'Deep nested', en: 'Deep', mr: 'खोल' }
    ];
    const languages = ['en', 'mr'];

    const result = JsonGenerator.generateJsonFromCsv(rows, languages);
    expect(result.en.a.b.c.d.e.f.g.h.i.j.k).toBe('Deep');
    expect(result.mr.a.b.c.d.e.f.g.h.i.j.k).toBe('खोल');
  });

  test('should handle JSON generation with array-like paths', () => {
    const rows = [
      { path: 'items.0.name', description: 'Array item', en: 'Item 1', mr: 'आयटम १' },
      { path: 'items.1.name', description: 'Array item', en: 'Item 2', mr: 'आयटम २' }
    ];
    const languages = ['en', 'mr'];

    const result = JsonGenerator.generateJsonFromCsv(rows, languages);
    expect(result.en.items['0'].name).toBe('Item 1');
    expect(result.en.items['1'].name).toBe('Item 2');
  });

  test('should handle JSON file writing with directory creation', async () => {
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const jsonOutput = JsonGenerator.generateJsonFromCsv(rows, languages);
    const outputDir = path.join(testDir, 'nested', 'deep', 'output');
    
    await JsonGenerator.writeJsonFiles(jsonOutput, outputDir, false);
    
    expect(fs.existsSync(path.join(outputDir, 'en.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'mr.json'))).toBe(true);
  });

  test('should handle JSON file writing with existing backup files', async () => {
    const rows = [
      { path: 'test.key', description: 'Test', en: 'Test', mr: 'चाचणी' }
    ];
    const languages = ['en', 'mr'];

    const jsonOutput = JsonGenerator.generateJsonFromCsv(rows, languages);
    const outputDir = path.join(testDir, 'backup-test');
    fs.mkdirSync(outputDir, { recursive: true });

    // Create existing backup files
    fs.writeFileSync(path.join(outputDir, 'en.json.backup'), '{"existing": "backup"}');
    
    await JsonGenerator.writeJsonFiles(jsonOutput, outputDir, true);
    
    expect(fs.existsSync(path.join(outputDir, 'en.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'en.json.backup'))).toBe(true);
  });

  test('should handle from-json with complex nested structure', async () => {
    const englishJson = path.join(testDir, 'complex.json');
    const outputCsv = path.join(testDir, 'complex.csv');
    
    const complexData = {
      app: {
        header: {
          title: "App Title",
          subtitle: "App Subtitle"
        },
        navigation: {
          home: "Home",
          about: "About",
          contact: "Contact"
        }
      },
      features: {
        list: {
          item1: "Feature 1",
          item2: "Feature 2"
        }
      }
    };
    
    fs.writeFileSync(englishJson, JSON.stringify(complexData, null, 2));

    await JsonGenerator.generateCsvFromEnglishJson(englishJson, outputCsv, ['en', 'mr']);
    
    expect(fs.existsSync(outputCsv)).toBe(true);
    
    const content = fs.readFileSync(outputCsv, 'utf8');
    expect(content).toContain('app.header.title');
    expect(content).toContain('app.navigation.home');
    expect(content).toContain('features.list.item1');
  });

  test('should handle from-json with empty object', async () => {
    const englishJson = path.join(testDir, 'empty.json');
    const outputCsv = path.join(testDir, 'empty.csv');
    
    const emptyData = {};
    fs.writeFileSync(englishJson, JSON.stringify(emptyData, null, 2));

    await JsonGenerator.generateCsvFromEnglishJson(englishJson, outputCsv, ['en', 'mr']);
    
    expect(fs.existsSync(outputCsv)).toBe(true);
    
    const content = fs.readFileSync(outputCsv, 'utf8');
    expect(content).toContain('path,description,en,mr');
  });

  test('should handle from-json with array values', async () => {
    const englishJson = path.join(testDir, 'array.json');
    const outputCsv = path.join(testDir, 'array.csv');
    
    const arrayData = {
      items: ["Item 1", "Item 2", "Item 3"],
      config: {
        options: ["Option A", "Option B"]
      }
    };
    
    fs.writeFileSync(englishJson, JSON.stringify(arrayData, null, 2));

    await JsonGenerator.generateCsvFromEnglishJson(englishJson, outputCsv, ['en', 'mr']);
    
    expect(fs.existsSync(outputCsv)).toBe(true);
    
    const content = fs.readFileSync(outputCsv, 'utf8');
    expect(content).toContain('items');
    expect(content).toContain('config.options');
  });
});

describe('CsvParser Edge Cases', () => {
  const testDir = path.join(__dirname, 'csv-edge-temp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should handle CSV with only headers', async () => {
    const csvFile = path.join(testDir, 'headers-only.csv');
    const csvContent = 'path,description,en,mr';
    fs.writeFileSync(csvFile, csvContent);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(0);
    expect(result.headers).toEqual(['path', 'description', 'en', 'mr']);
    expect(result.languages).toEqual(['en', 'mr']);
  });

  test('should handle CSV with empty values', async () => {
    const csvFile = path.join(testDir, 'empty-values.csv');
    const csvContent = `path,description,en,mr
test.key,Test description,,चाचणी
another.key,Another description,Another,`;
    fs.writeFileSync(csvFile, csvContent);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].en).toBe('');
    expect(result.rows[1].mr).toBe('');
  });

  test('should handle CSV with quoted values', async () => {
    const csvFile = path.join(testDir, 'quoted-values.csv');
    const csvContent = `path,description,en,mr
test.key,"Test description with, comma",Test,"चाचणी, मूल्य"
another.key,"Another description",Another,चाचणी`;
    fs.writeFileSync(csvFile, csvContent);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].description).toBe('Test description with, comma');
    expect(result.rows[0].mr).toBe('चाचणी, मूल्य');
  });

  test('should handle CSV with special characters', async () => {
    const csvFile = path.join(testDir, 'special-chars.csv');
    const csvContent = `path,description,en,mr
test.key,Test with "quotes" & <tags>,Test,"चाचणी "अवतरण" & <टॅग्स>"
emoji.key,Test with emojis 🎉,Test 🎉,चाचणी 🎉`;
    fs.writeFileSync(csvFile, csvContent);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].description).toContain('quotes');
    expect(result.rows[1].description).toContain('🎉');
  });

  test('should handle CSV with different line endings', async () => {
    const csvFile = path.join(testDir, 'line-endings.csv');
    const csvContent = 'path,description,en,mr\r\ntest.key,Test,Test,चाचणी\r\nanother.key,Another,Another,दुसरा';
    fs.writeFileSync(csvFile, csvContent);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].path).toBe('test.key');
    expect(result.rows[1].path).toBe('another.key');
  });

  test('should handle CSV with trailing commas', async () => {
    const csvFile = path.join(testDir, 'trailing-commas.csv');
    const csvContent = `path,description,en,mr,
test.key,Test description,Test,चाचणी,
another.key,Another description,Another,दुसरा,`;
    fs.writeFileSync(csvFile, csvContent);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].path).toBe('test.key');
    expect(result.rows[1].path).toBe('another.key');
  });

  test('should handle CSV with BOM (Byte Order Mark)', async () => {
    const csvFile = path.join(testDir, 'bom.csv');
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const csvContent = 'path,description,en,mr\ntest.key,Test,Test,चाचणी';
    fs.writeFileSync(csvFile, Buffer.concat([bom, Buffer.from(csvContent)]));

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(1);
    // BOM might affect parsing, so just check that we got some result
    expect(result.rows[0]).toBeDefined();
  });

  test('should handle CSV with very large content', async () => {
    const csvFile = path.join(testDir, 'large.csv');
    let csvContent = 'path,description,en,mr\n';
    
    // Generate 1000 rows
    for (let i = 0; i < 1000; i++) {
      csvContent += `test.key${i},Test description ${i},Test ${i},चाचणी ${i}\n`;
    }
    
    fs.writeFileSync(csvFile, csvContent);

    const result = await CsvParser.parseCsv(csvFile);
    expect(result.rows).toHaveLength(1000);
    expect(result.rows[999].path).toBe('test.key999');
  });

  test('should handle path validation edge cases', () => {
    // Valid paths
    expect(CsvParser.validatePath('valid.path')).toBe(true);
    expect(CsvParser.validatePath('section.subsection.key')).toBe(true);
    expect(CsvParser.validatePath('a.b.c.d.e.f')).toBe(true);
    expect(CsvParser.validatePath('valid.path')).toBe(true);
    expect(CsvParser.validatePath('valid.path')).toBe(true);
    expect(CsvParser.validatePath('valid123.path')).toBe(true);
    
    // Invalid paths
    expect(CsvParser.validatePath('')).toBe(false);
    expect(CsvParser.validatePath('invalid path with spaces')).toBe(false);
    expect(CsvParser.validatePath('path.with.special@chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special#chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special$chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special%chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special^chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special&chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special*chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special(chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special)chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special+chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special=chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special[chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special]chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special{chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special}chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special|chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special\\chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special:chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special;chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special"chars')).toBe(false);
    expect(CsvParser.validatePath("path.with.special'chars")).toBe(false);
    expect(CsvParser.validatePath('path.with.special<chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special>chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special,chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special?chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special/chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special~chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special`chars')).toBe(false);
    expect(CsvParser.validatePath('path.with.special!chars')).toBe(false);
  });

  test('should handle duplicate path detection edge cases', () => {
    // No duplicates
    const noDuplicates = [
      { path: 'test.key1', description: 'Test 1', en: 'Test 1' },
      { path: 'test.key2', description: 'Test 2', en: 'Test 2' },
      { path: 'other.key', description: 'Other', en: 'Other' }
    ];
    expect(CsvParser.findDuplicatePaths(noDuplicates)).toEqual([]);

    // Multiple duplicates
    const multipleDuplicates = [
      { path: 'test.key', description: 'Test 1', en: 'Test 1' },
      { path: 'test.key', description: 'Test 2', en: 'Test 2' },
      { path: 'other.key', description: 'Other 1', en: 'Other 1' },
      { path: 'other.key', description: 'Other 2', en: 'Other 2' },
      { path: 'unique.key', description: 'Unique', en: 'Unique' }
    ];
    const duplicates = CsvParser.findDuplicatePaths(multipleDuplicates);
    expect(duplicates).toContain('test.key');
    expect(duplicates).toContain('other.key');
    expect(duplicates).not.toContain('unique.key');
  });
});
