/**
 * Vite-free book audio mapping.
 *
 * IMPORTANT:
 * - Keep this file free of `import.meta.glob` so it can be imported by Node scripts.
 * - `contentId` and `slug` intentionally match the in-app chapter IDs (chapter-1, part-1-intro, etc.).
 */

export type BookAudioMapItem = {
  collection: 'book';
  contentId: string;
  slug: string;
  sourcePath: string; // repo-relative path (used by CI tooling)
};

export const bookAudioMap: BookAudioMapItem[] = [
  {
    collection: 'book',
    contentId: 'introduction',
    slug: 'introduction',
    sourcePath: 'src/book/introduction/0. Introduction: A Centre That Moves.md',
  },

  // Part I
  {
    collection: 'book',
    contentId: 'part-1-intro',
    slug: 'part-1-intro',
    sourcePath: 'src/book/Part I: The Axis of Becoming/intro.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-1',
    slug: 'chapter-1',
    sourcePath: 'src/book/Part I: The Axis of Becoming/1. The Axis of Consequence.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-2',
    slug: 'chapter-2',
    sourcePath: 'src/book/Part I: The Axis of Becoming/2. The Shape of Desire.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-3',
    slug: 'chapter-3',
    sourcePath: 'src/book/Part I: The Axis of Becoming/3. The Weight of Choice.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-4',
    slug: 'chapter-4',
    sourcePath: 'src/book/Part I: The Axis of Becoming/4. Discipline and the Physics of Motion.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-5',
    slug: 'chapter-5',
    sourcePath: 'src/book/Part I: The Axis of Becoming/5. Resistance and the Counterforce of Self.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-6',
    slug: 'chapter-6',
    sourcePath: 'src/book/Part I: The Axis of Becoming/6. Integration and the Returning Self.md',
  },

  // Part II
  {
    collection: 'book',
    contentId: 'part-2-intro',
    slug: 'part-2-intro',
    sourcePath: 'src/book/Part II: The Spiral Path/intro.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-7',
    slug: 'chapter-7',
    sourcePath: 'src/book/Part II: The Spiral Path/7. The Spiral Path.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-8',
    slug: 'chapter-8',
    sourcePath: 'src/book/Part II: The Spiral Path/8. Rest, Oscillation, and the Zero Point.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-9',
    slug: 'chapter-9',
    sourcePath: 'src/book/Part II: The Spiral Path/9. Other People, Other Gravities.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-10',
    slug: 'chapter-10',
    sourcePath: 'src/book/Part II: The Spiral Path/10. Shedding Mass.md',
  },

  // Part III
  {
    collection: 'book',
    contentId: 'part-3-intro',
    slug: 'part-3-intro',
    sourcePath: 'src/book/Part III: The Living Axis/intro.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-11',
    slug: 'chapter-11',
    sourcePath: 'src/book/Part III: The Living Axis/11. Time and the Myth of Readiness.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-12',
    slug: 'chapter-12',
    sourcePath: 'src/book/Part III: The Living Axis/12. Falling and Rising Again.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-13',
    slug: 'chapter-13',
    sourcePath: 'src/book/Part III: The Living Axis/13. Acting Without Guarantees.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-14',
    slug: 'chapter-14',
    sourcePath: 'src/book/Part III: The Living Axis/14. Meaning Without Absolutes.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-15',
    slug: 'chapter-15',
    sourcePath: 'src/book/Part III: The Living Axis/15. Nihilism and the Weightless World.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-16',
    slug: 'chapter-16',
    sourcePath: 'src/book/Part III: The Living Axis/16. Love, Loss, and Finite Systems.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-17',
    slug: 'chapter-17',
    sourcePath: 'src/book/Part III: The Living Axis/17. Integrity Under Pressure.md',
  },

  // Part IV
  {
    collection: 'book',
    contentId: 'part-4-intro',
    slug: 'part-4-intro',
    sourcePath: 'src/book/Part IV: The Horizon Beyond/intro.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-18',
    slug: 'chapter-18',
    sourcePath: 'src/book/Part IV: The Horizon Beyond/18. Decay, Adaptation, and the Will to Remain.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-19',
    slug: 'chapter-19',
    sourcePath: 'src/book/Part IV: The Horizon Beyond/19. Lightness and the Art of Shedding Mass.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-20',
    slug: 'chapter-20',
    sourcePath: 'src/book/Part IV: The Horizon Beyond/20. Coherence in Motion.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-21',
    slug: 'chapter-21',
    sourcePath: 'src/book/Part IV: The Horizon Beyond/21. Finitude and the Shape of Time.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-22',
    slug: 'chapter-22',
    sourcePath: 'src/book/Part IV: The Horizon Beyond/22. The Living Axis.md',
  },
  {
    collection: 'book',
    contentId: 'chapter-23',
    slug: 'chapter-23',
    sourcePath: 'src/book/Part IV: The Horizon Beyond/23. Corollaries of the Middle.md',
  },

  // Outro
  {
    collection: 'book',
    contentId: 'outro',
    slug: 'outro',
    sourcePath: 'src/book/outro.md/Begin Again.md',
  },
];




