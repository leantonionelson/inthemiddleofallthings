# New Tinder-Style Quote Card Homepage

## Overview
A new interactive homepage featuring swipeable quote cards extracted from the book chapters, meditations, and stories. The old homepage has been preserved as `HomePageOld.tsx`.

## Features

### 🎴 Swipeable Quote Cards
- **Tinder-style interaction**: Drag left or right to navigate through quotes
- **Beautiful gradients**: Randomly assigned light and dark gradient backgrounds
- **Stacked card effect**: See the next card underneath for visual depth
- **Smooth animations**: Powered by Framer Motion with rotate and opacity transforms

### 📖 Intelligent Quote Extraction
The system automatically extracts quotable content from all markdown files:

- **Prioritizes blockquotes**: Lines starting with `>` in the original markdown
- **Extracts meaningful paragraphs**: 50-400 character passages with substance
- **Poetic scoring**: Favors passages with:
  - Line breaks (rhythm)
  - Questions (reflection)
  - Negation language (definition)
  - Being/becoming verbs (philosophical depth)
- **Automatic cleaning**: Removes markdown formatting for clean display

### 🎨 Card Design
Each card displays:
- **Content type icon** (Book/Meditation/Story)
- **Quote text** in large, readable serif font
- **Source metadata**:
  - Book: Title, subtitle, part, and chapter number
  - Meditation: Title
  - Story: Title
- **@middleofallthings watermark** at the bottom

### 🔘 Action Buttons
- **Read Button**: Navigate directly to the source content (book/meditation/story)
- **Download Button**: Export the current card as a high-quality PNG image

## Files Created

### `/src/utils/quoteExtractor.ts`
Handles intelligent extraction and processing of quotable content:
- `generateQuoteCards()`: Main function to create quote cards from all content
- `extractBlockquotes()`: Finds and extracts blockquote passages
- `extractParagraphs()`: Identifies meaningful paragraphs
- `isQuotable()`: Scores passages for quotability
- `cleanMarkdown()`: Removes formatting
- `generateGradient()`: Assigns random beautiful gradients

### `/src/utils/cardDownloader.ts`
Enables downloading cards as images:
- Uses `html2canvas` to capture the card element
- Exports as 2x scale PNG for high quality
- Generates descriptive filename from quote source

### `/src/pages/Home/HomePage.tsx`
New homepage component featuring:
- Card stack with swipe gestures
- Loading state with spinner
- Card counter showing progress
- "Start Over" functionality when all cards viewed
- Responsive design for mobile and desktop

## Installation

Dependencies installed:
```bash
npm install html2canvas
```

## How It Works

1. **Load Content**: All chapters, meditations, and stories are loaded from cache
2. **Extract Quotes**: Each piece of content is parsed for quotable passages
3. **Generate Cards**: Cards are created with random gradients and shuffled
4. **Display**: Cards are shown in a swipeable stack
5. **Navigate**: Users can swipe through all quotes and read the source content

## Quote Extraction Algorithm

```
For each content piece:
  1. Extract all blockquotes (priority)
  2. Extract meaningful paragraphs
  3. Score each passage:
     - Length: 50-400 characters
     - Has punctuation
     - Poetic elements score ≥ 2
  4. Clean markdown formatting
  5. Assign random gradient
  6. Add source metadata
```

## Card Interactions

- **Drag left/right**: Move to next card
- **Click Read**: Navigate to source content
- **Click Download**: Export card as PNG
- **View counter**: Track progress through all quotes

## Gradients

18 beautiful gradients included:
- 10 light/vibrant gradients
- 8 dark/moody gradients
- Randomly assigned for variety
- Each card gets its own unique gradient

## Navigation

The "Read" button intelligently routes to:
- `/read` for book chapters
- `/meditations` for meditations
- `/stories` for stories

## Backup

The original homepage is preserved at:
- `/src/pages/Home/HomePageOld.tsx`

To restore the old homepage:
```bash
mv src/pages/Home/HomePage.tsx src/pages/Home/HomePageNew.tsx
mv src/pages/Home/HomePageOld.tsx src/pages/Home/HomePage.tsx
```

## Future Enhancements

Potential improvements:
- Add favorite/save functionality
- Share cards to social media
- Filter by content type
- Search for specific quotes
- Like/dislike gestures with different directions
- Custom gradient picker
- Quote of the day feature
- Progressive loading for large quote sets

## Technical Details

- **Framework**: React + TypeScript
- **Animation**: Framer Motion
- **Image Export**: html2canvas
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Content Caching**: Leverages existing contentCache service

