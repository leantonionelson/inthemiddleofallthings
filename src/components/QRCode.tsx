import React from 'react';
import QRCodeSVG from 'react-qr-code';

interface QRCodeProps {
  url?: string;
  size?: number;
  className?: string;
}

const QRCode: React.FC<QRCodeProps> = ({ 
  url = 'https://middleofallthings.com',
  size = 200,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative p-4 glass-subtle rounded-2xl">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          className="rounded-lg"
        />
      </div>
      <p className="text-sm text-ink-secondary dark:text-ink-muted text-center max-w-xs">
        Can't scan? Visit <span className="font-medium">{url}</span> on your phone.
      </p>
    </div>
  );
};

export default QRCode;

