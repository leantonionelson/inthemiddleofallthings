import { Tag } from '../data/tags';

// Synonym mapping for semantic tag expansion
// Expands core concepts to related tags for better matching
const synonymMap: Record<Tag, Tag[]> = {
  // Time-related
  'time': ['temporality', 'impermanence', 'eternity'],
  'temporality': ['time', 'impermanence'],
  'impermanence': ['time', 'temporality', 'change'],
  'eternity': ['time', 'temporality'],
  
  // Self and identity
  'self': ['identity', 'ego', 'becoming'],
  'identity': ['self', 'ego', 'becoming'],
  'ego': ['self', 'identity'],
  'becoming': ['self', 'identity', 'transformation'],
  
  // Chaos and disorder
  'chaos': ['entropy', 'disorder', 'randomness'],
  'entropy': ['chaos', 'disorder', 'randomness'],
  'disorder': ['chaos', 'entropy', 'randomness'],
  'randomness': ['chaos', 'entropy', 'disorder'],
  
  // Presence and awareness
  'presence': ['awareness', 'mindfulness', 'now'],
  'awareness': ['presence', 'mindfulness', 'consciousness', 'now'],
  'mindfulness': ['presence', 'awareness', 'now'],
  'now': ['presence', 'awareness', 'mindfulness', 'time'],
  'consciousness': ['awareness', 'mind', 'experience'],
  
  // Complexity and systems
  'complexity': ['systems', 'emergence', 'patterns'],
  'systems': ['complexity', 'emergence'],
  'emergence': ['complexity', 'systems', 'patterns'],
  'patterns': ['complexity', 'emergence'],
  
  // Physics concepts
  'energy': ['force', 'momentum', 'thermodynamics'],
  'forces': ['energy', 'fields', 'symmetry'],
  'fields': ['forces', 'symmetry', 'physics'],
  'symmetry': ['fields', 'forces', 'physics'],
  'relativity': ['perspective', 'spacetime', 'gravity'],
  'perspective': ['relativity', 'reference-frames'],
  'spacetime': ['relativity', 'gravity', 'geometry', 'curvature'],
  'gravity': ['relativity', 'spacetime', 'curvature'],
  
  // Information and meaning
  'information': ['signal', 'meaning', 'compression'],
  'signal': ['information', 'noise'],
  'noise': ['signal', 'information', 'disorder'],
  'meaning': ['information', 'compression'],
  
  // Evolution and adaptation
  'evolution': ['adaptation', 'selection', 'variation'],
  'adaptation': ['evolution', 'selection', 'variation'],
  'selection': ['evolution', 'adaptation', 'natural-selection'],
  'variation': ['evolution', 'adaptation', 'mutation'],
  'natural-selection': ['evolution', 'selection', 'strategy'],
  
  // Default empty arrays for tags without synonyms
  'mortality': [],
  'transcendence': [],
  'mystery': [],
  'transformation': [],
  'order': [],
  'mechanics': [],
  'thermodynamics': [],
  'neuroscience': [],
  'control-theory': [],
  'game-theory': [],
  'decision-theory': [],
  'choice': [],
  'desire': [],
  'resistance': [],
  'embodiment': [],
  'emotion': [],
  'relationships': [],
  'habits': [],
  'motion': [],
  'change': [],
  'electromagnetism': [],
  'particles': [],
  'mass': [],
  'landscapes': [],
  'reference-frames': [],
  'geometry': [],
  'curvature': [],
  'collisions': [],
  'intuition': [],
  'computation': [],
  'cellular-automata': [],
  'dynamics': [],
  'nonlinear': [],
  'sensitivity': [],
  'attractor': [],
  'criticality': [],
  'avalanches': [],
  'reaction-diffusion': [],
  'turing': [],
  'newton': [],
  'strategy': [],
  'mutation': [],
  'genetics': [],
  'fitness-landscape': [],
  'tension': [],
  'arrow-of-time': [],
  'probability': [],
  'free-energy': [],
  'self-organization': [],
  'compression': [],
  'efficiency': [],
  'filtering': [],
  'prediction': [],
  'brain': [],
  'cognition': [],
  'feedback': [],
  'stability': [],
  'oscillations': [],
  'synchronization': [],
  'rhythm': [],
  'cooperation': [],
  'coordination': [],
  'collaboration': [],
  'value': [],
  'action-reaction': [],
  'physics': []
};

/**
 * Expands tags with their synonyms for better semantic matching
 * @param tags - Array of tags to expand
 * @returns Array of expanded tags (original + synonyms, deduplicated)
 */
export function expandTags(tags: Tag[]): Tag[] {
  const expanded = new Set<Tag>();
  
  for (const tag of tags) {
    expanded.add(tag);
    const synonyms = synonymMap[tag] || [];
    synonyms.forEach(syn => expanded.add(syn));
  }
  
  return Array.from(expanded);
}

