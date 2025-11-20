import React from 'react';
import { LearnModule } from '../types';
import SynchronizedSectionCarousel from './SynchronizedSectionCarousel';

interface LearnModuleNavigationProps {
    currentModuleId: string;
    allModules: LearnModule[];
}

const LearnModuleNavigation: React.FC<LearnModuleNavigationProps> = ({
    currentModuleId,
    allModules
}) => {
    return (
        <SynchronizedSectionCarousel
            currentModuleId={currentModuleId}
            allModules={allModules}
        />
    );
};

export default LearnModuleNavigation;
