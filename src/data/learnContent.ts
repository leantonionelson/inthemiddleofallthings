import { LearnModule, LearnSection } from '../types';

// Section order and descriptions
export const sectionOrder: string[] = [
  'Gauge Theory & Field Theory',
  'Relativity (Special & General)',
  'Conservation Laws',
  'Dynamical Systems & Complexity',
  'Newtonian Mechanics',
  'Evolution & Adaptation',
  'Thermodynamics & Entropy',
  'Information Theory',
  'Neuroscience & Control Theory',
  'Game Theory & Decision Theory'
];

export const sectionDescriptions: Record<string, string> = {
  'Gauge Theory & Field Theory': 'Exploring how forces emerge from symmetry and how fields shape reality.',
  'Relativity (Special & General)': 'Understanding how perspective transforms reality and how gravity bends time.',
  'Conservation Laws': 'Discovering what remains constant through transformation.',
  'Dynamical Systems & Complexity': 'Witnessing how simple rules generate complex patterns.',
  'Newtonian Mechanics': 'Foundations of motion, force, and the physics of change.',
  'Evolution & Adaptation': 'How systems evolve through selection and variation.',
  'Thermodynamics & Entropy': 'The arrow of time and the tendency toward disorder.',
  'Information Theory': 'Signal, noise, and the essence of meaning.',
  'Neuroscience & Control Theory': 'How the brain predicts and stabilizes experience.',
  'Game Theory & Decision Theory': 'Strategy, cooperation, and the mathematics of choice.'
};

export const sectionDrawerContent: Record<string, string> = {
  'Gauge Theory & Field Theory': 'Gauge theory explains how the universe stays coherent even when every point is free to choose its own internal orientation.\n\nForces appear as corrections that keep neighbouring perspectives aligned.\n\nThis section explores how fields create connection, structure, and stability across difference.\n\nThese ideas mirror how our own inner stance is influenced by the unseen "fields" of relationship, context, and the subtle pressures that keep us aligned with others.',
  'Relativity (Special & General)': 'Relativity shows that time, motion, and perspective are not fixed—they depend on where you stand and how you move.\n\nGravity itself is a bending of time, shaping the natural paths systems follow.\n\nThis section introduces frames of reference, time dilation, and the deeper structure of spacetime.\n\nRelativity reminds us that perspective shapes experience — different positions create different truths, and our internal frame defines how reality feels and unfolds.',
  'Conservation Laws': 'The conservation laws describe what can change and what cannot.\n\nEnergy, momentum, and information don\'t disappear—they transform, shift, and move across systems.\n\nThis section looks at the rules that preserve the universe\'s accounting, even when forms change.\n\nThese principles reflect how experiences and choices continue in new forms rather than vanishing, carrying their influence forward in ways we may not always see.',
  'Dynamical Systems & Complexity': 'Complex behaviour often grows from simple rules repeated over time.\n\nChaos, cycles, and self-organisation emerge naturally in systems with many interacting parts.\n\nThis section explores how patterns form, collapse, and reorganise through the mathematics of complexity.\n\nThese ideas help explain why life repeats themes, why small changes compound, and why familiar patterns return with new structure as we grow.',
  'Newtonian Mechanics': 'Newton\'s laws describe how objects move, resist change, and respond to forces.\n\nMotion continues unless something interrupts it, and every action has an equal and opposite reaction.\n\nThis section connects physical motion with the deeper principles of persistence, pressure, and response.\n\nThese laws reflect how behaviour continues along its established path and how every movement or decision generates a corresponding shift in our inner world.',
  'Evolution & Adaptation': 'Evolution explains how systems change through variation, selection, and adaptation.\n\nSmall differences compound over time, creating new strategies, forms, and ways of surviving.\n\nThis section explores how change emerges through iteration rather than intention.\n\nThe principles of evolution mirror how identity develops gradually, shaped by countless small adjustments that refine how we navigate the world.',
  'Thermodynamics & Entropy': 'Thermodynamics studies energy, order, and the natural drift toward disorder.\n\nEntropy rises unless energy is invested to create structure and stability.\n\nThis section looks at how systems balance loss, renewal, and the cost of maintaining order.\n\nThese ideas echo the ongoing need to reinvest energy into clarity, stability, and presence, as things naturally move toward disorder without attention.',
  'Information Theory': 'Information theory explores how signals are encoded, transmitted, and restored through noise.\n\nClarity depends on reducing uncertainty and strengthening structure.\n\nThis section examines how systems balance complexity, compression, and the search for meaning.\n\nThese principles reflect the process of refining understanding — filtering noise, recognising patterns, and distilling experience into clearer forms.',
  'Neuroscience & Control Theory': 'Neuroscience and control theory explain how living systems regulate themselves.\n\nThe brain predicts, senses, and corrects constantly—balancing stability with responsiveness.\n\nThis section explores feedback loops, internal models, and the body\'s real-time intelligence.\n\nThese ideas mirror how we continually adjust our internal state, responding to change while aiming to stay centred and regulated.',
  'Game Theory & Decision Theory': 'Game theory studies choice, strategy, and cooperation in systems with competing interests.\n\nDecision theory examines how we weigh outcomes, risks, and possible futures.\n\nThis section explores how behaviour shapes the landscape of what becomes possible next.\n\nThese concepts reflect how every choice influences the environment we move through, opening some paths while closing others as situations evolve.'
};

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// All modules with their sections
const allModules: Omit<LearnModule, 'moduleNumber' | 'totalModules'>[] = [
  // Section 1: Gauge Theory & Field Theory
  {
    id: 'gauge-theory',
    title: 'Gauge Theory – Coherence Across Difference',
    content: 'Placeholder content for Gauge Theory module. This module explores how symmetry principles give rise to fundamental forces.',
    section: 'Gauge Theory & Field Theory',
    tags: ['physics', 'symmetry', 'fields', 'forces']
  },
  {
    id: 'electromagnetic-fields-forces-as-corrections',
    title: 'Electromagnetic Fields – Forces as Corrections',
    content: 'Placeholder content for Electromagnetic Fields module. Understanding how electric and magnetic fields emerge from gauge symmetry.',
    section: 'Gauge Theory & Field Theory',
    tags: ['physics', 'electromagnetism', 'fields']
  },
  {
    id: 'scalar-fields-the-weight-of-existence',
    title: 'Scalar Fields – The Weight of Existence',
    content: 'Placeholder content for Scalar Fields module. Exploring how scalar fields give mass to particles.',
    section: 'Gauge Theory & Field Theory',
    tags: ['physics', 'fields', 'particles', 'mass']
  },
  {
    id: 'potential-landscapes-alignment-and-resistance',
    title: 'Potential Landscapes – Alignment and Resistance',
    content: 'Placeholder content for Potential Landscapes module. Understanding energy landscapes and how systems find equilibrium.',
    section: 'Gauge Theory & Field Theory',
    tags: ['physics', 'energy', 'equilibrium', 'landscapes']
  },

  // Section 2: Relativity (Special & General)
  {
    id: 'frames-of-reference-perspective-as-reality',
    title: 'Frames of Reference – Perspective as Reality',
    content: 'Placeholder content for Frames of Reference module. How different observers see different realities.',
    section: 'Relativity (Special & General)',
    tags: ['physics', 'relativity', 'perspective', 'reference-frames']
  },
  {
    id: 'time-dilation-gravity-as-slow-time',
    title: 'Time Dilation – Gravity as Slow Time',
    content: 'Placeholder content for Time Dilation module. Understanding how gravity affects the flow of time.',
    section: 'Relativity (Special & General)',
    tags: ['physics', 'relativity', 'time', 'gravity']
  },
  {
    id: 'geodesics-following-the-deepest-path',
    title: 'Geodesics – Following the Deepest Path',
    content: 'Placeholder content for Geodesics module. Objects follow the straightest path through curved spacetime.',
    section: 'Relativity (Special & General)',
    tags: ['physics', 'relativity', 'geometry', 'spacetime']
  },
  {
    id: 'spacetime-curvature-centres-as-time-wells',
    title: 'Spacetime Curvature – Centres as Time Wells',
    content: 'Placeholder content for Spacetime Curvature module. How mass and energy curve the fabric of spacetime.',
    section: 'Relativity (Special & General)',
    tags: ['physics', 'relativity', 'curvature', 'spacetime']
  },

  // Section 3: Conservation Laws
  {
    id: 'conservation-of-energy-transformation-not-loss',
    title: 'Conservation of Energy – Transformation, Not Loss',
    content: 'Placeholder content for Conservation of Energy module. Energy is never destroyed, only transformed.',
    section: 'Conservation Laws',
    tags: ['physics', 'energy', 'conservation', 'transformation']
  },
  {
    id: 'conservation-of-momentum-behavioural-continuation',
    title: 'Conservation of Momentum – Behavioural Continuation',
    content: 'Placeholder content for Conservation of Momentum module. How momentum persists through interactions.',
    section: 'Conservation Laws',
    tags: ['physics', 'momentum', 'conservation', 'motion']
  },
  {
    id: 'conservation-of-information-nothing-truly-vanishes',
    title: 'Conservation of Information – Nothing Truly Vanishes',
    content: 'Placeholder content for Conservation of Information module. Information is preserved even in black holes.',
    section: 'Conservation Laws',
    tags: ['physics', 'information', 'conservation', 'quantum']
  },

  // Section 4: Dynamical Systems & Complexity
  {
    id: 'game-of-life',
    title: 'Conway\'s Game of Life – Emergence From Simplicity',
    content: 'Simple rules. Surprising patterns. See how tiny choices grow into complex worlds.',
    section: 'Dynamical Systems & Complexity',
    tags: ['consequence', 'patterns', 'emergence', 'simulation']
  },
  {
    id: 'chaos-theory-sensitive-dependence',
    title: 'Chaos Theory – Sensitive Dependence',
    content: 'Placeholder content for Chaos Theory module. How small changes lead to dramatically different outcomes.',
    section: 'Dynamical Systems & Complexity',
    tags: ['chaos', 'complexity', 'sensitivity', 'nonlinear']
  },
  {
    id: 'self-organised-criticality-the-avalanche-principle',
    title: 'Self-Organised Criticality – The Avalanche Principle',
    content: 'Placeholder content for Self-Organised Criticality module. Systems naturally organize at the edge of chaos.',
    section: 'Dynamical Systems & Complexity',
    tags: ['complexity', 'self-organization', 'criticality', 'emergence']
  },
  {
    id: 'reaction-diffusion-patterns-born-from-opposites',
    title: 'Reaction–Diffusion – Patterns Born From Opposites',
    content: 'Placeholder content for Reaction-Diffusion module. How opposing forces create beautiful patterns.',
    section: 'Dynamical Systems & Complexity',
    tags: ['patterns', 'reaction-diffusion', 'morphogenesis', 'complexity']
  },

  // Section 5: Newtonian Mechanics
  {
    id: 'inertia-habit-as-motion',
    title: 'Inertia – Habit as Motion',
    content: 'Placeholder content for Inertia module. Objects at rest stay at rest, objects in motion stay in motion.',
    section: 'Newtonian Mechanics',
    tags: ['physics', 'inertia', 'motion', 'mechanics']
  },
  {
    id: 'force-acceleration-pressure-creates-change',
    title: 'Force & Acceleration – Pressure Creates Change',
    content: 'Placeholder content for Force & Acceleration module. How forces cause acceleration and change.',
    section: 'Newtonian Mechanics',
    tags: ['physics', 'force', 'acceleration', 'mechanics']
  },
  {
    id: 'action-reaction-emotional-feedback',
    title: 'Action & Reaction – Emotional Feedback',
    content: 'Placeholder content for Action & Reaction module. Every action has an equal and opposite reaction.',
    section: 'Newtonian Mechanics',
    tags: ['physics', 'action-reaction', 'mechanics', 'forces']
  },

  // Section 6: Evolution & Adaptation
  {
    id: 'natural-selection-identity-as-strategy',
    title: 'Natural Selection – Identity as Strategy',
    content: 'Placeholder content for Natural Selection module. How advantageous traits become more common.',
    section: 'Evolution & Adaptation',
    tags: ['biology', 'evolution', 'selection', 'adaptation']
  },
  {
    id: 'mutation-variation-small-differences-new-paths',
    title: 'Mutation & Variation – Small Differences, New Paths',
    content: 'Placeholder content for Mutation & Variation module. How genetic variation drives evolution.',
    section: 'Evolution & Adaptation',
    tags: ['biology', 'evolution', 'mutation', 'variation']
  },
  {
    id: 'fitness-landscapes-becoming-through-tension',
    title: 'Fitness Landscapes – Becoming Through Tension',
    content: 'Placeholder content for Fitness Landscapes module. How organisms navigate adaptive landscapes.',
    section: 'Evolution & Adaptation',
    tags: ['biology', 'evolution', 'fitness', 'landscapes']
  },

  // Section 7: Thermodynamics & Entropy
  {
    id: 'entropy-drift-toward-disorder',
    title: 'Entropy – Drift Toward Disorder',
    content: 'Placeholder content for Entropy module. Systems naturally tend toward greater disorder.',
    section: 'Thermodynamics & Entropy',
    tags: ['physics', 'entropy', 'thermodynamics', 'disorder']
  },
  {
    id: 'free-energy-systems-choose-low-grounds',
    title: 'Free Energy – Systems Choose Low Grounds',
    content: 'Placeholder content for Free Energy module. Systems minimize free energy to find stable states.',
    section: 'Thermodynamics & Entropy',
    tags: ['physics', 'thermodynamics', 'energy', 'equilibrium']
  },
  {
    id: 'dissipative-structures-order-through-flow',
    title: 'Dissipative Structures – Order Through Flow',
    content: 'Placeholder content for Dissipative Structures module. How order emerges from energy flow.',
    section: 'Thermodynamics & Entropy',
    tags: ['physics', 'thermodynamics', 'complexity', 'self-organization']
  },

  // Section 8: Information Theory
  {
    id: 'shannon-entropy-signal-vs-noise',
    title: 'Shannon Entropy – Signal vs Noise',
    content: 'Placeholder content for Shannon Entropy module. Measuring information and uncertainty.',
    section: 'Information Theory',
    tags: ['information', 'entropy', 'signal', 'noise']
  },
  {
    id: 'compression-the-essence-of-meaning',
    title: 'Compression – The Essence of Meaning',
    content: 'Placeholder content for Compression module. How compression reveals what matters most.',
    section: 'Information Theory',
    tags: ['information', 'compression', 'meaning', 'efficiency']
  },
  {
    id: 'noise-filtering-clarity-through-reduction',
    title: 'Noise Filtering – Clarity Through Reduction',
    content: 'Placeholder content for Noise Filtering module. Separating signal from noise to find clarity.',
    section: 'Information Theory',
    tags: ['information', 'filtering', 'signal', 'noise']
  },

  // Section 9: Neuroscience & Control Theory
  {
    id: 'predictive-processing-the-brain-as-forecaster',
    title: 'Predictive Processing – The Brain as Forecaster',
    content: 'Placeholder content for Predictive Processing module. The brain as a prediction machine.',
    section: 'Neuroscience & Control Theory',
    tags: ['neuroscience', 'prediction', 'brain', 'cognition']
  },
  {
    id: 'feedback-control-stabilising-the-system',
    title: 'Feedback Control – Stabilising the System',
    content: 'Placeholder content for Feedback Control module. How feedback loops maintain stability.',
    section: 'Neuroscience & Control Theory',
    tags: ['control-theory', 'feedback', 'stability', 'systems']
  },
  {
    id: 'neural-oscillations-synchronisation-and-rhythm',
    title: 'Neural Oscillations – Synchronisation and Rhythm',
    content: 'Placeholder content for Neural Oscillations module. How brain rhythms coordinate activity.',
    section: 'Neuroscience & Control Theory',
    tags: ['neuroscience', 'oscillations', 'synchronization', 'rhythm']
  },

  // Section 10: Game Theory & Decision Theory
  {
    id: 'prisoner-dilemma-trust-strategy',
    title: 'Prisoner\'s Dilemma – Trust & Strategy',
    content: 'Placeholder content for Prisoner\'s Dilemma module. The tension between cooperation and self-interest.',
    section: 'Game Theory & Decision Theory',
    tags: ['game-theory', 'cooperation', 'strategy', 'trust']
  },
  {
    id: 'stag-hunt-choosing-collaboration',
    title: 'Stag Hunt – Choosing Collaboration',
    content: 'Placeholder content for Stag Hunt module. When coordination beats individual action.',
    section: 'Game Theory & Decision Theory',
    tags: ['game-theory', 'cooperation', 'coordination', 'collaboration']
  },
  {
    id: 'expected-value-the-weight-of-choice',
    title: 'Expected Value – The Weight of Choice',
    content: 'Placeholder content for Expected Value module. Calculating the value of uncertain outcomes.',
    section: 'Game Theory & Decision Theory',
    tags: ['decision-theory', 'probability', 'choice', 'value']
  }
];

// Function to load all learn modules
export async function loadLearnModules(): Promise<LearnModule[]> {
  // Group modules by section to calculate moduleNumber and totalModules
  const modulesBySection: Record<string, LearnModule[]> = {};
  
  allModules.forEach(module => {
    if (!modulesBySection[module.section]) {
      modulesBySection[module.section] = [];
    }
    modulesBySection[module.section].push(module as LearnModule);
  });

  // Add moduleNumber and totalModules to each module
  const modules: LearnModule[] = [];
  sectionOrder.forEach(section => {
    const sectionModules = modulesBySection[section] || [];
    sectionModules.forEach((module, index) => {
      modules.push({
        ...module,
        moduleNumber: index + 1,
        totalModules: sectionModules.length
      });
    });
  });

  return modules;
}

// Function to get modules grouped by section
export function getModulesBySection(modules: LearnModule[]): Record<string, LearnModule[]> {
  const grouped: Record<string, LearnModule[]> = {};
  modules.forEach(module => {
    if (!grouped[module.section]) {
      grouped[module.section] = [];
    }
    grouped[module.section].push(module);
  });
  return grouped;
}

// Function to get section descriptions
export function getSectionDescriptions(): Record<string, string> {
  return sectionDescriptions;
}

// Fallback modules
export const fallbackModules: LearnModule[] = allModules.map((module, index) => ({
  ...module,
  moduleNumber: 1,
  totalModules: 1
}));

