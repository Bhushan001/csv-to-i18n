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

  /**
   * Generate CSV from existing English JSON file
   * This is useful when users already have English translations and want to add other languages
   */
  static async generateCsvFromEnglishJson(
    englishJsonPath: string,
    outputCsvPath: string,
    targetLanguages: string[] = ['en', 'mr']
  ): Promise<void> {
    // Check if English JSON file exists
    if (!fs.existsSync(englishJsonPath)) {
      throw new Error(`English JSON file not found: ${englishJsonPath}`);
    }

    // Read and parse English JSON
    const englishContent = JSON.parse(fs.readFileSync(englishJsonPath, 'utf8'));
    
    // Flatten the JSON to get all paths
    const allPaths = new Set<string>();
    const englishTranslations: { [path: string]: string } = {};
    
    this.flattenJsonForEnglish(englishContent, '', allPaths, englishTranslations);

    // Generate CSV content with English translations pre-filled
    const csvContent = this.generateCsvFromEnglishTranslations(
      allPaths, 
      englishTranslations, 
      targetLanguages
    );

    // Write CSV file
    fs.writeFileSync(outputCsvPath, csvContent, 'utf8');
    
    console.log(`✅ Generated CSV template from English JSON`);
    console.log(`📁 Output: ${outputCsvPath}`);
    console.log(`🌍 Languages: ${targetLanguages.join(', ')}`);
    console.log(`📝 Translation keys: ${allPaths.size}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Open the CSV file and add translations for other languages`);
    console.log(`   2. Run: i18n-generator generate --input ${outputCsvPath} --output <output-dir>`);
  }

  /**
   * Generate CSV content from English translations
   */
  private static generateCsvFromEnglishTranslations(
    allPaths: Set<string>,
    englishTranslations: { [path: string]: string },
    languages: string[]
  ): string {
    const headers = ['path', 'description', ...languages];
    const csvRows = [headers.join(',')];

    for (const path of Array.from(allPaths).sort()) {
      const englishText = englishTranslations[path] || '';
      const description = this.generateDescription(path, englishText);
      
      const row = [path, description];
      
      languages.forEach(lang => {
        let translation = '';
        if (lang === 'en') {
          translation = englishText;
        }
        // Escape commas and quotes in CSV
        const escapedTranslation = translation.replace(/"/g, '""');
        row.push(`"${escapedTranslation}"`);
      });

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Flatten JSON for English translations (simplified version)
   */
  private static flattenJsonForEnglish(
    obj: any, 
    prefix: string, 
    allPaths: Set<string>, 
    englishTranslations: { [path: string]: string }
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        this.flattenJsonForEnglish(value, currentPath, allPaths, englishTranslations);
      } else {
        allPaths.add(currentPath);
        englishTranslations[currentPath] = String(value);
      }
    }
  }

  /**
   * Generate a human-readable description for a translation key
   */
  private static generateDescription(path: string, englishText: string): string {
    // Convert path to readable description
    const pathParts = path.split('.');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Convert camelCase or kebab-case to readable text
    const readableText = lastPart
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/[-_]/g, ' ') // Replace hyphens/underscores with spaces
      .toLowerCase()
      .trim();
    
    // Capitalize first letter
    const capitalized = readableText.charAt(0).toUpperCase() + readableText.slice(1);
    
    // If we have English text, use it to create a better description
    if (englishText) {
      const truncatedText = englishText.length > 50 
        ? englishText.substring(0, 50) + '...' 
        : englishText;
      return `${capitalized} - "${truncatedText}"`;
    }
    
    return capitalized;
  }
}
