import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Tablet } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onClose?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tablet'>('desktop');
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect device type
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
      
      if (isTablet) {
        setDeviceType('tablet');
      } else if (isMobile) {
        setDeviceType('mobile');
      } else {
        setDeviceType('desktop');
      }

      // Detect specific platforms
      setIsIOS(/iphone|ipad|ipod/i.test(userAgent));
      setIsAndroid(/android/i.test(userAgent));
      
      // Check if already installed
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    };

    detectDevice();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay to avoid being too aggressive
      setTimeout(() => {
        if (!isStandalone && !localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already dismissed
    if (localStorage.getItem('pwa-install-dismissed')) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onClose?.();
  };

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        title: "Install on iPhone/iPad",
        steps: [
          "Tap the Share button at the bottom of Safari",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to install the app"
        ],
        icon: <Smartphone className="w-6 h-6" />
      };
    } else if (isAndroid) {
      return {
        title: "Install on Android",
        steps: [
          "Tap the menu button (three dots) in Chrome",
          "Select 'Add to Home screen' or 'Install app'",
          "Tap 'Install' to add to your home screen"
        ],
        icon: <Smartphone className="w-6 h-6" />
      };
    } else if (deviceType === 'tablet') {
      return {
        title: "Install on Tablet",
        steps: [
          "Look for the install button in your browser's address bar",
          "Or use the browser menu to 'Add to Home screen'",
          "The app will work like a native tablet app"
        ],
        icon: <Tablet className="w-6 h-6" />
      };
    } else {
      return {
        title: "Install on Desktop",
        steps: [
          "Click the install button in your browser's address bar",
          "Or use the browser menu (⋮) and select 'Install app'",
          "The app will open in its own window like a native app"
        ],
        icon: <Monitor className="w-6 h-6" />
      };
    }
  };

  const instructions = getInstallInstructions();

  // Don't show if already installed or dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-paper-light dark:bg-paper-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-primary dark:text-paper-light">
                    Install App
                  </h3>
                  <p className="text-sm text-ink-secondary dark:text-ink-muted">
                    Get the full experience
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-ink-muted" />
              </button>
            </div>

            {/* Device-specific instructions */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                {instructions.icon}
                <h4 className="font-medium text-ink-primary dark:text-paper-light">
                  {instructions.title}
                </h4>
              </div>
              <ul className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-3 text-sm text-ink-secondary dark:text-ink-muted">
                    <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Install button (for supported browsers) */}
            {deferredPrompt && (
              <motion.button
                onClick={handleInstallClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </motion.button>
            )}

            {/* Benefits */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-xs text-ink-muted">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Offline access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Background audio</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Native controls</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Faster loading</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
