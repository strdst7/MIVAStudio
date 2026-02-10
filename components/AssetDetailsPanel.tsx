
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Asset } from '../types';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, DocumentDuplicateIcon, ArrowDownTrayIcon, FolderIcon, TrashIcon, CheckCircleIcon } from './icons';
import Tooltip from './Tooltip';

interface AssetDetailsPanelProps {
  asset: Asset | null;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDuplicate: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onAddToCollection: (asset: Asset) => void;
}

const AssetDetailsPanel: React.FC<AssetDetailsPanelProps> = ({ asset, onClose, onEdit, onDuplicate, onDownload, onDelete, onAddToCollection }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  if (!asset) return null;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] glass-morphism shadow-2xl transform transition-transform duration-300 z-[60] flex flex-col h-full animate-slide-in-right">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-sidebar)]/50">
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">Asset Details</h2>
        <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        
        {/* Preview */}
        <div className="space-y-4">
            <div className="relative group rounded-2xl overflow-hidden bg-[var(--bg-input)] border border-[var(--border-color)]">
                {asset.type === 'video' ? (
                    <video src={asset.url} controls className="w-full h-auto max-h-[400px] object-contain" />
                ) : (
                    <img src={asset.url} alt={asset.name} className="w-full h-auto object-contain" />
                )}
                {asset.aspectRatio && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[9px] font-mono text-white">
                        {asset.aspectRatio}
                    </div>
                )}
            </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Asset Name</label>
                    <p className="text-[11px] font-medium text-[var(--text-main)] truncate" title={asset.name}>{asset.name}</p>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Created</label>
                    <p className="text-[11px] font-medium text-[var(--text-main)]">{formatDate(asset.timestamp)}</p>
                </div>
            </div>

            <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Module</label>
                 <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-main)] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                     {asset.module}
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Identity</label>
                    <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-main)] flex items-center justify-between">
                         <span className="truncate">{asset.identityId || 'None'}</span>
                         {asset.identityId && <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Style</label>
                     <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-main)] truncate">
                         {asset.styleId || 'Raw Synthesis'}
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Engine</label>
                <p className="text-[10px] font-mono text-[var(--text-muted)]">{asset.metadata.engine}</p>
            </div>
        </div>

        {/* Prompt Logic */}
        <div className="bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
            <button 
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full p-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-panel)] transition-colors"
            >
                Prompt Logic
                {showPrompt ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
            {showPrompt && (
                <div className="p-4 pt-0 space-y-3 animate-fade-in border-t border-[var(--border-color)]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-[var(--text-muted)]">USER INPUT</span>
                        <p className="text-[11px] text-[var(--text-main)] font-mono leading-relaxed opacity-80">{asset.prompt}</p>
                    </div>
                    {asset.metadata.refinementApplied && (
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-medium pt-2">
                             <CheckCircleIcon className="w-3 h-3" /> Refinement Deck Applied
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3">
             <button onClick={() => onEdit(asset)} className="flex flex-col items-center justify-center gap-2 p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-panel)] hover:border-[var(--text-muted)] transition-all">
                <PencilIcon className="w-4 h-4 text-[var(--text-main)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Edit</span>
             </button>
             <button onClick={() => onDuplicate(asset)} className="flex flex-col items-center justify-center gap-2 p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-panel)] hover:border-[var(--text-muted)] transition-all">
                <DocumentDuplicateIcon className="w-4 h-4 text-[var(--text-main)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Duplicate</span>
             </button>
             <button onClick={() => onDownload(asset)} className="flex flex-col items-center justify-center gap-2 p-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--border-color)] rounded-xl hover:opacity-90 transition-all shadow-sm">
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Download</span>
             </button>
        </div>

        {/* Management */}
        <div className="space-y-2 pt-4 border-t border-[var(--border-color)]">
             <button onClick={() => onAddToCollection(asset)} className="w-full flex items-center gap-3 p-3 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors rounded-lg hover:bg-[var(--bg-input)]">
                <FolderIcon className="w-4 h-4" /> Add to Collection
             </button>
             <button onClick={() => onDelete(asset.id)} className="w-full flex items-center gap-3 p-3 text-[11px] font-medium text-red-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                <TrashIcon className="w-4 h-4" /> Delete Asset
             </button>
        </div>
      </div>
      
      {/* Footer Legal */}
      <div className="p-4 bg-[var(--bg-input)]/50 border-t border-[var(--border-color)] text-[9px] text-[var(--text-muted)] leading-relaxed text-center opacity-60">
        You are responsible for how exported assets are used. MIVA Studio does not claim ownership of your content.
      </div>
    </div>
  );
};

export default AssetDetailsPanel;
