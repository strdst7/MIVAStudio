
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface SavePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, category: string) => void;
  title?: string;
}

const SavePromptDialog: React.FC<SavePromptDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Save to Bank',
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), category.trim());
      setName('');
      setCategory('General');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div 
        className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-input)]/50">
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">{title}</h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Archive your synthesis logic for future use.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Logic Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3.5 text-[11px] font-bold focus:border-white transition-all outline-none"
              placeholder="e.g. Cinematic Noir V2"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Category</label>
            <div className="relative">
                <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-3.5 text-[11px] font-bold focus:border-white transition-all outline-none appearance-none"
                >
                <option>General</option>
                <option>Editorial</option>
                <option>Cinematic</option>
                <option>Product</option>
                <option>Portrait</option>
                <option>Abstract</option>
                <option>UGC</option>
                <option>Architecture</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors border border-[var(--border-color)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Logic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavePromptDialog;
