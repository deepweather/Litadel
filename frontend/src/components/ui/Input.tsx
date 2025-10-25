import React, { useMemo } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  accentColor?: string; // border color when idle
  focusAccentColor?: string; // border color on focus
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  accentColor,
  focusAccentColor,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const baseStyle = useMemo<React.CSSProperties>(() => ({
    ...(style || {}),
    ...(accentColor ? { borderColor: accentColor } : {}),
  }), [style, accentColor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label
          style={{
            marginBottom: '1rem',
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
            display: 'block',
          }}
        >
          {label}
        </label>
      )}
      <input
        className={`
          bg-terminal-highlight
          border border-terminal-border
          text-terminal-fg
          px-3 py-2
          font-mono
          outline-none
          focus:border-terminal-fg
          transition-all
          ${error ? 'border-terminal-error' : ''}
          ${className}
        `}
        style={baseStyle}
        onFocus={(e) => {
          if (focusAccentColor) {
            e.currentTarget.style.borderColor = focusAccentColor;
          }
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          if (accentColor) {
            e.currentTarget.style.borderColor = accentColor;
          }
          onBlur && onBlur(e);
        }}
        {...props}
      />
      {error && (
        <span className="text-terminal-error text-xs font-mono">
          {error}
        </span>
      )}
    </div>
  );
};

