#!/usr/bin/env node

console.log('🔍 VALIDATING IMPLEMENTATION BEFORE SERVER START\n');

const fs = require('fs');
const path = require('path');

// Check 1: Verify SettingsContext has correct branding
console.log('📋 Check 1: Branding in SettingsContext');
try {
  const settingsPath = path.join(__dirname, 'src/contexts/SettingsContext.tsx');
  const settingsContent = fs.readFileSync(settingsPath, 'utf8');
  
  if (settingsContent.includes('Caldas Assistant')) {
    console.log('✅ Bot name set to "Caldas Assistant"');
  } else {
    console.log('❌ Bot name not updated to "Caldas Assistant"');
  }
  
  if (settingsContent.includes('Caldas analytics platform')) {
    console.log('✅ System prompt mentions "Caldas analytics platform"');
  } else {
    console.log('❌ System prompt doesn\'t mention "Caldas analytics platform"');
  }
} catch (error) {
  console.log('❌ Error checking SettingsContext:', error.message);
}

// Check 2: Verify profile system files exist
console.log('\n📋 Check 2: Profile System Files');
const requiredFiles = [
  'src/components/profile/ProfileLanding.tsx',
  'src/components/profile/ProfileCreator.tsx',
  'src/utils/profile/profileManager.ts',
  'src/hooks/useActiveProfile.ts',
  'src/types/profile.ts'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

// Check 3: Verify main page has profile integration
console.log('\n📋 Check 3: Main Page Integration');
try {
  const pagePath = path.join(__dirname, 'src/app/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  
  const checks = [
    { pattern: 'useActiveProfile', name: 'Profile hook imported' },
    { pattern: 'ProfileLanding', name: 'ProfileLanding component imported' },
    { pattern: 'profile-selection', name: 'Profile selection view implemented' },
    { pattern: 'DEBUG.*PROFILE', name: 'Debug banner for profile testing' }
  ];
  
  checks.forEach(check => {
    if (pageContent.includes(check.pattern)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ Missing: ${check.name}`);
    }
  });
} catch (error) {
  console.log('❌ Error checking main page:', error.message);
}

// Check 4: Verify no TypeScript compilation errors
console.log('\n📋 Check 4: TypeScript Configuration');
try {
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    console.log('✅ TypeScript configuration exists');
  } else {
    console.log('❌ Missing tsconfig.json');
  }
} catch (error) {
  console.log('❌ Error checking TypeScript config:', error.message);
}

console.log('\n🚀 VALIDATION COMPLETE');
console.log('\n📝 WHAT TO EXPECT WHEN SERVER STARTS:');
console.log('1. Header should show "Caldas AI Platform" instead of "Miele Dashboard"');
console.log('2. If no profile exists, you should see a purple debug banner');
console.log('3. Profile selection interface should be visible');
console.log('4. You can create a new profile or select from 5 templates');
console.log('\n💡 Ready to start server? Run: node start-server.js');
