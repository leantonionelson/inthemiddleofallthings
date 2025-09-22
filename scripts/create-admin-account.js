#!/usr/bin/env node

/**
 * Admin Account Creation Script
 * 
 * This script helps create and manage admin accounts for the Middle App.
 * Run this to set up master admin credentials.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Admin account configuration
const ADMIN_CONFIG = {
  email: 'admin@middleapp.com',
  password: 'MiddleApp2024!Admin',
  backupEmail: 'leantonionelson@gmail.com', // Your personal email
  role: 'admin'
};

console.log('🔐 Middle App - Admin Account Setup');
console.log('=====================================\n');

console.log('📋 Master Admin Account Details:');
console.log(`📧 Email: ${ADMIN_CONFIG.email}`);
console.log(`🔑 Password: ${ADMIN_CONFIG.password}`);
console.log(`👤 Role: ${ADMIN_CONFIG.role}`);
console.log(`🔄 Backup Email: ${ADMIN_CONFIG.backupEmail}\n`);

console.log('🚀 How to use this admin account:');
console.log('1. Open your app: http://localhost:5174/');
console.log('2. Click "Sign In" or navigate to /auth');
console.log('3. Use the credentials above to log in');
console.log('4. Complete onboarding if prompted');
console.log('5. Enjoy full admin access!\n');

console.log('🎯 Admin Features:');
console.log('✅ Full AI Chat Access');
console.log('✅ Unlimited Highlights & Saving');
console.log('✅ All Premium Features');
console.log('✅ Cloud Sync & Progress Tracking');
console.log('✅ Access to All Content');
console.log('✅ No Paywall Restrictions\n');

console.log('📝 Technical Details:');
console.log('- User Type: "admin"');
console.log('- Subscription Status: Always Active');
console.log('- Capabilities: All features enabled');
console.log('- Email-based Admin Detection');
console.log('- Role-based Permissions\n');

console.log('🛠 Additional Admin Emails:');
console.log('The following emails also have admin access:');
console.log('- admin@middleapp.com');
console.log('- leantonionelson@gmail.com');
console.log('- dev@middleapp.com\n');

console.log('💡 Creating Account:');
console.log('1. The admin email is pre-configured in the codebase');
console.log('2. Create an account with admin@middleapp.com');
console.log('3. The system will automatically grant admin privileges');
console.log('4. No additional configuration needed!\n');

// Create a simple HTML page for easy access
const adminPageHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Middle App - Admin Login</title>
    <style>
        body { 
            font-family: 'SF Pro Text', -apple-system, system-ui, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            background: #f5f5f7;
        }
        .container { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .title { 
            font-size: 32px; 
            font-weight: 600; 
            margin-bottom: 10px; 
            color: #1d1d1f;
        }
        .subtitle { 
            color: #6e6e73; 
            margin-bottom: 30px; 
        }
        .credentials { 
            background: #f6f6f6; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #007aff;
        }
        .btn { 
            display: inline-block; 
            background: #007aff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 500;
            margin: 10px 10px 10px 0;
        }
        .btn:hover { 
            background: #0056d3; 
        }
        .feature { 
            display: flex; 
            align-items: center; 
            margin: 8px 0; 
        }
        .feature::before { 
            content: '✅'; 
            margin-right: 10px; 
        }
        code { 
            background: #f6f6f6; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-family: 'SF Mono', Monaco, monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🔐 Admin Login</h1>
        <p class="subtitle">Master admin account for Middle App development and testing</p>
        
        <div class="credentials">
            <h3>Login Credentials</h3>
            <p><strong>Email:</strong> <code>${ADMIN_CONFIG.email}</code></p>
            <p><strong>Password:</strong> <code>${ADMIN_CONFIG.password}</code></p>
        </div>

        <div>
            <a href="http://localhost:5174/" class="btn">🚀 Open App</a>
            <a href="http://localhost:5174/auth" class="btn">🔑 Login Page</a>
        </div>

        <h3>Admin Features</h3>
        <div class="feature">Full AI Chat Access</div>
        <div class="feature">Unlimited Highlights & Saving</div>
        <div class="feature">All Premium Features</div>
        <div class="feature">Cloud Sync & Progress Tracking</div>
        <div class="feature">No Paywall Restrictions</div>

        <h3>Setup Instructions</h3>
        <ol>
            <li>Click "Open App" above</li>
            <li>Navigate to Sign In / Create Account</li>
            <li>Use the email and password above</li>
            <li>Complete onboarding if prompted</li>
            <li>Enjoy full admin access!</li>
        </ol>

        <p><small><strong>Note:</strong> This account has been pre-configured with admin privileges. 
        The system will automatically detect the admin email and grant full access.</small></p>
    </div>
</body>
</html>`;

const adminPagePath = join(__dirname, '../admin-login.html');
writeFileSync(adminPagePath, adminPageHTML);

console.log('📄 Created admin login page: admin-login.html');
console.log('   Open this file in your browser for easy access\n');

console.log('🎉 Admin setup complete!');
console.log('🔥 Ready to access all app features with full privileges!');

// Save credentials to a secure file for reference
const credentialsFile = join(__dirname, '../.admin-credentials.json');
const credentials = {
  ...ADMIN_CONFIG,
  created: new Date().toISOString(),
  instructions: [
    "Open http://localhost:5174/",
    "Navigate to /auth",
    "Use the email and password from this file",
    "Complete onboarding",
    "Enjoy admin access!"
  ]
};

writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2));
console.log('💾 Saved credentials to: .admin-credentials.json');
console.log('   ⚠️  Keep this file secure and do not commit to version control');


