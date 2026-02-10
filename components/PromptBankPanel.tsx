
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SavedPrompt } from '../types';
import { TrashIcon, BookOpenIcon, PlusIcon, CheckCircleIcon, DocumentDuplicateIcon, SettingsIcon } from './icons';
import Tooltip from './Tooltip';

interface PromptBankPanelProps {
  prompts: SavedPrompt[];
  onAddPrompt: (name: string, content: string, category: string) => void;
  onDeletePrompt: (id: string) => void;
  onUpdatePrompt: (id: string, updates: Partial<SavedPrompt>) => void;
  onUsePrompt: (prompt: SavedPrompt) => void;
}

const PromptBankPanel: React.FC<PromptBankPanelProps> = ({ prompts, onAddPrompt, onDeletePrompt, onUpdatePrompt, onUsePrompt }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [filterCategory, setFilterCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', ...Array.from(new Set(prompts.map(p => p.category)))];

  const handleAdd = () => {
      if (newName.trim() && newContent.trim()) {
          onAddPrompt(newName.trim(), newContent.trim(), newCategory.trim());
          setIsAdding(false);
          setNewName('');
          setNewContent('');
      }
  };

  const filteredPrompts = prompts.filter(p => {
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in h-full">
        {/* Header */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-6 shadow-premium">
             <div className="flex flex-col items-center text-center">
                <div className="bg-[var(--bg-input)] p-4 rounded-[1.2rem] border border-white/5 mb-3">
                    <BookOpenIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[11px] font-black tracking-[0.2em] uppercase">Prompt Bank</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium leading-relaxed opacity-60">
                    Your personal repository of high-fidelity synthesis logic.
                </p>
            </div>

            {!isAdding ? (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full bg-white text-black font-black py-4 px-6 rounded-2xl transition-studio text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" /> Add New Prompt
                </button>
            ) : (
                <div className="space-y-3 bg-[var(--bg-input)] p-4 rounded-2xl border border-white/10 animate-slide-up">
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        placeholder="Prompt Name" 
                        className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] text-white rounded-lg p-2.5 text-[11px] font-bold focus:border-white transition-all outline-none"
                    />
                    <select 
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] text-white rounded-lg p-2.5 text-[11px] font-bold focus:border-white transition-all outline-none"
                    >
                        <option>General</option>
                        <option>Subject</option>
                        <option>Style</option>
                        <option>Editorial</option>
                        <option>Lighting</option>
                    </select>
                    <textarea 
                        value={newContent} 
                        onChange={(e) => setNewContent(e.target.value)} 
                        placeholder="Enter synthesis prompt..." 
                        className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] text-white rounded-lg p-2.5 text-[11px] font-medium focus:border-white transition-all outline-none h-20 resize-none"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsAdding(false)} className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-white/5">Cancel</button>
                        <button onClick={handleAdd} disabled={!newName || !newContent} className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 disabled:opacity-50">Save</button>
                    </div>
                </div>
            )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                        filterCategory === cat 
                        ? 'bg-white text-black border-white' 
                        : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-white/5 hover:border-white/20'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Search */}
        <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repository..."
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-white rounded-xl p-3 text-[11px] font-medium focus:border-white transition-all outline-none placeholder:text-[var(--text-muted)]/50"
        />

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[200px]">
            {filteredPrompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-30 py-10">
                    <BookOpenIcon className="w-8 h-8 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No prompts found</p>
                </div>
            ) : (
                filteredPrompts.map(prompt => (
                    <div key={prompt.id} className="group bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-4 hover:border-white/20 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[11px] font-bold text-white">{prompt.name}</h4>
                                    {prompt.settings && (
                                        <Tooltip text={`${prompt.settings.resolution || '?'} • ${prompt.settings.aspectRatio || '?'}`}>
                                            <SettingsIcon className="w-3 h-3 text-[var(--text-muted)]" />
                                        </Tooltip>
                                    )}
                                </div>
                                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded mt-1 inline-block">{prompt.category}</span>
                            </div>
                            <button onClick={() => onDeletePrompt(prompt.id)} className="text-[var(--text-muted)] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] line-clamp-3 mb-3 font-medium leading-relaxed">
                            {prompt.content}
                        </p>
                        <button 
                            onClick={() => onUsePrompt(prompt)}
                            className="w-full py-2 rounded-lg bg-[var(--bg-input)] hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white transition-colors flex items-center justify-center gap-2 border border-white/5"
                        >
                            <DocumentDuplicateIcon className="w-3 h-3" /> Load Logic
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default PromptBankPanel;
