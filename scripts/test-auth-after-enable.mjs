#!/usr/bin/env node

/**
 * Test Authentication After Enabling
 * 
 * This script tests if Authentication is working after enabling it in Firebase Console.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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

// Test credentials
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

console.log('🧪 Testing Firebase Authentication');
console.log('==================================\n');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuthentication() {
  try {
    console.log('🚀 Testing user creation...');
    
    // Try to create a test user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      TEST_CREDENTIALS.email, 
      TEST_CREDENTIALS.password
    );
    
    console.log('✅ User creation successful!');
    console.log(`🆔 User ID: ${userCredential.user.uid}`);
    
    // Sign out
    await signOut(auth);
    console.log('🔓 Signed out');
    
    // Test login
    console.log('🧪 Testing login...');
    const loginCredential = await signInWithEmailAndPassword(
      auth, 
      TEST_CREDENTIALS.email, 
      TEST_CREDENTIALS.password
    );
    
    console.log('✅ Login successful!');
    console.log(`🆔 Logged in as: ${loginCredential.user.uid}`);
    
    // Sign out
    await signOut(auth);
    console.log('🔓 Signed out after test\n');
    
    console.log('🎉 Authentication is working correctly!');
    console.log('✅ You can now create the admin account');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Test user already exists, testing login...\n');
      
      try {
        const loginCredential = await signInWithEmailAndPassword(
          auth, 
          TEST_CREDENTIALS.email, 
          TEST_CREDENTIALS.password
        );
        
        console.log('✅ Login test successful!');
        console.log(`🆔 User ID: ${loginCredential.user.uid}`);
        
        await signOut(auth);
        console.log('🔓 Signed out after test\n');
        
        console.log('🎉 Authentication is working correctly!');
        console.log('✅ You can now create the admin account');
        
      } catch (loginError) {
        console.error('❌ Login test failed:', loginError.message);
        throw loginError;
      }
    } else {
      console.error('❌ Authentication test failed:', error.message);
      console.log('\n💡 Make sure you have:');
      console.log('1. Enabled Firebase Authentication in Firebase Console');
      console.log('2. Enabled Email/Password sign-in method');
      console.log('3. Saved the changes in Firebase Console');
      throw error;
    }
  }
}

// Run the test
testAuthentication()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
