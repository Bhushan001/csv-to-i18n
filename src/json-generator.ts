import * as fs from 'fs';
import * as path from 'path';
import { CsvRow, JsonOutput } from './types';

export class JsonGenerator {
  /**
   * Convert CSV rows to nested JSON structure
   */
  static generateJsonFromCsv(rows: CsvRow[], languages: string[]): JsonOutput {
    const output: JsonOutput = {};

    // Initialize output for each language
    languages.forEach(lang => {
      output[lang] = {};
    });

    // Process each row
    rows.forEach(row => {
      const pathParts = row.path.split('.');
      
      languages.forEach(lang => {
        const translation = row[lang] || '';
        if (translation.trim()) {
          this.setNestedValue(output[lang], pathParts, translation);
        }
      });
    });

    return output;
  }

  /**
   * Set nested value in object using path parts
   */
  private static setNestedValue(obj: any, pathParts: string[], value: string): void {
    let current = obj;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;

      if (isLast) {
        current[part] = value;
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  /**
   * Write JSON files to output directory
   */
  static async writeJsonFiles(
    output: JsonOutput, 
    outputDir: string, 
    backup: boolean = false
  ): Promise<void> {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write each language file
    for (const [language, data] of Object.entries(output)) {
      const fileName = `${language}.json`;
      const filePath = path.join(outputDir, fileName);

      // Create backup if requested
      if (backup && fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
      }

      // Write JSON file with proper formatting
      const jsonContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonContent, 'utf8');
    }
  }

  /**
   * Convert existing JSON files back to CSV format
   */
  static async exportJsonToCsv(
    jsonDir: string, 
    outputCsvPath: string
  ): Promise<void> {
    const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      throw new Error('No JSON files found in the specified directory');
    }

    const allPaths = new Set<string>();
    const translations: { [path: string]: { [lang: string]: string } } = {};

    // Read all JSON files and collect paths
    for (const file of files) {
      const lang = file.replace('.json', '');
      const filePath = path.join(jsonDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      this.flattenJson(content, '', allPaths, translations, lang);
    }

    // Generate CSV content
    const languages = files.map(file => file.replace('.json', ''));
    const csvContent = this.generateCsvContent(allPaths, translations, languages);

    // Write CSV file
    fs.writeFileSync(outputCsvPath, csvContent, 'utf8');
  }

  /**
   * Flatten nested JSON object
   */
  private static flattenJson(
    obj: any, 
    prefix: string, 
    allPaths: Set<string>, 
    translations: { [path: string]: { [lang: string]: string } }, 
    lang: string
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        this.flattenJson(value, currentPath, allPaths, translations, lang);
      } else {
        allPaths.add(currentPath);
        if (!translations[currentPath]) {
          translations[currentPath] = {};
        }
        translations[currentPath][lang] = String(value);
      }
    }
  }

  /**
   * Generate CSV content from flattened translations
   */
  private static generateCsvContent(
    allPaths: Set<string>, 
    translations: { [path: string]: { [lang: string]: string } }, 
    languages: string[]
  ): string {
    const headers = ['path', 'description', ...languages];
    const csvRows = [headers.join(',')];

    for (const path of Array.from(allPaths).sort()) {
      const row = [path, `Translation for ${path}`];
      
      languages.forEach(lang => {
        const translation = translations[path]?.[lang] || '';
        // Escape commas and quotes in CSV
        const escapedTranslation = translation.replace(/"/g, '""');
        row.push(`"${escapedTranslation}"`);
      });

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }
}
