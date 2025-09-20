# Meditation System

This document explains how the meditation system works and how to add new meditation files.

## How It Works

The meditation system automatically detects and loads all `.md` files from the `src/meditations/meditations/` directory using Vite's `import.meta.glob()` function. This means:

- ✅ **New files are automatically detected** when you add them to the directory
- ✅ **No manual registration required** - just add a `.md` file and it will appear
- ✅ **Hot reloading works** - changes are reflected immediately in development
- ✅ **Search and filtering** work automatically with all files

## File Format

Each meditation file should follow this format:

```markdown
# Meditation Title

**Tags:** tag1, tag2, tag3, tag4

---

Your meditation content goes here.
This can be multiple paragraphs.
The content will be displayed to users.
```

### Required Elements:
- **Title**: Must start with `# ` (single hash and space)
- **Tags**: Must be on a line starting with `**Tags:**` followed by comma-separated tags
- **Separator**: Must have `---` on its own line
- **Content**: Everything after the separator is the meditation content

## Adding New Meditations

1. Create a new `.md` file in `src/meditations/meditations/`
2. Follow the format above
3. Save the file
4. The meditation will automatically appear in the app

## Development Tools

### Check All Meditations
Run this command to see all meditation files and their details:

```bash
node scripts/check-meditations.js
```

### Refresh Button
In the app, there's a refresh button (🔄) next to the search bar that you can use to manually reload the meditation list if needed.

## Technical Details

- **File Loading**: Uses `import.meta.glob('../meditations/meditations/*.md', { as: 'raw', eager: false })`
- **Parsing**: The `parseMeditationContent()` function extracts title, tags, and content
- **Search**: Full-text search across titles, tags, and content
- **Sorting**: Meditations are sorted alphabetically by title

## Troubleshooting

If new meditations don't appear:

1. **Check the file format** - make sure it follows the required structure
2. **Use the refresh button** - click the 🔄 button in the app
3. **Restart the dev server** - sometimes needed for new files
4. **Check the console** - look for any error messages
5. **Run the check script** - `node scripts/check-meditations.js` to verify files

## Current Status

As of the last check, there are **41 meditation files** in the system, all properly formatted and ready to use.

