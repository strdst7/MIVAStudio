
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, CheckCircleIcon, XMarkIcon, InfoIcon, UndoIcon, RedoIcon } from './icons';
import Tooltip from './Tooltip';

interface ActionToolbarProps {
  currentImage: File | null;
  onDownload?: () => void;
  onToggleDetails?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({ 
    currentImage, 
    onToggleDetails, 
    onUndo, 
    onRedo, 
    canUndo = false, 
    canRedo = false 
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [quality, setQuality] = useState<'original' | 'web'>('original');
  const [watermark, setWatermark] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentImage) {
      setIsSaved(true);
      const timer = setTimeout(() => setIsSaved(false), 4000); 
      return () => clearTimeout(timer);
    }
  }, [currentImage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async () => {
    if (!currentImage) return;
    setIsDownloading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = document.createElement('canvas');
      let imgBitmap: ImageBitmap | HTMLImageElement | null = null;

      try {
          imgBitmap = await createImageBitmap(currentImage);
      } catch (bitmapError) {
          console.warn("createImageBitmap failed, falling back to Image element load", bitmapError);
          // Fallback: Load image via URL
          const url = URL.createObjectURL(currentImage);
          imgBitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = url;
          });
          URL.revokeObjectURL(url);
      }

      if (!imgBitmap) throw new Error("Failed to decode image source");

      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(imgBitmap, 0, 0);

        if (watermark) {
            ctx.font = `bold ${canvas.width * 0.03}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'right';
            ctx.fillText('MIVA STUDIO', canvas.width - 40, canvas.height - 40);
        }

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const q = quality === 'web' ? 0.8 : 1.0;

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `miva-asset-${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          setIsDownloading(false);
          setShowMenu(false);
        }, mimeType, q);
      }
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to export image. The source file may be corrupted.");
      setIsDownloading(false);
    }
  };

  if (!currentImage) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-full max-w-md pointer-events-none">
      
      {/* Auto-Save Feedback */}
      <div 
        className={`transition-all duration-700 ease-out flex items-center gap-2 px-4 py-2 rounded-full glass-morphism shadow-premium pointer-events-auto ${
          isSaved ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        role="status"
        aria-live="polite"
      >
        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold text-[var(--text-main)] tracking-wide">Saved to Library</span>
      </div>

      {/* Main Action Bar */}
      <div className="relative pointer-events-auto" ref={menuRef}>
        {showMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 glass-morphism rounded-xl shadow-2xl overflow-hidden animate-slide-up origin-bottom">
                <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-input)]/50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Download Asset</span>
                    <button onClick={() => setShowMenu(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" aria-label="Close Menu"><XMarkIcon className="w-3.5 h-3.5" /></button>
                </div>
                
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Format</label>
                        <div className="flex gap-2">
                            <button onClick={() => setFormat('png')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors border ${format === 'png' ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)]' : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}>PNG</button>
                            <button onClick={() => setFormat('jpg')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors border ${format === 'jpg' ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)]' : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}>JPG</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Resolution</label>
                        <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-2 text-[10px] text-[var(--text-main)] cursor-pointer hover:opacity-80">
                                <input type="radio" checked={quality === 'original'} onChange={() => setQuality('original')} className="accent-[var(--text-main)]" />
                                Original (High Quality)
                            </label>
                            <label className="flex items-center gap-2 text-[10px] text-[var(--text-main)] cursor-pointer hover:opacity-80">
                                <input type="radio" checked={quality === 'web'} onChange={() => setQuality('web')} className="accent-[var(--text-main)]" />
                                Web Optimized
                            </label>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)]">
                        <label className="flex items-center gap-2 text-[10px] text-[var(--text-main)] cursor-pointer hover:opacity-80">
                            <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="accent-[var(--text-main)]" />
                            Include MIVA Watermark
                        </label>
                    </div>

                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-app)] font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isDownloading ? 'Downloading...' : 'Export File'}
                    </button>
                </div>
            </div>
        )}

        {/* Floating Bar Button - High Contrast Pill */}
        <div className="flex items-center gap-px bg-[var(--text-main)] text-[var(--bg-app)] rounded-full shadow-premium overflow-hidden transition-transform hover:scale-[1.02]">
            {onUndo && (
                <Tooltip text="Undo (Ctrl+Z)" position="top">
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo}
                        className="pl-4 pr-3 py-3 hover:opacity-80 transition-opacity disabled:opacity-30 focus:outline-none"
                        aria-label="Undo last action"
                    >
                        <UndoIcon className="w-4 h-4" />
                    </button>
                </Tooltip>
            )}
             {onUndo && <div className="w-px h-4 bg-[var(--bg-app)] opacity-20"></div>}
            
            {onRedo && (
                 <Tooltip text="Redo (Ctrl+Y)" position="top">
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo}
                        className="pl-3 pr-4 py-3 hover:opacity-80 transition-opacity disabled:opacity-30 focus:outline-none"
                        aria-label="Redo last action"
                    >
                        <RedoIcon className="w-4 h-4" />
                    </button>
                 </Tooltip>
            )}
             {onRedo && <div className="w-px h-4 bg-[var(--bg-app)] opacity-20"></div>}

            <Tooltip text="Quick Download as PNG" position="top">
                <button 
                    onClick={() => handleDownload()}
                    className="pl-5 pr-4 py-3 text-[11px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-2 focus:outline-none"
                    aria-label="Quick Download"
                >
                    {isDownloading ? 'Exporting...' : 'Download'}
                </button>
            </Tooltip>
            
            <div className="w-px h-4 bg-[var(--bg-app)] opacity-20"></div>
            
            <Tooltip text="Export configurations" position="top">
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="pl-3 pr-4 py-3 hover:opacity-80 transition-opacity focus:outline-none"
                    aria-label="Download Options"
                    aria-expanded={showMenu}
                >
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
                </button>
            </Tooltip>

            <div className="w-px h-4 bg-[var(--bg-app)] opacity-20"></div>
            
            {onToggleDetails && (
                <Tooltip text="View synthesis logic & metadata" position="top">
                    <button
                        onClick={onToggleDetails}
                        className="pl-4 pr-5 py-3 hover:opacity-80 transition-opacity focus:outline-none"
                        aria-label="View Asset Details"
                    >
                        <InfoIcon className="w-4 h-4" />
                    </button>
                </Tooltip>
            )}
        </div>
      </div>
    </div>
  );
};

export default ActionToolbar;
