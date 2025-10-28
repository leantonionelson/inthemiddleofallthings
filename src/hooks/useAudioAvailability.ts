import { useState, useEffect } from 'react';
import { getUnifiedContentService, ContentType } from '../services/unifiedContentService';

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
      // Don't check if we don't have content loaded yet
      if (!contentId || !contentTitle || !content) {
        console.log('⏸️  Skipping audio check - content not loaded yet');
        setIsChecking(false);
        setHasAudio(null);
        return;
      }

      try {
        setIsChecking(true);
        console.log(`🔍 Checking audio for ${contentType}: "${contentTitle}" (ID: ${contentId})`);
        
        const service = getUnifiedContentService();
        const audioExists = await service.hasAudio(contentId, contentType as ContentType);
        
        console.log(`✅ Audio check complete for "${contentTitle}": ${audioExists ? 'HAS AUDIO' : 'NO AUDIO'}`);
        setHasAudio(audioExists);
      } catch (error) {
        console.error(`❌ Error checking audio for "${contentTitle}":`, error);
        setHasAudio(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAudioAvailability();
  }, [contentId, contentType, contentTitle, content]);

  return { hasAudio, isChecking };
};
