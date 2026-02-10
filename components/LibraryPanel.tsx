
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Asset, Collection } from '../types';
import { GridIcon, FolderIcon, VideoCameraIcon, PhotoIcon, ArrowDownTrayIcon, PlusIcon, TrashIcon } from './icons';

interface LibraryPanelProps {
  assets: Asset[];
  collections: Collection[];
  onSelectAsset: (asset: Asset) => void;
  onDownloadAsset: (asset: Asset) => void;
  onDeleteCollection: (id: string) => void;
  onCreateCollection: (name: string) => void;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ assets, collections, onSelectAsset, onDownloadAsset, onDeleteCollection, onCreateCollection }) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const filteredAssets = assets.filter(a => {
      if (filterType === 'all') return true;
      return a.type === filterType;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const handleCreateCollection = () => {
      if (newCollectionName.trim()) {
          onCreateCollection(newCollectionName.trim());
          setNewCollectionName('');
          setShowCollectionModal(false);
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-app)] animate-studio-in">
        {/* Header */}
        <div className="p-8 md:p-12 pb-6 border-b border-[var(--border-color)] flex justify-between items-end">
            <div>
                <h1 className="text-xl font-black tracking-tight text-[var(--text-main)] mb-2 uppercase">Studio Library</h1>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">All saved assets • {assets.length} items</p>
            </div>
            
            <button 
                onClick={() => setShowCollectionModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-all shadow-sm"
            >
                <PlusIcon className="w-3.5 h-3.5" /> New Collection
            </button>
        </div>

        {/* Filters */}
        <div className="px-8 md:px-12 py-6 flex gap-3 overflow-x-auto custom-scrollbar">
            {['all', 'image', 'video'].map(type => (
                <button
                    key={type}
                    onClick={() => setFilterType(type as any)}
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        filterType === type 
                        ? 'bg-white text-black border-white shadow-md' 
                        : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-white/5 hover:border-white/20'
                    }`}
                >
                    {type === 'all' ? 'All Assets' : `${type}s`}
                </button>
            ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 pt-0">
            {filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)] opacity-30 border border-dashed border-[var(--border-color)] rounded-[2rem] bg-[var(--bg-input)]/20">
                    <GridIcon className="w-10 h-10 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Library Empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredAssets.map(asset => (
                        <div key={asset.id} className="group relative aspect-[4/5] bg-[var(--bg-panel)] rounded-2xl overflow-hidden border border-[var(--border-color)] hover:border-white/20 transition-all shadow-sm hover:shadow-xl">
                            {asset.type === 'video' ? (
                                <video src={asset.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            )}
                            
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10">
                                {asset.type === 'video' ? <VideoCameraIcon className="w-3 h-3 text-white" /> : <PhotoIcon className="w-3 h-3 text-white" />}
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 gap-3">
                                <p className="text-[9px] font-bold text-white truncate uppercase tracking-wide">{asset.name}</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onSelectAsset(asset)}
                                        className="flex-1 bg-white text-black py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
                                    >
                                        View
                                    </button>
                                    <button 
                                        onClick={() => onDownloadAsset(asset)}
                                        className="p-2.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg transition-colors border border-white/20"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Collections Section */}
            {collections.length > 0 && (
                <div className="mt-16 pt-12 border-t border-[var(--border-color)]">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-8">Collections</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {collections.map(col => (
                            <div key={col.id} className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl p-6 hover:border-white/20 transition-all group relative">
                                <div className="flex items-center justify-between mb-6">
                                    <FolderIcon className="w-6 h-6 text-[var(--text-muted)] group-hover:text-white transition-colors" />
                                    <span className="text-[9px] font-mono text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded">{col.assetIds.length} items</span>
                                </div>
                                <h3 className="text-sm font-bold text-white">{col.name}</h3>
                                <p className="text-[9px] text-[var(--text-muted)] mt-1 opacity-60 uppercase tracking-wide">{new Date(col.createdAt).toLocaleDateString()}</p>
                                
                                <button 
                                    onClick={() => onDeleteCollection(col.id)} 
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Create Collection Modal */}
        {showCollectionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-studio-in">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">New Collection</h3>
                    <p className="text-[10px] text-[var(--text-muted)] mb-6 font-medium">Organize your assets into dedicated project folders.</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Collection Name</label>
                            <input 
                                type="text" 
                                value={newCollectionName} 
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-4 text-[11px] font-bold text-white focus:border-white outline-none transition-all"
                                placeholder="e.g. Campaign Q1"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowCollectionModal(false)}
                                className="flex-1 py-3.5 rounded-xl bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors border border-[var(--border-color)]"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateCollection}
                                disabled={!newCollectionName.trim()}
                                className="flex-1 py-3.5 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                Create Folder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default LibraryPanel;
