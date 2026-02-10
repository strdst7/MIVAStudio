
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

interface EditPresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string, category: string) => void;
  initialName: string;
  initialPrompt: string;
  initialCategory?: string;
  title?: string;
}

const EditPresetDialog: React.FC<EditPresetDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialPrompt,
  initialCategory = '',
  title = 'Edit Preset',
}) => {
  const [name, setName] = useState(initialName);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPrompt(initialPrompt);
      setCategory(initialCategory || '');
    }
  }, [isOpen, initialName, initialPrompt, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && prompt.trim()) {
      onSave(name.trim(), prompt.trim(), category.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
      <div 
        className="w-full max-w-lg glass-morphism rounded-xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-panel)]/50">
          <h3 className="text-xl font-bold text-[var(--text-main)]">{title}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">Organize and customize your preset.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 bg-transparent">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Preset Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
              placeholder="e.g., Cinematic Glow"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Category (Optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
              placeholder="e.g., Portraits, Landscapes"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition resize-none leading-relaxed text-sm"
              placeholder="Describe the effect..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !prompt.trim()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPresetDialog;
