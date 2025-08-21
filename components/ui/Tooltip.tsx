import React, { useState, useRef, useLayoutEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({
    opacity: 0,
    position: 'fixed',
    pointerEvents: 'none', // Avoid tooltip blocking mouse events
    transition: 'opacity 0.15s ease-in-out',
    zIndex: 50,
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (visible && wrapperRef.current && tooltipRef.current) {
      const triggerRect = wrapperRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const margin = 8;

      let top = triggerRect.top - tooltipRect.height - margin;
      let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

      // Default to top, but switch to bottom if there's no space above
      if (top < margin) {
        top = triggerRect.bottom + margin;
      }

      // Adjust left position to stay within the viewport
      if (left < margin) {
        left = margin;
      } else if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
      }

      setStyle(prevStyle => ({
        ...prevStyle,
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1, // Make it visible after positioning
      }));
    } else {
        setStyle(prevStyle => ({
            ...prevStyle,
            opacity: 0, // Hide it
        }))
    }
  }, [visible]);

  // A wrapper is needed to capture mouse events if the child is disabled.
  return (
    <div 
      ref={wrapperRef}
      className={`relative inline-block ${className || ''}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {content && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="whitespace-nowrap rounded-md bg-slate-800 dark:bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-lg"
          style={style}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
