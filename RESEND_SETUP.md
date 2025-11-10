# Resend Email Setup

## Overview

The email functionality uses Resend API via a Netlify Function. The API key is stored securely in Netlify's environment variables.

## Setup Instructions

### 1. Add Environment Variable in Netlify Dashboard

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add variable**
4. Add the following:
   - **Key**: `RESEND_API_KEY`
   - **Value**: `re_6djHv3CP_DAzCmamCL1wRVx8d5KZZNYK2`
5. Click **Save**

### 2. Local Development

For local development with Netlify Dev, the function will automatically use the environment variable from your `.env` file. However, Netlify Functions use `RESEND_API_KEY` (not `VITE_RESEND_API_KEY`).

You can either:
- Add `RESEND_API_KEY` to your `.env` file for local testing
- Or use Netlify Dev which will sync environment variables from your Netlify dashboard

### 3. Testing

The email function is available at: `/.netlify/functions/send-email`

It accepts POST requests with:
```json
{
  "email": "user@example.com",
  "url": "https://middleofallthings.com"
}
```

### 4. Function Location

The Netlify function is located at:
- `netlify/functions/send-email.ts`

This function handles:
- Email validation
- Resend API integration
- Error handling
- CORS headers

## Notes

- The API key is stored in Netlify's environment variables (not in the codebase)
- The function is server-side only, keeping the API key secure
- CORS is enabled for cross-origin requests

