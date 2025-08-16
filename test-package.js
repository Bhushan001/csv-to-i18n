#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing @bhushan001/i18n-csv-generator package...\n');

const testDir = path.join(__dirname, 'test-output');
const csvFile = path.join(__dirname, 'test-data', 'sample-translations.csv');

// Clean up previous test output
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true });
}

// Test 1: Check if CLI is available
console.log('1️⃣ Testing CLI availability...');
try {
  const helpOutput = execSync('node dist/cli.js --help', { encoding: 'utf8' });
  console.log('✅ CLI help command works');
  console.log('📋 Available commands:', helpOutput.includes('generate') ? 'generate ✓' : 'generate ✗');
  console.log('📋 Available commands:', helpOutput.includes('validate') ? 'validate ✓' : 'validate ✗');
  console.log('📋 Available commands:', helpOutput.includes('watch') ? 'watch ✓' : 'watch ✗');
} catch (error) {
  console.log('❌ CLI help command failed:', error.message);
}

// Test 2: Validate CSV file
console.log('\n2️⃣ Testing CSV validation...');
try {
  const validateOutput = execSync(`node dist/cli.js validate --input "${csvFile}"`, { encoding: 'utf8' });
  console.log('✅ CSV validation passed');
  console.log('📊 Validation output:', validateOutput.includes('✅') ? 'Success ✓' : 'Failed ✗');
} catch (error) {
  console.log('❌ CSV validation failed:', error.message);
}

// Test 3: Generate JSON files
console.log('\n3️⃣ Testing JSON generation...');
try {
  const generateOutput = execSync(`node dist/cli.js generate --input "${csvFile}" --output "${testDir}"`, { encoding: 'utf8' });
  console.log('✅ JSON generation completed');
  console.log('📊 Generation output:', generateOutput.includes('✅') ? 'Success ✓' : 'Failed ✗');
} catch (error) {
  console.log('❌ JSON generation failed:', error.message);
}

// Test 4: Check generated files
console.log('\n4️⃣ Checking generated files...');
if (fs.existsSync(testDir)) {
  const files = fs.readdirSync(testDir);
  console.log('📁 Generated files:', files);
  
  // Check each language file
  ['en.json', 'es.json', 'fr.json'].forEach(file => {
    const filePath = path.join(testDir, file);
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ ${file}: ${Object.keys(content).length} translations`);
      
      // Check specific translations
      if (content.common && content.common.buttons && content.common.buttons.save) {
        console.log(`   - common.buttons.save: "${content.common.buttons.save}"`);
      }
    } else {
      console.log(`❌ ${file}: File not found`);
    }
  });
} else {
  console.log('❌ Test output directory not found');
}

// Test 5: Test programmatic usage
console.log('\n5️⃣ Testing programmatic usage...');
try {
  const { I18nGenerator } = require('./dist/index.js');
  
  const generator = new I18nGenerator({
    inputFile: csvFile,
    outputDir: path.join(testDir, 'programmatic'),
    languages: ['en', 'es', 'fr']
  });
  
  console.log('✅ I18nGenerator instance created successfully');
  console.log('📋 Config:', {
    inputFile: generator.config.inputFile,
    outputDir: generator.config.outputDir,
    languages: generator.config.languages
  });
} catch (error) {
  console.log('❌ Programmatic usage failed:', error.message);
}

// Test 6: Test CSV export (if we have generated files)
console.log('\n6️⃣ Testing CSV export...');
try {
  const exportFile = path.join(testDir, 'exported-translations.csv');
  const exportOutput = execSync(`node dist/cli.js export --input "${testDir}" --output "${exportFile}"`, { encoding: 'utf8' });
  console.log('✅ CSV export completed');
  
  if (fs.existsSync(exportFile)) {
    const exportedContent = fs.readFileSync(exportFile, 'utf8');
    console.log('📊 Exported CSV lines:', exportedContent.split('\n').length);
  }
} catch (error) {
  console.log('❌ CSV export failed:', error.message);
}

// Test 7: Test sample CSV creation
console.log('\n7️⃣ Testing sample CSV creation...');
try {
  const sampleFile = path.join(testDir, 'sample.csv');
  execSync(`node dist/cli.js init --output "${sampleFile}"`, { encoding: 'utf8' });
  
  if (fs.existsSync(sampleFile)) {
    const sampleContent = fs.readFileSync(sampleFile, 'utf8');
    console.log('✅ Sample CSV created successfully');
    console.log('📊 Sample CSV lines:', sampleContent.split('\n').length);
  }
} catch (error) {
  console.log('❌ Sample CSV creation failed:', error.message);
}

console.log('\n🎉 Package testing completed!');
console.log('📁 Test output directory:', testDir);
console.log('📋 Check the generated files to verify the package works correctly.');
