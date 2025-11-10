import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesktopDetection } from '../hooks/useDesktopDetection';

/**
 * Component that redirects desktop users to /desktop route
 * Should wrap routes that should only be accessible on mobile
 */
interface DesktopRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const DesktopRedirect: React.FC<DesktopRedirectProps> = ({ 
  children, 
  redirectTo = '/desktop' 
}) => {
  const isDesktop = useDesktopDetection();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDesktop) {
      navigate(redirectTo, { replace: true });
    }
  }, [isDesktop, navigate, redirectTo]);

  // Don't render children if desktop (redirect will happen)
  if (isDesktop) {
    return null;
  }

  return <>{children}</>;
};

export default DesktopRedirect;

