# Audio Generation Automation Testing

## Overview

The audio generation system runs automatically via GitHub Actions. You don't need to run anything locally.

## How It Works

1. **Daily Schedule**: Runs automatically at 02:30 UTC every day
2. **Manual Trigger**: You can trigger it manually from GitHub Actions
3. **Incremental Processing**: Processes 10 files per run (configurable)
4. **Rate Limit Handling**: Automatically handles API rate limits and continues on subsequent runs

## Testing the Automation

### Option 1: Manual Trigger (Recommended)

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Daily TTS Audio Generation** workflow
4. Click **Run workflow** button (top right)
5. Select the branch (usually `main` or `master`)
6. Click **Run workflow**

The workflow will:
- Install dependencies
- Install ffmpeg
- Run the audio generation script
- Commit and push any generated audio files

### Option 2: Wait for Scheduled Run

The workflow runs automatically at 02:30 UTC daily. You can check the Actions tab to see the results.

## Monitoring Progress

### Check GitHub Actions
- Go to **Actions** tab in GitHub
- View the latest run
- Check the logs to see:
  - How many files were processed
  - How many were generated
  - How many were skipped (already exist)
  - Any errors

### Check the Manifest
The script creates/updates `public/audio/audio-manifest.json` which tracks:
- Status of each audio file (`ok`, `pending`, `failed`)
- Last error messages
- Processing statistics

## Configuration

The workflow is configured in `.github/workflows/daily-audio.yml`:

- `MAX_FILES_PER_RUN`: Number of files to process per run (default: 10)
- `REQUESTS_PER_MINUTE`: API rate limit (default: 6)
- `GEMINI_API_KEY`: Must be set in GitHub Secrets

## Setting Up GitHub Secrets

**Use Repository secrets** (not Environment secrets) - this is simpler and sufficient for this workflow.

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Make sure you're on the **Secrets** tab (not Environments)
4. Click **New repository secret**
5. Name: `GEMINI_API_KEY`
6. Value: Your Gemini API key (from `.env` file: `GEMINI_API_KEY`)
7. Click **Add secret**

**Note**: Repository secrets are available to all workflows in the repository. Environment secrets are only needed if you have multiple environments (dev/staging/prod) or need protection rules.

## Local Testing (Optional)

If you want to test locally (not required):

```bash
# Install ffmpeg (macOS)
brew install ffmpeg

# Or (Linux)
sudo apt-get install ffmpeg

# Run the script
npm run generate:audio
```

**Note**: Local testing will hit the same API rate limits. The automation is designed to handle this gracefully.

## Troubleshooting

### Rate Limit Errors
- **Normal**: The free tier has a limit of 10 requests
- **Solution**: The script automatically stops and will continue on the next run
- **Wait**: Check back tomorrow or trigger manually after some time

### Quota Exceeded
- The script will stop gracefully
- Check your Gemini API quota at: https://ai.dev/usage?tab=rate-limit
- The script will continue from where it left off on the next run

### No Audio Generated
- Check the manifest: `public/audio/audio-manifest.json`
- Look for `status: "failed"` items
- Check `lastError` field for details
- Most failures are due to rate limits and will retry automatically

## Success Indicators

✅ **Good signs:**
- Workflow completes successfully
- `generated` count > 0 in the output
- New `.mp3` files appear in `public/audio/`
- Manifest shows `status: "ok"` for items

⚠️ **Expected behavior:**
- `rateLimited` > 0 (normal for free tier)
- `failed` > 0 (will retry on next run)
- `quotaStopped: true` (will continue tomorrow)

