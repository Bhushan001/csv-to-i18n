import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { CsvRow, ParsedCsvData } from './types';

export class CsvParser {
  /**
   * Parse CSV file and extract translation data
   */
  static async parseCsv(filePath: string): Promise<ParsedCsvData> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      const headers: string[] = [];
      let isFirstRow = true;

      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList: string[]) => {
          headers.push(...headerList);
        })
        .on('data', (data: any) => {
          if (isFirstRow) {
            isFirstRow = false;
          }
          
          const row: CsvRow = {
            path: data.path || '',
            description: data.description || ''
          };

          // Add language columns dynamically
          headers.forEach(header => {
            if (header !== 'path' && header !== 'description') {
              row[header] = data[header] || '';
            }
          });

          results.push(row);
        })
        .on('end', () => {
          // Extract language codes from headers
          const languages = headers.filter(header => 
            header !== 'path' && header !== 'description'
          );

          resolve({
            headers,
            rows: results,
            languages
          });
        })
        .on('error', (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          reject(new Error(`Error parsing CSV: ${errorMessage}`));
        });
    });
  }

  /**
   * Validate CSV structure
   */
  static validateHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredColumns = ['path', 'description'];

    // Check required columns
    for (const required of requiredColumns) {
      if (!headers.includes(required)) {
        errors.push(`Missing required column: ${required}`);
      }
    }

    // Check for language columns
    const languageColumns = headers.filter(header => 
      header !== 'path' && header !== 'description'
    );

    if (languageColumns.length === 0) {
      errors.push('No language columns found. Expected at least one language column.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate path format (dot notation)
   */
  static validatePath(path: string): boolean {
    if (!path || typeof path !== 'string') {
      return false;
    }

    // Check for valid dot notation format
    const pathRegex = /^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*$/;
    return pathRegex.test(path);
  }

  /**
   * Check for duplicate paths
   */
  static findDuplicatePaths(rows: CsvRow[]): string[] {
    const paths = rows.map(row => row.path);
    const duplicates: string[] = [];
    const seen = new Set<string>();

    paths.forEach(path => {
      if (seen.has(path)) {
        duplicates.push(path);
      } else {
        seen.add(path);
      }
    });

    return [...new Set(duplicates)];
  }
}
