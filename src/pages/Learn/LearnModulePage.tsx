import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';
import { LearnModule } from '../../types';
import { loadLearnModules, fallbackModules } from '../../data/learnContent';
import GaugeFieldSimulation from '../../components/GaugeFieldSimulation';
import ElectromagneticFieldSimulation from '../../components/ElectromagneticFieldSimulation';
import GeodesicSimulation from '../../components/GeodesicSimulation';
import ScalarFieldSimulation from '../../components/ScalarFieldSimulation';
import PotentialLandscapeSimulation from '../../components/PotentialLandscapeSimulation';
import FramesOfReferenceSimulation from '../../components/FramesOfReferenceSimulation';
import TimeDilationSimulation from '../../components/TimeDilationSimulation';
import SpacetimeCurvatureSimulation from '../../components/SpacetimeCurvatureSimulation';
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
  const isGeodesics = module.id === 'geodesics-following-the-deepest-path';
  const isScalarFields = module.id === 'scalar-fields-the-weight-of-existence';
  const isPotentialLandscapes = module.id === 'potential-landscapes-alignment-and-resistance';
  const isFramesOfReference = module.id === 'frames-of-reference-perspective-as-reality';
  const isTimeDilation = module.id === 'time-dilation-gravity-as-slow-time';
  const isSpacetimeCurvature = module.id === 'spacetime-curvature-centres-as-time-wells';

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
                    Much of modern physics and technology – light, radio, electronics – emerges from how these fields behave and interact.
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

  // Custom layout for Geodesics module
  if (isGeodesics) {
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
              <GeodesicSimulation />
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What are geodesics?">
                <div className="space-y-4">
                  <p>
                    In curved spacetime, a geodesic is the closest thing to a straight line.
                    It is the path an object follows when no other forces act on it, apart from gravity built into the geometry itself.
                  </p>
                  <p>
                    Rather than thinking of gravity as a separate force, geodesics describe how motion looks when space and time themselves are curved.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Why paths curve around mass">
                <div className="space-y-4">
                  <p>
                    A massive object like a star or planet bends the spacetime around it.
                    Objects move along geodesics in this curved spacetime, so their paths appear bent or orbital when viewed in normal space.
                  </p>
                  <p>
                    The simulation is a simplified picture of this idea: the central mass defines a curved environment, and each particle reveals one possible geodesic, set entirely by its starting position and velocity.
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
          title="Geodesics Simulation"
          instructions={[
            'This simulation shows how paths bend around a central mass in curved spacetime.',
            'Each line you see is a geodesic: the path a particle follows when it moves freely under the influence of gravity.',
            'The central mass creates curvature, and particles follow the straightest possible path within that curved geometry.',
            'Different starting positions and velocities create very different trajectories: escape paths, wide arcs, or tight orbits.'
          ]}
          interactions={[
            {
              action: 'Tap and drag on the canvas',
              description: 'Drag from a point to launch a particle. The start of the drag sets the particle\'s position; the direction and length of the drag set its initial velocity.'
            },
            {
              action: 'Avoid the central region',
              description: 'For clarity, try launching particles from around the outer parts of the canvas rather than directly on top of the central mass.'
            },
            {
              action: 'Mass / Curvature slider',
              description: 'Controls how strongly the central mass bends nearby paths. Higher values create tighter curves and more dramatic orbits.'
            },
            {
              action: 'Damping slider',
              description: 'Gently reduces particle speed over time. Higher damping keeps the system stable and can help reveal stable orbits and near-miss paths.'
            },
            {
              action: 'Clear Paths button',
              description: 'Removes all particles and their trails so you can start a fresh set of geodesics with new initial conditions.'
            }
          ]}
        />
      </>
    );
  }

  // Custom layout for Scalar Fields module
  if (isScalarFields) {
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
              <ScalarFieldSimulation />
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What are scalar fields?">
                <div className="space-y-4">
                  <p>
                    A scalar field assigns one number to every point in space — temperature, pressure, gravitational potential, and energy landscapes all behave like this.
                    Unlike vector fields, scalar fields don't point anywhere; they simply encode levels or intensities across space.
                    Objects interacting with scalar fields respond to the gradients of these values, moving from high to low regions.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Fields as landscapes">
                <div className="space-y-4">
                  <p>
                    A scalar field can be imagined as a 2D map of hills and valleys.
                    Particles move according to the steepness and direction of the slope beneath them, even when the field itself has no direction.
                    This gives a simple, intuitive view of how a single value — distributed across space — can shape motion, flow, and equilibrium.
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
          title="Scalar Fields Simulation"
          instructions={[
            'This simulation shows how a scalar field assigns a single value to every point in space — like a landscape of hills and valleys.',
            'Each source you place changes the shape of this landscape, creating areas of higher or lower potential.',
            'A test particle moves across this surface, accelerating toward lower values in the field — the steepest downhill direction.',
            'This reveals how scalar fields guide behaviour through simple gradients, without needing explicit forces or directional rules.'
          ]}
          interactions={[
            {
              action: 'Tap on the canvas',
              description: 'Add a scalar source at the tap location. Use "Add +" to create hills, or "Add –" to create wells.'
            },
            {
              action: 'Long press on a source',
              description: 'Hold for 0.5 seconds on a source to remove it (if implemented), or use the "Clear Sources" button.'
            },
            {
              action: 'Field Strength slider',
              description: 'Controls how strongly the particle responds to the slope of the field. Higher values increase acceleration.'
            },
            {
              action: 'Damping slider',
              description: 'Controls how quickly the particle loses speed. Higher damping stabilises motion and prevents spiralling.'
            },
            {
              action: 'Reset Particle',
              description: 'Returns the test particle to the centre with zero velocity.'
            },
            {
              action: 'Clear Sources',
              description: 'Removes all scalar sources, flattening the field.'
            }
          ]}
        />
      </>
    );
  }

  // Custom layout for Potential Landscapes module
  if (isPotentialLandscapes) {
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
              <PotentialLandscapeSimulation />
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What is a potential landscape?">
                <div className="space-y-4">
                  <p>
                    A potential landscape assigns an energy value to every point in space.
                    Objects tend to move toward regions of lower potential and avoid regions of higher potential, creating natural paths, basins, and stable points.
                  </p>
                  <p>
                    This is how many systems — from physics to chemistry to biology — decide where things want to go.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Alignment and resistance">
                <div className="space-y-4">
                  <p>
                    Wells represent alignment: paths where things naturally settle with little effort.
                    Hills represent resistance: areas where movement costs more energy and becomes harder.
                  </p>
                  <p>
                    Potential landscapes help visualise how the shape of a system guides behaviour, drawing things together or pushing them apart.
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
          title="Potential Landscape Simulation"
          instructions={[
            'This simulation shows how potential energy shapes movement across space.',
            'Each source you place becomes a hill or well, changing the shape of the overall landscape.',
            'The test particle travels along the path of least potential — the smoothest, lowest-energy route.',
            'Together, wells and barriers create a network of forces that channel motion, stability, resistance, and flow.'
          ]}
          interactions={[
            {
              action: 'Tap on the canvas',
              description: 'Add a potential source. "Add +" creates a hill (repulsive); "Add –" creates a well (attractive).'
            },
            {
              action: 'Long press on a source',
              description: 'Remove a potential source by holding your finger down for 0.5 seconds.'
            },
            {
              action: 'Potential Strength slider',
              description: 'Controls how strongly the particle moves in response to the landscape. Higher values create steeper paths.'
            },
            {
              action: 'Damping slider',
              description: 'Slows the particle over time and prevents runaway movement.'
            },
            {
              action: 'Reset Particle',
              description: 'Returns the particle to the centre with zero velocity.'
            },
            {
              action: 'Clear Sources',
              description: 'Removes all wells/hills, flattening the landscape.'
            }
          ]}
        />
      </>
    );
  }

  // Custom layout for Frames of Reference module
  if (isFramesOfReference) {
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
              <FramesOfReferenceSimulation />
            </motion.section>

            {/* What it does Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
                What it does
              </h2>
              <ul className="space-y-2 text-ink-secondary dark:text-ink-muted">
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>This simulation shows how motion depends entirely on where you stand.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>Two observers watch the same moving ship, but because one observer is also in motion, each sees a different path, speed, and timing.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>Switching frames reveals that motion is not absolute — it is relational.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>In Relativistic mode, time and velocity transform using Lorentz equations, revealing how deeply perspective shapes physical reality.</span>
                </li>
              </ul>
            </motion.section>

            {/* How to interact Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
                How to interact
              </h2>
              <div className="space-y-3">
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Toggle the frame of reference
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Switch between Observer A and Observer B to see how the same motion appears from different perspectives.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Adjust the velocities
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Use the sliders to change the ship's speed and Observer B's speed. Each frame interprets the movement differently.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Switch between Classical and Relativistic modes
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Classical uses simple velocity differences. Relativistic uses Lorentz transformations (velocity addition + time dilation).
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Reset Simulation
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Reset both observers and the ship to their starting positions.
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What is a frame of reference?">
                <div className="space-y-4">
                  <p>
                    A frame of reference is a point of view — a physical coordinate system tied to an observer.
                    Motion only exists relative to a frame.
                    If two observers move differently, they will not agree on speeds, directions, or timing.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Why perspective shapes reality">
                <div className="space-y-4">
                  <p>
                    Two observers can see different worlds even while watching the same event.
                    At everyday speeds this is a matter of subtracting velocities.
                    At high speeds time itself stretches and contracts, so their realities drift even further apart.
                  </p>
                  <p>
                    The simulation shows how deeply the universe depends on perspective.
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
          title="Frames of Reference Simulation"
          instructions={[
            'This simulation shows how motion depends entirely on where you stand.',
            'Two observers watch the same moving ship, but because one observer is also in motion, each sees a different path, speed, and timing.',
            'Switching frames reveals that motion is not absolute — it is relational.',
            'In Relativistic mode, time and velocity transform using Lorentz equations, revealing how deeply perspective shapes physical reality.'
          ]}
          interactions={[
            {
              action: 'Toggle the frame of reference',
              description: 'Switch between Observer A and Observer B to see how the same motion appears from different perspectives.'
            },
            {
              action: 'Adjust the velocities',
              description: 'Use the sliders to change the ship\'s speed and Observer B\'s speed. Each frame interprets the movement differently.'
            },
            {
              action: 'Switch between Classical and Relativistic modes',
              description: 'Classical uses simple velocity differences. Relativistic uses Lorentz transformations (velocity addition + time dilation).'
            },
            {
              action: 'Reset Simulation',
              description: 'Reset both observers and the ship to their starting positions.'
            }
          ]}
        />
      </>
    );
  }

  // Custom layout for Time Dilation module
  if (isTimeDilation) {
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
              <TimeDilationSimulation />
            </motion.section>

            {/* What it does Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
                What it does
              </h2>
              <ul className="space-y-2 text-ink-secondary dark:text-ink-muted">
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>This simulation shows how gravity emerges from differences in the flow of time.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>Each mass slows the passage of time in its vicinity, forming a "time well."</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>The particle doesn't fall because it is pulled — it falls because time flows more slowly beneath it, curving its natural path.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>Clocks near masses tick more slowly, revealing how time dilation shapes motion.</span>
                </li>
              </ul>
            </motion.section>

            {/* How to interact Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
                How to interact
              </h2>
              <div className="space-y-3">
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Tap to add mass
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Each mass creates a local region where time flows more slowly.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Long press to remove
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Remove a mass by holding your finger on it.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Time Strength slider
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Controls how strongly masses slow time and how deeply the wells become.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Damping slider
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Stabilises the particle's motion and shows the structure of time wells more clearly.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Reset Particle
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Returns the particle to the center with zero velocity.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Clear Masses
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Removes all masses from the simulation, resetting the time field.
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What is time dilation?">
                <div className="space-y-4">
                  <p>
                    Time does not pass at the same rate everywhere.
                    Near massive objects, time slows down.
                    This difference becomes the foundation of gravity in general relativity.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Why gravity is slow time">
                <div className="space-y-4">
                  <p>
                    Instead of a force pulling objects down, gravity emerges from the geometry of time itself.
                    A particle naturally moves toward regions where its own time ticks more slowly — sliding down time rather than falling through space.
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
          title="Time Dilation Simulation"
          instructions={[
            'This simulation shows how gravity emerges from differences in the flow of time.',
            'Each mass slows the passage of time in its vicinity, forming a "time well."',
            'The particle doesn\'t fall because it is pulled — it falls because time flows more slowly beneath it, curving its natural path.',
            'Clocks near masses tick more slowly, revealing how time dilation shapes motion.'
          ]}
          interactions={[
            {
              action: 'Tap on the canvas',
              description: 'Add a mass at the tap location. Each mass creates a local region where time flows more slowly.'
            },
            {
              action: 'Long press on a mass',
              description: 'Hold for 0.5 seconds on a mass to remove it from the simulation.'
            },
            {
              action: 'Time Strength slider',
              description: 'Controls how strongly masses slow time and how deeply the time wells become. Higher values create stronger time dilation effects.'
            },
            {
              action: 'Damping slider',
              description: 'Stabilises the particle\'s motion and shows the structure of time wells more clearly. Higher damping slows the particle down faster.'
            },
            {
              action: 'Clock Visualization toggle',
              description: 'Show or hide the animated clock grid that displays local time speed at different points in space.'
            },
            {
              action: 'Reset Particle button',
              description: 'Resets the test particle to the center with zero velocity.'
            },
            {
              action: 'Clear Masses button',
              description: 'Removes all masses from the simulation, resetting the time field to flat space.'
            }
          ]}
        />
      </>
    );
  }

  // Custom layout for Spacetime Curvature module
  if (isSpacetimeCurvature) {
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
              <SpacetimeCurvatureSimulation />
            </motion.section>

            {/* What it does Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
                What it does
              </h2>
              <ul className="space-y-2 text-ink-secondary dark:text-ink-muted">
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>This simulation shows how a massive object bends spacetime.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>The grid represents the geometry of space. A mass at the centre pulls this geometry downward, creating a curvature.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>When you launch the particle, it follows the straightest possible path within this curved geometry — a geodesic.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                  <span>Increasing the mass deepens the curvature, creating tighter bends and orbital paths.</span>
                </li>
              </ul>
            </motion.section>

            {/* How to interact Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
            >
              <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-4">
                How to interact
              </h2>
              <div className="space-y-3">
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Drag to launch
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Touch the particle and drag to set its initial direction and speed.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Mass / Curvature slider
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Increase this to deepen the well and exaggerate curvature.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Damping slider
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Controls how quickly the particle slows or settles.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Visualization mode
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Switch between Fabric, Contour map, and Refractive distortion.
                  </div>
                </div>
                <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                  <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                    Reset
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-ink-muted">
                    Reset the particle or the curvature field to start fresh.
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Accordions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Accordion title="What is spacetime curvature?">
                <div className="space-y-4">
                  <p>
                    Spacetime curvature describes how mass reshapes the geometry of the universe.
                    Massive bodies pull the "fabric" of space downward, creating paths that bend naturally.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Why gravity behaves like a time well">
                <div className="space-y-4">
                  <p>
                    Near massive objects, time slows and space stretches.
                    This produces a geometry that resembles a well: objects naturally fall inward or orbit depending on their motion.
                    Gravity emerges from this shape, not from a pulling force.
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
          title="Spacetime Curvature Simulation"
          instructions={[
            'This simulation shows how a massive object bends spacetime.',
            'The grid represents the geometry of space. A mass at the centre pulls this geometry downward, creating a curvature.',
            'When you launch the particle, it follows the straightest possible path within this curved geometry — a geodesic.',
            'Increasing the mass deepens the curvature, creating tighter bends and orbital paths.'
          ]}
          interactions={[
            {
              action: 'Drag to launch',
              description: 'Touch the particle and drag to set its initial direction and speed. The particle will follow a geodesic path through the curved spacetime.'
            },
            {
              action: 'Mass / Curvature slider',
              description: 'Controls how strongly the central mass bends spacetime. Higher values create deeper wells and more dramatic curvature effects.'
            },
            {
              action: 'Damping slider',
              description: 'Controls how quickly the particle loses energy. Higher damping helps reveal stable orbits and prevents runaway motion.'
            },
            {
              action: 'Visualization mode toggle',
              description: 'Switch between three visualization modes: Fabric (warped grid mesh), Contour (height level lines), and Refractive (background distortion).'
            },
            {
              action: 'Reset Particle button',
              description: 'Resets the particle to the center with zero velocity.'
            },
            {
              action: 'Reset Curvature button',
              description: 'Resets the mass/curvature slider to zero, flattening spacetime.'
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

