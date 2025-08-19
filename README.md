# @i18n-tools/i18n-csv-generator

[![npm version](https://badge.fury.io/js/%40i18n-tools%2Fi18n-csv-generator.svg)](https://badge.fury.io/js/%40i18n-tools%2Fi18n-csv-generator)
[![npm downloads](https://img.shields.io/npm/dm/%40i18n-tools%2Fi18n-csv-generator.svg)](https://www.npmjs.com/package/%40i18n-tools%2Fi18n-csv-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

A powerful Node.js tool to convert CSV files to i18n JSON files for JavaScript applications (React, Vue, Angular, etc.). Perfect for business users who need to manage translations without touching code.

**🆕 New in v1.0.0**: Enhanced JSON generation with better handling of empty values and improved validation! Perfect for teams that need robust translation management with comprehensive validation.

> **📦 Package Migration Notice**: This package has been moved from `@bhushan001/i18n-csv-generator` to `@i18n-tools/i18n-csv-generator`. Please update your dependencies to use the new package name.

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Configuration](#configuration)
- [Validation](#validation)
- [Integration](#integration)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Installation

```bash
npm install @i18n-tools/i18n-csv-generator
```

### Global Installation (CLI)

```bash
npm install -g @i18n-tools/i18n-csv-generator
```

## ⚡ Quick Start

### Basic Usage

```bash
# Generate JSON files from CSV
npx i18n-generator generate --input translations.csv --output src/assets/i18n

# Validate CSV file
npx i18n-generator validate --input translations.csv

# Watch for changes
npx i18n-generator watch --input translations.csv --output src/assets/i18n

# Generate CSV from existing English JSON file
npx i18n-generator from-json --input en.json --output translations.csv --languages en,mr,es

# Validate JSON files against CSV
npx i18n-generator validate-json --input translations.csv --json-dir src/assets/i18n
```

### Programmatic Usage

```typescript
import { I18nGenerator } from '@bhushan001/i18n-csv-generator';

const generator = new I18nGenerator({
  inputFile: 'translations.csv',
  outputDir: 'src/assets/i18n',
  languages: ['eng', 'mr'],
  backup: true
});

await generator.generate();
```

## 💻 System Requirements

### Minimum Requirements

- **Node.js**: `>= 18.0.0`
- **npm**: `>= 8.0.0`
- **Operating System**: 
  - macOS 10.15+ (Catalina)
  - Windows 10+ (64-bit)
  - Linux (Ubuntu 18.04+, CentOS 7+, RHEL 7+)

### Recommended Requirements

- **Node.js**: `>= 20.0.0` (LTS)
- **npm**: `>= 9.0.0`
- **Memory**: 512MB RAM
- **Disk Space**: 50MB free space

### Browser Support

This package is designed for Node.js environments and does not support browser usage.

### Dependencies

#### Production Dependencies
- `csv-parser`: `^3.0.0` - CSV parsing
- `csv-writer`: `^1.6.0` - CSV writing
- `chokidar`: `^3.5.3` - File watching

#### Development Dependencies
- `typescript`: `^4.9.0` - TypeScript compilation
- `@types/node`: `^18.0.0` - Node.js type definitions

## 📖 Usage

### CSV Format

The CSV file must follow this structure:

```csv
path,description,eng,mr
common.loading,Loading text shown during data fetch,Loading...,लोड होत आहे...
auth.login,Login button text,Login,लॉगिन
navigation.dashboard,Dashboard menu item,Dashboard,डॅशबोर्ड
```

#### Required Columns

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `path` | string | Translation key using dot notation | `section.subsection.key` |
| `description` | string | Human-readable description | `Login button text` |
| `[lang]` | string | Translation for specific language | `Login` |

#### Path Format Rules

- Use dot notation: `section.subsection.key`
- Start with letter: `[a-zA-Z]`
- Alphanumeric characters: `[a-zA-Z0-9]`
- No spaces or special characters
- Maximum 10 levels deep

**Valid Examples:**
- `common.loading`
- `auth.login`
- `navigation.dashboard`
- `members.addMember`

**Invalid Examples:**
- `common-loading` (hyphens not allowed)
- `1section.key` (cannot start with number)
- `section..key` (double dots not allowed)

## 🔧 CLI Commands

### Generate JSON Files

```bash
i18n-generator generate --input <csv-file> --output <json-directory> [options]
```

**Options:**
- `--input, -i` (required): Path to CSV file
- `--output, -o` (required): Output directory for JSON files
- `--backup, -b` (optional): Create backup of existing files

**Example:**
```bash
i18n-generator generate --input translations.csv --output src/assets/i18n --backup
```

### Validate CSV

```bash
i18n-generator validate --input <csv-file>
```

**Options:**
- `--input, -i` (required): Path to CSV file

**Example:**
```bash
i18n-generator validate --input translations.csv
```

### Validate JSON Files

```bash
i18n-generator validate-json --input <csv-file> --json-dir <json-directory>
```

**Options:**
- `--input, -i` (required): Path to CSV file
- `--json-dir, -j` (required): Directory containing JSON files

**Example:**
```bash
i18n-generator validate-json --input translations.csv --json-dir src/assets/i18n
```

This command validates that all JSON files have the same translation keys as the CSV file, ensuring consistency between source and generated files.

### Watch Mode

```bash
i18n-generator watch --input <csv-file> --output <json-directory>
```

**Options:**
- `--input, -i` (required): Path to CSV file
- `--output, -o` (required): Output directory for JSON files

**Example:**
```bash
i18n-generator watch --input translations.csv --output src/assets/i18n
```

### Export JSON to CSV

```bash
i18n-generator export --input <json-directory> --output <csv-file>
```

**Options:**
- `--input, -i` (required): Directory containing JSON files
- `--output, -o` (required): Output CSV file path

**Example:**
```bash
i18n-generator export --input src/assets/i18n --output exported.csv
```

### Create Template

```bash
i18n-generator init --output <csv-file>
```

**Options:**
- `--output, -o` (required): Output CSV file path

**Example:**
```bash
i18n-generator init --output sample.csv
```

### Generate CSV from English JSON

```bash
i18n-generator from-json --input <english-json-file> --output <csv-file> [--languages <lang1,lang2,...>]
```

**Options:**
- `--input, -i` (required): Path to existing English JSON file
- `--output, -o` (required): Output CSV file path
- `--languages, -l` (optional): Target languages (default: `en,mr`)

**Example:**
```bash
i18n-generator from-json --input src/assets/i18n/en.json --output translations.csv --languages en,mr,es
```

## 📚 API Reference

### I18nGenerator

Main class for generating i18n JSON files from CSV.

#### Constructor

```typescript
new I18nGenerator(config: GeneratorConfig)
```

#### Configuration Interface

```typescript
interface GeneratorConfig {
  inputFile: string;           // Path to CSV file
  outputDir: string;          // Output directory for JSON files
  languages: string[];        // Language codes (auto-detected if empty)
  defaultLanguage?: string;   // Default language code
  validateOnly?: boolean;     // Only validate, don't generate
  watch?: boolean;           // Watch mode for file changes
  backup?: boolean;          // Create backup of existing files
}
```

#### Methods

##### generate()

Generates JSON files from CSV.

```typescript
async generate(): Promise<void>
```

**Returns:** Promise that resolves when generation is complete

**Throws:** Error if validation fails or file operations fail

##### validate()

Validates CSV file without generating JSON.

```typescript
async validate(): Promise<ValidationResult>
```

**Returns:** Promise<ValidationResult> with validation results

##### watch()

Watches CSV file for changes and regenerates automatically.

```typescript
async watch(): Promise<void>
```

**Returns:** Promise that never resolves (keeps watching)

##### exportToCsv()

Exports existing JSON files to CSV format.

```typescript
async exportToCsv(outputCsvPath: string): Promise<void>
```

**Parameters:**
- `outputCsvPath`: Path to output CSV file

**Returns:** Promise that resolves when export is complete

#### Static Methods

##### createSampleCsv()

Creates a sample CSV template.

```typescript
static createSampleCsv(outputPath: string, languages?: string[]): void
```

**Parameters:**
- `outputPath`: Path to output CSV file
- `languages`: Array of language codes (default: `['eng', 'mr']`)

##### generateCsvFromEnglishJson()

Generates CSV from existing English JSON file. Useful when you already have English translations and want to add other languages.

```typescript
static generateCsvFromEnglishJson(
  englishJsonPath: string,
  outputCsvPath: string,
  targetLanguages?: string[]
): Promise<void>
```

**Parameters:**
- `englishJsonPath`: Path to existing English JSON file
- `outputCsvPath`: Path to output CSV file
- `targetLanguages`: Array of target language codes (default: `['en', 'mr']`)

**Returns:** Promise that resolves when CSV generation is complete

**Example:**
```typescript
await I18nGenerator.generateCsvFromEnglishJson(
  'src/assets/i18n/en.json',
  'translations.csv',
  ['en', 'mr', 'es']
);
```

##### validateJsonAgainstCsv()

Validates JSON files against CSV data to ensure consistency between source and generated files.

```typescript
static validateJsonAgainstCsv(
  csvFilePath: string,
  jsonDir: string
): Promise<void>
```

**Parameters:**
- `csvFilePath`: Path to CSV file
- `jsonDir`: Directory containing JSON files

**Returns:** Promise that resolves when validation is complete

**Example:**
```typescript
await I18nGenerator.validateJsonAgainstCsv(
  'translations.csv',
  'src/assets/i18n'
);
```

## 🔄 Workflows

### Workflow 1: Starting from Scratch

1. **Create CSV template**: `i18n-generator init --output translations.csv`
2. **Add translations**: Edit the CSV file with your translations
3. **Generate JSON files**: `i18n-generator generate --input translations.csv --output src/assets/i18n`

### Workflow 2: Adding Languages to Existing English Translations

If you already have English translations in JSON format and want to add other languages:

1. **Generate CSV from English JSON**:
   ```bash
   i18n-generator from-json --input src/assets/i18n/en.json --output translations.csv --languages en,mr,es
   ```

2. **Add translations for other languages**: Open the CSV file and fill in translations for `mr` and `es` columns

3. **Generate all JSON files**:
   ```bash
   i18n-generator generate --input translations.csv --output src/assets/i18n
   ```

**Example English JSON (`en.json`)**:
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout"
  }
}
```

**Generated CSV (`translations.csv`)**:
```csv
path,description,en,mr,es
common.loading,Loading - "Loading...",Loading...,,
common.error,Error - "An error occurred",An error occurred,,
auth.login,Login - "Login",Login,,
auth.logout,Logout - "Logout",Logout,,
```

**After adding translations**:
```csv
path,description,en,mr,es
common.loading,Loading - "Loading...",Loading...,लोड होत आहे...,Cargando...
common.error,Error - "An error occurred",An error occurred,एक त्रुटी आली,Se produjo un error
auth.login,Login - "Login",Login,लॉगिन,Iniciar sesión
auth.logout,Logout - "Logout",Logout,लॉगआउट,Cerrar sesión
```

### Workflow 3: Validating JSON Consistency

To ensure your JSON files are consistent with your CSV source:

1. **Generate JSON files from CSV**:
   ```bash
   i18n-generator generate --input translations.csv --output src/assets/i18n
   ```

2. **Validate JSON files against CSV**:
   ```bash
   i18n-generator validate-json --input translations.csv --json-dir src/assets/i18n
   ```

3. **Fix any inconsistencies** if validation fails, then regenerate JSON files

This workflow helps maintain consistency between your CSV source and generated JSON files, especially useful in CI/CD pipelines or when multiple team members are working on translations.

## 📊 Examples

### Input CSV

### Output JSON Files

**`en.json`:**
```json
{
  "common": {
    "loading": "Loading..."
  },
  "auth": {
    "login": "Login"
  },
  "navigation": {
    "dashboard": "Dashboard"
  },
  "members": {
    "title": "Members",
    "addMember": "Add Member"
  }
}
```

**`mr.json`:**
```json
{
  "common": {
    "loading": "लोड होत आहे..."
  },
  "auth": {
    "login": "लॉगिन"
  },
  "navigation": {
    "dashboard": "डॅशबोर्ड"
  },
  "members": {
    "title": "सदस्य",
    "addMember": "सदस्य जोडा"
  }
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `I18N_GENERATOR_DEBUG` | Enable debug logging | `false` |
| `I18N_GENERATOR_TIMEOUT` | File operation timeout (ms) | `30000` |

### Package.json Scripts

```json
{
  "scripts": {
    "i18n:generate": "i18n-generator generate --input translations.csv --output src/assets/i18n",
    "i18n:validate": "i18n-generator validate --input translations.csv",
    "i18n:watch": "i18n-generator watch --input translations.csv --output src/assets/i18n",
    "i18n:export": "i18n-generator export --input src/assets/i18n --output exported.csv",
    "i18n:init": "i18n-generator init --output translations.csv"
  }
}
```

## 🔍 Validation

The tool performs comprehensive validation:

### Validation Rules

| Rule | Type | Description |
|------|------|-------------|
| Required Columns | Error | `path` and `description` must exist |
| Language Columns | Error | At least one language column required |
| Path Format | Error | Must follow dot notation rules |
| Duplicate Paths | Error | No duplicate translation keys |
| Empty Translations | Warning | Missing translations flagged |
| Special Characters | Warning | Characters that need escaping |

### Validation Output

```
=== Validation Results ===

❌ ERRORS:
  Row 3, Column "path": Invalid path format. Use dot notation (e.g., section.subsection.key)
    Value: "invalid path"

⚠️  WARNINGS:
  Row 5, Column "mr": Translation for mr is empty

✅ CSV file is valid!
```

## 🔗 Integration

### Angular Integration

#### 1. Install Package

```bash
npm install @sanchay/i18n-csv-generator
```

#### 2. Add Scripts

```json
{
  "scripts": {
    "i18n:generate": "i18n-generator generate --input translations.csv --output src/assets/i18n",
    "i18n:validate": "i18n-generator validate --input translations.csv",
    "i18n:watch": "i18n-generator watch --input translations.csv --output src/assets/i18n"
  }
}
```

#### 3. Configure Angular

```typescript
// angular.json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/assets/i18n"
            ]
          }
        }
      }
    }
  }
}
```

#### 4. Use in Angular

```typescript
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ]
})
export class AppModule { }
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Generate i18n
on:
  push:
    paths:
      - 'translations.csv'

jobs:
  generate-i18n:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install @sanchay/i18n-csv-generator
      - run: npx i18n-generator generate --input translations.csv --output src/assets/i18n
      - run: git add src/assets/i18n/
      - run: git commit -m "Update i18n files" || exit 0
      - run: git push
```

## 🐛 Troubleshooting

### Common Issues

#### "CSV file not found"
- Ensure the CSV file path is correct
- Check file permissions
- Verify file exists in the specified location

#### "Invalid path format"
- Use dot notation: `section.subsection.key`
- Avoid special characters and spaces
- Start with a letter

#### "No language columns found"
- Ensure CSV has language columns (e.g., `eng`, `mr`)
- Check CSV header format
- Verify column names match expected format

#### "Permission denied"
- Check file and directory permissions
- Ensure write access to output directory
- Run with appropriate user privileges

### Debug Mode

Enable debug logging:

```bash
I18N_GENERATOR_DEBUG=true npx i18n-generator generate --input translations.csv --output src/assets/i18n
```

## 🚀 Get Involved & Contribute

We'd love your help to make this tool even better! Whether you're a developer, designer, or just passionate about internationalization, there are many ways to contribute.

### 💡 Request Features

Have an idea for a new feature? We want to hear it! 

- 🎯 **Create a Feature Request**: [Open an issue](https://github.com/bhushan001/csv-to-i18n/issues/new?template=feature_request.md) with the "Feature Request" template
- 💬 **Discuss Ideas**: Join our [GitHub Discussions](https://github.com/bhushan001/csv-to-i18n/discussions) to brainstorm with the community
- 📝 **Share Use Cases**: Tell us how you're using the tool and what could make it better

**Popular Feature Requests:**
- 🔄 Support for more file formats (Excel, Google Sheets)
- 🌐 Integration with translation services (Google Translate, DeepL)
- 📊 Advanced validation rules and custom validators
- 🎨 Web UI for non-technical users
- 🔌 Plugin system for custom transformations

### 🛠️ Contribute Code

Ready to roll up your sleeves? Here's how to get started:

#### Quick Start for Contributors

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/csv-to-i18n.git
cd csv-to-i18n

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

#### Areas We Need Help With

- 🧪 **Testing**: Add more test cases, improve coverage
- 📚 **Documentation**: Improve README, add examples, create tutorials
- 🐛 **Bug Fixes**: Help squash bugs and improve reliability
- ⚡ **Performance**: Optimize CSV parsing and JSON generation
- 🌍 **Internationalization**: Add support for more languages and formats
- 🎨 **UI/UX**: Design improvements for CLI and future web interface

#### Contribution Guidelines

1. **Fork the repository** and create a feature branch
2. **Follow the existing code style** and add tests for new features
3. **Update documentation** for any new functionality
4. **Submit a pull request** with a clear description of changes
5. **Join the discussion** in the PR comments

### 🎉 Recognition

Contributors will be:
- 📝 **Listed in our contributors file**
- 🏆 **Featured in release notes**
- 🎯 **Mentioned in our documentation**
- 💝 **Given early access to new features**

### 🤝 Community

- 💬 **Discussions**: [GitHub Discussions](https://github.com/bhushan001/csv-to-i18n/discussions)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/bhushan001/csv-to-i18n/issues)
- 📧 **Contact**: Open an issue or start a discussion
- ⭐ **Star the repo**: Show your support!

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/bhushan001/csv-to-i18n.git
cd csv-to-i18n

# Install dependencies
npm install

# Build package
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Code Style

- Follow TypeScript best practices
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Write comprehensive tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/bhushan001/csv-to-i18n/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/bhushan001/csv-to-i18n/discussions)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/bhushan001/csv-to-i18n/wiki)
- 📧 **Contact**: Open an issue or start a discussion

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

Made with ❤️ by [Bhushan Gadekar](https://github.com/bhushan001)
