# Netlify Secrets Scan Configuration

## Issue
Netlify's secrets scanner detects the Firebase API key in the build output and flags it as a potential secret. However, Firebase API keys are **intentionally public** and are meant to be included in client-side code.

## Solution
Add the Firebase API key value to Netlify's `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` environment variable.

### Steps:
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new environment variable:
   - **Key**: `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`
   - **Value**: Your Firebase API key value (the one starting with `AIza...`)
4. Save and redeploy

### Alternative (if you have multiple values to omit):
You can provide a comma-separated list:
```
AIzaSyC...,other-secret-value
```

## Note
This is safe because Firebase API keys are public by design. They're restricted by domain/referrer in Firebase Console, not by keeping them secret.

