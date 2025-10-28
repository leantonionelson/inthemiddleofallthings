# Stories System

This document explains how the Stories system works and how to add new story files.

## Overview

The Stories system is a complete clone of the Meditations system, designed to host longer-form narrative content, fictional pieces, philosophical stories, and other literary works. It provides the same rich reading experience with search, tagging, audio capabilities, and text highlighting.

## How It Works

The Stories system automatically detects and loads all `.md` files from the `src/stories/stories/` directory using Vite's `import.meta.glob()` function. This means:

- ✅ **New files are automatically detected** when you add them to the directory
- ✅ **No manual registration required** - just add a `.md` file and it will appear
- ✅ **Hot reloading works** - changes are reflected immediately in development
- ✅ **Search and filtering** work automatically with all files
- ✅ **Full feature parity** with the Meditations system

## File Format

Each story file should follow this format:

```markdown
# Story Title

**Tags:** tag1, tag2, tag3, tag4, tag5

---

Your story content goes here.

This can be multiple paragraphs with complex formatting.

The content will be displayed to users with full typography support.
```

### Required Elements:
- **Title**: Must start with `# ` (single hash and space)
- **Tags**: Must be on a line starting with `**Tags:**` followed by comma-separated tags
- **Separator**: Must have `---` on its own line
- **Content**: Everything after the separator is the story content

### Recommended Tags for Stories:
- Genre tags: `fiction`, `non-fiction`, `philosophy`, `poetry`, `drama`
- Theme tags: `consciousness`, `existence`, `identity`, `time`, `memory`, `love`, `death`
- Style tags: `experimental`, `narrative`, `dialogue`, `stream-of-consciousness`
- Length tags: `short`, `medium`, `long`, `epic`
- Mood tags: `contemplative`, `mysterious`, `uplifting`, `dark`, `surreal`

## Navigation

The Stories section is accessible through:
- **Desktop**: Stories link in the top navigation
- **Mobile**: Stories tab in the bottom navigation (scroll icon)
- **Direct URL**: `/stories`

## Adding New Stories

1. Create a new `.md` file in `src/stories/stories/`
2. Follow the format above
3. Save the file
4. The story will automatically appear in the app

## Current Content

### INTRUDENT
A philosophical exploration of consciousness, eternity, and existence. This story examines what it means to be outside of time and form, serving as an example of the kind of contemplative narrative content the Stories system can host.

- **Tags**: consciousness, eternity, existence, awareness, being, time, memory, identity, witness, presence
- **Length**: ~3,250 characters
- **Theme**: Existential philosophy through narrative

## Development Tools

### Check All Stories
Run this command to see all story files and their details:

```bash
node scripts/check-stories.js
```

### Refresh Button
In the app, there's a refresh button (🔄) next to the search bar that you can use to manually reload the story list if needed.

## Technical Details

- **File Loading**: Uses `import.meta.glob('../stories/stories/*.md', { as: 'raw', eager: false })`
- **Parsing**: The `parseStoryContent()` function extracts title, tags, and content
- **Search**: Full-text search across titles, tags, and content
- **Sorting**: Stories are sorted alphabetically by title
- **Icons**: Dynamic icon assignment based on tags (BookOpen, Scroll, Feather, Eye, Brain, etc.)

## Features

### Reading Experience
- **Typography**: Beautiful serif typography optimized for longer reading
- **Navigation**: Swipe gestures, keyboard navigation, and pagination
- **Audio**: Text-to-speech capabilities with progress tracking
- **Highlighting**: Text selection and saving with AI chat integration

### Discovery
- **Search**: Full-text search across all story content
- **Tag Filtering**: Filter stories by multiple tags
- **Visual Icons**: Tag-based icons for visual story identification

### Integration
- **Highlights**: Save passages to your personal collection
- **AI Chat**: Discuss story passages with AI companions
- **Progress**: Reading progress tracking and synchronization

## Troubleshooting

If new stories don't appear:

1. **Check the file format** - make sure it follows the required structure
2. **Use the refresh button** - click the 🔄 button in the app
3. **Restart the dev server** - sometimes needed for new files
4. **Check the console** - look for any error messages
5. **Run the check script** - `node scripts/check-stories.js` to verify files

## Content Guidelines

### For Fiction
- Use descriptive tags that capture genre, mood, and themes
- Consider breaking very long stories into multiple files
- Use evocative titles that give readers a sense of the content

### For Philosophy
- Tag with relevant philosophical concepts and schools of thought
- Include themes and questions explored in the piece
- Consider the contemplative vs. analytical nature of the content

### For Poetry
- Tag with poetic forms and techniques if applicable
- Include emotional and thematic tags
- Consider grouping related poems or series

## Future Enhancements

Potential features for the Stories system:
- **Series/Collections**: Grouping related stories together
- **Reading Time Estimates**: Automatic calculation based on word count
- **Author Information**: Support for author metadata
- **Publication Dates**: Timeline organization
- **Cover Images**: Visual representations for stories
- **Comments/Discussions**: Community features around stories

## Current Status

As of the last check, there is **1 story file** in the system:
- INTRUDENT (philosophical narrative)

The system is ready for expansion with additional literary content.





