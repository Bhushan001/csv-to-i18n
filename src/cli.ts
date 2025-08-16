#!/usr/bin/env node

import { I18nGenerator, GeneratorConfig } from './index';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

function showHelp(): void {
  console.log(`
🌐 @sanchay/i18n-csv-generator

Usage: i18n-generator <command> [options]

Commands:
  generate    Generate JSON files from CSV
  validate    Validate CSV file only
  watch       Watch CSV file for changes
  export      Export JSON files to CSV
  init        Create sample CSV template

Options:
  --input, -i     Input CSV file path
  --output, -o    Output directory for JSON files
  --backup, -b    Create backup of existing files
  --help, -h      Show this help message

Examples:
  i18n-generator generate --input translations.csv --output src/assets/i18n
  i18n-generator validate --input translations.csv
  i18n-generator watch --input translations.csv --output src/assets/i18n
  i18n-generator export --input src/assets/i18n --output exported.csv
  i18n-generator init --output sample.csv
`);
}

function parseArgs(args: string[]): { [key: string]: string } {
  const options: { [key: string]: string } = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        options[key] = value;
        i++; // Skip next argument
      } else {
        options[key] = 'true';
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        options[key] = value;
        i++; // Skip next argument
      } else {
        options[key] = 'true';
      }
    }
  }
  
  return options;
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(args.slice(1));

    if (options.help || options.h || !command) {
      showHelp();
      return;
    }

    switch (command) {
      case 'generate': {
        const inputFile = options.input || options.i;
        const outputDir = options.output || options.o;

        if (!inputFile || !outputDir) {
          console.error('❌ Error: --input and --output are required for generate command');
          process.exit(1);
        }

        const config: GeneratorConfig = {
          inputFile: path.resolve(inputFile),
          outputDir: path.resolve(outputDir),
          languages: [], // Will be auto-detected
          backup: options.backup === 'true' || options.b === 'true'
        };

        const generator = new I18nGenerator(config);
        await generator.generate();
        break;
      }

      case 'validate': {
        const inputFile = options.input || options.i;

        if (!inputFile) {
          console.error('❌ Error: --input is required for validate command');
          process.exit(1);
        }

        const config: GeneratorConfig = {
          inputFile: path.resolve(inputFile),
          outputDir: '', // Not used for validation
          languages: [],
          validateOnly: true
        };

        const generator = new I18nGenerator(config);
        await generator.validate();
        break;
      }

      case 'watch': {
        const inputFile = options.input || options.i;
        const outputDir = options.output || options.o;

        if (!inputFile || !outputDir) {
          console.error('❌ Error: --input and --output are required for watch command');
          process.exit(1);
        }

        const config: GeneratorConfig = {
          inputFile: path.resolve(inputFile),
          outputDir: path.resolve(outputDir),
          languages: [],
          watch: true
        };

        const generator = new I18nGenerator(config);
        await generator.watch();
        break;
      }

      case 'export': {
        const inputDir = options.input || options.i;
        const outputFile = options.output || options.o;

        if (!inputDir || !outputFile) {
          console.error('❌ Error: --input (JSON dir) and --output (CSV file) are required for export command');
          process.exit(1);
        }

        const config: GeneratorConfig = {
          inputFile: '', // Not used for export
          outputDir: path.resolve(inputDir),
          languages: []
        };

        const generator = new I18nGenerator(config);
        await generator.exportToCsv(path.resolve(outputFile));
        break;
      }

      case 'init': {
        const outputFile = options.output || options.o;

        if (!outputFile) {
          console.error('❌ Error: --output is required for init command');
          process.exit(1);
        }

        I18nGenerator.createSampleCsv(path.resolve(outputFile));
        break;
      }

      default:
        console.error(`❌ Error: Unknown command "${command}"`);
        showHelp();
        process.exit(1);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error:', errorMessage);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}
