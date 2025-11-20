import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Info } from 'lucide-react';
import { LearnModule, BookChapter, Meditation, Story } from '../../types';
import { loadLearnModules, fallbackModules, sectionOrder, sectionDescriptions } from '../../data/learnContent';
import ContentCarousel from '../../components/ContentCarousel';
import LearnIntroDrawer from '../../components/LearnIntroDrawer';
import SEO from '../../components/SEO';

const LearnPage: React.FC = () => {
  const [modules, setModules] = useState<LearnModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadModules = async () => {
      try {
        setIsLoading(true);
        const loadedModules = await loadLearnModules();
        setModules(loadedModules);
      } catch (error) {
        console.error('Error loading modules:', error);
        setModules(fallbackModules);
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, []);

  // Group modules by section
  const modulesBySection = useMemo(() => {
    const grouped: Record<string, LearnModule[]> = {};
    modules.forEach(module => {
      if (!grouped[module.section]) {
        grouped[module.section] = [];
      }
      grouped[module.section].push(module);
    });
    return grouped;
  }, [modules]);

  // Get ordered list of sections
  const orderedSections = useMemo(() => {
    return sectionOrder.filter(section => modulesBySection[section] && modulesBySection[section].length > 0);
  }, [modulesBySection]);

  const handleModuleClick = useCallback((item: LearnModule | BookChapter | Meditation | Story) => {
    // Type guard: ensure this is a LearnModule
    if (!('section' in item)) {
      return;
    }
    const module = item as LearnModule;
    navigate(`/learn/${module.id}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted">Loading learn content...</p>
        </div>
      </div>
    );
  }

  const learnDescription = 'Explore scientific concepts through interactive modules. Discover how physics, mathematics, and complexity theory illuminate the patterns of existence.';

  return (
    <>
      <SEO
        title="Learn: Scientific Explorations"
        description={learnDescription}
        keywords="science, physics, mathematics, complexity, learning, education, interactive modules"
        type="website"
      />
      {/* Scrollable Main Content Area - Stops short of navigation */}
      <div 
        className="relative z-10 overflow-y-auto overflow-x-hidden"
        style={{
          height: 'calc(100vh - 86px)',
        }}
      >
        <main 
          className="flex-1 flex flex-col p-6 pt-6 pb-10 max-w-7xl mx-auto w-full"
        >
          {/* Description */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 mt-4 text-left"
          >
            <div className="mb-4">
              <BookOpen className="w-8 h-8 text-ink-primary dark:text-paper-light mb-3" />
              <h1 className="text-3xl font-serif text-ink-primary dark:text-paper-light">
                Learn
              </h1>
            </div>
            <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
              {learnDescription}
            </p>
          </motion.header>

          {/* Modules by Section */}
          <section className="space-y-12 mt-8">
            {orderedSections.map((section, sectionIndex) => {
              const sectionModules = modulesBySection[section];
              const description = sectionDescriptions[section] || '';
              
              return (
                <motion.section
                  key={section}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + sectionIndex * 0.1 }}
                  className="w-full"
                >
                  {/* Section Header */}
                  <header className="mb-4 text-left">
                    <h2 className="text-xl font-serif text-ink-primary dark:text-paper-light mb-2">
                      {section}
                    </h2>
                    {description && (
                      <div className="flex items-start gap-3">
                        <p className="text-sm text-ink-secondary dark:text-ink-muted italic max-w-3xl leading-relaxed flex-1">
                          {description}
                        </p>
                        {/* Info Button for Section Description */}
                        <button
                          onClick={() => {
                            const sectionIndex = sectionOrder.indexOf(section);
                            setSelectedSectionIndex(sectionIndex);
                            setIsDrawerOpen(true);
                          }}
                          className="p-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 border border-ink-muted/20 dark:border-paper-light/20 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors flex-shrink-0"
                          aria-label={`View ${section} description`}
                        >
                          <Info className="w-5 h-5 text-ink-primary dark:text-paper-light" />
                        </button>
                      </div>
                    )}
                  </header>

                  {/* Modules Carousel for this Section */}
                  <ContentCarousel
                    items={sectionModules}
                    contentType="module"
                    onItemClick={handleModuleClick}
                    showReadStatus={true}
                  />
                </motion.section>
              );
            })}
          </section>
        </main>
      </div>

      {/* Learn Intro Drawer */}
      <LearnIntroDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        modules={modules}
        initialSectionIndex={selectedSectionIndex}
      />
    </>
  );
};

export default React.memo(LearnPage);
