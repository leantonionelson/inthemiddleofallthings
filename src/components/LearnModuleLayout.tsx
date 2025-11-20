import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LearnModule } from '../types';
import LearnModuleNavigation from './LearnModuleNavigation';
import SimulationInstructionDrawer from './SimulationInstructionDrawer';

interface LearnModuleLayoutProps {
    module: LearnModule;
    allModules: LearnModule[];
    children: React.ReactNode;
    instructionDrawerProps: {
        isOpen: boolean;
        onClose: () => void;
        title: string;
        instructions: string[];
        interactions: Array<{ action: string; description: string }>;
        conceptual?: string[];
    };
    onOpenDrawer: () => void;
}

const LearnModuleLayout: React.FC<LearnModuleLayoutProps> = ({
    module,
    allModules,
    children,
    instructionDrawerProps,
    onOpenDrawer
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/learn');
    };

    const parts = module.title.split(' – ');
    const mainTitle = parts[0];
    const subtitle = parts[1] || '';

    return (
        <>
            {/* Content */}
            <div
                className="min-h-screen"
                style={{
                    height: 'calc(-84px + 100vh)',
                    paddingBottom: '0px'
                }}
            >
                <main className="pt-6 pb-10 px-4 sm:px-6">
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
                                    <h1 className="text-xl sm:text-2xl font-serif text-ink-primary dark:text-paper-light text-left">
                                        {mainTitle}
                                    </h1>
                                    {subtitle && (
                                        <p className="text-sm sm:text-base text-ink-secondary dark:text-ink-muted text-left">
                                            {subtitle}
                                        </p>
                                    )}
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
                                onClick={onOpenDrawer}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-sm text-ink-secondary dark:text-ink-muted transition-colors border border-ink-muted/20 dark:border-paper-light/20"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Info className="w-4 h-4" />
                                <span>How to play</span>
                            </motion.button>
                        </motion.div>

                        {/* Module Content (Simulation + Accordions) */}
                        {children}
                    </div>

                    {/* Bottom Navigation */}
                    <LearnModuleNavigation
                        currentModuleId={module.id}
                        allModules={allModules}
                    />
                </main>
            </div>

            {/* Instruction Drawer */}
            <SimulationInstructionDrawer
                {...instructionDrawerProps}
            />
        </>
    );
};

export default LearnModuleLayout;
