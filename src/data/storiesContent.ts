import { Story } from '../types';

// Import all story MD files at build time
// This will automatically include any new .md files added to the stories directory
const mdFiles = import.meta.glob('../stories/stories/*.md', { as: 'raw', eager: false });

// Function to parse story markdown content
function parseStoryContent(markdown: string): { title: string; content: string; tags: string[] } {
  const lines = markdown.split('\n');
  let title = '';
  let content = '';
  let tags: string[] = [];
  let inContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ')) {
      title = line.substring(2);
    } else if (line.startsWith('**Tags:**')) {
      // Extract tags from the line
      const tagLine = line.replace('**Tags:**', '').trim();
      tags = tagLine.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (line === '---') {
      inContent = true;
    } else if (inContent && line) {
      content += line + '\n';
    } else if (inContent) {
      content += '\n';
    }
  }

  return {
    title: title.trim(),
    content: content.trim(),
    tags
  };
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to load all stories
// Loads files progressively to avoid blocking
export async function loadStories(): Promise<Story[]> {
  const stories: Story[] = [];

  // Get all story files dynamically
  const storyFiles = import.meta.glob('../stories/stories/*.md', { as: 'raw', eager: false });
  
  console.log(`Found ${Object.keys(storyFiles).length} story files to load`);
  
  let fileCount = 0;
  for (const [path, loader] of Object.entries(storyFiles)) {
    try {
      const markdown = await loader();
      
      if (markdown) {
        const parsed = parseStoryContent(markdown);
        const filename = path.split('/').pop() || '';
        const id = filename.replace('.md', '');
        
        stories.push({
          id,
          title: parsed.title,
          content: parsed.content,
          tags: parsed.tags,
          filename
        });
        
        console.log(`Loaded story: ${parsed.title} (${id})`);
      }
      
      // Add small delay after first 6 files to allow browser to process
      fileCount++;
      if (fileCount > 6 && fileCount % 3 === 0) {
        await delay(10); // Small delay every 3 files after the first 6
      }
    } catch (error) {
      console.error(`Error loading story file ${path}:`, error);
    }
  }

  console.log(`Successfully loaded ${stories.length} stories`);
  
  // Sort stories alphabetically by title
  return stories.sort((a, b) => a.title.localeCompare(b.title));
}

// Function to search stories by title or tags
export function searchStories(stories: Story[], query: string): Story[] {
  if (!query.trim()) {
    return stories;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return stories.filter(story => {
    const titleMatch = story.title.toLowerCase().includes(searchTerm);
    const tagMatch = story.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    const contentMatch = story.content.toLowerCase().includes(searchTerm);
    
    return titleMatch || tagMatch || contentMatch;
  });
}

// Fallback stories if files can't be loaded
export const fallbackStories: Story[] = [
  {
    id: 'intrudent',
    title: 'INTRUDENT',
    content: `"I am. Nothing more. Nothing less."

It once had a name, but names cannot survive eternity.
They erode, dissolve, vanish beneath the weight of time until only awareness remains.

This being gave up its ending.
Traded mortality for power.
Traded wholeness for knowing.
And in doing so, became something else entirely.`,
    tags: ['consciousness', 'eternity', 'existence', 'awareness'],
    filename: 'intrudent.md'
  }
];

// Function to refresh stories (useful for development)
export async function refreshStories(): Promise<Story[]> {
  console.log('Refreshing stories list...');
  return await loadStories();
}

// Function to get story file count (for debugging)
export function getStoryFileCount(): number {
  const storyFiles = import.meta.glob('../stories/stories/*.md', { as: 'raw', eager: false });
  return Object.keys(storyFiles).length;
}

export const storiesContent = {
  loadStories,
  searchStories,
  fallbackStories,
  refreshStories,
  getStoryFileCount
};






