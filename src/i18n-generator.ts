import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { GeneratorConfig, ValidationResult } from './types';
import { CsvParser } from './csv-parser';
import { JsonGenerator } from './json-generator';
import { Validator } from './validator';

export class I18nGenerator {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Main generation method
   */
  async generate(): Promise<void> {
    try {
      console.log('🚀 Starting i18n generation...\n');

      // Parse CSV file
      console.log('📖 Parsing CSV file...');
      const csvData = await CsvParser.parseCsv(this.config.inputFile);
      console.log(`✅ Parsed ${csvData.rows.length} rows with ${csvData.languages.length} languages: ${csvData.languages.join(', ')}\n`);

      // Validate CSV data
      console.log('🔍 Validating CSV data...');
      const validationResult = Validator.validateCsvData(
        csvData.headers,
        csvData.rows,
        csvData.languages
      );

      Validator.printValidationResults(validationResult);

      if (this.config.validateOnly) {
        console.log('✅ Validation complete. Exiting due to validate-only mode.');
        return;
      }

      if (!validationResult.isValid) {
        throw new Error('CSV validation failed. Please fix the errors before generating JSON files.');
      }

      // Generate JSON files
      console.log('🔄 Generating JSON files...');
      const jsonOutput = JsonGenerator.generateJsonFromCsv(csvData.rows, csvData.languages);

      // Write JSON files
      console.log('💾 Writing JSON files...');
      await JsonGenerator.writeJsonFiles(jsonOutput, this.config.outputDir, this.config.backup);

      // Print summary
      this.printSummary(csvData, jsonOutput);

      console.log('✅ i18n generation completed successfully!\n');

    } catch (error) {
      console.error('❌ Error during i18n generation:', error.message);
      throw error;
    }
  }

  /**
   * Validate CSV file only
   */
  async validate(): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating CSV file...\n');

      const csvData = await CsvParser.parseCsv(this.config.inputFile);
      const validationResult = Validator.validateCsvData(
        csvData.headers,
        csvData.rows,
        csvData.languages
      );

      Validator.printValidationResults(validationResult);

      return validationResult;

    } catch (error) {
      console.error('❌ Error during validation:', error.message);
      throw error;
    }
  }

  /**
   * Watch CSV file for changes and regenerate automatically
   */
  async watch(): Promise<void> {
    console.log('👀 Watching for CSV file changes...\n');

    const watcher = chokidar.watch(this.config.inputFile, {
      persistent: true,
      ignoreInitial: false
    });

    watcher.on('change', async (filePath) => {
      console.log(`\n📝 File changed: ${filePath}`);
      console.log('🔄 Regenerating JSON files...\n');
      
      try {
        await this.generate();
      } catch (error) {
        console.error('❌ Error during regeneration:', error.message);
      }
    });

    watcher.on('error', (error) => {
      console.error('❌ Watcher error:', error);
    });

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping file watcher...');
      watcher.close();
      process.exit(0);
    });
  }

  /**
   * Export existing JSON files to CSV
   */
  async exportToCsv(outputCsvPath: string): Promise<void> {
    try {
      console.log('📤 Exporting JSON files to CSV...\n');

      await JsonGenerator.exportJsonToCsv(this.config.outputDir, outputCsvPath);

      console.log(`✅ Successfully exported to: ${outputCsvPath}\n`);

    } catch (error) {
      console.error('❌ Error during export:', error.message);
      throw error;
    }
  }

  /**
   * Print generation summary
   */
  private printSummary(csvData: any, jsonOutput: any): void {
    console.log('\n📊 Generation Summary:');
    console.log(`  • Input CSV: ${this.config.inputFile}`);
    console.log(`  • Output Directory: ${this.config.outputDir}`);
    console.log(`  • Total Rows: ${csvData.rows.length}`);
    console.log(`  • Languages: ${csvData.languages.join(', ')}`);
    console.log(`  • Generated Files:`);

    Object.keys(jsonOutput).forEach(lang => {
      const filePath = path.join(this.config.outputDir, `${lang}.json`);
      console.log(`    - ${filePath}`);
    });

    console.log('');
  }

  /**
   * Create sample CSV template
   */
  static createSampleCsv(outputPath: string, languages: string[] = ['eng', 'mr']): void {
    const headers = ['path', 'description', ...languages];
    const sampleRows = [
      ['common.loading', 'Loading text shown during data fetch', 'Loading...', 'लोड होत आहे...'],
      ['common.error', 'Error message text', 'An error occurred', 'एक त्रुटी आली'],
      ['auth.login', 'Login button text', 'Login', 'लॉगिन'],
      ['auth.logout', 'Logout button text', 'Logout', 'लॉगआउट'],
      ['navigation.dashboard', 'Dashboard menu item', 'Dashboard', 'डॅशबोर्ड'],
      ['members.title', 'Members page title', 'Members', 'सदस्य'],
      ['members.addMember', 'Add member button', 'Add Member', 'सदस्य जोडा']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n');

    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`✅ Sample CSV template created: ${outputPath}`);
  }
}
