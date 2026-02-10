
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top', className = '' }) => {
  return (
    <div className={`group relative flex items-center justify-center ${className}`}>
      {children}
      <div 
        className={`
          absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          pointer-events-none
          px-3 py-2
          bg-gray-900 text-white text-xs font-medium
          rounded-md shadow-xl border border-gray-700
          whitespace-nowrap z-50
        `}
      >
        {text}
        <div 
          className={`
            absolute w-2 h-2 bg-gray-900 rotate-45
            left-1/2 -translate-x-1/2
            ${position === 'top' ? '-bottom-1' : '-top-1'}
          `}
        />
      </div>
    </div>
  );
};

export default Tooltip;
