import { useState, useEffect } from 'react';
import { getGenericAudioService } from '../services/genericAudioService';

interface UseAudioAvailabilityProps {
  contentId: string;
  contentType: 'story' | 'meditation' | 'chapter';
  contentTitle: string;
  content: string;
}

export const useAudioAvailability = ({ 
  contentId, 
  contentType, 
  contentTitle, 
  content 
}: UseAudioAvailabilityProps) => {
  const [hasAudio, setHasAudio] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAudioAvailability = async () => {
      try {
        setIsChecking(true);
        const audioService = getGenericAudioService();
        
        const contentItem = {
          id: contentId,
          title: contentTitle,
          content: content,
          type: contentType,
          part: contentType === 'story' ? 'Story' : contentType === 'meditation' ? 'Meditation' : undefined
        };

        const audioExists = await audioService.hasPreGeneratedAudio(contentItem);
        setHasAudio(audioExists);
      } catch (error) {
        console.error('Error checking audio availability:', error);
        setHasAudio(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAudioAvailability();
  }, [contentId, contentType, contentTitle, content]);

  return { hasAudio, isChecking };
};
