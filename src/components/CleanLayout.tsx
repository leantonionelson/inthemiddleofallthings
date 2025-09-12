import React from 'react';
import ResponsiveLayout from './ResponsiveLayout';

interface CleanLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onRead: () => void;
  isReading?: boolean;
  onOpenAI?: () => void;
  isAudioPlaying?: boolean;
}

const CleanLayout: React.FC<CleanLayoutProps> = ({
  children,
  currentPage,
  onRead,
  isReading = false,
  onOpenAI,
  isAudioPlaying = false
}) => {
  return (
    <ResponsiveLayout
      currentPage={currentPage}
      onRead={onRead}
      isReading={isReading}
      onOpenAI={onOpenAI}
      showShadow={true}
      isAudioPlaying={isAudioPlaying}
    >
      {children}
    </ResponsiveLayout>
  );
};

export default CleanLayout;
