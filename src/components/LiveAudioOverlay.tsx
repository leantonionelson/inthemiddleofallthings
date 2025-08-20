import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { LiveAudioService } from '../services/liveAudio';

interface LiveAudioOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageReceived: (message: string) => void;
}

const LiveAudioOverlay: React.FC<LiveAudioOverlayProps> = ({
  isOpen,
  onClose,
  onMessageReceived
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const liveAudioService = useRef<LiveAudioService | null>(null);
  const audioLevelInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && !liveAudioService.current) {
      liveAudioService.current = new LiveAudioService({
        onStatusUpdate: (status) => setStatus(status),
        onMessageReceived: (message) => {
          onMessageReceived(message);
          setStatus('Message received');
        },
        onError: (error) => setStatus(`Error: ${error}`)
      });
      liveAudioService.current.initSession();
    }

    return () => {
      if (liveAudioService.current) {
        liveAudioService.current.cleanup();
        liveAudioService.current = null;
      }
    };
  }, [isOpen, onMessageReceived]);

  useEffect(() => {
    if (isRecording && !audioLevelInterval.current) {
      audioLevelInterval.current = setInterval(() => {
        // Simulate audio level for visual feedback
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else if (!isRecording && audioLevelInterval.current) {
      clearInterval(audioLevelInterval.current);
      audioLevelInterval.current = null;
      setAudioLevel(0);
    }

    return () => {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
    };
  }, [isRecording]);

  const handleToggleRecording = async () => {
    if (!liveAudioService.current) return;

    if (isRecording) {
      liveAudioService.current.stopRecording();
      setIsRecording(false);
    } else {
      const started = await liveAudioService.current.startRecording();
      if (started) {
        setIsRecording(true);
      }
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Note: LiveAudioService doesn't have mute/unmute methods yet
    // This would need to be implemented in the service
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-paper-light dark:bg-paper-dark rounded-t-3xl p-6"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-ink-primary dark:text-paper-light">
                Live Conversation
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink-muted hover:bg-opacity-10 transition-colors"
              >
                <X className="w-5 h-5 text-ink-muted" />
              </button>
            </div>

            {/* Audio Visualizer */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-ink-muted border-opacity-30"
                  animate={{
                    scale: isRecording ? [1, 1.1, 1] : 1,
                    opacity: isRecording ? [0.3, 0.6, 0.3] : 0.3
                  }}
                  transition={{ duration: 2, repeat: isRecording ? Infinity : 0 }}
                />
                
                <motion.div
                  className="absolute inset-4 rounded-full bg-gradient-to-r from-ink-primary to-ink-secondary dark:from-paper-light dark:to-paper-light"
                  animate={{
                    scale: isRecording ? [1, 1.05, 1] : 1,
                    opacity: isRecording ? [0.8, 1, 0.8] : 0.8
                  }}
                  transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
                />

                {/* Audio level bars */}
                {isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex space-x-1">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-paper-light dark:bg-ink-primary rounded-full"
                          animate={{
                            height: [
                              Math.random() * 20 + 5,
                              Math.random() * 30 + 10,
                              Math.random() * 20 + 5
                            ]
                          }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-paper-light dark:text-ink-primary" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="text-center mb-6">
              <p className="text-sm text-ink-secondary dark:text-ink-muted">
                {status || (isRecording ? 'Listening...' : 'Tap to start speaking')}
              </p>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={handleToggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted
                    ? 'bg-red-500 text-white'
                    : 'bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>

              <motion.button
                onClick={handleToggleRecording}
                className={`p-6 rounded-full transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white'
                    : 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isRecording ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </motion.button>
            </div>

            {/* Instructions */}
            <div className="mt-6 text-center">
              <p className="text-xs text-ink-muted dark:text-ink-muted">
                Speak naturally. The Book will respond through audio.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiveAudioOverlay;
