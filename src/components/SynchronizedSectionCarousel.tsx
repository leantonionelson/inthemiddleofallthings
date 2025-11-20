import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LearnModule } from '../types';
import { sectionOrder } from '../data/learnContent';
import CarouselCard from './CarouselCard';
import { readingProgressService } from '../services/readingProgressService';

interface SynchronizedSectionCarouselProps {
    currentModuleId: string;
    allModules: LearnModule[];
}

const SynchronizedSectionCarousel: React.FC<SynchronizedSectionCarouselProps> = ({
    currentModuleId,
    allModules
}) => {
    const navigate = useNavigate();
    const moduleCarouselRef = useRef<HTMLDivElement>(null);
    const sectionCarouselRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [activeSection, setActiveSection] = useState<string>('');
    const [sectionScrollLeft, setSectionScrollLeft] = useState(0);
    const isUserScrollingSection = useRef(false);
    const isUserScrollingModule = useRef(false);

    // Group modules by section in the order defined by sectionOrder
    const modulesBySection = React.useMemo(() => {
        const grouped: Record<string, LearnModule[]> = {};
        allModules.forEach(module => {
            if (!grouped[module.section]) {
                grouped[module.section] = [];
            }
            grouped[module.section].push(module);
        });
        return grouped;
    }, [allModules]);

    // Get sections that have modules
    const availableSections = React.useMemo(() => {
        return sectionOrder.filter(section => modulesBySection[section]?.length > 0);
    }, [modulesBySection]);

    // Set initial active section based on current module
    useEffect(() => {
        const currentModule = allModules.find(m => m.id === currentModuleId);
        if (currentModule && currentModule.section) {
            setActiveSection(currentModule.section);
        } else if (availableSections.length > 0) {
            setActiveSection(availableSections[0]);
        }
    }, [currentModuleId, allModules, availableSections]);

    // Intersection Observer to track which section is visible
    useEffect(() => {
        const carousel = moduleCarouselRef.current;
        if (!carousel) return;

        const observerOptions = {
            root: carousel,
            rootMargin: '0px',
            threshold: 0.5 // Section is active when 50% of its first module is visible
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            // Only update if user is scrolling the module carousel, not programmatically
            if (isUserScrollingSection.current) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target.getAttribute('data-section');
                    if (section) {
                        setActiveSection(section);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe the first module of each section
        availableSections.forEach(section => {
            const firstModule = modulesBySection[section]?.[0];
            if (firstModule) {
                const moduleElement = carousel.querySelector(`[data-module-id="${firstModule.id}"]`);
                if (moduleElement) {
                    observer.observe(moduleElement);
                }
            }
        });

        return () => observer.disconnect();
    }, [availableSections, modulesBySection]);

    // Handle horizontal sticky positioning with transform
    useEffect(() => {
        const moduleCarousel = moduleCarouselRef.current;
        if (!moduleCarousel) return;

        const handleScroll = () => {
            const scrollLeft = moduleCarousel.scrollLeft;
            setSectionScrollLeft(scrollLeft);
        };

        moduleCarousel.addEventListener('scroll', handleScroll, { passive: true });
        return () => moduleCarousel.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll section carousel to keep active section visible
    useEffect(() => {
        if (!activeSection || isUserScrollingSection.current) return;

        const sectionCarousel = sectionCarouselRef.current;
        const activeSectionElement = sectionRefs.current.get(activeSection);

        if (sectionCarousel && activeSectionElement) {
            const carouselRect = sectionCarousel.getBoundingClientRect();
            const sectionRect = activeSectionElement.getBoundingClientRect();

            // Check if section is out of view
            if (sectionRect.left < carouselRect.left || sectionRect.right > carouselRect.right) {
                // Manually scroll the carousel container to prevent page-level scrolling
                const sectionOffsetLeft = activeSectionElement.offsetLeft;
                const scrollPadding = 32; // 2rem = 32px for balanced spacing
                
                sectionCarousel.scrollTo({
                    left: sectionOffsetLeft - scrollPadding,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeSection]);

    // Scroll to current module on initial load
    useEffect(() => {
        const moduleCarousel = moduleCarouselRef.current;
        if (!moduleCarousel || !currentModuleId) return;

        // Wait for DOM to be ready
        const timer = setTimeout(() => {
            const currentModuleElement = moduleCarousel.querySelector(`[data-module-id="${currentModuleId}"]`) as HTMLElement;
            if (currentModuleElement) {
                // Manually scroll the carousel container instead of scrollIntoView
                // to prevent page-level scrolling
                const containerRect = moduleCarousel.getBoundingClientRect();
                const elementRect = currentModuleElement.getBoundingClientRect();
                const scrollLeft = moduleCarousel.scrollLeft;
                const elementOffsetLeft = currentModuleElement.offsetLeft;
                
                // Calculate the scroll position needed to show the element
                const targetScroll = elementOffsetLeft - (containerRect.width / 2 - elementRect.width / 2);
                
                moduleCarousel.scrollTo({
                    left: Math.max(0, targetScroll),
                    behavior: 'auto'
                });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []); // Empty deps - only run on mount

    // Scroll to current section on initial load
    useEffect(() => {
        const sectionCarousel = sectionCarouselRef.current;
        const currentModule = allModules.find(m => m.id === currentModuleId);
        if (!sectionCarousel || !currentModule) return;

        // Wait for DOM to be ready
        const timer = setTimeout(() => {
            const currentSectionElement = sectionRefs.current.get(currentModule.section);
            if (currentSectionElement) {
                // Get the section's position relative to the carousel container
                const sectionOffsetLeft = currentSectionElement.offsetLeft;
                const scrollPadding = 32; // 2rem = 32px for balanced spacing

                // Set absolute scroll position to align section to the left with padding
                sectionCarousel.scrollLeft = sectionOffsetLeft - scrollPadding;
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []); // Empty deps - only run on mount

    // Handle section click - scroll to corresponding modules
    const handleSectionClick = useCallback((section: string) => {
        const moduleCarousel = moduleCarouselRef.current;
        const firstModule = modulesBySection[section]?.[0];

        if (moduleCarousel && firstModule) {
            isUserScrollingSection.current = true;
            setActiveSection(section);

            const moduleElement = moduleCarousel.querySelector(`[data-module-id="${firstModule.id}"]`) as HTMLElement;
            if (moduleElement) {
                // Manually scroll the carousel container to prevent page-level scrolling
                const containerRect = moduleCarousel.getBoundingClientRect();
                const elementRect = moduleElement.getBoundingClientRect();
                const elementOffsetLeft = moduleElement.offsetLeft;
                
                // Calculate the scroll position needed to show the element
                const targetScroll = elementOffsetLeft - (containerRect.width / 2 - elementRect.width / 2);
                
                moduleCarousel.scrollTo({
                    left: Math.max(0, targetScroll),
                    behavior: 'smooth'
                });
            }

            // Reset flag after scroll completes
            setTimeout(() => {
                isUserScrollingSection.current = false;
            }, 1000);
        }
    }, [modulesBySection]);

    // Handle module click
    const handleModuleClick = useCallback((module: LearnModule) => {
        navigate(`/learn/${module.id}`);
        window.scrollTo(0, 0);
    }, [navigate]);

    // Prevent swipe navigation
    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.stopPropagation();
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="mt-16 mb-8 border-t border-ink-muted/10 dark:border-paper-light/10 pt-8">
            {/* Heading */}
            <div className="px-4 sm:px-6 max-w-4xl mx-auto w-full mb-4">
                <h3 className="text-lg font-serif text-ink-primary dark:text-paper-light">
                    Explore More Modules
                </h3>
            </div>

            {/* Section Carousel - Sticky Headers */}
            <div className="mb-3 relative">
                <div
                    ref={sectionCarouselRef}
                    className="w-screen overflow-x-auto scrollbar-hide -ml-6 scroll-smooth"
                    style={{
                        scrollPaddingLeft: '2rem'
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex gap-2 pl-6 pr-6 py-2" style={{ width: 'max-content' }}>
                        {availableSections.map((section, index) => {
                            const isActive = section === activeSection;
                            const isCurrentSection = section === activeSection && activeSection === allModules.find(m => m.id === currentModuleId)?.section;

                            return (
                                <motion.button
                                    key={section}
                                    ref={(el) => {
                                        if (el) sectionRefs.current.set(section, el);
                                    }}
                                    onClick={() => handleSectionClick(section)}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap
                                        ${isCurrentSection
                                            ? 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/30 shadow-sm'
                                            : isActive
                                                ? 'bg-paper-light/80 dark:bg-paper-dark/80 backdrop-blur-sm text-ink-primary dark:text-paper-light border border-ink-muted/20 dark:border-paper-light/20 shadow-sm'
                                                : 'bg-ink-muted/5 dark:bg-paper-light/5 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/10 dark:hover:bg-paper-light/10'
                                        }
                                    `}
                                    initial={false}
                                    animate={{
                                        scale: isActive ? 1.02 : 1,
                                        fontWeight: isCurrentSection ? 600 : isActive ? 600 : 500
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {section}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Module Carousel - All Modules */}
            <div
                ref={moduleCarouselRef}
                className="w-screen overflow-x-auto scrollbar-hide -ml-6 scroll-smooth"
                style={{
                    scrollSnapType: 'x mandatory',
                    scrollPaddingLeft: '2rem'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex gap-2 pl-6 pr-6 pb-6" style={{ width: 'max-content' }}>
                    {availableSections.map((section) => {
                        const modules = modulesBySection[section] || [];

                        return (
                            <React.Fragment key={section}>
                                {modules.map((module, index) => {
                                    const isRead = readingProgressService.isRead(module.id);
                                    const isFirstInSection = index === 0;
                                    const isCurrentModule = module.id === currentModuleId;

                                    return (
                                        <motion.div
                                            key={module.id}
                                            data-module-id={module.id}
                                            data-section={isFirstInSection ? section : undefined}
                                            className="flex-shrink-0 w-[210px]"
                                            style={{
                                                scrollSnapAlign: 'start'
                                            }}
                                            initial={{
                                                opacity: 0,
                                                x: 20,
                                                scale: 0.95
                                            }}
                                            animate={{
                                                opacity: 1,
                                                x: 0,
                                                scale: isCurrentModule ? 1.02 : 1
                                            }}
                                            transition={{
                                                duration: 0.4,
                                                delay: index * 0.02,
                                                ease: "easeOut"
                                            }}
                                        >
                                            <div className={isCurrentModule ? 'bg-blue-500/10 dark:bg-blue-400/10 rounded-xl p-0.5' : ''}>
                                                <CarouselCard
                                                    title={module.title}
                                                    subtitle={module.section}
                                                    isRead={isRead}
                                                    onClick={() => handleModuleClick(module)}
                                                    contentType="story"
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};

export default SynchronizedSectionCarousel;
