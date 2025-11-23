// Canonical Tag vocabulary - prevents tag drift across all content types
// All tags used in book chapters, meditations, stories, and learn modules should use this type

export type Tag =
  // Core philosophical concepts
  | 'presence'
  | 'awareness'
  | 'consciousness'
  | 'mindfulness'
  | 'now'
  | 'time'
  | 'temporality'
  | 'impermanence'
  | 'eternity'
  | 'mortality'
  | 'transcendence'
  | 'mystery'
  
  // Identity and becoming
  | 'identity'
  | 'self'
  | 'ego'
  | 'becoming'
  | 'transformation'
  
  // Complexity and systems
  | 'complexity'
  | 'chaos'
  | 'disorder'
  | 'randomness'
  | 'entropy'
  | 'order'
  | 'emergence'
  | 'systems'
  | 'patterns'
  
  // Physics and science
  | 'physics'
  | 'symmetry'
  | 'fields'
  | 'forces'
  | 'energy'
  | 'equilibrium'
  | 'relativity'
  | 'perspective'
  | 'gravity'
  | 'spacetime'
  | 'mechanics'
  | 'momentum'
  | 'thermodynamics'
  | 'information'
  | 'signal'
  | 'noise'
  | 'evolution'
  | 'adaptation'
  | 'selection'
  | 'variation'
  | 'neuroscience'
  | 'control-theory'
  | 'game-theory'
  | 'decision-theory'
  
  // Human experience
  | 'choice'
  | 'desire'
  | 'resistance'
  | 'embodiment'
  | 'emotion'
  | 'relationships'
  | 'habits'
  | 'motion'
  | 'change'
  
  // Additional tags for learn modules
  | 'electromagnetism'
  | 'particles'
  | 'mass'
  | 'landscapes'
  | 'reference-frames'
  | 'geometry'
  | 'curvature'
  | 'collisions'
  | 'intuition'
  | 'computation'
  | 'cellular-automata'
  | 'dynamics'
  | 'nonlinear'
  | 'sensitivity'
  | 'attractor'
  | 'criticality'
  | 'avalanches'
  | 'reaction-diffusion'
  | 'turing'
  | 'newton'
  | 'natural-selection'
  | 'strategy'
  | 'mutation'
  | 'genetics'
  | 'fitness-landscape'
  | 'tension'
  | 'arrow-of-time'
  | 'probability'
  | 'free-energy'
  | 'self-organization'
  | 'compression'
  | 'meaning'
  | 'efficiency'
  | 'filtering'
  | 'prediction'
  | 'brain'
  | 'cognition'
  | 'feedback'
  | 'stability'
  | 'oscillations'
  | 'synchronization'
  | 'rhythm'
  | 'cooperation'
  | 'coordination'
  | 'collaboration'
  | 'value'
  | 'action-reaction';

// Helper function to check if a string is a valid Tag
export function isValidTag(tag: string): tag is Tag {
  const validTags: Tag[] = [
    'presence', 'awareness', 'consciousness', 'mindfulness', 'now',
    'time', 'temporality', 'impermanence', 'eternity', 'mortality', 'transcendence', 'mystery',
    'identity', 'self', 'ego', 'becoming', 'transformation',
    'complexity', 'chaos', 'disorder', 'randomness', 'entropy', 'order', 'emergence', 'systems', 'patterns',
    'physics', 'symmetry', 'fields', 'forces', 'energy', 'equilibrium', 'relativity', 'perspective',
    'gravity', 'spacetime', 'mechanics', 'momentum', 'thermodynamics', 'information', 'signal', 'noise',
    'evolution', 'adaptation', 'selection', 'variation', 'neuroscience', 'control-theory', 'game-theory', 'decision-theory',
    'choice', 'desire', 'resistance', 'embodiment', 'emotion', 'relationships', 'habits', 'motion', 'change',
    'electromagnetism', 'particles', 'mass', 'landscapes', 'reference-frames', 'geometry', 'curvature',
    'collisions', 'intuition', 'computation', 'cellular-automata', 'dynamics', 'nonlinear', 'sensitivity',
    'attractor', 'criticality', 'avalanches', 'reaction-diffusion', 'turing', 'newton', 'natural-selection',
    'strategy', 'mutation', 'genetics', 'fitness-landscape', 'tension', 'arrow-of-time', 'probability',
    'free-energy', 'self-organization', 'compression', 'meaning', 'efficiency', 'filtering', 'prediction',
    'brain', 'cognition', 'feedback', 'stability', 'oscillations', 'synchronization', 'rhythm',
    'cooperation', 'coordination', 'collaboration', 'value', 'action-reaction'
  ];
  return validTags.includes(tag as Tag);
}

