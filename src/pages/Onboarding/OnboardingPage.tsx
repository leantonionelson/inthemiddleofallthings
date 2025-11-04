import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SkipForward } from 'lucide-react';
import { Symbol } from '../../components/Symbol';
import { generateSymbol } from '../../services/symbolGenerator';
import PaymentStep from '../../components/PaymentStep';

interface OnboardingPageProps {
  onComplete: () => void;
  onClose: () => void;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple' | 'text' | 'scale' | 'persona' | 'payment';
  options?: string[];
}

const questions: Question[] = [
  {
    id: 'persona_choice',
    text: 'Which companion resonates with your journey?',
    type: 'persona',
    options: ['Sage', 'Mirror', 'Flame']
  },
  {
    id: 'voice_preference',
    text: 'Which voice would you prefer for audio content?',
    type: 'multiple',
    options: ['Male voice', 'Female voice']
  },
  {
    id: 'reading_style',
    text: 'How do you prefer to engage with reflective content?',
    type: 'multiple',
    options: ['Slowly and contemplatively', 'With active questioning', 'Through emotional connection', 'By seeking practical wisdom']
  },
  {
    id: 'reflection_depth',
    text: 'When you reflect on life experiences, what draws you most?',
    type: 'multiple',
    options: ['Understanding patterns', 'Emotional insights', 'Philosophical meaning', 'Personal growth']
  },
  {
    id: 'current_focus',
    text: 'What area of your life feels most "in the middle" right now?',
    type: 'text'
  },
  {
    id: 'ai_comfort',
    text: 'How comfortable are you with AI as a conversation partner?',
    type: 'scale'
  },
  {
    id: 'payment',
    text: 'Choose your plan to unlock premium features',
    type: 'payment'
  }
];

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isGeneratingSymbol, setIsGeneratingSymbol] = useState(false);
  const [generatedSymbol, setGeneratedSymbol] = useState<any | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>(questions);

  // Check if user is in free mode (guest user)
  useEffect(() => {
    const checkAuthState = () => {
      const freeAuth = localStorage.getItem('freeAuth') === 'true';
      
      // User is in free mode if they have freeAuth
      const isFree = freeAuth;
      setIsFreeUser(isFree);
      
      // Filter questions based on authentication state
      const filtered = isFree 
        ? questions.filter(q => q.id !== 'payment') // Remove payment question for free users
        : questions; // Keep all questions for authenticated users
      
      setFilteredQuestions(filtered);
      
      console.log('Auth state check - Free user:', isFree, 'Questions:', filtered.length);
    };

    checkAuthState();
  }, []);

  const currentQuestion = filteredQuestions[currentStep];
  const isLastQuestion = currentStep === filteredQuestions.length - 1;

  // Initialize scale questions with default value
  React.useEffect(() => {
    if (currentQuestion && currentQuestion.type === 'scale' && responses[currentQuestion.id] === undefined) {
      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: 3
      }));
    }
  }, [currentQuestion?.id, currentQuestion?.type, responses]);

  const handleResponse = (value: any) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = async () => {
    // Check if this is the payment step and payment hasn't been completed
    if (currentQuestion?.type === 'payment' && responses.payment !== 'completed') {
      console.warn('Payment step cannot be skipped - payment is required');
      return; // Don't proceed without payment
    }

    if (isLastQuestion) {
      // Final validation: ensure payment was completed for authenticated users
      if (!isFreeUser && responses.payment !== 'completed') {
        console.error('Payment is required for authenticated users');
        // Revert user to free account if they somehow bypassed payment
        await revertToFreeAccount();
        return;
      }

      setIsGeneratingSymbol(true);
      
      try {
        // Generate user's symbol based on responses
        const userResponses = Object.values(responses).map(r => String(r));
        const userSymbol = generateSymbol('onboarding', userResponses);
        
        // Store the symbol data
        const symbolData = {
          svgPath: userSymbol.svgPath,
          metadata: userSymbol.metadata,
          colorScheme: userSymbol.colorScheme,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem('userSymbol', JSON.stringify(symbolData));
        setGeneratedSymbol(userSymbol);
        
        // Save voice preference
        if (responses.voice_preference) {
          const voicePreference = responses.voice_preference === 'Male voice' ? 'male' : 'female';
          localStorage.setItem('audioVoicePreference', voicePreference);
        }
        
        // Set user type based on payment status
        if (isFreeUser || responses.payment !== 'completed') {
          localStorage.setItem('userType', 'free');
          console.log('Free user onboarding completed - paywall restrictions apply');
        } else {
          localStorage.setItem('userType', 'authenticated');
          console.log('Authenticated user onboarding completed with payment');
        }
        
        // Wait a moment to show the symbol, then complete onboarding
        setTimeout(() => {
          console.log('Completing onboarding after symbol generation');
          onComplete();
        }, 2000);
        
      } catch (error) {
        console.error('Symbol generation failed:', error);
        
        // Save voice preference even if symbol generation fails
        if (responses.voice_preference) {
          const voicePreference = responses.voice_preference === 'Male voice' ? 'male' : 'female';
          localStorage.setItem('audioVoicePreference', voicePreference);
        }
        
        // Set user type even if symbol generation fails
        if (isFreeUser || responses.payment !== 'completed') {
          localStorage.setItem('userType', 'free');
        } else {
          localStorage.setItem('userType', 'authenticated');
        }
        
        // Continue anyway
        setTimeout(() => {
          console.log('Completing onboarding after error fallback');
          onComplete();
        }, 1000);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePaymentComplete = () => {
    setPaymentCompleted(true);
    setResponses(prev => ({
      ...prev,
      payment: 'completed'
    }));
    // Move to next step (symbol generation)
    handleNext();
  };


  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // Prevent skipping payment step
    if (currentQuestion?.type === 'payment') {
      console.warn('Payment step cannot be skipped - payment is required');
      return;
    }

    // Mark current question as skipped
    setSkippedQuestions(prev => new Set([...prev, currentStep]));
    
    if (isLastQuestion) {
      // If this is the last question, complete onboarding with skipped responses
      handleCompleteWithSkipped();
    } else {
      // Move to next question
      setCurrentStep(prev => prev + 1);
    }
  };

  const revertToFreeAccount = async () => {
    try {
      // Update localStorage to remove subscription status
      localStorage.setItem('subscriptionStatus', JSON.stringify({
        isActive: false,
        status: 'incomplete',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planName: 'Free Plan'
      }));
      
      // Set user type to free
      localStorage.setItem('userType', 'free');
      console.log('User account reverted to free due to payment bypass attempt');
    } catch (error) {
      console.error('Error reverting account to free:', error);
    }
  };

  const handleCompleteWithSkipped = async () => {
    setIsGeneratingSymbol(true);
    
    try {
      // Generate symbol with available responses (or random if all skipped)
      const availableResponses = Object.values(responses).filter(r => r !== undefined && r !== '');
      
      let userSymbol;
      if (availableResponses.length > 0) {
        // Use available responses
        const userResponses = availableResponses.map(r => String(r));
        userSymbol = generateSymbol('onboarding', userResponses);
      } else {
        // Generate random symbol if all questions were skipped
        const randomResponses = ['random', 'skipped', 'default'];
        userSymbol = generateSymbol('onboarding', randomResponses);
      }
      
      // Store the symbol data
      const symbolData = {
        svgPath: userSymbol.svgPath,
        metadata: userSymbol.metadata,
        colorScheme: userSymbol.colorScheme,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('userSymbol', JSON.stringify(symbolData));
      setGeneratedSymbol(userSymbol);
      
      // Save voice preference if available
      if (responses.voice_preference) {
        const voicePreference = responses.voice_preference === 'Male voice' ? 'male' : 'female';
        localStorage.setItem('audioVoicePreference', voicePreference);
      } else {
        // Set default voice preference
        localStorage.setItem('audioVoicePreference', 'male');
      }
      
      // Wait a moment to show the symbol, then complete onboarding
      setTimeout(() => {
        onComplete();
      }, 3000);
      
    } catch (error) {
      console.error('Symbol generation failed:', error);
      
      // Set default voice preference
      localStorage.setItem('audioVoicePreference', 'male');
      
      // Continue anyway
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const renderInput = () => {
    const currentResponse = responses[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'multiple':
      case 'persona':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <motion.button
                key={option}
                onClick={() => handleResponse(option)}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  currentResponse === option
                    ? 'border-gray-900 bg-gray-900 bg-opacity-10 text-gray-900 dark:border-gray-100 dark:bg-gray-100 dark:bg-opacity-10 dark:text-gray-100'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {currentQuestion.type === 'persona' ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{option.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{option}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option === 'Sage' && 'Wisdom and guidance'}
                        {option === 'Mirror' && 'Reflection and insight'}
                        {option === 'Flame' && 'Passion and transformation'}
                      </div>
                    </div>
                  </div>
                ) : (
                  option
                )}
              </motion.button>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={currentResponse || ''}
            onChange={(e) => handleResponse(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full h-32 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:ring-opacity-50"
          />
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="5"
              value={currentResponse || 3}
              onChange={(e) => handleResponse(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #1f2937 0%, #1f2937 ${((currentResponse || 3) - 1) * 25}%, #e5e7eb ${((currentResponse || 3) - 1) * 25}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Not comfortable</span>
              <span>Very comfortable</span>
            </div>
            <div className="text-center">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {currentResponse || 3}/5
              </span>
            </div>
          </div>
        );

      case 'payment':
        return (
          <PaymentStep
            onComplete={handlePaymentComplete}
          />
        );

      default:
        return null;
    }
  };

  if (isGeneratingSymbol) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-24 h-24 mx-auto mb-6">
            {generatedSymbol ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                <Symbol 
                  svgPath={generatedSymbol.svgPath} 
                  size={96}
                  metadata={generatedSymbol.metadata}
                  colorScheme={generatedSymbol.colorScheme}
                />
              </motion.div>
            ) : (
              <div className="w-full h-full rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-100 animate-spin" />
            )}
          </div>
          
          <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100 mb-4">
            {generatedSymbol ? 'Your Symbol Has Been Created' : 'Creating Your Symbol'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400">
            {generatedSymbol 
              ? 'This symbol will evolve as you journey through the book.'
              : 'Weaving your responses into a unique visual representation...'
            }
          </p>
        </motion.div>
      </div>
    );
  }

  const canProceed = currentQuestion 
    ? (currentQuestion.type === 'payment' 
        ? responses[currentQuestion.id] === 'completed' // Payment must be completed
        : responses[currentQuestion.id] !== undefined)
    : false;

  // Don't render until we have questions loaded and currentQuestion is available
  if (!currentQuestion || filteredQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header with Close and Skip buttons */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-6 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Close</span>
          </button>
          
          {currentQuestion?.type !== 'payment' && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              <span className="text-sm font-medium">Skip</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content with top padding to account for fixed header */}
      <div className="pt-20 flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-2xl">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Question {currentStep + 1} of {filteredQuestions.length}</span>
            <span>{Math.round(((currentStep + 1) / filteredQuestions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gray-900 dark:bg-gray-100 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / filteredQuestions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100 leading-relaxed">
              {currentQuestion.text}
            </h1>

            {renderInput()}

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="px-8 py-3 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLastQuestion ? 'Complete' : 'Next'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage; 