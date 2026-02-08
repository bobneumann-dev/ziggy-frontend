import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

export interface LoadingStateProps {
  variant?: 'fullscreen' | 'section' | 'overlay';
  message?: string;
  minHeight?: string | number;
  className?: string;
}

export default function LoadingState({
  variant = 'section',
  message,
  minHeight,
  className,
}: LoadingStateProps) {
  const { t } = useTranslation();
  const resolvedMessage = message ?? t('common.loading');

  let containerClassName = 'flex items-center justify-center';
  const containerStyle: CSSProperties = {};

  if (variant === 'fullscreen') {
    containerClassName = 'min-h-screen flex items-center justify-center';
  }

  if (variant === 'section') {
    containerStyle.minHeight = minHeight ?? '16rem';
  }

  if (variant === 'overlay') {
    containerClassName = 'absolute inset-0 z-10 flex items-center justify-center';
    containerStyle.backgroundColor = 'var(--card-bg)';
    containerStyle.opacity = 0.9;
  }

  const classes = [containerClassName, className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={containerStyle}>
      <div className="flex flex-col items-center space-y-3">
        <img
          src="/logo_animated_128_128.gif"
          alt={resolvedMessage}
          width={128}
          height={128}
        />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {resolvedMessage}
        </span>
      </div>
    </div>
  );
}
