## [1.3.0] - 2025-01-27

### Added
- **New `validate-json` command**: Validate JSON files against CSV data for consistency
- **JSON consistency checking**: Ensures all translation keys match between CSV and JSON files
- **Missing key detection**: Identifies translation keys present in CSV but missing in JSON
- **Extra key warnings**: Warns about translation keys in JSON but not in CSV
- **Comprehensive validation**: Validates all language files against CSV source

### Changed
- Enhanced validation system with JSON consistency checks
- Improved error reporting for missing and extra translation keys
- Updated documentation with new validation workflow

### Fixed
- None

## [1.2.0] - 2025-01-27

### Added
- **New `from-json` command**: Generate CSV from existing English JSON file
- **Workflow for existing translations**: Support for teams that already have English translations
- **Automatic description generation**: Smart descriptions based on translation keys and content
- **Multi-language CSV templates**: Generate CSV with multiple target languages

### Changed
- Enhanced CLI help with new command examples
- Improved documentation with new workflow examples

### Fixed
- None

## [1.1.0] - 2025-08-16

### Added
- Initial release

### Changed
- None

### Fixed
- None

## [1.0.2] - 2025-08-16

### Added
- Initial release

### Changed
- None

### Fixed
- None

## [1.0.1] - 2025-08-16

### Added
- Initial release

### Changed
- None

### Fixed
- None

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @sanchay/i18n-csv-generator
- CSV to JSON conversion functionality
- Comprehensive validation system
- CLI interface with multiple commands
- Programmatic API
- Watch mode for file changes
- Export functionality (JSON to CSV)
- Sample CSV template generation
- Support for unlimited languages
- Automatic backup functionality
- Detailed error reporting and validation
- TypeScript support with full type definitions

### Features
- **CSV Parser**: Parse CSV files with path-based translation keys
- **JSON Generator**: Convert flat CSV to nested JSON structure
- **Validator**: Comprehensive validation with detailed error reporting
- **CLI Commands**: generate, validate, watch, export, init
- **File Management**: Generate/update i18n JSON files with backup support
- **Internationalization**: Support for multiple languages
- **Error Handling**: Comprehensive error management and validation

### Technical Details
- Built with TypeScript 4.9+
- Node.js 18+ compatibility
- MIT License
- Comprehensive documentation
- Professional npm package structure

## [1.0.0] - 2024-08-16

### Added
- Initial release
- Core CSV to JSON conversion
- CLI interface
- Programmatic API
- Validation system
- Watch mode
- Export functionality
- Sample templates
- Complete documentation
