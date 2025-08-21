import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MessageCircle } from 'lucide-react';
import { User, BookChapter, ChatMessage, ConversationTone, ReflectionEntry } from '../../types';
import { geminiService } from '../../services/gemini';
import { LiveAudioService } from '../../services/liveAudio';

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentChapter?: BookChapter;
}

const AIDrawer: React.FC<AIDrawerProps> = ({ isOpen, onClose, user, currentChapter }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ConversationTone>(ConversationTone.REFLECTIVE);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveAudioService = useRef<LiveAudioService | null>(null);

  const toneButtons = [
    { tone: ConversationTone.REFLECTIVE, label: 'Reflective' },
    { tone: ConversationTone.INTERPRETIVE, label: 'Interpretive' },
    { tone: ConversationTone.PHILOSOPHICAL, label: 'Philosophical' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize live audio service
      if (!liveAudioService.current) {
        liveAudioService.current = new LiveAudioService({
          onStatusUpdate: (status) => setVoiceStatus(status),
          onMessageReceived: (message) => {
            const aiMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: message,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
          },
          onError: (error) => setVoiceStatus(`Error: ${error}`)
        });
        liveAudioService.current.initSession();
      }

      // Check if there's selected text from the reader
      const selectedText = localStorage.getItem('selectedTextForAI');
      let greeting: ChatMessage;

      if (selectedText) {
        // If there's selected text, start with that
        greeting = {
          id: '1',
          role: 'assistant',
          content: `I see you've selected this passage: "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"\n\nWhat would you like to explore about this text?`,
          timestamp: new Date()
        };
        // Clear the selected text from storage
        localStorage.removeItem('selectedTextForAI');
      } else {
        // Regular greeting
        greeting = {
          id: '1',
          role: 'assistant',
          content: currentChapter 
            ? `I sense you're exploring "${currentChapter.title}". What draws your attention in this passage?`
            : 'What would you like to explore together?',
          timestamp: new Date()
        };
      }
      setMessages([greeting]);
    }
  }, [isOpen, currentChapter, messages.length]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (liveAudioService.current) {
        liveAudioService.current.cleanup();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      tone: selectedTone
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = currentChapter 
        ? `Current chapter: "${currentChapter.title}" - ${currentChapter.subtitle}`
        : undefined;

      const response = await geminiService.generateReflection(
        inputValue,
        selectedTone,
        context
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save this conversation as a reflection
      const selectedText = localStorage.getItem('selectedTextForAI');
      const reflection: ReflectionEntry = {
        id: Date.now().toString(),
        title: `Reflection on "${inputValue.substring(0, 50)}${inputValue.length > 50 ? '...' : ''}"`,
        content: selectedText 
          ? `Selected Text: "${selectedText}"\n\nQ: ${inputValue}\n\nA: ${response}`
          : `Q: ${inputValue}\n\nA: ${response}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || 'anonymous',
        chapterContext: currentChapter?.title,
        highlightText: selectedText || undefined
      };

      // Load existing reflections and add new one
      const existingReflections = localStorage.getItem('reflections');
      const reflections = existingReflections ? JSON.parse(existingReflections) : [];
      reflections.push(reflection);
      localStorage.setItem('reflections', JSON.stringify(reflections));

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = async () => {
    if (!liveAudioService.current) return;

    if (isVoiceRecording) {
      liveAudioService.current.stopRecording();
      setIsVoiceRecording(false);
    } else {
      const started = await liveAudioService.current.startRecording();
      if (started) {
        setIsVoiceRecording(true);
        // Add a placeholder message showing user is speaking
        const voiceMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: '🎤 Speaking...',
          timestamp: new Date(),
          isVoice: true
        };
        setMessages(prev => [...prev, voiceMessage]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 drawer-backdrop z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-paper-light dark:bg-paper-dark rounded-t-3xl z-50 max-h-[80vh] flex flex-col ink-shadow"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-ink-muted border-opacity-20">
              <h2 className="text-xl font-heading text-ink-primary dark:text-paper-light">
                Ask the Book
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink-muted hover:bg-opacity-10 transition-colors"
              >
                <X className="w-5 h-5 text-ink-muted" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                        : 'bg-ink-muted bg-opacity-10 text-ink-primary dark:text-paper-light'
                    }`}
                  >
                    <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-ink-muted bg-opacity-10 p-4 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-ink-muted rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-ink-muted rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-ink-muted rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Tone Selection */}
            <div className="px-6 py-3 border-t border-ink-muted border-opacity-20">
              <div className="flex space-x-2">
                {toneButtons.map(({ tone, label }) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTone === tone
                        ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                        : 'bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Status */}
            {voiceStatus && (
              <div className="px-6 py-2 border-t border-ink-muted border-opacity-20">
                <p className="text-sm text-ink-secondary dark:text-ink-muted">{voiceStatus}</p>
              </div>
            )}

            {/* Input */}
            <div className="p-6">
              <div className="flex items-end space-x-3">
                <button 
                  onClick={handleVoiceToggle}
                  className={`p-3 rounded-full transition-all ${
                    isVoiceRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'hover:bg-ink-muted hover:bg-opacity-10'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                <div className="flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What would you like to explore?"
                    className="w-full p-3 bg-ink-muted bg-opacity-10 rounded-2xl text-ink-primary dark:text-paper-light placeholder-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-ink-primary dark:focus:ring-paper-light focus:ring-opacity-50"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIDrawer; 