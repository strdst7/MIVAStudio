
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { UserIcon, CreditCardIcon, SettingsIcon, LogOutIcon, CheckCircleIcon } from './icons';

const AccountPanel: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-6 animate-studio-in">
        <div className="glass-morphism rounded-[2rem] p-8 flex flex-col items-center gap-6 shadow-premium">
             <div className="relative">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[var(--text-main)] to-gray-600 flex items-center justify-center text-[var(--bg-app)] shadow-xl">
                    <span className="text-2xl font-black">AM</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border-2 border-[var(--bg-panel)]">
                    Pro
                </div>
             </div>
             
             <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Nur Amirah Mohd Kamil</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">amirah@miva.studio</p>
             </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Subscription & Plan</h4>
            <div className="glass-morphism rounded-[2rem] p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <CreditCardIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-[var(--text-main)]">Obsidian Tier</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Next billing: Oct 24, 2025</p>
                    </div>
                </div>
                <div className="h-px bg-[var(--border-color)]"></div>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--text-muted)] font-medium">Credits Remaining</span>
                    <span className="text-[var(--text-main)] font-mono font-bold">∞</span>
                </div>
                <div className="w-full bg-[var(--bg-input)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 w-full h-full"></div>
                </div>
                <button className="w-full py-3 rounded-xl bg-[var(--bg-input)] hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-colors border border-white/5">
                    Manage Billing
                </button>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">System</h4>
            <div className="glass-morphism rounded-[2rem] overflow-hidden">
                <button className="w-full flex items-center gap-4 p-4 hover:bg-[var(--bg-input)] transition-colors border-b border-[var(--border-color)] text-left group">
                    <SettingsIcon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
                    <span className="text-[11px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-main)] uppercase tracking-widest transition-colors">Preferences</span>
                </button>
                <button className="w-full flex items-center gap-4 p-4 hover:bg-red-500/5 transition-colors text-left group">
                    <LogOutIcon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-red-400 transition-colors" />
                    <span className="text-[11px] font-bold text-[var(--text-muted)] group-hover:text-red-400 uppercase tracking-widest transition-colors">Log Out</span>
                </button>
            </div>
        </div>
        
        <div className="text-center pt-6 opacity-30">
            <p className="text-[9px] font-mono text-[var(--text-muted)]">MIVA Studio v2.5.0 (Build 9842)</p>
        </div>
    </div>
  );
};

export default AccountPanel;
