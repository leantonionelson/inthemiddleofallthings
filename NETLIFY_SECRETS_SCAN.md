# Netlify Secrets Scan Configuration

## Issue
Netlify's secrets scanner detects the Firebase API key in the build output and flags it as a potential secret. However, Firebase API keys are **intentionally public** and are meant to be included in client-side code.

## Solution
Add the Firebase API key value to Netlify's `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` environment variable.

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
   - **Value**: Comma-separated list of all API keys detected by the scanner:
     ```
     AIzaSyAW4vyYLQjBGEJDwemF2gz26yLWkj5n2j8,pk_live_51S7ZkEJz7MVRzFNxPh3voOKnepoCrxwBBhYqHD7skmlGv8GIQsn9iGDDaq9pCoHlSrI6EcsVynw6ywYGBuVlHu0u00gdmO9ewj
     ```
   - This includes:
     - Firebase API key (public, safe)
     - Stripe publishable key (public, safe)
5. Save and redeploy

## Security Notes

### Safe to Expose (Public Keys):
- **Firebase API Key**: Public by design. Restricted by domain/referrer in Firebase Console.
- **Stripe Publishable Key**: Intentionally public. The "publishable" prefix indicates it's meant for client-side use.

