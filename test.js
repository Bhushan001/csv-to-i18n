// Simple test script to verify the i18n generator functionality
const fs = require('fs');
const path = require('path');

// Create a test CSV file
const testCsv = `path,description,eng,mr
common.loading,Loading text shown during data fetch,Loading...,लोड होत आहे...
auth.login,Login button text,Login,लॉगिन
navigation.dashboard,Dashboard menu item,Dashboard,डॅशबोर्ड
members.title,Members page title,Members,सदस्य
members.addMember,Add member button,Add Member,सदस्य जोडा`;

// Write test CSV
fs.writeFileSync('test-translations.csv', testCsv, 'utf8');
console.log('✅ Test CSV file created: test-translations.csv');

// Create output directory
if (!fs.existsSync('test-output')) {
  fs.mkdirSync('test-output');
}

console.log('✅ Test output directory created: test-output');
console.log('\n📋 Test CSV Content:');
console.log(testCsv);
console.log('\n🎯 To test the package:');
console.log('1. npm install');
console.log('2. npm run build');
console.log('3. node dist/cli.js generate --input test-translations.csv --output test-output');
console.log('4. Check the generated JSON files in test-output/');
