import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, Tablet } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallButtonProps {
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

const InstallButton: React.FC<InstallButtonProps> = ({
  className = '',
  showIcon = true,
  showText = true,
  size = 'md',
  variant = 'primary'
}) => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    deviceType, 
    install, 
    showInstallPrompt,
    resetDismissal 
  } = usePWAInstall();

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const getDeviceIcon = () => {
    if (isIOS || isAndroid) return <Smartphone className="w-4 h-4" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
      case 'outline':
        return 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else {
      // For iOS or other browsers that don't support beforeinstallprompt
      resetDismissal();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        rounded-lg font-medium transition-colors
        flex items-center space-x-2
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={isInstallable ? 'Install app' : 'Show install instructions'}
    >
      {showIcon && (
        isInstallable ? <Download className="w-4 h-4" /> : getDeviceIcon()
      )}
      {showText && (
        <span>
          {isInstallable ? 'Install App' : 'Install'}
        </span>
      )}
    </motion.button>
  );
};

export default InstallButton;
