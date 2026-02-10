
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, TrashIcon, CheckCircleIcon, StackIcon, MagicWandIcon } from './icons';
import { BatchItem } from '../types';
import Tooltip from './Tooltip';

interface BatchPanelProps {
  queue: BatchItem[];
  initialPrompt?: string;
  onAddToQueue: (files: File[]) => void;
  onRemoveFromQueue: (id: string) => void;
  onProcessBatch: (selectedIds: string[], prompt: string) => void;
  isProcessing: boolean;
}

const BatchPanel: React.FC<BatchPanelProps> = ({ 
  queue, 
  initialPrompt = '',
  onAddToQueue, 
  onRemoveFromQueue, 
  onProcessBatch, 
  isProcessing 
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with cloned prompt if it updates
  useEffect(() => {
    if (initialPrompt) {
        setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onAddToQueue(files);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === queue.length && queue.length > 0) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(queue.map(i => i.id)));
    }
  };

  const handleProcess = () => {
      if (prompt?.trim() && selectedIds.size > 0) {
          onProcessBatch(Array.from(selectedIds), prompt);
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'success': return 'text-emerald-500';
          case 'error': return 'text-red-500';
          case 'processing': return 'text-[var(--text-main)] animate-pulse';
          default: return 'text-[var(--text-muted)]';
      }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in h-full">
        {/* Header / Drop Zone */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-8 flex flex-col items-center text-center gap-6">
             <div className="bg-[var(--bg-input)] p-5 rounded-[1.5rem] border border-[var(--border-color)]">
                <StackIcon className="w-6 h-6 text-[var(--text-main)]" />
             </div>
             <div className="space-y-2">
                <h3 className="text-sm font-black tracking-widest uppercase text-[var(--text-main)]">Batch Studio</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed opacity-60">
                    Process multiple assets simultaneously using a unified style prompt.
                </p>
                <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 py-1 px-3 rounded-full inline-block border border-amber-500/20">
                    Note: All outputs will use the same identity and style.
                </p>
             </div>
             
             <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black text-[11px] tracking-widest uppercase hover:opacity-90 transition-studio flex items-center gap-3 shadow-lg active:scale-95"
             >
                <UploadIcon className="w-4 h-4" />
                Add Source Assets
             </button>
        </div>

        {/* Prompt Input */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Unified Prompt</label>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. 'Apply cinematic lighting...'"
                        className="flex-grow bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-4 text-[11px] font-medium focus:border-[var(--text-main)] transition-studio outline-none"
                        disabled={isProcessing}
                    />
                </div>
            </div>
            <button
                onClick={handleProcess}
                disabled={isProcessing || !prompt?.trim() || selectedIds.size === 0}
                className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-black py-4 px-6 rounded-xl transition-studio text-[11px] uppercase tracking-widest disabled:opacity-20 flex items-center justify-center gap-3 shadow-md"
            >
                {isProcessing ? 'SYNTHESIZING...' : <><MagicWandIcon className="w-4 h-4" /> RUN BATCH SEQUENCE</>}
            </button>
        </div>

        {/* Queue List */}
        <div className="flex-grow flex flex-col bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-input)]/50">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        checked={queue.length > 0 && selectedIds.size === queue.length}
                        onChange={toggleSelectAll}
                        disabled={queue.length === 0}
                        className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-[var(--text-main)] cursor-pointer"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                        Asset Queue ({queue.length})
                    </span>
                </div>
                <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-input)] px-2 py-1 rounded">
                    {selectedIds.size} READY
                </span>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2 min-h-[300px]">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-20 gap-3 py-20">
                        <StackIcon className="w-10 h-10" />
                        <p className="text-[10px] uppercase font-black tracking-widest">Queue is currently idle</p>
                    </div>
                ) : (
                    queue.map((item) => (
                        <div key={item.id} className={`flex items-center gap-4 p-3 rounded-2xl border transition-studio ${selectedIds.has(item.id) ? 'bg-[var(--bg-input)] border-[var(--border-color)]' : 'bg-transparent border-transparent hover:bg-[var(--bg-input)]/50'}`}>
                            <input 
                                type="checkbox" 
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelection(item.id)}
                                className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-[var(--text-main)]"
                            />
                            
                            <div className="w-12 h-12 rounded-xl bg-[var(--bg-input)] overflow-hidden flex-shrink-0 border border-[var(--border-color)]">
                                {item.resultUrl ? (
                                    <img src={item.resultUrl} alt="Result" className="w-full h-full object-cover" />
                                ) : (
                                    <img src={URL.createObjectURL(item.file)} alt="Source" className="w-full h-full object-cover opacity-60" />
                                )}
                            </div>

                            <div className="flex-grow min-w-0">
                                <p className="text-[11px] font-bold text-[var(--text-main)] truncate">{item.file.name}</p>
                                <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5 ${getStatusColor(item.status)}`}>
                                    {item.status}
                                    {item.status === 'success' && <CheckCircleIcon className="w-3 h-3" />}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                {item.resultUrl && (
                                    <a href={item.resultUrl} download={`batch-${item.file.name}`} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-studio">
                                        <UploadIcon className="w-4 h-4 rotate-180" />
                                    </a>
                                )}
                                <button onClick={() => onRemoveFromQueue(item.id)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-studio">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default BatchPanel;
