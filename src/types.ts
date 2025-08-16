export interface GeneratorConfig {
  inputFile: string;
  outputDir: string;
  languages: string[];
  defaultLanguage?: string;
  validateOnly?: boolean;
  watch?: boolean;
  backup?: boolean;
}

export interface CsvRow {
  path: string;
  description: string;
  [key: string]: string; // Dynamic language columns
}

export interface TranslationData {
  [language: string]: {
    [key: string]: any;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: string;
}

export interface ValidationWarning {
  row: number;
  column: string;
  message: string;
  value?: string;
}

export interface ParsedCsvData {
  headers: string[];
  rows: CsvRow[];
  languages: string[];
}

export interface JsonOutput {
  [language: string]: {
    [key: string]: any;
  };
}
