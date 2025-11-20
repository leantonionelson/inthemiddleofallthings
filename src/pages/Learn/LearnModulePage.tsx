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
import ConservationOfEnergySimulation from '../../components/ConservationOfEnergySimulation';
import ConservationMomentumSimulation from '../../components/ConservationMomentumSimulation';
import ConservationInformationSimulation from '../../components/ConservationInformationSimulation';
import GameOfLifeSimulation from '../../components/GameOfLifeSimulation';
import ChaosTheorySimulation from '../../components/ChaosTheorySimulation';
import SelfOrganisedCriticalitySimulation from '../../components/SelfOrganisedCriticalitySimulation';
import ReactionDiffusionSimulation from '../../components/ReactionDiffusionSimulation';
import InertiaSimulation from '../../components/InertiaSimulation';
import ForceAccelerationSimulation from '../../components/ForceAccelerationSimulation';
import ActionReactionSimulation from '../../components/ActionReactionSimulation';
import NaturalSelectionSimulation from '../../components/NaturalSelectionSimulation';
import MutationVariationSimulation from '../../components/MutationVariationSimulation';
import FitnessLandscapeSimulation from '../../components/FitnessLandscapeSimulation';
import EntropySimulation from '../../components/EntropySimulation';
import FreeEnergySimulation from '../../components/FreeEnergySimulation';
import LearnModuleLayout from '../../components/LearnModuleLayout';
import Accordion from '../../components/Accordion';
import SimulationInstructionDrawer from '../../components/SimulationInstructionDrawer';

const LearnModulePage: React.FC = () => {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<LearnModule | null>(null);
  const [allModules, setAllModules] = useState<LearnModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstructionDrawerOpen, setIsInstructionDrawerOpen] = useState(false);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsLoading(true);
        const modules = await loadLearnModules();
        setAllModules(modules);
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

  // Scroll to top when module changes (with delay to ensure it happens after carousel positioning)
  useEffect(() => {
    if (module) {
      // Use setTimeout to ensure this runs after any carousel scrollIntoView calls
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        // Also scroll the main container if it exists (for reading pages)
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = 0;
        }
      }, 150); // Slightly longer than carousel's 100ms delay
      
      return () => clearTimeout(timer);
    }
  }, [module]);

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

  const isGaugeTheory = module.id === 'gauge-theory';
  const isElectromagneticFields = module.id === 'electromagnetic-fields-forces-as-corrections';
  const isGeodesics = module.id === 'geodesics-following-the-deepest-path';
  const isScalarFields = module.id === 'scalar-fields-the-weight-of-existence';
  const isPotentialLandscapes = module.id === 'potential-landscapes-alignment-and-resistance';
  const isFramesOfReference = module.id === 'frames-of-reference-perspective-as-reality';
  const isTimeDilation = module.id === 'time-dilation-gravity-as-slow-time';
  const isSpacetimeCurvature = module.id === 'spacetime-curvature-centres-as-time-wells';
  const isConservationOfEnergy = module.id === 'conservation-of-energy-transformation-not-loss';
  const isConservationMomentum = module.id === 'conservation-of-momentum-behavioural-continuation';
  const isConservationOfInformation = module.id === 'conservation-of-information-nothing-truly-vanishes';
  const isGameOfLife = module.id === 'conways-game-of-life-emergence-from-simplicity';
  const isChaosTheory = module.id === 'chaos-theory-sensitive-dependence';
  const isSelfOrganisedCriticality = module.id === 'self-organised-criticality-the-avalanche-principle';
  const isReactionDiffusion = module.id === 'reaction-diffusion-patterns-born-from-opposites';
  const isInertia = module.id === 'inertia-habit-as-motion';
  const isForceAcceleration = module.id === 'force-and-acceleration-the-shape-of-change';
  const isActionReaction = module.id === 'action-and-reaction-emotional-feedback';
  const isNaturalSelection = module.id === 'natural-selection-identity-as-strategy';
  const isMutationVariation = module.id === 'mutation-variation-small-differences-new-paths';
  const isEntropy = module.id === 'entropy-drift-toward-disorder';
  const isFreeEnergy = module.id === 'free-energy-systems-choose-low-grounds';

  // Custom layout for Gauge Theory module
  if (isGaugeTheory) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Gauge Theory Simulation",
          instructions: [
            'This simulation visualizes how gauge fields maintain coherence across a grid of cells.',
            'Each cell has an internal orientation (shown as an arrow) that can be freely chosen.',
            'The field strength and gauge freedom sliders control how strongly cells align with their neighbors.',
            'Watch how local changes propagate through the system, creating patterns of alignment and coherence.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <GaugeFieldSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Electromagnetic Fields module
  if (isElectromagneticFields) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Electromagnetic Fields Simulation",
          instructions: [
            'This simulation visualizes how electric charges create electromagnetic fields in space.',
            'The field arrows show the direction and strength of the electric field at each point.',
            'A test particle (white circle) moves through the field, responding to the forces created by the charges.',
            'Positive charges (orange/red) repel positive particles, while negative charges (blue) attract them.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ElectromagneticFieldSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Geodesics module
  if (isGeodesics) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Geodesics Simulation",
          instructions: [
            'This simulation shows how paths bend around a central mass in curved spacetime.',
            'Each line you see is a geodesic: the path a particle follows when it moves freely under the influence of gravity.',
            'The central mass creates curvature, and particles follow the straightest possible path within that curved geometry.',
            'Different starting positions and velocities create very different trajectories: escape paths, wide arcs, or tight orbits.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <GeodesicSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Scalar Fields module
  if (isScalarFields) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Scalar Fields Simulation",
          instructions: [
            'This simulation shows how a scalar field assigns a single value to every point in space — like a landscape of hills and valleys.',
            'Each source you place changes the shape of this landscape, creating areas of higher or lower potential.',
            'A test particle moves across this surface, accelerating toward lower values in the field — the steepest downhill direction.',
            'This reveals how scalar fields guide behaviour through simple gradients, without needing explicit forces or directional rules.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ScalarFieldSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Potential Landscapes module
  if (isPotentialLandscapes) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Potential Landscape Simulation",
          instructions: [
            'This simulation shows how potential energy shapes movement across space.',
            'Each source you place becomes a hill or well, changing the shape of the overall landscape.',
            'The test particle travels along the path of least potential — the smoothest, lowest-energy route.',
            'Together, wells and barriers create a network of forces that channel motion, stability, resistance, and flow.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <PotentialLandscapeSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Frames of Reference module
  if (isFramesOfReference) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Frames of Reference Simulation",
          instructions: [
            'This simulation shows how motion depends entirely on where you stand.',
            'Two observers watch the same moving ship, but because one observer is also in motion, each sees a different path, speed, and timing.',
            'Switching frames reveals that motion is not absolute — it is relational.',
            'In Relativistic mode, time and velocity transform using Lorentz equations, revealing how deeply perspective shapes physical reality.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <FramesOfReferenceSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Time Dilation module
  if (isTimeDilation) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Time Dilation Simulation",
          instructions: [
            'This simulation shows how gravity emerges from differences in the flow of time.',
            'Each mass slows the passage of time in its vicinity, forming a "time well."',
            'The particle doesn\'t fall because it is pulled — it falls because time flows more slowly beneath it, curving its natural path.',
            'Clocks near masses tick more slowly, revealing how time dilation shapes motion.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <TimeDilationSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Spacetime Curvature module
  if (isSpacetimeCurvature) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Spacetime Curvature Simulation",
          instructions: [
            'This simulation shows how a massive object bends spacetime.',
            'The grid represents the geometry of space. A mass at the centre pulls this geometry downward, creating a curvature.',
            'When you launch the particle, it follows the straightest possible path within this curved geometry — a geodesic.',
            'Increasing the mass deepens the curvature, creating tighter bends and orbital paths.'
          ],
          interactions: [
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
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <SpacetimeCurvatureSimulation />
        </motion.section>

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
      </LearnModuleLayout>
    );
  }

  // Custom layout for Conservation of Energy module
  if (isConservationOfEnergy) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Conservation of Energy Simulation",
          instructions: [
            'Shows how one fixed "budget" of energy splits into kinetic, potential, and dissipated forms as a particle moves.',
            'Lets you see why objects speed up downhill and slow down uphill without any extra push.',
            'Makes so-called "lost" energy visible as a growing store instead of something that just vanishes.',
            'Demonstrates how friction changes motion while the deeper rule – total energy conservation – still holds.',
            'Helps you think in terms of energy landscapes, not just forces and accelerations.'
          ],
          interactions: [
            {
              action: 'Tap on the track',
              description: 'Click or tap on the track to move the particle to that position and set its velocity to zero. Recalculate energies from that configuration.'
            },
            {
              action: 'Drag to launch',
              description: 'Press and drag the particle along the track to give it an initial push. The drag distance determines the initial speed and kinetic energy.'
            },
            {
              action: 'Initial energy slider',
              description: 'Sets how much energy the particle starts with. Higher values allow the particle to climb taller hills. Try different values to see which hills are reachable.'
            },
            {
              action: 'Friction slider (γ)',
              description: 'Controls the friction coefficient. At zero, energy exchanges cleanly between kinetic and potential. Higher values cause motion to fade as energy moves into the dissipated bucket.'
            },
            {
              action: 'Gravity slider (g)',
              description: 'Scales the strength of gravity, affecting the depth and steepness of the potential energy landscape.'
            },
            {
              action: 'Track shape selector',
              description: 'Choose from four track shapes: Flat (no potential), Single hill (Gaussian bump), Double well (quartic potential), or Steep drop (piecewise ramp). Each creates a different energy landscape.'
            },
            {
              action: 'Visualization mode toggle',
              description: 'Switch between three views: Bars (stacked energy bars with total budget line), Time graph (scrolling time-series of energy components), or Energy phase (energy vs position with potential curve background).'
            },
            {
              action: 'Play/Pause button',
              description: 'Start or pause the simulation. Useful for examining the particle at a specific moment.'
            },
            {
              action: 'Step button',
              description: 'Advance the simulation by one fixed timestep. Useful for slow inspection and debugging.'
            },
            {
              action: 'Reset buttons',
              description: 'Reset particle: returns particle to initial position with current settings. Reset All: resets all sliders and settings to defaults.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ConservationOfEnergySimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="What is conservation of energy?">
            <div className="space-y-4">
              <p>
                Energy is a way of tracking the capacity for change. In a closed system, total energy stays constant, even while it moves between forms: kinetic (motion), potential (position), thermal (heat), and others.
              </p>
              <p>
                The simulation shows this principle in action. As the particle moves, energy flows between kinetic and potential forms. When friction acts, some kinetic energy appears to "disappear," but it actually transforms into dissipated energy (heat, sound, deformation) that we track separately.
              </p>
              <p>
                Tiny numerical drift in the simulation is due to approximation in the integration method, not a real violation of conservation. In reality, energy is perfectly conserved.
              </p>
            </div>
          </Accordion>

          <Accordion title="Why 'lost' energy isn't really lost">
            <div className="space-y-4">
              <p>
                Everyday experiences seem to show energy disappearing: swings slow down, rolling balls stop, cars need constant fuel. But energy doesn't vanish – it transforms into less obvious forms.
              </p>
              <p>
                When a ball rolls to a stop, its kinetic energy goes into heat (friction with the ground), sound (vibrations), and subtle deformations. The energy is still there, just spread out and harder to gather back into neat motion.
              </p>
              <p>
                The "E_loss" bar in the simulation is a visual metaphor for this hidden store. It grows as motion fades, making visible what usually seems invisible. This connects to entropy: as energy spreads out, it becomes harder to use for organized work.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Conservation of Momentum module
  if (isConservationMomentum) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Conservation of Momentum Simulation",
          instructions: [
            'Shows how momentum (p = m v) behaves like a shared motion budget between bodies.',
            'Lets you see that when two objects collide, individual speeds and directions change but the total momentum vector stays fixed.',
            'Reveals the centre of mass as the "average body" whose path is smooth and stubborn, even during violent interactions.',
            'Lets you explore how changing mass and elasticity alters who moves more after impact.',
            'Builds intuition for momentum as a vector quantity: direction matters as much as magnitude.'
          ],
          interactions: [
            {
              action: 'Slingshot launch',
              description: 'While paused, drag from a body to set its initial velocity. The drag direction sets the direction, and the length sets the speed.'
            },
            {
              action: 'Drag bodies',
              description: 'While paused, click and drag a body to move it to a new position. Set up head-on collisions, glancing blows, or corner impacts.'
            },
            {
              action: 'Elasticity slider',
              description: 'Controls how bouncy collisions are. 0 = perfectly inelastic (bodies stick together), 1 = perfectly elastic (billiard balls). Real-world collisions are typically 0.5-0.9.'
            },
            {
              action: 'Mass sliders',
              description: 'Adjust the mass of each body (0.5 to 5). Heavier bodies are harder to move and have more momentum for the same speed. Notice how the lighter body "gives way" more after collisions.'
            },
            {
              action: 'Time scale toggle',
              description: 'Switch between Normal speed and Slow Motion (0.25x) to inspect collisions in detail. Slow motion helps see the exact moment of impact and how velocities change.'
            },
            {
              action: 'Visual mode toggle',
              description: 'Standard: Shows bodies and COM crosshair. Vector: Shows velocity (cyan/blue) and momentum (orange/red) vectors for each body. System: Shows total momentum vector and COM trail.'
            },
            {
              action: 'Play/Pause button',
              description: 'Start or pause the simulation. Useful for setting up initial conditions or examining the system at a specific moment.'
            },
            {
              action: 'Reset buttons',
              description: 'Reset Scenario: Returns bodies to default positions and velocities while keeping current masses and elasticity. Reset All: Restores all settings to defaults.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ConservationMomentumSimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="Momentum as stubbornness">
            <div className="space-y-4">
              <p>
                Momentum is "how hard something is to stop or divert," not just speed. A small fast object can have the same momentum as a large slow one – both require the same effort to change their motion.
              </p>
              <p>
                In a closed system with no external forces, the vector sum of all momenta cannot change. When two objects collide, they exchange momentum through the collision force, but the total remains constant. Individual speeds and directions can change violently, but the system's overall motion budget stays fixed.
              </p>
              <p>
                This is why momentum conservation is so powerful: it's a constraint that must be satisfied, regardless of how complex the interactions become.
              </p>
            </div>
          </Accordion>

          <Accordion title="The centre of mass never lies">
            <div className="space-y-4">
              <p>
                The centre of mass is the weighted average position of all mass in a system. For two bodies, it sits somewhere on the line connecting them, closer to the heavier body.
              </p>
              <p>
                Internal forces – like collisions between the bodies – cannot change the centre of mass path. Only external forces can do that. So even as the two bodies zig-zag, bounce, and collide, their centre of mass moves in a straight line at constant velocity (or follows a simple path if external forces act).
              </p>
              <p>
                This connects to real-world systems: ice skaters pushing off each other, rockets throwing mass backwards, or any system where parts rearrange internally. The system's "behaviour" continues smoothly even while its parts swirl and change.
              </p>
              <p>
                Watch the crosshair in System View – it's the system's true motion, the behavioural continuation that never breaks stride.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Conservation of Information module
  if (isConservationOfInformation) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Conservation of Information Simulation",
          instructions: [
            'Shows how a clear, structured pattern can be stretched and folded into something that looks like random noise.',
            'Demonstrates that in a closed, deterministic system, this apparent randomness is still reversible: if you reverse the flow, the pattern reappears.',
            'Introduces noise as a stand-in for the environment: tiny random kicks that destroy the ability to reconstruct the exact past.',
            'Gives a visual intuition for the difference between scrambled and lost.',
            'Connects "information" to the uniqueness of a microstate, not just the visible shape.'
          ],
          interactions: [
            {
              action: 'Shape preset selector',
              description: 'Choose from three initial shapes: Square (block), Circle (disc), or Letter I. Each shape demonstrates the same mixing behavior under the same flow law.'
            },
            {
              action: 'Play/Pause button',
              description: 'Start or pause the simulation. When playing, time advances with the current direction (forward or reverse).'
            },
            {
              action: 'Direction toggle',
              description: 'Switch between Forward (mixing) and Reverse (unwinding). With zero noise, reversing perfectly reconstructs the original shape. With noise, recovery is imperfect.'
            },
            {
              action: 'Noise slider',
              description: 'Controls the amount of random noise injected each frame (0-100%). At 0%, the flow is effectively reversible. Higher values break reversibility as information leaks into untracked degrees of freedom.'
            },
            {
              action: 'Speed slider',
              description: 'Adjusts the time scale of the flow (0.25x to 2x). Slower speeds help see the onset of mixing and the details of reversal.'
            },
            {
              action: 'Visualization mode toggle',
              description: 'Particles: Shows the particle cloud with color-coded particles based on initial position. Entropy: Same view plus entropy meter and optional grid overlay showing the coarse-grained bins.'
            },
            {
              action: 'Reset buttons',
              description: 'Reset Shape: Resets to the current shape\'s initial state with t=0, keeping current noise and direction settings. Reset All: Resets everything to defaults (Square shape, Forward direction, 0% noise, 1x speed).'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ConservationInformationSimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="Is the past still here?">
            <div className="space-y-4">
              <p>
                In many fundamental theories – classical Hamiltonian mechanics, quantum unitary evolution – the mapping from state to state is reversible. If you knew the present state <em>perfectly</em> and the exact rules, you could, in principle, reconstruct the past.
              </p>
              <p>
                The simulation's perfect rewind (with zero noise) is a toy model of that idea. When the flow is deterministic and closed, running it backwards undoes every step. The apparent chaos is just a scrambled version of the original pattern, and the scrambling can be reversed.
              </p>
              <p>
                This connects to deep questions in physics: Is information truly conserved? Can we, in principle, recover the past from the present? The simulation shows that in an ideal closed system, the answer is yes.
              </p>
            </div>
          </Accordion>

          <Accordion title="Noise and true information loss">
            <div className="space-y-4">
              <p>
                Noise here represents untracked interactions with an environment. Once the system leaks information into degrees of freedom you don't track, many different past microstates can lead to the same macro appearance.
              </p>
              <p>
                Think of burning a book: in principle, the smoke and photons carry the information, but it's practically unrecoverable. Or the black hole information problem: do black holes destroy information or only scramble it beyond recognition?
              </p>
              <p>
                The key insight is that "entropy increase" is often about <strong>forgetting details</strong>, not magic destruction of reality. Information doesn't vanish – it spreads into degrees of freedom we can't easily track or reconstruct. The simulation makes this visible: with noise, the reverse flow can't perfectly recover the original shape because the exact microstate has been lost to the environment.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Inertia module
  if (isInertia) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Inertia – Habit as Motion",
          instructions: [
            'Space is as close as we get to pure Newtonian motion. Once the ship is moving, it does not need constant force to keep going.',
            'Force only changes its motion: starts it moving, speeds it up, turns it, or brings it to a stop.',
            'Mass is resistance to change: low mass responds quickly, high mass is stubborn and slow to turn or stop.',
            'The velocity vector (green) shows your current motion direction and speed. It persists even when you stop thrusting.',
            'The thrust vector (orange) appears only when you are actively applying force. Notice how it disappears instantly when you let go, while velocity continues.',
            'Friction in "Earth mode" simulates the drag we experience on Earth, where objects naturally slow down. In "Space mode", motion continues forever without intervention.',
            'The docking challenge teaches you to anticipate motion: you must fire thrusters early in the opposite direction to cancel your velocity before reaching the target.',
            '',
            'Habit as motion:',
            'The ship\'s motion is your current habit – the direction you\'re moving in, the speed at which your days are already flowing.',
            'Mass is how deeply that habit is embedded: heavy habits are hard to start and hard to stop.',
            'Friction is your environment: some worlds sap your momentum quickly, others let you drift for a long time in the same direction.',
            'Every burst of thrust is a choice – a deliberate push, a decision to tilt the path.',
            'The trail you leave behind doesn\'t change when you course-correct. You\'re not rewriting the past; you\'re steering the next part of the line.'
          ],
          interactions: [
            {
              action: 'Virtual Joystick',
              description: 'Drag in the circular pad to apply thrust. The direction you drag determines the force direction, and the distance from center determines the magnitude. Release to stop thrusting. Notice how the force arrow disappears instantly while the velocity arrow persists.'
            },
            {
              action: 'Mass (Inertia) Slider',
              description: 'Adjust the ship\'s mass from 0.5 to 3.0. Low mass makes the ship quick and responsive – easy to accelerate and easy to stop. High mass makes it sluggish and stubborn – requires more force to change direction or come to a halt. Try stopping a high-mass ship that\'s moving fast!'
            },
            {
              action: 'Earth mode (friction) Toggle',
              description: 'Toggle between Space mode (no friction) and Earth mode (with friction). In Space mode, the ship continues drifting forever once moving. In Earth mode, it naturally slows down over time, matching our everyday experience where objects eventually come to rest.'
            },
            {
              action: 'Brake to stop Button',
              description: 'Automatically applies reverse thrust to bring the ship to a complete stop. Watch how the computer fires thrusters in the exact opposite direction of your velocity until speed reaches zero. This demonstrates how much effort it takes to cancel inertia.'
            },
            {
              action: 'Play/Pause Button',
              description: 'Start or pause the physics simulation. When paused, you can still interact with controls, but the ship won\'t move.'
            },
            {
              action: 'Reset Button',
              description: 'Resets the simulation: ship returns to center with zero velocity, docking zone resets, and all particles clear. Useful for starting fresh experiments.'
            },
            {
              action: 'Docking Challenge',
              description: 'Try to fly into the cyan docking zone and come to a perfect stop inside it. You\'ll likely overshoot at first – this teaches you to fire reverse thrusters early to cancel your forward motion. The zone turns green when you successfully dock (inside zone with low speed).'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <InertiaSimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="Newton's First Law">
            <div className="space-y-4">
              <p>
                Newton's First Law states that an object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an unbalanced force.
              </p>
              <p>
                This simulation demonstrates this principle in its purest form: a spacecraft drifting in a near-frictionless void. Once you give it a push, it continues moving forever unless you apply a force to change its motion.
              </p>
              <p>
                The key insight is that <strong>force is only needed to change motion</strong>, not to maintain it. This contradicts our everyday experience on Earth, where friction constantly slows things down, making it seem like constant force is needed to keep moving.
              </p>
            </div>
          </Accordion>

          <Accordion title="Mass as resistance to change">
            <div className="space-y-4">
              <p>
                Mass represents an object's resistance to acceleration. The relationship is captured by Newton's Second Law: <strong>F = ma</strong>, or acceleration = force / mass.
              </p>
              <p>
                In the simulation, you can feel this directly: a low-mass ship responds quickly to thrust, accelerating and turning with ease. A high-mass ship is sluggish and stubborn – it takes much more force to get it moving, and even more to stop it.
              </p>
              <p>
                This is why heavy objects are harder to push, and why stopping a moving train requires much more effort than stopping a bicycle. Mass isn't just "stuff" – it's a measure of how much an object resists changes to its motion.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Force & Acceleration module
  if (isForceAcceleration) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Force & Acceleration – The Shape of Change",
        instructions: [
          'Force is the push or pull that changes motion. It has both strength (magnitude) and direction.',
          'Acceleration is the shape of that change: direction tells you where motion is being bent toward, magnitude tells you how sharply it\'s changing.',
          'Mass measures how "stubborn" the sled is: for the same push, a heavier sled accelerates less. For the same acceleration, a heavier sled requires more force.',
          '',
          'Habit metaphor:',
          'Think of net force as the sum of influences on your behaviour – supports, obstacles, desires, fears.',
          'Acceleration is how quickly your path actually changes in response.',
          'Mass is everything that makes you slow to change: identity, history, context.',
          'Friction is the subtle resistance of routine and environment.'
        ],
        interactions: [
          {
            action: 'Mass Slider',
            description: 'Adjust the sled\'s mass from 1 to 10 kg. Higher mass = smaller acceleration for the same net force. Try the same push with different masses to feel the difference.'
          },
          {
            action: 'Push Right Slider',
            description: 'Control the magnitude of the rightward applied force (0-20 N). Watch the blue arrow appear and grow as you increase the force.'
          },
          {
            action: 'Push Left Slider',
            description: 'Control the magnitude of the leftward applied force (0-20 N). Watch the orange arrow appear. When both pushes are active, they combine into a net force.'
          },
          {
            action: 'Friction (μ) Slider',
            description: 'Adjust the friction coefficient from 0 (ice) to 1 (rough surface). At high friction, the sled might not move until your push overcomes static friction. At low friction, the sled glides freely.'
          },
          {
            action: 'Preset Buttons',
            description: 'Quick setups: Gentle Push (low mass, small force, low friction), Heavy Sled (high mass, same force), High Friction (large μ to show static friction holding sled until threshold).'
          },
          {
            action: 'Play/Pause Button',
            description: 'Start or pause the physics simulation. When paused, you can adjust controls, but the sled won\'t move.'
          },
          {
            action: 'Reset Button',
            description: 'Resets the simulation: sled returns to center with zero velocity. Useful for starting fresh experiments.'
          }
        ]
      }}
      onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-6 flex flex-wrap gap-2"
      >
        {module.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
          >
            {tag}
          </span>
        ))}
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
      >
        <ForceAccelerationSimulation />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <Accordion title="Newton's Second Law">
          <div className="space-y-4">
            <p>
              Newton's Second Law is often written as <strong>F = ma</strong> (Force equals Mass times Acceleration).
            </p>
            <p>
              It means that the acceleration of an object depends on two things: the net force acting upon it and the mass of the object.
              More force means more acceleration. More mass means less acceleration.
            </p>
            <p>
              Crucially, it tells us that force causes <em>change</em> in motion, not motion itself. You don't need force to keep moving (that's inertia), only to speed up, slow down, or turn.
            </p>
          </div>
        </Accordion>

        <Accordion title="The Habit Metaphor">
          <div className="space-y-4">
            <p>
              If we view mass as "resistance to change", it maps beautifully to habit and identity.
            </p>
            <p>
              Someone with a "massive" established identity or strong habits is hard to move. It takes a huge force (a life crisis, a major intervention) to change their trajectory even a little bit.
            </p>
            <p>
              Someone with "low mass" (perhaps younger, or in a transitional phase) can be sent spinning by a relatively small push.
            </p>
            <p>
              Friction represents the environment's drag – the daily grind that slows down any change you try to make. To change your path, your "force" (willpower, systems, support) must exceed the "friction" of your environment.
            </p>
          </div>
        </Accordion>
      </motion.section>
    </LearnModuleLayout>
    );
  }

  // Custom layout for Action & Reaction module
  if (isActionReaction) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Action & Reaction – Emotional Feedback",
          instructions: [
            'Two objects floating freely in space.',
            'Whenever you push or pull, the force exists as a pair: force on A, equal and opposite force on B.',
            'The forces are identical in size, but the responses (accelerations, speeds) differ with mass.',
            'The centre of mass of the pair stays fixed when only internal forces act, showing that the system as a whole keeps its balance.',
            '',
            'How to interact:',
            '1. The Mirror: Set Mass A and Mass B to be equal. Choose Push, hold the force button. Watch the force arrows: one left, one right, perfectly matched. See how both astronauts drift away at the same speed in opposite directions.',
            '2. The Wall: Set Target type to Wall (or just max out Mass B). Hold Push. The force arrows are still equal and opposite. But the wall barely moves; its acceleration is almost zero. You fly backwards. This is "pushing off a wall" in space.',
            '3. The Recoil: Set Mass A to very small, Mass B to large (but not infinite). Push again. The force pair hasn\'t changed. Yet you shoot backwards much faster than the target moves. This is why small bodies recoil more violently.',
            '4. The Rope (Pull mode): Switch to Pull mode. Now when you pull, the same law applies: you try to pull them towards you, you also get pulled towards them. There is no one-sided tug.',
            '5. Follow the centre of mass: Watch the centre-of-mass marker on the track. As long as only internal pushes/pulls happen, that marker stays in place. The system reshuffles itself around that shared point.',
            '6. Reset and explore: Use Reset to bring both back to the starting positions. Experiment with different combinations of mass and force. Look for the pattern: the forces are always equal; the motion is not.',
            '',
            'Emotional Feedback:',
            'Every interaction is mutual. You can\'t "push" on someone (verbally, emotionally, structurally) without some recoil in you.',
            'Sometimes you are the "light astronaut" pushing a "heavy wall": you move a lot, they barely seem to shift. The force pair still exists; the difference is what can move.',
            'Sometimes you are both similar mass: you push, they push back. Both trajectories change noticeably.',
            'The centre of mass is like the shared emotional field: you don\'t leave it when you act. The system as a whole keeps a kind of balance, even if one side seems to move more.',
            'To influence a system cleanly, you have to recognise: you are part of what you\'re pushing. The "reaction" might show up as guilt, tension, relief, resistance, or closeness in you, not just in them.'
          ],
          interactions: [
            {
              action: 'Mass A (Player) Slider',
              description: 'Adjust the player\'s mass from 1 to 10 kg. Lower mass means you\'ll move more when forces are applied. Higher mass means you\'ll move less.'
            },
            {
              action: 'Mass B (Target) Slider',
              description: 'Adjust the target\'s mass from 1 to 100 kg (or Wall for effectively infinite mass). When set to Wall, the target becomes immovable, demonstrating the extreme case of pushing off a massive object.'
            },
            {
              action: 'Force Magnitude Slider',
              description: 'Control the strength of the push or pull force (0-100 N). Higher forces create larger accelerations, but the force pair always remains equal and opposite.'
            },
            {
              action: 'Interaction Mode Toggle',
              description: 'Switch between Push (repulsion - entities push apart) and Pull (tension - entities pull together). Both modes demonstrate the same action-reaction principle.'
            },
            {
              action: 'Target Type Selector',
              description: 'Choose the target: Astronaut (similar to player), Crate (bulkier object), or Wall (effectively infinite mass). Each demonstrates different consequences of the same force pair.'
            },
            {
              action: 'Push/Pull Button (Hold)',
              description: 'Press and hold to apply the force. Release to stop. The force arrows appear only while holding, showing the action-reaction pair in real-time.'
            },
            {
              action: 'Play/Pause Button',
              description: 'Start or pause the physics simulation. When paused, you can adjust controls, but entities won\'t move.'
            },
            {
              action: 'Reset Button',
              description: 'Resets the simulation: both entities return to starting positions with zero velocity. Useful for starting fresh experiments.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ActionReactionSimulation />
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Natural Selection module
  if (isNaturalSelection) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Natural Selection – Identity as Strategy",
          instructions: [
            'Each dot is an individual with a single strategy trait between 0 and 1.',
            'The background curve is the environment\'s preference: high parts of the curve = strategies that gain more "success".',
            'Each generation: strategies that fit the curve better leave more copies.',
            'Each copy is slightly mutated, so new versions keep appearing.',
            'Over time, the shape of the population bends to match the environment: peaks in the curve become clusters of traits.',
            'When you change the environment, the cluster slowly moves.',
            '',
            'How to interact:',
            '1. Start from chaos: Reset the simulation. At first, traits are spread roughly randomly along the line. The population has no strong "identity" yet.',
            '2. Choose an environment: Pick a landscape - Single niche (one peak), Two niches (two peaks), Edge seekers (favours extremes), or Centre-avoiding (middling traits do worst). Watch the fitness curve behind the dots.',
            '3. Let selection work: Press Play and watch a few generations pass. You\'ll see the cloud of dots start to clump around the high parts of the curve. The histogram bars reinforce this: they grow where the environment is kind.',
            '4. Move the peak: In the single-niche environment, slide the Environment peak left and right. The landscape moves. The population can\'t jump instantly. Over many generations, the cluster of traits chases the moving peak.',
            '5. Tune mutation: Increase Mutation rate - at very low values, the population locks into a tight cluster; it adapts slowly to change. At moderate values, it can track changes while staying coherent. At very high values, the cluster smears out: inheritance gets noisy, and selection has less to hold onto.',
            '6. Adjust selection strength: Turn Selection strength down - the curve still exists, but it barely matters. The population drifts more randomly. Turn it up - the curve becomes a strong pull. Unfit traits vanish quickly; the population hugs the peaks.',
            '7. Pause & inspect: Pause the sim and hover visually over the clusters. Ask: what sort of strategies are currently alive here? Which strategies disappeared? How does that match the environment they face?',
            '',
            'Identity as Strategy:',
            'In this model, identity is not a fixed essence. It\'s a strategy profile: a way of meeting the world. A bias towards caution, boldness, conformity, exploration, etc. (collapsed into a single axis here).',
            'The environment is not "good" or "bad"—it is selective: certain ways of being get rewarded. Others are quietly starved of opportunity.',
            'Over time: strategies that "work" in that environment become more common. The system looks like it chooses an identity. In reality, it\'s just differential survival of strategies.',
            'Change the environment and the "best" identity shifts: a trait that was once adaptive can become a liability. A fringe trait can become central when conditions flip.',
            'For a person or culture, this offers a lens: some parts of what we call "who I am" are really tuned responses to our surroundings. Some parts are mutations that never scaled. Identity, seen this way, is less a noun and more a running strategy in negotiation with context.'
          ],
          interactions: [
            {
              action: 'Environment Type buttons',
              description: 'Choose from four landscape types: Single niche (one peak - there is one "sweet spot"), Two niches (two peaks - two strategies can thrive), Edge seekers (the environment favours extremes), or Centre-avoiding (middling traits do worst). Watch the fitness curve behind the dots change as you switch landscapes.'
            },
            {
              action: 'Mutation rate slider',
              description: 'Controls how much traits change when passed to offspring (0.005 - 0.08). At very low values, the population locks into a tight cluster and adapts slowly to change. At moderate values, it can track changes while staying coherent. At very high values, the cluster smears out: inheritance gets noisy, and selection has less to hold onto.'
            },
            {
              action: 'Selection strength slider',
              description: 'Controls how strongly fitness differences matter (0 - 2). At 0, the curve still exists but barely matters - the population drifts more randomly. At higher values, the curve becomes a strong pull - unfit traits vanish quickly and the population hugs the peaks.'
            },
            {
              action: 'Environment peak slider',
              description: 'Only visible for Single niche landscape. Controls the position of the fitness peak (0 - 1). When you move this slider, the landscape shifts. The population can\'t jump instantly - over many generations, the cluster of traits chases the moving peak.'
            },
            {
              action: 'Population size slider',
              description: 'Controls the number of individuals in the population (50 - 300). Larger populations show smoother distributions but may run slower. Smaller populations show more variation and drift.'
            },
            {
              action: 'Play/Pause button',
              description: 'Starts or pauses the simulation. When running, the population evolves generation by generation. When paused, you can adjust controls and use the Step button.'
            },
            {
              action: 'Step button',
              description: 'Only works when paused. Advances the simulation by exactly one generation. Useful for studying how the population evolves step by step.'
            },
            {
              action: 'Reset button',
              description: 'Resets the simulation: generation counter goes to 0, population is rebuilt with random traits, and histogram is recalculated. Useful for starting fresh experiments.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <NaturalSelectionSimulation />
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Game of Life module
  if (isGameOfLife) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Conway's Game of Life Simulation",
          instructions: [
            'Simulates a zero-player universe where the entire future is determined by the starting pattern.',
            'Shows how four simple local rules create still lifes, oscillators, moving "ships", and endless chaos.',
            'Uses colour and age to reveal which structures are stable elders and which are newborn sparks.',
            'Lets you explore how richness of behaviour sits on the knife-edge between overcrowding and emptiness.',
            'Gives a hands-on feel for emergence: complex stories arising from simple rules.',
            '',
            'Things to look for:',
            '• Gliders: Small patterns that move diagonally across the grid',
            '• Oscillators: Patterns that repeat in cycles (like the Pulsar)',
            '• Stable islands: Still lifes that remain unchanged',
            '• Chaotic seas: Regions of constant activity and change'
          ],
          interactions: [
            {
              action: 'Play/Pause button',
              description: 'Starts or pauses the simulation. When running, the grid evolves generation by generation according to Conway\'s rules.'
            },
            {
              action: 'Step button',
              description: 'When paused, advances the simulation by exactly one generation. Useful for studying how patterns evolve step by step.'
            },
            {
              action: 'Speed slider',
              description: 'Controls how many generations per second the simulation runs (1-60 gen/s). Higher speeds show evolution faster, while slower speeds help you see the details.'
            },
            {
              action: 'Visual Mode toggle',
              description: 'Standard: White alive cells with grey ghost trails. Biological: Age-based colour gradients where newborns are bright white/cyan and old cells fade to deep purple/blue.'
            },
            {
              action: 'Draw Mode toggle',
              description: 'Pen: Click and drag on the canvas to create living cells. Erase: Click and drag to remove cells. Great for creating custom starting patterns.'
            },
            {
              action: 'Presets',
              description: 'Random: Fills the grid with random cells (~35% density). Glider: Places a 5-cell pattern that moves diagonally. Pulsar: A period-3 oscillator. Glider Gun: The famous Gosper glider gun that continuously produces gliders.'
            },
            {
              action: 'Clear button',
              description: 'Resets the entire grid to all dead cells, sets generation to 0, and clears all age and fade data.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <GameOfLifeSimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="The four rules of life">
            <div className="space-y-4">
              <p>
                Conway's Game of Life follows four simple rules that govern each cell's fate based on its eight neighbours:
              </p>
              <ul className="space-y-2 list-disc list-inside text-ink-secondary dark:text-ink-muted">
                <li><strong>Too few neighbours</strong> (less than 2): A living cell dies from isolation.</li>
                <li><strong>Just enough</strong> (2 or 3): A living cell survives to the next generation.</li>
                <li><strong>Too many</strong> (more than 3): A living cell dies from overcrowding.</li>
                <li><strong>Exactly three neighbours</strong>: A dead cell comes to life through reproduction.</li>
              </ul>
              <p>
                These rules create a delicate balance at the <strong>edge of chaos</strong>. Too sparse, and everything dies out. Too dense, and everything collapses. But at just the right density, patterns can persist, move, and evolve in endlessly surprising ways.
              </p>
            </div>
          </Accordion>

          <Accordion title="Is it alive?">
            <div className="space-y-4">
              <p>
                Game of Life patterns exhibit behaviours that feel remarkably lifelike:
              </p>
              <ul className="space-y-2 list-disc list-inside text-ink-secondary dark:text-ink-muted">
                <li>They <strong>consume space and potential</strong> like resources, growing or shrinking based on their environment.</li>
                <li>They <strong>reproduce</strong> – gliders create copies of themselves as they move, and breeders spawn new patterns continuously.</li>
                <li>They <strong>evolve</strong> complex structures from simple seeds, with some patterns stabilising while others remain in constant flux.</li>
              </ul>
              <p>
                Remarkably, Game of Life is <strong>Turing complete</strong>: in principle, you can build a computer inside this grid. Patterns can perform calculations, store data, and execute programs. This raises profound questions: when does pattern become "behaviour", and when does behaviour feel like a self?
              </p>
              <p>
                The simulation invites you to explore this boundary. Watch a glider move across the grid – is it an organism? A wave? Or just pixels following rules? The answer might depend on how you look at it.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Chaos Theory module
  if (isChaosTheory) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Chaos Theory – Sensitive Dependence",
          instructions: [
            'The Lorenz Attractor is a system of three simple equations that describes fluid motion (like the atmosphere).',
            'It is deterministic: if you know the exact starting point, you know the future forever.',
            'But it is chaotic: if you change the starting point by a tiny amount, the future changes completely.',
            'The "Butterfly Effect" is this sensitivity: a butterfly flapping its wings (small change) can cause a tornado weeks later (large difference).',
            '',
            'How to interact:',
            '1. Watch the path: The point traces a shape in 3D space. It never repeats, but it stays within a "strange attractor" shape (the butterfly wings).',
            '2. Launch a shadow: Press "Launch Shadow". A second point (red) starts extremely close to the first (blue).',
            '3. Observe divergence: At first, they move together. You can\'t tell them apart. Then, they split. Soon, they are on opposite sides of the attractor.',
            '4. Change the speed: Use the slider to speed up time. See how quickly the divergence happens.',
            '5. Rotate the view: Drag to rotate the 3D plot. See the complex structure of the attractor.',
            '',
            'The Lesson:',
            'Prediction has a horizon. Even with perfect laws of physics, we cannot predict the long-term future because we cannot measure the present with infinite precision.'
          ],
          interactions: [
            {
              action: 'Launch Shadow',
              description: 'Spawns a second particle 0.001 units away from the main one. Watch them drift apart.'
            },
            {
              action: 'Speed Slider',
              description: 'Controls the simulation speed.'
            },
            {
              action: 'Rotate View',
              description: 'Click and drag to rotate the 3D visualization.'
            },
            {
              action: 'Reset',
              description: 'Restarts the simulation from the initial state.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ChaosTheorySimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="The Butterfly Effect">
            <div className="space-y-4">
              <p>
                In 1961, Edward Lorenz was running a weather simulation. He wanted to see a sequence again, so he entered the numbers from a printout.
              </p>
              <p>
                The printout showed numbers to 3 decimal places (0.506), but the computer worked with 6 (0.506127). Lorenz assumed the difference was negligible.
              </p>
              <p>
                It wasn't. The tiny error grew exponentially, and the new weather pattern was completely different from the original. He realised that for some systems, <strong>approximate knowledge of the present does not lead to approximate prediction of the future.</strong>
              </p>
            </div>
          </Accordion>

          <Accordion title="The Strange Attractor">
            <div className="space-y-4">
              <p>
                The shape you see is called a "Strange Attractor".
              </p>
              <p>
                It's a fractal structure. The system is bound to it—it will never leave this shape—but within the shape, its path is infinite and non-repeating.
              </p>
              <p>
                It represents order within chaos. We can't predict the exact position of the point, but we can predict the shape of the attractor it lives on.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Self-Organised Criticality module
  if (isSelfOrganisedCriticality) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Self-Organised Criticality Simulation",
          instructions: [
            'Represents complex systems (tectonic plates, forests, markets, neural tissue) as a grid of slowly building stress.',
            'Shows how the system self-organises to a critical state – no fine-tuning, just add grains.',
            'Demonstrates that the same rule produces both tiny flickers and system-spanning avalanches.',
            'Reveals a power-law pattern in avalanche sizes: many small releases, few rare, massive collapses.',
            'Gives intuition for why "disasters" are a feature of critical systems, not freak anomalies.'
          ],
          interactions: [
            {
              action: 'Play/Pause button',
              description: 'Starts or pauses automatic grain dropping. When playing, grains are added at the set drop speed.'
            },
            {
              action: 'Drop Grain button',
              description: 'Manually adds one grain to the grid and resolves any resulting avalanche. Works even when paused.'
            },
            {
              action: 'Click on canvas',
              description: 'Click anywhere on the grid to drop a grain at that specific location. Useful for targeted exploration.'
            },
            {
              action: 'Drop Speed slider',
              description: 'Controls how many grains per second are automatically added (0-50). Set to 0 for manual-only mode.'
            },
            {
              action: 'Drop Mode toggle',
              description: 'Center: Grains always added to the center cell. Random: Grains added to random cells. Center mode helps build up stress in one region.'
            },
            {
              action: 'View Mode toggle',
              description: 'Height Map: Shows cell heights with color coding (black=0, blue=1-2, cyan=3, yellow/green=4+, white=unstable). Avalanche View: Highlights only cells that toppled in the current frame (bright green), others dim.'
            },
            {
              action: 'Reset button',
              description: 'Clears the entire grid (all cells to 0), resets avalanche history, and resets the drop counter.'
            },
            {
              action: 'Avalanche Analytics Panel',
              description: 'Shows the last avalanche size, total number of drops, and a mini graph of avalanche sizes over time. Notice the power-law pattern: many small events, few large ones.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <SelfOrganisedCriticalitySimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="What is a critical state?">
            <div className="space-y-4">
              <p>
                A critical state is where the system is balanced between two extremes:
              </p>
              <ul className="space-y-2 list-disc list-inside text-ink-secondary dark:text-ink-muted">
                <li>
                  <strong>Too ordered:</strong> Nothing interesting happens. The system is too stable, too predictable.
                </li>
                <li>
                  <strong>Too disordered:</strong> Everything collapses immediately. The system can't maintain any structure.
                </li>
              </ul>
              <p>
                In Self-Organised Criticality, the system <strong>drifts</strong> to this critical state by itself under slow driving and fast relaxation. You don't need to fine-tune anything – just add grains slowly, and the system naturally finds the edge where small triggers can cause large effects.
              </p>
              <p>
                This is remarkable because it means criticality isn't a rare, carefully tuned condition. It's what happens naturally when you have a system that builds up stress slowly and releases it quickly.
              </p>
            </div>
          </Accordion>

          <Accordion title="Why disasters are unavoidable">
            <div className="space-y-4">
              <p>
                In a critical system, big events don't need big triggers. A single grain, trade, spark, or tremor can cascade into a system-spanning avalanche.
              </p>
              <p>
                This isn't a bug – it's a feature of how these systems work. The same mechanism that allows tiny releases also allows massive ones. The system is poised at the edge, where the difference between a small event and a large one isn't in the trigger, but in how the cascade unfolds.
              </p>
              <p>
                This principle appears across nature and human systems:
              </p>
              <ul className="space-y-2 list-disc list-inside text-ink-secondary dark:text-ink-muted">
                <li>
                  <strong>Earthquakes:</strong> Tectonic plates build stress slowly. A small slip can trigger a massive quake.
                </li>
                <li>
                  <strong>Market crashes:</strong> Markets accumulate imbalances. A single trade can cascade into a crash.
                </li>
                <li>
                  <strong>Forest fires:</strong> Forests accumulate fuel. A small spark can become a wildfire.
                </li>
                <li>
                  <strong>Brain avalanches:</strong> Neural networks build up activity. A small trigger can cascade into a large-scale neural event.
                </li>
              </ul>
              <p>
                Different materials, different scales, but the same underlying logic: systems that build stress slowly and release it quickly naturally organize at the edge of chaos, where disasters are not anomalies but inevitable features of the system's structure.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Reaction-Diffusion module
  if (isReactionDiffusion) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Reaction–Diffusion Simulation",
          instructions: [
            'Explains biological textures: how zebra stripes, leopard spots, and seashell patterns emerge from simple chemical rules.',
            'Demonstrates symmetry breaking – how uniform starting conditions plus small disturbances blossom into distinct patterns.',
            'Shows Turing patterns – structure emerging purely from instability in a reaction–diffusion system.',
            'Reveals how changing a few parameters (feed & kill rates, diffusion balance) completely rewires what kind of "skin" the system grows.',
            'Connects the math of movement and hunger to the patterns of life itself.'
          ],
          interactions: [
            {
              action: 'Paint Chemical B',
              description: 'Click and drag on the canvas to inject Chemical B (V) into the field. This creates local disturbances that can trigger pattern formation.'
            },
            {
              action: 'Play/Pause button',
              description: 'Start or pause the simulation. When playing, the pattern evolves according to the Gray–Scott equations.'
            },
            {
              action: 'Preset buttons',
              description: 'Select from five presets: Coral, Fingerprints, Mitosis, Black Hole, or Chaotic. Each preset sets specific Du, Dv, F, and K parameters that produce characteristic patterns.'
            },
            {
              action: 'View mode toggle',
              description: 'Switch between four views: U (grayscale, shows the U field), V (blue–magenta, shows the V field), Pattern (combined view showing the emergent pattern), and Edges (highlights spatial gradients).'
            },
            {
              action: 'Speed slider',
              description: 'Controls how many simulation steps run per frame (1–10x). Higher speeds show pattern evolution faster, but slower speeds help you see the details of how patterns form.'
            },
            {
              action: 'Perturb button',
              description: 'Injects small random patches of V into the field without resetting. Watch how local disturbances ripple outward and interact with existing patterns.'
            },
            {
              action: 'Reset button',
              description: 'Resets the grid to the current preset\'s initial conditions (U=1, V=0 with a center disturbance).'
            },
            {
              action: 'Advanced Parameters (F and K)',
              description: 'Fine-tune the feed rate (F) and kill rate (K) around a preset\'s values. Small changes can dramatically alter the pattern type. F controls how quickly U feeds into the system, while K controls how quickly V is removed.'
            }
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <ReactionDiffusionSimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="How the Leopard Got Its Spots">
            <div className="space-y-4">
              <p>
                In 1952, Alan Turing asked: how do biological patterns form? How do leopards get their spots, zebras their stripes, seashells their spirals?
              </p>
              <p>
                He proposed that two chemicals reacting and diffusing could generate these patterns. One chemical (the "activator") promotes its own production, while the other (the "inhibitor") suppresses it. If the inhibitor diffuses faster, it creates zones where the activator is suppressed, leading to spatial patterns.
              </p>
              <p>
                The key is <strong>symmetry breaking</strong>: a uniform state becomes unstable under the right reaction–diffusion rules. Tiny fluctuations get amplified instead of erased. Different wave numbers grow at different rates, and the fastest-growing mode sets the characteristic spot or stripe size.
              </p>
              <p>
                The pattern isn't pre-programmed – it emerges from the interaction between local chemistry and global geometry. The same principles appear in real biological systems, from animal coats to the arrangement of leaves on a stem.
              </p>
            </div>
          </Accordion>

          <Accordion title="The Math of Becoming">
            <div className="space-y-4">
              <p>
                The Gray–Scott model demonstrates Turing's idea beautifully. Two fields (U and V) interact: U feeds V, V consumes U, and both diffuse across space.
              </p>
              <p>
                The magic happens through <strong>short-range activation</strong> and <strong>long-range inhibition</strong>. The activator (V) promotes its own production locally, while the inhibitor (U) diffuses faster and suppresses activation at a distance.
              </p>
              <p>
                This creates a feedback loop: where V is high, it stays high (activation). But V also consumes U, and U diffuses away faster, creating zones where V is suppressed (inhibition). The balance between these forces determines whether you get spots, stripes, labyrinths, or chaos.
              </p>
              <p>
                The pattern's scale emerges from the balance between reaction rates (F and K) and diffusion speeds (Du and Dv). Change these parameters slightly, and the entire pattern morphs – revealing how form emerges from the math of movement and hunger.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Mutation & Variation module
  if (isMutationVariation) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Mutation & Variation",
          instructions: [
            "Each creature comes from a tiny code: a handful of numbers called a genome.",
            "The visible shape – the spikes, the size, the colour – is the phenotype.",
            "When you nudge the genome, the creature changes.",
            "When you introduce small random changes (mutations), you don't get 'noise'; you get new possibilities.",
            "This is the raw material that Natural Selection works on in the previous module."
          ],
          interactions: [
            {
              action: "Edit the genes directly",
              description: "Use the sliders to change size, spike count, spike length, wobble, and colour. Notice how each gene affects one dimension of the creature's appearance."
            },
            {
              action: "Apply small mutations",
              description: "Press 'Small mutation'. The new creature is similar, but not identical. Press it a few times in a row and watch a 'family' line drift away from the starting form."
            },
            {
              action: "Roll entirely new genomes",
              description: "Press 'Randomise all'. This ignores the current code and jumps somewhere else in the space of possible creatures."
            },
            {
              action: "Build a gallery of variations",
              description: "Whenever you see a form you like, hit 'Save to history'. Compare siblings and cousins: some are only a tiny change away, others are far in 'genetic distance'."
            },
            {
              action: "Reset the baseline",
              description: "Use 'Reset' to go back to a simple default creature. From there, explore again with different patterns of mutation."
            }
          ],
          conceptual: [
            "Real DNA is just a long sequence of simple chemicals.",
            "A mutation is often one small change in that sequence. Most of the time, the change is small in effect. Occasionally, it is profound.",
            "Over enough time, these small shifts create families, breeds, species, and open new behaviours and bodies that weren't on the board before.",
            "The same lens can be turned on personal identity: Tiny changes in habits, environment, or perspective are like mutations in your code.",
            "Most days, the change is barely visible. Over years, those small differences add up to entirely new paths."
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <MutationVariationSimulation />
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Fitness Landscapes module
  const isFitnessLandscapes = module.id === 'fitness-landscapes-becoming-through-tension';
  if (isFitnessLandscapes) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Fitness Landscapes",
          instructions: [
            "The wireframe terrain is a fitness landscape: Horizontal axes are trait combinations; Height is how 'good' that combination is.",
            "Each dot is an organism or strategy currently living somewhere on that landscape.",
            "The simple hill-climber rule: Try a small random step (mutation). If it lands higher, keep it; if lower, reject it.",
            "Over time, the population climbs uphill blindly, collects on local peaks, and can get trapped even if a taller mountain exists elsewhere.",
            "When the terrain itself moves (Shift Landscape), the population has to adapt or fall."
          ],
          interactions: [
            {
              action: "Watch the climb",
              description: "Start with low ruggedness and moderate mutation size. Press Play. The dots spread out, then rush towards the single main peak and cluster there."
            },
            {
              action: "Create traps",
              description: "Increase Ruggedness. Press Reset Population. Now the terrain has many peaks and valleys. The dots split into tribes on different hills."
            },
            {
              action: "Bridge the gap with mutation",
              description: "Increase Mutation Size. Mutations now jump further. Some agents manage to leap over small valleys to reach higher peaks."
            },
            {
              action: "Change the world beneath them",
              description: "Activate Shift Landscape. The hills and valleys slowly move. Peaks can sink; valleys can rise. The population is forced to move."
            },
            {
              action: "Pause and inspect",
              description: "Pause at any moment. Which peaks are occupied? Are some agents stranded on lower hills?"
            }
          ],
          conceptual: [
            "The landscape is the structure of the world: What your environment rewards or punishes.",
            "Each agent is a way of being: Its coordinates encode how it is configured right now. Its height is how much that configuration works here.",
            "Tension lives in the slope: On a slope, there is a strong pull to move 'uphill'. On a flat plateau, there is little felt tension.",
            "Local peaks feel like perfection: From the agent's point of view, every small step makes things worse. To move to a higher mountain, you'd have to go downhill first.",
            "Mutation size and environmental change matter: Small steps refine you. Bigger steps sometimes let you cross valleys. When the landscape shifts, the old peak might vanish."
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted border border-ink-muted/20 dark:border-paper-light/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <FitnessLandscapeSimulation />
        </motion.section>

        <div className="space-y-4">
          <Accordion title="Sewall Wright’s Adaptive Map">
            <div className="space-y-4">
              <p>
                In classical population genetics, Sewall Wright imagined evolution moving across a “surface” where height represents how well a population is doing.
              </p>
              <p>
                On this adaptive landscape:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The horizontal directions are <strong>trait combinations</strong> – beak length and wing span, risk-taking and caution, any pair of choices that shape how a life plays out.</li>
                <li>The vertical direction is <strong>fitness</strong> – the probability of surviving, reproducing, or “succeeding” according to whatever the environment demands.</li>
              </ul>
              <p>
                A population doesn’t see the map. It only feels whether a tiny change makes things better or worse. Mutations are like blind steps. Natural selection keeps the moves that help and discards the ones that hurt.
              </p>
              <p>
                Over time, this local rule – <em>keep the moves that help, discard the moves that hurt</em> – draws whole species up the nearest hills. The landscape doesn’t move to meet them. They have to climb, stumble, and sometimes fall to find the places where life is easiest to sustain.
              </p>
              <p className="italic border-l-2 border-ink-muted/30 pl-4">
                “Your history is the story of which hills you climbed and which valleys you refused to cross.”
              </p>
            </div>
          </Accordion>

          <Accordion title="The Trap of Local Peaks">
            <div className="space-y-4">
              <p>
                On a fitness landscape, <strong>local peaks</strong> are points where every small move makes things worse, even though the peak itself isn’t the highest place on the map.
              </p>
              <p>
                From the inside, a local peak feels like “this is as good as it gets”:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Every small experiment looks costly.</li>
                <li>The landscape right around you slopes down in every direction.</li>
                <li>The only way to reach a higher mountain is to <strong>go downhill first</strong> – to accept a period of being less adapted.</li>
              </ul>
              <p>
                This is why evolution often gets stuck:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Species can become exquisitely tuned to a niche that is only “good enough”.</li>
                <li>Crossing the valley towards a better niche would mean being temporarily worse at <em>everything</em>.</li>
                <li>Without enough mutation, diversity, or environmental shock, those vaults between peaks simply never happen.</li>
              </ul>
              <p>
                The same tension shows up in human life:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>A career, role, or identity can be a local peak – highly adapted to a narrow context.</li>
                <li>Learning something new, changing direction, or softening an old defence can feel like “losing ground”.</li>
                <li>Yet the only way to discover a higher peak – a better-fitting way of living – is often to <strong>leave the comfort of the current one</strong>.</li>
              </ul>
              <p>
                Fitness landscapes make this brutally clear:
              </p>
              <p className="font-medium">
                Stability is not the same as optimal.<br />
                And sometimes the path to “better” begins with a deliberate step into “worse”.
              </p>
            </div>
          </Accordion>
        </div>
      </LearnModuleLayout>
    );
  }

  // Custom layout for Entropy module
  if (isEntropy) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Entropy – Drift Toward Disorder",
          instructions: [
            'The box starts in a low-entropy state: all hot/fast red particles on one side, all cold/slow blue particles on the other. This is extremely ordered and statistically rare.',
            'When the partition is removed, particles move randomly, bouncing off the walls. Reds and blues wander into each other\'s half, and the pattern blurs into a mixed state.',
            'The "entropy" graph is a simple mixing score. At the start, there is almost no mixing. As red and blue cross the centre line, the score rises. Eventually it reaches a noisy plateau – equilibrium – where the system is as disordered as it\'s likely to get.',
            'Nothing is "pushing" the system towards disorder. No force of chaos. Just probability: there are far more mixed arrangements than separated ones, so the system almost always wanders into a mixed state and stays there.'
          ],
          interactions: [
            {
              action: 'Open the gate',
              description: 'Press Remove partition. Watch red and blue particles spill into each other\'s side. The crisp boundary is gone within seconds.'
            },
            {
              action: 'Watch the graph rise',
              description: 'Focus on the entropy line. It climbs quickly at first as the first particles cross the boundary. Then it slows and flattens into a noisy band – the box is well mixed.'
            },
            {
              action: 'Play Maxwell\'s Demon',
              description: 'Right after you remove the partition, press Reverse time. For a moment, the motion rewinds: particles head back roughly towards where they came from. If you wait too long before pressing it, the exact correlations are lost in tiny numerical errors and chaotic motion. The system refuses to "unscramble".'
            },
            {
              action: 'Reset to restore order',
              description: 'Press Reset. You\'re manually doing what the physics will not: forcing the system back into a low-entropy, separated state. This is the hidden cost of order – it always needs external work.'
            },
            {
              action: 'Experiment with speed',
              description: 'Use the Speed slider. Faster speed just makes mixing happen more quickly. It doesn\'t change the destination: disorder.'
            }
          ],
          conceptual: [
            'Entropy is the tendency for structure to dissolve when left alone: sharp boundaries blur, differences even out, information about the past arrangement is lost into countless microscopic details.',
            'In life: plans lose definition without attention, routines fray if not reinforced, communities and relationships drift unless tended.',
            'It isn\'t malice; it\'s mathematics: there are far more ways for things to be loosely organised than precisely arranged. Order is a narrow target; disorder is an open field.',
            'Every act of maintenance, care, or discipline is like re-inserting the partition: you spend energy to restore or preserve a low-entropy state. The moment you stop, the drift resumes.'
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <EntropySimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="Microstates and Macrostates">
            <div className="space-y-4">
              <p>
                When you look at the box, you see a macrostate:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>"All reds on the left, all blues on the right."</li>
                <li>Or "Fully mixed."</li>
                <li>Or "Mostly mixed with a few patches."</li>
              </ul>
              <p>
                But under each macrostate there are enormous numbers of microstates:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The exact position and velocity of every particle.</li>
                <li>Every tiny detail of who is where, moving how.</li>
              </ul>
              <p>
                There is essentially one very special microstate where all red particles sit perfectly on the left, all blue particles perfectly on the right.
              </p>
              <p>
                There are astronomically many microstates where reds and blues are scattered all over.
              </p>
              <p>
                Entropy is a measure of how many microstates fit your macro description:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Low entropy: only a few configurations match ("all reds left").</li>
                <li>High entropy: almost any random arrangement qualifies ("pretty mixed").</li>
              </ul>
              <p>
                The box doesn't "prefer" disorder. It just wanders randomly, and almost every place it can wander to looks disordered.
              </p>
            </div>
          </Accordion>

          <Accordion title="Why Time Flows Forward">
            <div className="space-y-4">
              <p>
                The microscopic laws of motion are time-reversible:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>If you reversed every velocity exactly, the trajectories would run backwards.</li>
                <li>In principle, the box could un-mix. The reds could march back to the left, the blues to the right.</li>
              </ul>
              <p>
                But in practice:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Any tiny error – a rounding difference, a disturbance, a mis-aligned velocity – explodes over time in a many-particle system.</li>
                <li>Once the box is mixed, the precise correlations needed to reverse it are lost in an ocean of possibilities.</li>
              </ul>
              <p>
                So, at the human scale, we never see:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Smoke going back into the match.</li>
                <li>Coffee spontaneously separating itself back into hot and cold layers.</li>
                <li>A shattered glass reassembling on the floor.</li>
              </ul>
              <p>
                Time's arrow is the direction in which entropy almost always increases.
              </p>
              <p>
                The laws allow both directions. Probability gives one direction overwhelming weight. That direction is what we call "the future".
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
    );
  }

  // Free Energy module
  if (isFreeEnergy) {
    return (
      <LearnModuleLayout
        module={module}
        allModules={allModules}
        instructionDrawerProps={{
          isOpen: isInstructionDrawerOpen,
          onClose: () => setIsInstructionDrawerOpen(false),
          title: "Free Energy Simulation",
          instructions: [
            'The left well is deep and narrow: extremely low energy but with almost no room to move — low entropy.',
            'The right well is shallow but wide: higher energy but with far more possible microstates — high entropy.',
            'Free energy combines both: F = E - TS. At low temperature, the energy term dominates. At higher temperature, the entropy term becomes more important.',
            'When particles jump from the deep well into the wide one at high temperature, they are not "choosing higher energy"; they are minimising free energy, which balances energy with freedom.'
          ],
          interactions: [
            {
              action: 'Freeze the world',
              description: 'Set Temperature to zero. Watch every particle drain into the deep, narrow left well. In the absence of agitation, energy wins.'
            },
            {
              action: 'Add heat',
              description: 'Slowly increase Temperature. The deep well stops being "sticky". Particles begin to escape.'
            },
            {
              action: 'Watch the migration',
              description: 'As temperature rises, more particles accumulate in the wide well. There is more room there — more microstates — so entropy wins.'
            },
            {
              action: 'Find the tipping point',
              description: 'Adjust Temperature until the system hops back and forth between wells. You\'re watching the balance point between energy and entropy.'
            },
            {
              action: 'Cool suddenly',
              description: 'When many particles are in the wide basin, rapidly drop Temperature. They get stuck there — a demonstration of metastability. Systems can freeze in the "wrong" well if cooled too quickly.'
            }
          ],
          conceptual: [
            'The landscape represents all the states a system can inhabit.',
            'The deep well is comfort, routine, structure — low cost, but restrictive.',
            'The wide well is possibility, exploration, ambiguity — higher cost, but more freedom.',
            'Temperature is agitation, uncertainty, or creativity — the willingness to move.',
            'Free energy is the quiet negotiation between resting low (minimising cost) and spreading wide (maximising freedom).',
            'Systems — physical, biological, psychological — settle where effort is low enough and freedom is high enough. Not the lowest point. Not the widest point. The best compromise.'
          ]
        }}
        onOpenDrawer={() => setIsInstructionDrawerOpen(true)}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20"
        >
          <FreeEnergySimulation />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <Accordion title="Why nature sometimes chooses disorder">
            <div className="space-y-4">
              <p>
                Even though disorder has higher energy, it often has vastly more microstates than an ordered arrangement.
              </p>
              <p>
                As temperature rises:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>the entropy term -TS becomes large</li>
                <li>a shallow but extremely wide configuration becomes more favourable</li>
                <li>the deep well loses its dominance</li>
                <li>the system prefers "room to move" over "being tightly folded"</li>
              </ul>
              <p>
                This explains why:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>ice melts</li>
                <li>DNA strands unzip</li>
                <li>proteins unfold</li>
                <li>solid structures soften and rearrange</li>
              </ul>
              <p>
                At high temperature, entropy reshapes what counts as "stable."
              </p>
            </div>
          </Accordion>

          <Accordion title="Why proteins fold and unfold">
            <div className="space-y-4">
              <p>
                Proteins fold into a specific low-energy shape — their "deep well".
              </p>
              <p>
                But if you increase temperature:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>entropy grows</li>
                <li>the free energy balance flips</li>
                <li>the folded shape becomes unfavourable</li>
                <li>the protein denatures (escapes the well)</li>
              </ul>
              <p>
                When cooled again, it often can't find the original well, becoming trapped in a shallow misfolded basin — another example of metastability and path dependence.
              </p>
              <p>
                Free energy explains both biological order and biological fragility.
              </p>
            </div>
          </Accordion>
        </motion.section>
      </LearnModuleLayout>
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
              <p>Interactive simulation will be implemented here.</p>
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
