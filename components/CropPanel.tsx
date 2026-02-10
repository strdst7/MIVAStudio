
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

type AspectRatio = 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:5';

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('9:16');
  
  useEffect(() => {
    onSetAspect(9 / 16);
  }, [onSetAspect]);

  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects: { name: AspectRatio, value: number | undefined, desc: string }[] = [
    { name: 'free', value: undefined, desc: 'Freeform crop' },
    { name: '1:1', value: 1 / 1, desc: 'Square (1:1)' },
    { name: '16:9', value: 16 / 9, desc: 'Landscape (16:9)' },
    { name: '9:16', value: 9 / 16, desc: 'Story (9:16)' },
    { name: '4:3', value: 4 / 3, desc: 'Standard (4:3)' },
    { name: '3:4', value: 3 / 4, desc: 'Portrait (3:4)' },
    { name: '4:5', value: 4 / 5, desc: 'Social (4:5)' },
  ];

  return (
    <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-[var(--text-main)]">Crop Image</h3>
      <p className="text-sm text-[var(--text-muted)] -mt-2">Click and drag on the image to select a crop area.</p>
      
      <div className="flex flex-wrap justify-center items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-muted)] w-full text-center sm:w-auto mb-1 sm:mb-0">Ratio:</span>
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 justify-center">
            {aspects.map(({ name, value, desc }) => (
            <Tooltip key={name} text={desc}>
                <button
                    onClick={() => handleAspectChange(name, value)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 min-w-[60px] ${
                    activeAspect === name 
                    ? 'bg-[var(--accent-color)] text-white shadow-md' 
                    : 'bg-[var(--bg-input)] hover:bg-[var(--border-color)] text-[var(--text-main)]'
                    }`}
                >
                    {name === 'free' ? 'Free' : name}
                </button>
            </Tooltip>
            ))}
        </div>
      </div>

      <Tooltip text="Crop the image to the selected area">
        <button
            onClick={onApplyCrop}
            disabled={isLoading || !isCropping}
            className="w-full max-w-xs mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:-translate-y-px active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Apply Crop
        </button>
      </Tooltip>
    </div>
  );
};

export default CropPanel;
