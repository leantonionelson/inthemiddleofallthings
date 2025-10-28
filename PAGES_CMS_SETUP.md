# Pages CMS Setup Guide

## Quick Start

Your Pages CMS configuration is ready! Follow these steps to start editing your content:

### 1. Access Pages CMS

Go to **[https://pagescms.org](https://pagescms.org)** and click "Sign in with GitHub"

### 2. Select Your Repository

After signing in, select your repository: `the-middle-of-all-things/middle-app`

### 3. Start Editing

Pages CMS will automatically detect the `.pages.yml` configuration file and present you with these collections:

#### 📿 **Meditations**
- Edit existing meditations in `src/meditations/meditations/`
- Add new meditations with title, tags, and content
- Upload audio files (optional)

#### 📖 **Stories**  
- Edit existing stories in `src/stories/stories/`
- Add new stories with title, tags, and content
- Upload audio files (optional)

#### 📚 **Book Chapters** (4 sections)
- Part I: The Axis of Becoming
- Part II: The Spiral Path
- Part III: The Living Axis
- Part IV: The Horizon Beyond

Each section lets you edit existing chapters or add new ones.

## Adding New Content

### For Meditations & Stories:

1. Click "New" in the respective collection
2. Enter the **Title** (e.g., "The Mirror of Everything and Nothing")
3. Enter **Tags** as comma-separated values (e.g., "paradox, infinity, emptiness, fullness")
4. Paste your **Content** (the meditation or story text)
5. Upload **Audio File** (optional - .wav files preferred)
6. Click "Save"

The system will automatically:
- Create a slug from your title (e.g., "the-mirror-of-everything-and-nothing.md")
- Format the file with proper heading and tags
- Save it to the correct directory

### For Book Chapters:

1. Select the appropriate Part (I, II, III, or IV)
2. Click "New"
3. Enter the **Title**
4. Paste your **Content**
5. Upload **Audio File** (optional)
6. Click "Save"

## Content Format

### Meditations & Stories
Pages CMS will automatically format your content like this:

```markdown
# Your Title

**Tags:** your, tags, here

---

Your content here...
```

### Book Chapters
Pages CMS will format chapters like this:

```markdown
# Your Chapter Title

Your content here...
```

## Audio Files

### Important: Audio Upload Process

When you upload audio through Pages CMS:

1. **File Storage**: Audio files go to `public/media/audio/{type}/`
   - Meditations: `public/media/audio/meditations/`
   - Stories: `public/media/audio/stories/`
   - Chapters: `public/media/audio/chapters/`

2. **File Naming**: Files are automatically named as:
   - Format: `{content-id}_{voice-type}.wav`
   - Example: `the-mirror-of-everything-and-nothing_male.wav`
   - Voice types: `male` or `female` (choose one)

3. **Update Index**: After uploading, you must update the `index.json` in the same folder:
   ```json
   {
     "generated": 1234567890,
     "type": "meditations",
     "items": [
       {
         "id": "your-content-id",
         "title": "Your Content Title",
         "audioFile": "your-content-id_male.wav",
         "hasAudio": true
       }
     ]
   }
   ```

4. **Preferred Format**: `.wav` files for best quality

**See `AUDIO_MANUAL_UPLOAD.md` for complete audio upload documentation.**

## GitHub Integration

- All changes are committed directly to your GitHub repository
- You can see the commit history in GitHub
- Pages CMS creates meaningful commit messages
- Your local project will sync via git pull

## Tips

✅ **Do:**
- Use descriptive titles
- Include relevant tags for searchability  
- Keep tags lowercase and hyphenated
- Upload high-quality audio files

❌ **Don't:**
- Worry about file naming - it's automatic
- Manually edit the markdown format - Pages CMS handles it
- Delete files through Pages CMS without backing up

## Alternative: Local Editing

You can always edit files locally in your IDE and push to GitHub. Pages CMS is just a convenient web interface for content editing.

## Support

- [Pages CMS Documentation](https://pagescms.org/docs/)
- [GitHub Repository](https://github.com/pages-cms/pages-cms)
- [Discord Community](https://discord.gg/pages-cms)

---

**Ready to go!** Just visit [https://pagescms.org](https://pagescms.org) and sign in with GitHub.

