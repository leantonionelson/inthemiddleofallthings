import { BookChapter } from '../types';

// Import all MDX files at build time
// This approach requires Vite to handle the imports
const mdxFiles = import.meta.glob('../book/**/*.mdx', { as: 'raw' });
const mdFiles = import.meta.glob('../book/**/*.md', { as: 'raw' });

// Symbol descriptions from the glossary for generating visual symbols
export const symbolGlossary = {
  // Introduction symbols
  'compass-void': 'An open circle with radial lines that don\'t reach the edge',
  'balanced-tension': 'Two equal forces pressing inward toward a central dot',
  'dual-gaze': 'Two arcs mirrored on either side of a line, eye-like',
  'sacred-radiance': 'A small dot at center with soft rays extending outward',
  'reflection-gate': 'A vertical rectangle split by a symmetrical wave',
  'breath-sequence': 'Three dots: one below, one centered, one above',
  'spiral-anchor': 'A spiral that begins at a point, then anchors into stillness',

  // Chapter 1: The Axis of Consequence
  'true-center': 'A dot perfectly centered in a ring that pulses outward in all directions',
  'inheritance-web': 'A spiral of lines converging into one moment, a single intersection point',
  'field-body': 'A soft sphere with random motion lines in every direction',
  'consecrated-step': 'A single line stepping forward from a dense center',
  'heaven-root': 'A vertical axis with star points above and small roots below',
  'becoming-lens': 'A hollow circle with shifting shadows inside, changing, unstable',
  'turning-hand': 'A curve spiraling but anchored at the base, a symbol of guided redirection',

  // Chapter 2: The Shape of Desire
  'revealed-shape': 'A hazy outline coming into focus, emerging geometry within a mist',
  'resonant-core': 'Concentric rings vibrating around a soft center dot',
  'echo-hunger': 'A jagged shape inside a clean circle, misaligned',
  'gravity-pull': 'A central shape gently pulling inward arrows in graceful arcs',
  'voice-mirror': 'A vertical symbol split in half, one side clear, one side distorted',
  'soul-north': 'A fine triangle nested over a soft spiral, motion with direction',
  'shed-skin': 'A layered shape peeling back to reveal a simpler form beneath'
};

// Function to parse markdown content and extract title and content
function parseMarkdownContent(markdown: string): { title: string; subtitle?: string; content: string } {
  const lines = markdown.split('\n');
  let title = '';
  let subtitle = '';
  let content = '';
  let foundTitle = false;

  // Strip simple inline markdown from titles/subtitles so UI headers don't show raw markers (e.g. "**Title**")
  const stripInlineMarkdown = (text: string): string => {
    return text
      // Bold / italic wrappers
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Inline code
      .replace(/`([^`]+)`/g, '$1')
      // Any remaining stray markdown markers
      .replace(/[*_`]+/g, '')
      .trim();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Extract the first markdown heading (any level) as the title
    // (Some intros start with ##, and we still want them to load + display correctly.)
    if (!foundTitle) {
      const titleMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (titleMatch) {
        title = stripInlineMarkdown(titleMatch[2]);
        foundTitle = true;
        continue; // Skip adding title to content
      }
    }
    // Extract the first ## heading as subtitle (only if it immediately follows the title)
    if (trimmedLine.startsWith('## ') && !subtitle && foundTitle && content.trim() === '') {
      subtitle = stripInlineMarkdown(trimmedLine.substring(3));
      continue; // Skip adding subtitle to content
    }
    
    // Add everything else to content (including other ## headings)
    if (foundTitle) {
      content += line + '\n';
    }
  }

  return {
    title: stripInlineMarkdown(title.trim()),
    subtitle: stripInlineMarkdown(subtitle.trim()) || undefined,
    content: content.trim()
  };
}

// Book structure definition with part descriptions
const bookStructure = [
  {
    part: 'Introduction',
    path: 'introduction',
    description: 'An orientation to the journey ahead, setting the foundation for exploration.',
    chapters: [
      { id: 'introduction', filename: '0. Introduction: A Centre That Moves.md', order: 0 }
    ]
  },
  {
    part: 'Part I: The Axis of Becoming',
    path: 'Part I: The Axis of Becoming',
    description: 'Exploring the fundamental forces that shape our existence and the choices that define who we become.',
    chapters: [
      { id: 'part-1-intro', filename: 'intro.md', order: 1 },
      { id: 'chapter-1', filename: '1. The Axis of Consequence.md', order: 2 },
      { id: 'chapter-2', filename: '2. The Shape of Desire.md', order: 3 },
      { id: 'chapter-3', filename: '3. The Weight of Choice.md', order: 4 },
      { id: 'chapter-4', filename: '4. Discipline and the Physics of Motion.md', order: 5 },
      { id: 'chapter-5', filename: '5. Resistance and the Counterforce of Self.md', order: 6 },
      { id: 'chapter-6', filename: '6. Integration and the Returning Self.md', order: 7 }
    ]
  },
  {
    part: 'Part II: The Spiral Path',
    path: 'Part II: The Spiral Path',
    description: 'Understanding the cyclical nature of growth, the return of old patterns, and the sacred pauses that allow integration.',
    chapters: [
      { id: 'part-2-intro', filename: 'intro.md', order: 8 },
      { id: 'chapter-7', filename: '7. The Spiral Path.md', order: 9 },
      { id: 'chapter-8', filename: '8. Rest, Oscillation, and the Zero Point.md', order: 10 },
      { id: 'chapter-9', filename: '9. Other People, Other Gravities.md', order: 11 },
      { id: 'chapter-10', filename: '10. Shedding Mass.md', order: 12 }
    ]
  },
  {
    part: 'Part III: The Living Axis',
    path: 'Part III: The Living Axis',
    description: 'Discovering how to live fully in the present moment, using the body and emotions as guides to authentic being.',
    chapters: [
      { id: 'part-3-intro', filename: 'intro.md', order: 13 },
      { id: 'chapter-11', filename: '11. Time and the Myth of Readiness.md', order: 14 },
      { id: 'chapter-12', filename: '12. Falling and Rising Again.md', order: 15 },
      { id: 'chapter-13', filename: '13. Acting Without Guarantees.md', order: 16 },
      { id: 'chapter-14', filename: '14. Meaning Without Absolutes.md', order: 17 },
      { id: 'chapter-15', filename: '15. Nihilism and the Weightless World.md', order: 18 },
      { id: 'chapter-16', filename: '16. Love, Loss, and Finite Systems.md', order: 19 },
      { id: 'chapter-17', filename: '17. Integrity Under Pressure.md', order: 20 }
    ]
  },
  {
    part: 'Part IV: The Horizon Beyond',
    path: 'Part IV: The Horizon Beyond',
    description: 'Contemplating mortality, transcendence, and our place within something larger than ourselves.',
    chapters: [
      { id: 'part-4-intro', filename: 'intro.md', order: 21 },
      { id: 'chapter-18', filename: '18. Decay, Adaptation, and the Will to Remain.md', order: 22 },
      { id: 'chapter-19', filename: '19. Lightness and the Art of Shedding Mass.md', order: 23 },
      { id: 'chapter-20', filename: '20. Coherence in Motion.md', order: 24 },
      { id: 'chapter-21', filename: '21. Finitude and the Shape of Time.md', order: 25 },
      { id: 'chapter-22', filename: '22. The Living Axis.md', order: 26 },
      { id: 'chapter-23', filename: '23. Corollaries of the Middle.md', order: 27 }
    ]
  },
  {
    part: 'Outro',
    path: 'outro.md',
    description: 'A final reflection on the journey and returning to begin again.',
    chapters: [
      { id: 'outro', filename: 'Begin Again.md', order: 28 }
    ]
  }
];

export { bookAudioMap } from './bookAudioMap';

// Export part descriptions for use in components
export const partDescriptions: Record<string, string> = {
  'Introduction': 'An orientation to the journey ahead, setting the foundation for exploration.',
  'Part I: The Axis of Becoming': 'Before motion is possible, the system must be understood.',
  'Part II: The Spiral Path': 'Understanding the system does not prevent contact with the world.',
  'Part III: The Living Axis': 'When structure holds but meaning thins, the system enters flatness.',
  'Part IV: The Horizon Beyond': 'What lasts is not built once, but maintained continuously.',
  'Outro': 'What remains is not certainty, but orientation under force.'
};

// Carousel/reader subtitle overrides (used to show one-line intros on cards and under titles)
const chapterSubtitleOverrides: Record<string, string> = {
  // Part I
  'part-1-intro': 'Before motion is possible, the system must be understood.',
  'chapter-1': 'Everything that follows turns on where force is allowed to pass.',
  'chapter-2': 'Desire becomes signal only when it coheres into direction.',
  'chapter-3': 'Choice collapses possibility into consequence.',
  'chapter-4': 'Discipline reduces friction so energy can accumulate.',
  'chapter-5': 'Resistance marks the point where force meets structure.',
  'chapter-6': 'What was once fragmented can be carried again.',

  // Part II
  'part-2-intro': 'Understanding the system does not prevent contact with the world.',
  'chapter-7': 'Progress refines itself through repetition, not escape.',
  'chapter-8': 'Sustainable systems move because they release.',
  'chapter-9': 'Every relationship introduces a pull that must be oriented.',
  'chapter-10': 'What is not released eventually determines the orbit.',

  // Part III
  'part-3-intro': 'When structure holds but meaning thins, the system enters flatness.',
  'chapter-13': 'Movement continues even when outcomes cannot be known.',
  'chapter-14': 'Orientation replaces certainty when truth no longer stabilises.',
  'chapter-15': 'Fatigue emerges when gradient disappears.',
  'chapter-16': 'Attachment restores consequence by making loss possible.',
  'chapter-17': 'Alignment determines whether force strengthens or fractures.',

  // Part IV
  'part-4-intro': 'What lasts is not built once, but maintained continuously.',
  'chapter-18': 'Intelligence sheds what no longer fits.',
  'chapter-19': 'Mobility returns when unnecessary weight is released.',
  'chapter-20': 'Stability is maintained through adjustment, not stillness.',
  'chapter-21': 'Time concentrates meaning by forcing choice.',
  'chapter-22': 'The centre is something you return to, not something you reach.',
  'chapter-23': 'All systems obey the same mechanics once alignment is named.',

  // Outro
  'outro': 'What remains is not certainty, but orientation under force.'
};

// Title overrides for part intro chapters (so carousel cards match the part headers you provided)
const chapterTitleOverrides: Record<string, string> = {
  'part-1-intro': 'PART I – THE INTERNAL MECHANICS',
  'part-2-intro': 'PART II – THE FIELD OF FORCES',
  'part-3-intro': 'PART III – THE COLLAPSE OF CERTAINTY',
  'part-4-intro': 'PART IV – THE HORIZON BEYOND',
  'outro': 'Outro'
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to load book chapters with optional limit for partial loading
async function loadBookChaptersInternal(limit?: number): Promise<BookChapter[]> {
  const chapters: BookChapter[] = [];
  let chapterNumber = 0;

  // Combine all file imports
  const allFiles = { ...mdxFiles, ...mdFiles };

  // Collect all chapters to load
  const chaptersToLoad: Array<{ part: typeof bookStructure[0]; chapterDef: typeof bookStructure[0]['chapters'][0] }> = [];
  for (const part of bookStructure) {
    for (const chapterDef of part.chapters) {
      chaptersToLoad.push({ part, chapterDef });
    }
  }

  // Apply limit if specified
  const chaptersToProcess = limit ? chaptersToLoad.slice(0, limit) : chaptersToLoad;

  let fileCount = 0;
  for (const { part, chapterDef } of chaptersToProcess) {
    const filePath = `../book/${part.path}/${chapterDef.filename}`;
    
    try {
      // Try to load the file using Vite's import system
      const fileLoader = allFiles[filePath];
      if (fileLoader) {
        const markdown = await fileLoader();
        
        if (markdown) {
          const parsed = parseMarkdownContent(markdown);
          chapterNumber++;

          const title = chapterTitleOverrides[chapterDef.id] ?? parsed.title;
          const subtitle = chapterSubtitleOverrides[chapterDef.id] ?? parsed.subtitle;
          
          chapters.push({
            id: chapterDef.id,
            title,
            subtitle,
            content: parsed.content,
            part: part.part,
            chapterNumber,
            totalChapters: 28 // Total number of chapters including intros and outro
          });
        }
      }
      
      // Add small delay after first 6 files to allow browser to process
      fileCount++;
      if (fileCount > 6 && fileCount % 3 === 0) {
        await delay(10); // Small delay every 3 files after the first 6
      }
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error);
    }
  }

  return chapters.sort((a, b) => {
    const aOrder = bookStructure.flatMap(p => p.chapters).find(c => c.id === a.id)?.order || 0;
    const bOrder = bookStructure.flatMap(p => p.chapters).find(c => c.id === b.id)?.order || 0;
    return aOrder - bOrder;
  });
}

// Function to load all book chapters using Vite's import system
// Loads files progressively to avoid blocking
export async function loadBookChapters(): Promise<BookChapter[]> {
  return loadBookChaptersInternal();
}

// Function to load partial chapters (for initial batch)
export async function loadBookChaptersPartial(count: number = 5): Promise<BookChapter[]> {
  return loadBookChaptersInternal(count);
}

// Fallback content for when files can't be loaded
export const fallbackChapters: BookChapter[] = [
  {
    id: 'introduction',
    title: 'A Centre That Moves',
    subtitle: 'Orientations, not answers',
    content: `This is **not** a book of answers.  
It's a book of positions. Of orientations. Of quiet fires and sharp edges.

I write from the middle, not as a compromise, but as a vantage point.  
From here, I can see both extremes, feel their pull, know their consequence.  
The middle is not a place of neutrality. It is the convergence point of becoming.  
Every direction is available. Every tension, instructive. Every choice, sacred.

This is **not** philosophy in the abstract. It is a mirror held up to your being.  
You do **not** read it. You **meet** it.

> Pause between the words.  
> Reflect.  
> And when you're ready, act.

The center moves.`,
    part: 'Introduction',
    chapterNumber: 1,
    totalChapters: 28
  }
];

export const onboardingQuestions = [
  "What draws you to reflective reading?",
  "When you face uncertainty, what helps you find center?",
  "What area of your life feels most 'in the middle' right now?",
  "How comfortable are you with AI as a conversation partner?",
  "What calls to you from the space between knowing and not knowing?"
];

export const aiPersonas = [
  {
    id: 'sage',
    name: 'Sage',
    description: 'A gentle, wise guide who helps you explore deeper meanings',
    preview: 'The path to understanding often begins with a willingness to not understand...'
  },
  {
    id: 'mirror',
    name: 'Mirror', 
    description: 'A reflective companion who helps you see yourself more clearly',
    preview: 'What you notice in this passage says as much about you as it does about the text...'
  },
  {
    id: 'flame',
    name: 'Flame',
    description: 'An inspiring voice that ignites your inner fire and courage',
    preview: 'There is a flame within you that cannot be extinguished. What feeds it?'
  }
]; 

// Export everything in a convenient object
export const bookContent = {
  loadChapters: loadBookChapters,
  fallbackChapters,
  questions: onboardingQuestions,
  personas: aiPersonas,
  symbols: symbolGlossary
}; 