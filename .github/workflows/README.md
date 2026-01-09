# GitHub Actions Workflows

## Audio Generation Workflow

The `generate-audio.yml` workflow automatically generates audio files from markdown content using the Gemini TTS API.

### Automatic Triggers

The workflow runs automatically when:
- Any markdown files in `src/book/`, `src/meditations/`, or `src/stories/` are modified
- The audio generation script (`scripts/generate-audio.ts`) is updated
- The markdown-to-text conversion script (`scripts/markdownToTtsText.ts`) is updated
- The book audio map (`src/data/bookAudioMap.ts`) is updated

### Manual Triggers

You can manually trigger the workflow from the GitHub Actions tab:

1. Go to **Actions** → **Generate Audio**
2. Click **Run workflow**
3. Optionally check **Force regenerate all audio** to delete the manifest and regenerate everything from scratch
4. Click **Run workflow**

### Force Regeneration

To force regenerate all audio files (useful after updating voice style instructions):

1. Use the manual trigger with **Force regenerate all audio** checked, OR
2. Delete `public/audio/audio-manifest.json` and push the change

### Configuration

The workflow uses these GitHub secrets and variables:

**Required Secrets:**
- `GEMINI_API_KEY` - Your Gemini API key for TTS

**Optional Variables (with defaults):**
- `MAX_FILES_PER_RUN` (default: 10) - Maximum files to process per run
- `REQUESTS_PER_MINUTE` (default: 6) - Rate limit for API requests

Set these in: **Settings** → **Secrets and variables** → **Actions**

### How It Works

1. The workflow checks out the repository
2. Installs Node.js and system dependencies (including ffmpeg)
3. Runs the audio generation script
4. Commits any generated audio files back to the repository
5. The script handles rate limits and will continue in subsequent runs if needed

### Incremental Generation

The script is smart about regeneration:
- Only regenerates files when source markdown changes
- Tracks changes via SHA256 hashes
- Respects rate limits and continues in subsequent runs
- Skips files that are already up-to-date

### Notes

- Generated audio files are automatically committed with `[skip ci]` to prevent infinite loops
- The workflow may need multiple runs if you hit rate limits (it will continue automatically)
- Audio files are stored in `public/audio/` directory

