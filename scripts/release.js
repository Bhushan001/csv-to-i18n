#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

console.log(`Current version: ${currentVersion}`);

const args = process.argv.slice(2);
const releaseType = args[0];

if (!releaseType || !['major', 'minor', 'patch'].includes(releaseType)) {
  console.error('Usage: node scripts/release.js [major|minor|patch]');
  process.exit(1);
}

let newVersion;
switch (releaseType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`New version: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update CHANGELOG.md
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

const today = new Date().toISOString().split('T')[0];
const changelogEntry = `## [${newVersion}] - ${today}

### Added
- Initial release

### Changed
- None

### Fixed
- None

`;

changelog = changelogEntry + changelog;
fs.writeFileSync(changelogPath, changelog);

// Git operations
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  
  console.log(`\n✅ Successfully released version ${newVersion}!`);
  console.log(`📦 Package: @bhushan001/i18n-csv-generator@${newVersion}`);
  console.log(`🏷️  Tag: v${newVersion}`);
  
} catch (error) {
  console.error('❌ Error during release:', error.message);
  process.exit(1);
}
