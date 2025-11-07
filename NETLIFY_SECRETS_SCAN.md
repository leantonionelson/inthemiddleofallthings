# Netlify Secrets Scan Configuration

## Issue
Netlify's secrets scanner detects the Firebase API key in the build output and flags it as a potential secret. However, Firebase API keys are **intentionally public** and are meant to be included in client-side code.

## Solution

Netlify's secrets scanner is detecting placeholder values in Firebase's type definitions (`node_modules`), which are not real secrets. We need to disable smart detection to allow the build to proceed.

### Option 1: Disable Smart Detection (Recommended)

Add this environment variable in Netlify's dashboard:
- **Key**: `SECRETS_SCAN_SMART_DETECTION_ENABLED`
- **Value**: `false`

This disables the "smart detection" pass that flags placeholder values in dependencies, while still scanning for actual secrets.

### Option 2: Use Omit Values (Alternative)

If you prefer to keep smart detection enabled, add the Firebase API key value to Netlify's `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` environment variable.

### ⚠️ Important: Variable Name Must Be Plural
The variable name must be **`SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`** (with an "S" at the end). 
- ✅ Correct: `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`
- ❌ Wrong: `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUE` (singular)

### Steps:
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables** (or **Build & deploy** → **Environment**)
3. **If you already have the wrong variable name:**
   - Delete the incorrectly named variable (`SECRETS_SCAN_SMART_DETECTION_OMIT_VALUE`)
4. Add a new environment variable:
   - **Key**: `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` (note the "S" at the end)
   - **Value**: Your Firebase API key value:
     ```
     AIzaSyAW4vyYLQjBGEJDwemF2gz26yLWkj5n2j8
     ```
   - This is the Firebase API key (public, safe)
5. Save and redeploy

## Security Notes

### Safe to Expose (Public Keys):
- **Firebase API Key**: Public by design. Restricted by domain/referrer in Firebase Console. This is the only key that needs to be in the omit list.

