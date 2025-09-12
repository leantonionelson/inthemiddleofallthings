import { Meditation } from '../types';

// Import all meditation MD files at build time
const mdFiles = import.meta.glob('../meditations/meditations/*.md', { as: 'raw' });

// Function to parse meditation markdown content
function parseMeditationContent(markdown: string): { title: string; content: string; tags: string[] } {
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

// Function to load all meditations
export async function loadMeditations(): Promise<Meditation[]> {
  const meditations: Meditation[] = [];

  for (const [path, loader] of Object.entries(mdFiles)) {
    try {
      const markdown = await loader();
      
      if (markdown) {
        const parsed = parseMeditationContent(markdown);
        const filename = path.split('/').pop() || '';
        const id = filename.replace('.md', '');
        
        meditations.push({
          id,
          title: parsed.title,
          content: parsed.content,
          tags: parsed.tags,
          filename
        });
      }
    } catch (error) {
      console.error(`Error loading meditation file ${path}:`, error);
    }
  }

  // Sort meditations alphabetically by title
  return meditations.sort((a, b) => a.title.localeCompare(b.title));
}

// Function to search meditations by title or tags
export function searchMeditations(meditations: Meditation[], query: string): Meditation[] {
  if (!query.trim()) {
    return meditations;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return meditations.filter(meditation => {
    const titleMatch = meditation.title.toLowerCase().includes(searchTerm);
    const tagMatch = meditation.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    const contentMatch = meditation.content.toLowerCase().includes(searchTerm);
    
    return titleMatch || tagMatch || contentMatch;
  });
}

// Fallback meditations if files can't be loaded
export const fallbackMeditations: Meditation[] = [
  {
    id: 'two-breaths-in-all-out',
    title: 'Two Breaths In, All Out',
    content: `The body is rhythm.
It knows before the mind.
It teaches without words.

Two breaths in.
All out.

This is not a technique.
It is a mirror.
A reminder that life is not symmetrical.
Inhale requires effort.
Exhale is release.

You take twice what you need—
air, nourishment, experience—
and then let it go completely.
Nothing hoarded.
Nothing clutched.`,
    tags: ['breathing', 'rhythm', 'release', 'surrender'],
    filename: 'two-breaths-in-all-out.md'
  }
];

export const meditationContent = {
  loadMeditations,
  searchMeditations,
  fallbackMeditations
};
