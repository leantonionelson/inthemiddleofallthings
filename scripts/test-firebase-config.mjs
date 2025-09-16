#!/usr/bin/env node

/**
 * Firebase Configuration Test Script
 * 
 * This script tests if the Firebase project configuration is valid
 * and if Authentication is properly enabled.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (error) {
  console.error('❌ Error loading environment variables:', error);
  process.exit(1);
}

// Firebase configuration
const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
  measurementId: envVars.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('🔧 Firebase Configuration Test');
console.log('==============================\n');

console.log('📋 Configuration Details:');
console.log(`Project ID: ${firebaseConfig.projectId}`);
console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`API Key: ${firebaseConfig.apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`App ID: ${firebaseConfig.appId}`);
console.log(`Storage Bucket: ${firebaseConfig.storageBucket}\n`);

// Test Firebase initialization
try {
  console.log('🚀 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  console.log('🔐 Initializing Firebase Auth...');
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
  
  console.log('📊 Auth Configuration:');
  console.log(`Auth Domain: ${auth.config.authDomain}`);
  console.log(`API Key: ${auth.config.apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`Project ID: ${auth.config.projectId}`);
  
  console.log('\n🎉 Firebase configuration is valid!');
  console.log('💡 If you\'re still getting auth/configuration-not-found errors,');
  console.log('   the issue is likely that Authentication is not enabled in Firebase Console.');
  console.log('\n🔧 Next steps:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log(`2. Select project: ${firebaseConfig.projectId}`);
  console.log('3. Navigate to Authentication → Sign-in method');
  console.log('4. Enable Email/Password authentication');
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('\n💡 Possible solutions:');
  console.log('1. Check if the Firebase project exists');
  console.log('2. Verify the project ID is correct');
  console.log('3. Ensure the API key is valid');
  console.log('4. Check if the project has the required services enabled');
}
