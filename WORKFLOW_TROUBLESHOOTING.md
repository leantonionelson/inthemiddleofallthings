# GitHub Actions Workflow Troubleshooting

## Common Errors and Solutions

### Exit Code 1 - Missing API Key

**Error Message:**
```
Missing GEMINI_API_KEY (or GEMINI_API_KEY in .env).
```

**Solution:**
1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `GEMINI_API_KEY`
4. Value: Your API key from `.env` file
5. Click **Add secret**
6. Re-run the workflow

---

### Exit Code 1 - Authentication Failure (401)

**Error Message:**
```
Gemini TTS request failed (401): ...
```

**Solution:**
- Your API key is invalid or expired
- Check that the `GEMINI_API_KEY` secret matches your actual API key
- Verify the API key is active in Google AI Studio
- Re-run the workflow after updating the secret

---

### Exit Code 1 - Unexpected Error

**Error Message:**
```
Unexpected error in generate-audio: ...
```

**Common Causes:**
1. **Missing files**: Check that all source markdown files exist
2. **File permissions**: Ensure the workflow can read source files
3. **Script errors**: Check the full error message in the logs

**Solution:**
- Check the full error stack trace in the GitHub Actions logs
- Verify all files in `src/book/`, `src/meditations/`, `src/stories/` exist
- Check that `src/data/bookAudioMap.ts` is valid

---

### Rate Limits (429) - Expected Behavior

**Error Message:**
```
Gemini TTS request failed (429): You exceeded your current quota...
```

**This is NORMAL!** The script handles this gracefully:
- It will stop and exit with code 0
- The manifest will be updated
- The next run will continue from where it left off
- Free tier has a limit of 10 requests per day

**No action needed** - the workflow will continue automatically on the next scheduled run.

---

### Quota Exceeded (403) - Expected Behavior

**Error Message:**
```
Gemini TTS request failed (403): Quota exceeded...
```

**This is NORMAL!** Similar to rate limits:
- The script stops gracefully
- Progress is saved in the manifest
- Will continue on the next run

**No action needed** - wait for the next scheduled run or trigger manually later.

---

## How to Check Workflow Logs

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on the failed workflow run
4. Expand the **Generate audio** step
5. Look for error messages in red
6. Check the console output for details

## How to Test Locally

```bash
# Make sure you have ffmpeg installed
brew install ffmpeg  # macOS
# or
sudo apt-get install ffmpeg  # Linux

# Set the API key
export GEMINI_API_KEY="your-key-here"

# Run the script
npm run generate:audio
```

## Verifying the Setup

1. ✅ Workflow file exists: `.github/workflows/daily-audio.yml`
2. ✅ Script exists: `scripts/generate-audio.ts`
3. ✅ API key secret is set: `GEMINI_API_KEY` in GitHub Secrets
4. ✅ Source files exist: Check `src/book/`, `src/meditations/`, `src/stories/`

## Getting Help

If you're still seeing errors:
1. Copy the full error message from the GitHub Actions logs
2. Check which step failed (Check API key, Generate audio, Commit & push)
3. Verify the API key is correct and active
4. Check that all source files exist and are readable

