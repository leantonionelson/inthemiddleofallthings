import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';
import { LearnModule } from '../../types';
import { loadLearnModules, fallbackModules } from '../../data/learnContent';
import GaugeFieldSimulation from '../../components/GaugeFieldSimulation';
import ElectromagneticFieldSimulation from '../../components/ElectromagneticFieldSimulation';
import Accordion from '../../components/Accordion';
import SimulationInstructionDrawer from '../../components/SimulationInstructionDrawer';

const LearnModulePage: React.FC = () => {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<LearnModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstructionDrawerOpen, setIsInstructionDrawerOpen] = useState(false);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsLoading(true);
        const modules = await loadLearnModules();
        const foundModule = modules.find(m => m.id === moduleSlug);
        
        if (foundModule) {
          setModule(foundModule);
        } else {
          // Try fallback
          const fallbackModule = fallbackModules.find(m => m.id === moduleSlug);
          if (fallbackModule) {
            setModule(fallbackModule);
          } else {
            // Module not found, redirect to learn page
            navigate('/learn');
          }
        }
      } catch (error) {
        console.error('Error loading module:', error);
        navigate('/learn');
      } finally {
        setIsLoading(false);
      }
    };

    if (moduleSlug) {
      loadModule();
    }
  }, [moduleSlug, navigate]);

  const handleBack = () => {
    navigate('/learn');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return null;
  }

  // Special handling for Game of Life - show placeholder with note
  const isGameOfLife = module.id === 'game-of-life';
  const isGaugeTheory = module.id === 'gauge-theory';
  const isElectromagneticFields = module.id === 'electromagnetic-fields-forces-as-corrections';

  // Custom layout for Gauge Theory module
  if (isGaugeTheory) {
    return (
      <>
        {/* Content */}
        <main className="min-h-screen pt-6 pb-10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header with back arrow on left */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-start gap-4">
                <motion.button
                  onClick={handleBack}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 mt-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <div className="flex-1">
                  {(() => {
                    const parts = module.title.split(' – ');
                    const mainTitle = parts[0];
                    const subtitle = parts[1] || '';
                    return (
                      <>
                        <h1 className="text-xl sm:text-2xl font-serif text-ink-primary dark:text-paper-light text-left">
                          {mainTitle}
                        </h1>
                        {subtitle && (
                          <p className="text-sm sm:text-base text-ink-secondary dark:text-ink-muted text-left">
                            {subtitle}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.header>

            {/* How to play chip - above simulation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4"
            >
              <motion.button
                onClick={() => setIsInstructionDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-sm text-ink-secondary dark:text-ink-muted transition-colors border border-ink-muted/20 dark:border-paper-light/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Info className="w-4 h-4" />
                <span>How to play</span>
              </motion.button>
            </motion.div>

            {/* Simulation Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <GaugeFieldSimulation />
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What is Gauge Theory?">
                <div className="space-y-4">
                  <p>
                    Gauge theory describes how systems stay consistent even when each point in space is free to choose its own internal orientation.
                    If these orientations changed arbitrarily, the universe would lose coherence, so gauge fields arise to preserve meaningful relationships.
                    In physics, these fields become the forces we observe: electromagnetism, the weak force, and the strong force.
                  </p>
                  <p>
                    It is one of the core frameworks of modern physics for understanding how freedom, symmetry, and interaction fit together.
                  </p>
                </div>
              </Accordion>

              <Accordion title="How this connects to lived experience">
                <div className="space-y-4">
                  <p>
                    Gauge theory offers a way to think about individuality and coherence together.
                    Each point has the freedom to shift its internal stance, yet the surrounding field brings stability and connection.
                    In our own lives, something similar happens when our internal orientation is shaped by the subtle influence of relationships, environment, and shared context.
                  </p>
                  <p>
                    Local changes rarely stay local; the system around us adjusts, responds, and rebalances in ways we can often feel but not always see.
                  </p>
                </div>
              </Accordion>
            </motion.section>
          </div>
        </main>

        {/* Instruction Drawer */}
        <SimulationInstructionDrawer
          isOpen={isInstructionDrawerOpen}
          onClose={() => setIsInstructionDrawerOpen(false)}
          title="Gauge Theory Simulation"
          instructions={[
            'This simulation visualizes how gauge fields maintain coherence across a grid of cells.',
            'Each cell has an internal orientation (shown as an arrow) that can be freely chosen.',
            'The field strength and gauge freedom sliders control how strongly cells align with their neighbors.',
            'Watch how local changes propagate through the system, creating patterns of alignment and coherence.'
          ]}
          interactions={[
            {
              action: 'Drag on the canvas',
              description: 'Click and drag to set the arrow direction for cells. The arrow points in the direction you drag from the cell center.'
            },
            {
              action: 'Field Strength slider',
              description: 'Controls how strongly cells align with their neighbors. Higher values create more uniform patterns.'
            },
            {
              action: 'Gauge Freedom slider',
              description: 'Controls how much freedom each cell has to maintain its orientation. Lower values allow more variation.'
            },
            {
              action: 'Play button',
              description: 'Randomizes all cell orientations to create a chaotic starting state.'
            },
            {
              action: 'Reset button',
              description: 'Resets all cells to a uniform aligned state (all arrows pointing the same direction).'
            }
          ]}
        />
      </>
    );
  }

  // Custom layout for Electromagnetic Fields module
  if (isElectromagneticFields) {
    return (
      <>
        {/* Content */}
        <main className="min-h-screen pt-6 pb-10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header with back arrow on left */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-start gap-4">
                <motion.button
                  onClick={handleBack}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 mt-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <div className="flex-1">
                  {(() => {
                    const parts = module.title.split(' – ');
                    const mainTitle = parts[0];
                    const subtitle = parts[1] || '';
                    return (
                      <>
                        <h1 className="text-xl sm:text-2xl font-serif text-ink-primary dark:text-paper-light text-left">
                          {mainTitle}
                        </h1>
                        {subtitle && (
                          <p className="text-sm sm:text-base text-ink-secondary dark:text-ink-muted text-left">
                            {subtitle}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.header>

            {/* How to play chip - above simulation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4"
            >
              <motion.button
                onClick={() => setIsInstructionDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-sm text-ink-secondary dark:text-ink-muted transition-colors border border-ink-muted/20 dark:border-paper-light/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Info className="w-4 h-4" />
                <span>How to play</span>
              </motion.button>
            </motion.div>

            {/* Simulation Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <ElectromagneticFieldSimulation />
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What are electromagnetic fields?">
                <div className="space-y-4">
                  <p>
                    Electromagnetic fields describe how electric charges and currents influence the space around them.
                    A charge doesn't only affect the point where it sits; it creates a field that extends outward, shaping how other charges will move if they enter that region.
                    The field stores energy, carries information, and allows forces to act at a distance without direct contact.
                  </p>
                  <p>
                    Much of modern physics and technology—light, radio, electronics—emerges from how these fields behave and interact.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Forces as corrections">
                <div className="space-y-4">
                  <p>
                    When we think in terms of fields, forces become corrections rather than pushes.
                    A particle tries to continue along its current path, but the field gently or strongly bends that path according to the pattern created by the charges.
                  </p>
                  <p>
                    In this way, electromagnetic forces constantly adjust motion to keep it consistent with the structure of the field.
                    It's a useful way to think about how invisible patterns and past choices can quietly correct or redirect behaviour over time.
                  </p>
                </div>
              </Accordion>
            </motion.section>
          </div>
        </main>

        {/* Instruction Drawer */}
        <SimulationInstructionDrawer
          isOpen={isInstructionDrawerOpen}
          onClose={() => setIsInstructionDrawerOpen(false)}
          title="Electromagnetic Fields Simulation"
          instructions={[
            'This simulation visualizes how electric charges create electromagnetic fields in space.',
            'The field arrows show the direction and strength of the electric field at each point.',
            'A test particle (white circle) moves through the field, responding to the forces created by the charges.',
            'Positive charges (orange/red) repel positive particles, while negative charges (blue) attract them.'
          ]}
          interactions={[
            {
              action: 'Tap on the canvas',
              description: 'Add a charge at the tap location. Use the "Add +" or "Add −" buttons to choose positive or negative charges.'
            },
            {
              action: 'Long press on a charge',
              description: 'Hold for 0.5 seconds on a charge to remove it from the simulation.'
            },
            {
              action: 'Field Strength slider',
              description: 'Controls how strongly the electric field affects the test particle. Higher values create stronger forces.'
            },
            {
              action: 'Damping slider',
              description: 'Controls how quickly the particle loses energy. Higher damping slows the particle down faster.'
            },
            {
              action: 'Reset Particle button',
              description: 'Resets the test particle to the center with zero velocity.'
            },
            {
              action: 'Clear Charges button',
              description: 'Removes all charges from the simulation, leaving only the test particle.'
            }
          ]}
        />
      </>
    );
  }

  // Standard module page layout
  return (
    <>
      {/* Back Button - Fixed at top-left */}
      <div className="fixed top-0 left-0 z-[10001] p-4">
        <motion.button
          onClick={handleBack}
          className="flex items-center justify-center w-12 h-12 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Content */}
      <main className="min-h-screen pt-20 pb-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-serif text-ink-primary dark:text-paper-light mb-4">
              {module.title}
            </h1>
            <p className="text-lg text-ink-secondary dark:text-ink-muted">
              {module.section}
            </p>
          </motion.header>

          {/* Simulation Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
          >
            <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
              Simulation
            </h2>
            <div className="text-ink-secondary dark:text-ink-muted">
              {isGameOfLife ? (
                <p className="mb-4">
                  The interactive Game of Life simulation is available. This module demonstrates how simple rules generate complex patterns.
                </p>
              ) : (
                <p>Interactive simulation will be implemented here.</p>
              )}
            </div>
          </motion.section>

          {/* Explanation Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
          >
            <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
              Explanation
            </h2>
            <div className="prose prose-invert dark:prose-invert max-w-none text-ink-secondary dark:text-ink-muted leading-relaxed">
              <p>{module.content}</p>
            </div>
          </motion.section>
        </div>
      </main>
    </>
  );
};

export default LearnModulePage;

