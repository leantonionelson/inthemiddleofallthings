import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { LearnModule } from '../../types';
import { loadLearnModules, fallbackModules } from '../../data/learnContent';

const LearnModulePage: React.FC = () => {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<LearnModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

