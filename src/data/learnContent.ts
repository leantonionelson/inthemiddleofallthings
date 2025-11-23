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
  'Relativity (Special & General)': 'Relativity shows that time, motion, and perspective are not fixed – they depend on where you stand and how you move.\n\nGravity itself is a bending of time, shaping the natural paths systems follow.\n\nThis section introduces frames of reference, time dilation, and the deeper structure of spacetime.\n\nRelativity reminds us that perspective shapes experience – different positions create different truths, and our internal frame defines how reality feels and unfolds.',
  'Conservation Laws': 'The conservation laws describe what can change and what cannot.\n\nEnergy, momentum, and information don\'t disappear – they transform, shift, and move across systems.\n\nThis section looks at the rules that preserve the universe\'s accounting, even when forms change.\n\nThese principles reflect how experiences and choices continue in new forms rather than vanishing, carrying their influence forward in ways we may not always see.',
  'Dynamical Systems & Complexity': 'Complex behaviour often grows from simple rules repeated over time.\n\nChaos, cycles, and self-organisation emerge naturally in systems with many interacting parts.\n\nThis section explores how patterns form, collapse, and reorganise through the mathematics of complexity.\n\nThese ideas help explain why life repeats themes, why small changes compound, and why familiar patterns return with new structure as we grow.',
  'Newtonian Mechanics': 'Newton\'s laws describe how objects move, resist change, and respond to forces.\n\nMotion continues unless something interrupts it, and every action has an equal and opposite reaction.\n\nThis section connects physical motion with the deeper principles of persistence, pressure, and response.\n\nThese laws reflect how behaviour continues along its established path and how every movement or decision generates a corresponding shift in our inner world.',
  'Evolution & Adaptation': 'Evolution explains how systems change through variation, selection, and adaptation.\n\nSmall differences compound over time, creating new strategies, forms, and ways of surviving.\n\nThis section explores how change emerges through iteration rather than intention.\n\nThe principles of evolution mirror how identity develops gradually, shaped by countless small adjustments that refine how we navigate the world.',
  'Thermodynamics & Entropy': 'Thermodynamics studies energy, order, and the natural drift toward disorder.\n\nEntropy rises unless energy is invested to create structure and stability.\n\nThis section looks at how systems balance loss, renewal, and the cost of maintaining order.\n\nThese ideas echo the ongoing need to reinvest energy into clarity, stability, and presence, as things naturally move toward disorder without attention.',
  'Information Theory': 'Information theory explores how signals are encoded, transmitted, and restored through noise.\n\nClarity depends on reducing uncertainty and strengthening structure.\n\nThis section examines how systems balance complexity, compression, and the search for meaning.\n\nThese principles reflect the process of refining understanding – filtering noise, recognising patterns, and distilling experience into clearer forms.',
  'Neuroscience & Control Theory': 'Neuroscience and control theory explain how living systems regulate themselves.\n\nThe brain predicts, senses, and corrects constantly –balancing stability with responsiveness.\n\nThis section explores feedback loops, internal models, and the body\'s real-time intelligence.\n\nThese ideas mirror how we continually adjust our internal state, responding to change while aiming to stay centred and regulated.',
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
    content: 'Play with a rolling particle and watch energy move between kinetic, potential, and "lost" forms. The total energy stays fixed – only its shape changes.',
    section: 'Conservation Laws',
    tags: ['physics', 'mechanics', 'energy', 'intuition', 'learn']
  },
  {
    id: 'conservation-of-momentum-behavioural-continuation',
    title: 'Conservation of Momentum – Behavioural Continuation',
    content: 'Smash two orbs together on a frictionless table and watch how the system\'s overall motion never breaks stride, even as each body changes direction.',
    section: 'Conservation Laws',
    tags: ['physics', 'mechanics', 'momentum', 'collisions', 'intuition']
  },
  {
    id: 'conservation-of-information-nothing-truly-vanishes',
    title: 'Conservation of Information – Nothing Truly Vanishes',
    content: 'Watch a clean shape dissolve into chaos, then rewind time to pull it back together. Only when you add noise does the past truly disappear.',
    section: 'Conservation Laws',
    tags: ['physics', 'information', 'entropy', 'chaos', 'intuition']
  },

  // Section 4: Dynamical Systems & Complexity
  {
    id: 'conways-game-of-life-emergence-from-simplicity',
    title: 'Conway\'s Game of Life – Emergence From Simplicity',
    content: 'Discover how four simple rules generate endless complexity. Paint your own creatures and watch order emerge from chaos in a universe of pure logic.',
    section: 'Dynamical Systems & Complexity',
    tags: ['computation', 'emergence', 'complexity', 'cellular-automata', 'intuition']
  },
  {
    id: 'chaos-theory-sensitive-dependence',
    title: 'Chaos Theory – Sensitive Dependence',
    content: 'Witness how microscopic differences spiral into macroscopic consequences. Trace the butterfly-shaped Lorenz attractor.',
    section: 'Dynamical Systems & Complexity',
    tags: ['chaos', 'dynamics', 'nonlinear', 'sensitivity', 'attractor']
  },
  {
    id: 'self-organised-criticality-the-avalanche-principle',
    title: 'Self-Organised Criticality – The Avalanche Principle',
    content: 'Discover why large catastrophes arise in stable-looking systems. Build a sandpile and watch tiny grains trigger avalanches of all sizes.',
    section: 'Dynamical Systems & Complexity',
    tags: ['complexity', 'criticality', 'avalanches', 'emergence', 'systems']
  },
  {
    id: 'reaction-diffusion-patterns-born-from-opposites',
    title: 'Reaction–Diffusion – Patterns Born From Opposites',
    content: 'How do leopards get their spots? Watch distinct patterns emerge from the math of movement and hunger.',
    section: 'Dynamical Systems & Complexity',
    tags: ['reaction-diffusion', 'turing', 'patterns', 'emergence', 'complexity']
  },

  // Section 5: Newtonian Mechanics
  {
    id: 'inertia-habit-as-motion',
    title: 'Inertia – Habit as Motion',
    content: 'Why is it hard to start moving, and harder to stop? Explore mass as resistance to change in a frictionless void.',
    section: 'Newtonian Mechanics',
    tags: ['mechanics', 'inertia', 'habits', 'motion', 'newton']
  },
  {
    id: 'force-and-acceleration-the-shape-of-change',
    title: 'Force & Acceleration – Pressure Creates Change',
    content: 'See how pushes combine into a single net force, and how that net force sculpts acceleration, not just motion.',
    section: 'Newtonian Mechanics',
    tags: ['mechanics', 'force', 'acceleration', 'newton']
  },
  {
    id: 'action-and-reaction-emotional-feedback',
    title: 'Action & Reaction – Emotional Feedback',
    content: 'You cannot touch the world without the world touching you back. Explore the symmetry of interaction.',
    section: 'Newtonian Mechanics',
    tags: ['mechanics', 'forces', 'action-reaction', 'systems', 'emotion']
  },

  // Section 6: Evolution & Adaptation
  {
    id: 'natural-selection-identity-as-strategy',
    title: 'Natural Selection – Identity as Strategy',
    content: 'Watch strategies live, reproduce, and disappear as the environment quietly chooses which identities can stay.',
    section: 'Evolution & Adaptation',
    tags: ['evolution', 'natural-selection', 'strategy', 'identity', 'complexity']
  },
  {
    id: 'mutation-variation-small-differences-new-paths',
    title: 'Mutation & Variation – Small Differences, New Paths',
    content: 'Discover how tiny changes in a simple genetic code can unfold into a wide range of possible forms.',
    section: 'Evolution & Adaptation',
    tags: ['evolution', 'mutation', 'variation', 'genetics', 'complexity']
  },
  {
    id: 'fitness-landscapes-becoming-through-tension',
    title: 'Fitness Landscapes – Becoming Through Tension',
    content: 'Evolution is a mountain climb in the dark. Watch populations find peaks, get trapped in valleys, and adapt as the ground shifts beneath them.',
    section: 'Evolution & Adaptation',
    tags: ['evolution', 'fitness-landscape', 'complexity', 'identity', 'tension']
  },

  // Section 7: Thermodynamics & Entropy
  {
    id: 'entropy-drift-toward-disorder',
    title: 'Entropy – Drift Toward Disorder',
    content: 'Why does coffee cool down but never spontaneously heat up? Watch order dissolve as randomness takes over.',
    section: 'Thermodynamics & Entropy',
    tags: ['thermodynamics', 'entropy', 'arrow-of-time', 'probability']
  },
  {
    id: 'free-energy-systems-choose-low-grounds',
    title: 'Free Energy – Systems Choose Low Grounds',
    content: 'Why does nature sometimes choose chaos over order? Explore the tension between resting low and spreading wide.',
    section: 'Thermodynamics & Entropy',
    tags: ['free-energy', 'thermodynamics', 'entropy', 'complexity']
  },
  {
    id: 'dissipative-structures-order-through-flow',
    title: 'Dissipative Structures – Order Through Flow',
    content: 'Watch ordered convection cells appear only when energy flows from hot to cold — and collapse the moment the flow stops.',
    section: 'Thermodynamics & Entropy',
    tags: ['complexity', 'thermodynamics', 'self-organisation', 'non-equilibrium']
  },

  // Section 8: Information Theory
  {
    id: 'shannon-entropy-signal-vs-noise',
    title: 'Shannon Entropy – Signal vs Noise',
    content: 'Information is the reduction of uncertainty. Watch how noise destroys structure—and how redundancy saves it.',
    section: 'Information Theory',
    tags: ['information', 'entropy', 'signal', 'noise']
  },
  {
    id: 'compression-the-essence-of-meaning',
    title: 'Compression – The Essence of Meaning',
    content: 'See how reducing detail reveals structure, and how structure reveals meaning. Compression is the art of deciding what is essential.',
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

