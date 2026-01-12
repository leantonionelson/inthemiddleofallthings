import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wind, Eye, Sparkles, Activity } from 'lucide-react';
import BreathworkDrawer from '../../components/BreathworkDrawer';
import EyeToolsDrawer from '../../components/EyeToolsDrawer';
import OpticalIllusionDrawer from '../../components/OpticalIllusionDrawer';

const DoPage: React.FC = () => {
  const [showBreathworkDrawer, setShowBreathworkDrawer] = useState(false);
  const [showEyeToolsDrawer, setShowEyeToolsDrawer] = useState(false);
  const [showOpticalIllusionDrawer, setShowOpticalIllusionDrawer] = useState(false);

  const tools = [
    {
      id: 'breathwork',
      title: 'Breathwork Tool',
      description: 'Guided breathing exercises for focus and calm',
      icon: Wind,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      onClick: () => setShowBreathworkDrawer(true)
    },
    {
      id: 'eye-tools',
      title: 'Eye Tools',
      description: 'Visual exercises for eye health and calm',
      icon: Eye,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      onClick: () => setShowEyeToolsDrawer(true)
    },
    {
      id: 'optical-illusions',
      title: 'Optical Illusions',
      description: 'Visual meditation through optical illusions',
      icon: Sparkles,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900',
      onClick: () => setShowOpticalIllusionDrawer(true)
    }
  ];

  return (
    <div className="relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 mt-4 text-left"
        >
          <div className="mb-4">
            <Activity className="w-8 h-8 text-ink-primary dark:text-paper-light mb-3" />
            <h1 className="text-3xl font-serif text-ink-primary dark:text-paper-light">
              Do
            </h1>
          </div>
          <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
            Interactive tools and practices for focus, calm, and well-being.
          </p>
        </motion.header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <motion.button
                key={tool.id}
                onClick={tool.onClick}
                className="relative w-full py-4 px-4 rounded-xl border border-ink-muted/30 dark:border-paper-light/20 hover:border-ink-muted/50 dark:hover:border-paper-light/40 transition-all text-left overflow-hidden group glass-subtle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${tool.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                      {tool.title}
                    </div>
                    <div className="text-sm text-ink-secondary dark:text-ink-muted">
                      {tool.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Drawers */}
      <BreathworkDrawer
        isOpen={showBreathworkDrawer}
        onClose={() => setShowBreathworkDrawer(false)}
      />

      <EyeToolsDrawer
        isOpen={showEyeToolsDrawer}
        onClose={() => setShowEyeToolsDrawer(false)}
      />

      <OpticalIllusionDrawer
        isOpen={showOpticalIllusionDrawer}
        onClose={() => setShowOpticalIllusionDrawer(false)}
      />
    </div>
  );
};

export default DoPage;

