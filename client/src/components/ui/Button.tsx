import { useState, useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, FC, MouseEvent } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  onReset?: () => void;
  timeoutMs?: number;
  showResetAfterMs?: number;
}

export const Button: FC<ButtonProps> = ({
  children,
  loading: controlledLoading,
  loadingText,
  onReset,
  timeoutMs = 10000,
  showResetAfterMs = 4000,
  onClick,
  className = '',
  disabled,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetShowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = isReset ? false : (controlledLoading !== undefined ? controlledLoading : internalLoading);

  const cleanupTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (resetShowRef.current) clearTimeout(resetShowRef.current);
  };

  useEffect(() => {
    if (isLoading) {
      resetShowRef.current = setTimeout(() => {
        setShowReset(true);
      }, showResetAfterMs);

      timeoutRef.current = setTimeout(() => {
        handleReset();
      }, timeoutMs);
    } else {
      cleanupTimers();
      setShowReset(false);
    }

    return cleanupTimers;
  }, [isLoading, timeoutMs, showResetAfterMs]);

  useEffect(() => {
    if (!controlledLoading) {
      setIsReset(false);
    }
  }, [controlledLoading]);

  const handleReset = () => {
    cleanupTimers();
    setInternalLoading(false);
    setShowReset(false);
    setIsReset(true);
    if (onReset) {
      onReset();
    }
  };

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;

    if (onClick) {
      const result = onClick(e) as any;
      if (result instanceof Promise) {
        setInternalLoading(true);
        try {
          await result;
        } finally {
          setInternalLoading(false);
        }
      }
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText || 'Loading...'}</span>
          {showReset && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="ml-2 p-1 bg-current/10 hover:bg-current/20 rounded-full cursor-pointer transition-colors"
              title="Reset state"
              aria-label="Reset loading state"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
