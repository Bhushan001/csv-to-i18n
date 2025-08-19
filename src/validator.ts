import { CsvRow, ValidationResult, ValidationError, ValidationWarning } from './types';
import { CsvParser } from './csv-parser';

export class Validator {
  /**
   * Validate CSV data comprehensively
   */
  static validateCsvData(
    headers: string[], 
    rows: CsvRow[], 
    languages: string[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate headers
    const headerValidation = CsvParser.validateHeaders(headers);
    if (!headerValidation.isValid) {
      headerValidation.errors.forEach(error => {
        errors.push({
          row: 0,
          column: 'headers',
          message: error
        });
      });
    }

    // Validate each row
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because CSV is 1-indexed and we have headers

      // Validate path
      if (!row.path || row.path.trim() === '') {
        errors.push({
          row: rowNumber,
          column: 'path',
          message: 'Path is required',
          value: row.path
        });
      } else if (!CsvParser.validatePath(row.path)) {
        errors.push({
          row: rowNumber,
          column: 'path',
          message: 'Invalid path format. Use dot notation (e.g., section.subsection.key)',
          value: row.path
        });
      }

      // Validate description
      if (!row.description || row.description.trim() === '') {
        warnings.push({
          row: rowNumber,
          column: 'description',
          message: 'Description is empty. Consider adding a description for better context.',
          value: row.description
        });
      }

      // Validate language translations
      languages.forEach(lang => {
        const translation = row[lang];
        if (!translation || translation.trim() === '') {
          warnings.push({
            row: rowNumber,
            column: lang,
            message: `Translation for ${lang} is empty`,
            value: translation
          });
        } else {
          // Check for special characters that might cause JSON issues
          if (translation.includes('\\') || translation.includes('"')) {
            warnings.push({
              row: rowNumber,
              column: lang,
              message: `Translation contains special characters that will be escaped in JSON`,
              value: translation
            });
          }
        }
      });
    });

    // Check for duplicate paths
    const duplicatePaths = CsvParser.findDuplicatePaths(rows);
    duplicatePaths.forEach(path => {
      const duplicateRows = rows
        .map((row, index) => ({ row: row, index: index + 2 }))
        .filter(item => item.row.path === path);

      duplicateRows.forEach(item => {
        errors.push({
          row: item.index,
          column: 'path',
          message: `Duplicate path found: ${path}`,
          value: path
        });
      });
    });

    // Check for empty rows
    const emptyRows = rows.filter(row => 
      !row.path.trim() && 
      !row.description.trim() && 
      languages.every(lang => !row[lang]?.trim())
    );

    if (emptyRows.length > 0) {
      warnings.push({
        row: 0,
        column: 'general',
        message: `Found ${emptyRows.length} empty rows that will be skipped`
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Print validation results to console
   */
  static printValidationResults(result: ValidationResult): void {
    console.log('\n=== Validation Results ===\n');

    if (result.errors.length > 0) {
      console.log('❌ ERRORS:');
      result.errors.forEach(error => {
        console.log(`  Row ${error.row}, Column "${error.column}": ${error.message}`);
        if (error.value) {
          console.log(`    Value: "${error.value}"`);
        }
      });
      console.log('');
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      result.warnings.forEach(warning => {
        if (warning.row === 0) {
          console.log(`  ${warning.message}`);
        } else {
          console.log(`  Row ${warning.row}, Column "${warning.column}": ${warning.message}`);
          if (warning.value) {
            console.log(`    Value: "${warning.value}"`);
          }
        }
      });
      console.log('');
    }

    if (result.isValid) {
      console.log('✅ CSV file is valid!');
    } else {
      console.log('❌ CSV file has errors that need to be fixed.');
    }

    console.log('');
  }

  /**
   * Get summary statistics
   */
  static getValidationStats(result: ValidationResult, totalRows: number): {
    totalRows: number;
    errorCount: number;
    warningCount: number;
    isValid: boolean;
  } {
    return {
      totalRows,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      isValid: result.isValid
    };
  }

  /**
   * Validate JSON files against CSV data to ensure consistency
   */
  static validateJsonAgainstCsv(
    csvRows: CsvRow[],
    jsonDir: string,
    languages: string[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Get all paths from CSV
    const csvPaths = new Set(csvRows.map(row => row.path));

    // Check each language file
    languages.forEach(lang => {
      const jsonFilePath = `${jsonDir}/${lang}.json`;
      
      try {
        const fs = require('fs');
        if (!fs.existsSync(jsonFilePath)) {
          errors.push({
            row: 0,
            column: lang,
            message: `JSON file not found: ${jsonFilePath}`,
            value: jsonFilePath
          });
          return;
        }

        const jsonContent = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        const jsonPaths = new Set<string>();

        // Flatten JSON to get all paths
        this.flattenJsonPaths(jsonContent, '', jsonPaths);

        // Check for missing paths in JSON (paths in CSV but not in JSON)
        csvPaths.forEach(csvPath => {
          if (!jsonPaths.has(csvPath)) {
            errors.push({
              row: 0,
              column: lang,
              message: `Missing translation key in ${lang}.json: ${csvPath}`,
              value: csvPath
            });
          }
        });

        // Check for extra paths in JSON (paths in JSON but not in CSV)
        jsonPaths.forEach(jsonPath => {
          if (!csvPaths.has(jsonPath)) {
            warnings.push({
              row: 0,
              column: lang,
              message: `Extra translation key in ${lang}.json (not in CSV): ${jsonPath}`,
              value: jsonPath
            });
          }
        });

      } catch (error) {
        errors.push({
          row: 0,
          column: lang,
          message: `Error reading ${lang}.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
          value: jsonFilePath
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Flatten JSON object to get all paths
   */
  private static flattenJsonPaths(obj: any, prefix: string, paths: Set<string>): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.flattenJsonPaths(value, currentPath, paths);
      } else {
        paths.add(currentPath);
      }
    }
  }

  /**
   * Print JSON validation results to console
   */
  static printJsonValidationResults(result: ValidationResult, jsonDir: string): void {
    console.log('\n=== JSON Files Validation Results ===\n');

    if (result.errors.length > 0) {
      console.log('❌ ERRORS:');
      result.errors.forEach(error => {
        console.log(`  ${error.message}`);
        if (error.value) {
          console.log(`    Key: "${error.value}"`);
        }
      });
      console.log('');
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      result.warnings.forEach(warning => {
        console.log(`  ${warning.message}`);
        if (warning.value) {
          console.log(`    Key: "${warning.value}"`);
        }
      });
      console.log('');
    }

    if (result.isValid) {
      console.log('✅ All JSON files are consistent with CSV data!');
    } else {
      console.log('❌ JSON files have inconsistencies that need to be fixed.');
    }

    console.log('');
  }
}
