
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import Tooltip from './Tooltip';
import { 
    RefreshIcon, 
    MaximizeIcon, 
    MinimizeIcon, 
    DevicePhoneIcon, 
    DeviceTabletIcon, 
    MonitorIcon, 
    PlusIcon, 
    UserIcon, 
    LogOutIcon 
} from './icons';

interface HeaderProps {
    onLibraryClick?: () => void;
    activeView?: 'workspace' | 'library';
    onHomeClick: () => void;
    onAccountClick?: () => void;
    onNewProject?: () => void;
    currentViewport?: 'desktop' | 'tablet' | 'mobile';
    onViewportChange?: (view: 'desktop' | 'tablet' | 'mobile') => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onLibraryClick, 
    activeView = 'workspace', 
    onHomeClick, 
    onAccountClick,
    onNewProject,
    currentViewport = 'desktop',
    onViewportChange
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((e) => console.error(e));
      } else {
          document.exitFullscreen();
      }
  };

  const handleReload = () => {
      window.location.reload();
  };

  return (
    <header className="w-full h-16 px-6 flex items-center justify-between z-50 shrink-0 relative bg-[var(--bg-app)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="flex items-center gap-8">
            <button 
                onClick={onHomeClick}
                className="flex items-center gap-3 group transition-studio outline-none"
                aria-label="Studio Dashboard"
            >
                <div className="w-6 h-6 bg-[var(--text-main)] rounded-md flex items-center justify-center shadow-sm transition-transform group-hover:scale-95">
                    <div className="w-2 h-2 bg-[var(--bg-app)] rounded-full"></div>
                </div>
                <h1 className="text-xs font-black tracking-[0.3em] text-[var(--text-main)] uppercase leading-none md:block hidden opacity-90 group-hover:opacity-100">MIVA</h1>
            </button>
            
            <nav className="hidden md:flex items-center gap-1 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-color)]" aria-label="Main Navigation">
                {[
                    { id: 'workspace', label: 'Workspace', active: activeView === 'workspace' },
                    { id: 'library', label: 'Library', active: activeView === 'library' }
                ].map(view => (
                    <button 
                        key={view.id}
                        onClick={() => activeView !== view.id && onLibraryClick?.()}
                        className={`text-[9px] font-bold tracking-widest uppercase transition-all px-4 py-1.5 rounded-md ${
                            view.active 
                            ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm' 
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]/50'
                        }`}
                    >
                        {view.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
            
            {/* Viewport & Utility Tools */}
            <div className="flex items-center gap-1 pr-4 border-r border-[var(--border-color)]">
                {onNewProject && (
                    <button 
                        onClick={onNewProject}
                        className="flex items-center gap-2 px-3 py-1.5 mr-2 bg-[var(--bg-input)] hover:bg-emerald-500 hover:text-white transition-colors rounded-lg border border-[var(--border-color)] hover:border-emerald-500 shadow-sm text-[9px] font-black uppercase tracking-widest text-[var(--text-main)]"
                    >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Create New</span>
                    </button>
                )}

                {activeView === 'workspace' && onViewportChange && (
                    <div className="hidden lg:flex items-center gap-1 mr-2">
                        {[
                            { id: 'mobile', icon: <DevicePhoneIcon className="w-3.5 h-3.5" />, label: 'Mobile' },
                            { id: 'tablet', icon: <DeviceTabletIcon className="w-3.5 h-3.5" />, label: 'Tablet' },
                            { id: 'desktop', icon: <MonitorIcon className="w-3.5 h-3.5" />, label: 'Desktop' }
                        ].map(mode => (
                            <Tooltip key={mode.id} text={mode.label} position="bottom">
                                <button
                                    onClick={() => onViewportChange(mode.id as any)}
                                    className={`p-2 rounded-lg transition-all ${currentViewport === mode.id ? 'bg-[var(--bg-input)] text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    {mode.icon}
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                )}

                <Tooltip text="Reload" position="bottom">
                    <button onClick={handleReload} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors rounded-lg hover:bg-[var(--bg-input)]">
                        <RefreshIcon className="w-3.5 h-3.5" />
                    </button>
                </Tooltip>
                
                <Tooltip text={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} position="bottom">
                    <button onClick={toggleFullscreen} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors rounded-lg hover:bg-[var(--bg-input)]">
                        {isFullscreen ? <MinimizeIcon className="w-3.5 h-3.5" /> : <MaximizeIcon className="w-3.5 h-3.5" />}
                    </button>
                </Tooltip>
            </div>

            <ThemeSwitcher />
            
            <div className="relative" ref={profileRef}>
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`w-8 h-8 rounded-full bg-[var(--bg-input)] border flex items-center justify-center text-[10px] font-black transition-studio shadow-sm hover:scale-105 active:scale-95 ${
                        isProfileOpen ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                >
                    AM
                </button>

                {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl shadow-premium overflow-hidden animate-slide-up origin-top-right z-50">
                        {/* User Info Header */}
                        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/30">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--text-main)] text-[var(--bg-app)] flex items-center justify-center text-[11px] font-black shadow-sm">AM</div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest">Nur Amirah</p>
                                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-medium">amirah@miva.studio</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Obsidian Tier</span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-1.5 space-y-0.5">
                            <button 
                                onClick={() => { onAccountClick?.(); setIsProfileOpen(false); }} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] rounded-lg transition-colors group"
                            >
                                <UserIcon className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
                                My Profile
                            </button>
                            
                            <div className="h-px bg-[var(--border-color)] my-1.5 mx-2"></div>
                            
                            <button 
                                onClick={() => setIsProfileOpen(false)} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10 rounded-lg transition-colors group"
                            >
                                <LogOutIcon className="w-3.5 h-3.5 text-red-400 group-hover:text-red-500 transition-colors" />
                                Sign Out
                            </button>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-2 bg-[var(--bg-input)]/30 border-t border-[var(--border-color)] text-center">
                            <p className="text-[8px] text-[var(--text-muted)] font-mono opacity-40">MIVA Studio v2.5.0</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default Header;
