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
  const [audioStatus, setAudioStatus] = useState<'ok' | 'pending' | 'failed' | 'none' | null>(null);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
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
        const status = await service.getAudioStatus(contentId, contentType as ContentType);
        const audioExists = status === 'ok';
        
        console.log(`✅ Audio check complete for "${contentTitle}": ${audioExists ? 'HAS AUDIO' : `STATUS=${status}`}`);
        setHasAudio(audioExists);
        setAudioStatus(status);

        // If audio isn't available, we keep messaging minimal.
        // In particular, don't show "generating" messaging for content that may never have audio.
        if (status === 'pending') {
          setAudioMessage(null);
        } else if (status === 'failed') {
          setAudioMessage('Audio unavailable right now.');
        } else {
          setAudioMessage(null);
        }
      } catch (error) {
        console.error(`❌ Error checking audio for "${contentTitle}":`, error);
        setHasAudio(false);
        setAudioStatus('failed');
        setAudioMessage('Audio unavailable right now.');
      } finally {
        setIsChecking(false);
      }
    };

    checkAudioAvailability();
  }, [contentId, contentType, contentTitle, content]);

  return { hasAudio, audioStatus, audioMessage, isChecking };
};
