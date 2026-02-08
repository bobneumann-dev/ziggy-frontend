import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import i18n from '../i18n/config';
import LoadingState from './LoadingState';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguarda o i18n estar pronto
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      i18n.on('initialized', () => {
        setIsReady(true);
      });
    }
  }, []);

  if (!isReady) {
    return <LoadingState variant="fullscreen" />;
  }

  return <>{children}</>;
}
