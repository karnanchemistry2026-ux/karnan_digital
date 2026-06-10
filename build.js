const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'js', 'firebase-config.template.js');
const outputPath = path.join(__dirname, 'js', 'firebase-config.js');

try {
  let configContent = fs.readFileSync(templatePath, 'utf8');

  // Replace tokens with Environment Variables
  configContent = configContent.replace('"FIREBASE_API_KEY"', `"${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}"`);
  configContent = configContent.replace('"FIREBASE_AUTH_DOMAIN"', `"${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}"`);
  configContent = configContent.replace('"FIREBASE_PROJECT_ID"', `"${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}"`);
  configContent = configContent.replace('"FIREBASE_STORAGE_BUCKET"', `"${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}"`);
  configContent = configContent.replace('"FIREBASE_MESSAGING_SENDER_ID"', `"${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}"`);
  configContent = configContent.replace('"FIREBASE_APP_ID"', `"${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}"`);
  configContent = configContent.replace('"FIREBASE_MEASUREMENT_ID"', `"${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''}"`);

  fs.writeFileSync(outputPath, configContent);
  console.log('✅ Successfully generated js/firebase-config.js from environment variables.');
} catch (error) {
  console.error('❌ Error generating firebase-config.js:', error);
  process.exit(1);
}
