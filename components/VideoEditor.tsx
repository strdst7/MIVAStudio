
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, SaveIcon, XMarkIcon, PlusIcon, ScissorsIcon, PaletteIcon, FilmIcon, ChevronUpIcon, ChevronDownIcon, FolderOpenIcon, ArrowDownTrayIcon } from './icons';
import Tooltip from './Tooltip';

interface VideoClip {
  id: string;
  url: string; // Blob URL
  name?: string;
  duration?: number;
}

interface EditorClip {
  id: string;
  sourceUrl: string;
  filter: string;
  startTime: number;
  endTime: number;
  duration: number; // approximate duration of the whole source
}

interface VideoEditorProps {
  initialVideoUrl: string;
  library: VideoClip[]; // Other available videos to merge
  onSave: (newVideoBlob: Blob) => void;
  onCancel: () => void;
}

const FILTERS = [
    { name: 'None', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(80%)' },
    { name: 'Vivid', value: 'saturate(150%)' },
    { name: 'Cool', value: 'hue-rotate(180deg) contrast(110%)' },
    { name: 'Warm', value: 'sepia(30%) saturate(140%)' },
    { name: 'Fade', value: 'opacity(80%) brightness(110%)' },
    { name: 'Dark', value: 'brightness(70%) contrast(120%)' },
];

const VideoEditor: React.FC<VideoEditorProps> = ({ initialVideoUrl, library, onSave, onCancel }) => {
  // Timeline State
  const [clips, setClips] = useState<EditorClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<{ active: boolean }>({ active: false });
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Add initial clip
  useEffect(() => {
    // We need to load metadata to get duration for trimming
    const vid = document.createElement('video');
    vid.src = initialVideoUrl;
    vid.onloadedmetadata = () => {
        const id = `clip-${Date.now()}`;
        setClips([{
            id,
            sourceUrl: initialVideoUrl,
            filter: 'none',
            startTime: 0,
            endTime: vid.duration,
            duration: vid.duration
        }]);
        setSelectedClipId(id);
    };
  }, [initialVideoUrl]);

  const activeClip = clips.find(c => c.id === selectedClipId);

  const handleUpdateClip = (updates: Partial<EditorClip>) => {
      if (!selectedClipId) return;
      setClips(prev => prev.map(c => c.id === selectedClipId ? { ...c, ...updates } : c));
  };

  const handleAddClip = (url: string) => {
      const vid = document.createElement('video');
      vid.src = url;
      vid.onloadedmetadata = () => {
          const id = `clip-${Date.now()}-${Math.random()}`;
          const newClip = {
              id,
              sourceUrl: url,
              filter: 'none',
              startTime: 0,
              endTime: vid.duration,
              duration: vid.duration
          };
          setClips(prev => [...prev, newClip]);
          setSelectedClipId(id);
      };
  };

  const handleRemoveClip = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (clips.length <= 1) return; // Prevent removing last clip
      const newClips = clips.filter(c => c.id !== id);
      setClips(newClips);
      if (selectedClipId === id) setSelectedClipId(newClips[0].id);
  };

  const handleMoveClip = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
      e.stopPropagation();
      const newClips = [...clips];
      if (direction === 'up' && index > 0) {
          [newClips[index], newClips[index - 1]] = [newClips[index - 1], newClips[index]];
      } else if (direction === 'down' && index < clips.length - 1) {
          [newClips[index], newClips[index + 1]] = [newClips[index + 1], newClips[index]];
      }
      setClips(newClips);
  };

  const handleSaveProject = () => {
      const projectData = {
          version: '1.0',
          createdAt: Date.now(),
          clips: clips
      };
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `miva-project-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const project = JSON.parse(event.target?.result as string);
              if (project.clips && Array.isArray(project.clips)) {
                  setClips(project.clips);
                  if (project.clips.length > 0) {
                      setSelectedClipId(project.clips[0].id);
                  }
                  alert('Project loaded successfully. Note: External source URLs must still be valid.');
              } else {
                  alert('Invalid project file format.');
              }
          } catch (err) {
              console.error(err);
              alert('Failed to load project file.');
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };

  const handleExport = async () => {
      if (!canvasRef.current || clips.length === 0) return;
      setIsProcessing(true);
      setProgress(0);
      processingRef.current.active = true;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create a hidden video element for processing
      const procVideo = document.createElement('video');
      procVideo.muted = true;
      procVideo.crossOrigin = 'anonymous'; // Though we use blob URLs, this is good practice
      
      const stream = canvas.captureStream(30); // Capture at 30 FPS
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.start();

      const totalDuration = clips.reduce((acc, c) => acc + (c.endTime - c.startTime), 0);
      let processedDuration = 0;

      for (const clip of clips) {
          if (!processingRef.current.active) break;

          // Load clip
          procVideo.src = clip.sourceUrl;
          await new Promise<void>((resolve) => {
              procVideo.onloadedmetadata = () => resolve();
          });

          // Set dimensions
          canvas.width = procVideo.videoWidth;
          canvas.height = procVideo.videoHeight;
          
          procVideo.currentTime = clip.startTime;
          await procVideo.play();

          // Render loop for this clip
          while (procVideo.currentTime < clip.endTime && !procVideo.ended && processingRef.current.active) {
              ctx.filter = clip.filter;
              ctx.drawImage(procVideo, 0, 0, canvas.width, canvas.height);
              
              // Simple progress estimation
              const currentGlobal = processedDuration + (procVideo.currentTime - clip.startTime);
              setProgress(Math.min((currentGlobal / totalDuration) * 100, 99));

              // Wait for next frame (approx 30fps)
              await new Promise(r => setTimeout(r, 33)); 
          }
          
          procVideo.pause();
          processedDuration += (clip.endTime - clip.startTime);
      }

      recorder.stop();
      recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          onSave(blob);
          setIsProcessing(false);
          processingRef.current.active = false;
      };
  };

  const togglePlay = () => {
      if (videoRef.current) {
          if (isPlaying) {
              videoRef.current.pause();
          } else {
              videoRef.current.play();
          }
          setIsPlaying(!isPlaying);
      }
  };

  // Sync preview video with active clip settings
  useEffect(() => {
     if (videoRef.current && activeClip) {
         // If source changed, update it. Note: changing src pauses video.
         if (videoRef.current.src !== activeClip.sourceUrl) {
             videoRef.current.src = activeClip.sourceUrl;
         }
         // Important: Jump to start time when selecting a different clip
         videoRef.current.currentTime = activeClip.startTime;
         setIsPlaying(false);
     }
  }, [selectedClipId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-6">
        <div className="w-full max-w-6xl h-[85vh] glass-morphism rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)] bg-[var(--bg-panel)]/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--text-main)] text-[var(--bg-app)] rounded-lg">
                        <FilmIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-main)]">Video Editor Suite</h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <Tooltip text="Load Project File">
                        <button 
                            onClick={() => projectInputRef.current?.click()}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] rounded-lg transition-colors"
                        >
                            <FolderOpenIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <input 
                        type="file" 
                        ref={projectInputRef}
                        onChange={handleLoadProject}
                        accept=".json"
                        className="hidden" 
                    />
                    
                    <Tooltip text="Save Project File">
                        <button 
                            onClick={handleSaveProject}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] rounded-lg transition-colors"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>

                    <div className="h-6 w-px bg-[var(--border-color)] mx-2"></div>

                    <button onClick={onCancel} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                
                {/* Preview Player */}
                <div className="flex-grow bg-black flex items-center justify-center relative p-8">
                    {activeClip ? (
                        <>
                            <video 
                                ref={videoRef}
                                className="max-w-full max-h-full rounded-xl shadow-2xl"
                                style={{ filter: activeClip.filter !== 'none' ? activeClip.filter : undefined }}
                                onTimeUpdate={(e) => {
                                    setCurrentTime(e.currentTarget.currentTime);
                                    // Auto-loop preview within trim bounds
                                    if (e.currentTarget.currentTime >= activeClip.endTime) {
                                        e.currentTarget.currentTime = activeClip.startTime;
                                    }
                                }}
                                onEnded={() => setIsPlaying(false)}
                                playsInline
                            />
                            
                            {/* Hidden canvas for processing */}
                            <canvas ref={canvasRef} className="hidden" />

                            <div className="absolute bottom-10 flex gap-4 bg-[var(--bg-panel)]/80 backdrop-blur-md p-2 pl-4 pr-4 rounded-full border border-[var(--border-color)] shadow-xl">
                                <button onClick={togglePlay} className="text-[var(--text-main)] hover:text-[var(--accent-color)] transition-colors">
                                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                </button>
                                <div className="w-px h-4 bg-[var(--border-color)] self-center"></div>
                                <span className="text-[10px] text-[var(--text-main)] font-mono self-center">
                                    {currentTime.toFixed(1)}s <span className="text-[var(--text-muted)]">/</span> {activeClip.duration.toFixed(1)}s
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4 opacity-50">
                             <FilmIcon className="w-12 h-12 text-white" />
                             <p className="text-[10px] uppercase font-black tracking-widest text-white">No clip selected</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="w-full lg:w-96 bg-[var(--bg-sidebar)]/80 border-l border-[var(--border-color)] flex flex-col p-6 gap-8 overflow-y-auto custom-scrollbar backdrop-blur-sm">
                    
                    {/* Filter Section */}
                    <div>
                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <PaletteIcon className="w-4 h-4" /> Filters
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {FILTERS.map(f => (
                                <button
                                    key={f.name}
                                    onClick={() => handleUpdateClip({ filter: f.value })}
                                    className={`py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        activeClip?.filter === f.value
                                        ? 'bg-[var(--text-main)] text-[var(--bg-app)] shadow-md'
                                        : 'bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--text-muted)]'
                                    }`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trim Section */}
                    <div>
                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ScissorsIcon className="w-4 h-4" /> Trim
                        </h4>
                        <div className="flex flex-col gap-4 bg-[var(--bg-panel)]/50 p-5 rounded-2xl border border-[var(--border-color)]">
                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Start</label>
                                    <span className="text-[10px] text-[var(--text-main)] font-mono">{activeClip?.startTime.toFixed(1)}s</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={0} 
                                    max={activeClip?.duration || 10} 
                                    step={0.1}
                                    value={activeClip?.startTime || 0}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val < (activeClip?.endTime || 10)) {
                                            handleUpdateClip({ startTime: val });
                                            if (videoRef.current) videoRef.current.currentTime = val;
                                        }
                                    }}
                                    className="w-full h-1 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--text-main)]"
                                />
                             </div>

                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">End</label>
                                    <span className="text-[10px] text-[var(--text-main)] font-mono">{activeClip?.endTime.toFixed(1)}s</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={0} 
                                    max={activeClip?.duration || 10} 
                                    step={0.1}
                                    value={activeClip?.endTime || 0}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > (activeClip?.startTime || 0)) {
                                            handleUpdateClip({ endTime: val });
                                        }
                                    }}
                                    className="w-full h-1 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--text-main)]"
                                />
                             </div>
                        </div>
                    </div>

                    {/* Timeline / Merge Section */}
                    <div className="flex-grow">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Timeline</h4>
                            {library.length > 0 && (
                                <div className="relative group">
                                    <button className="p-1.5 hover:bg-[var(--bg-input)] rounded-lg text-[var(--text-main)] transition-colors border border-transparent hover:border-[var(--border-color)]">
                                        <PlusIcon className="w-3.5 h-3.5" />
                                    </button>
                                    {/* Dropdown for clips */}
                                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                                        <div className="p-3 text-[9px] font-black uppercase tracking-widest border-b border-[var(--border-color)] bg-[var(--bg-input)]">Add Clip</div>
                                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                            {library.map((vid, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAddClip(vid.url)}
                                                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] truncate transition-colors"
                                                >
                                                    Clip #{idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {clips.map((clip, idx) => (
                                <div 
                                    key={clip.id}
                                    onClick={() => setSelectedClipId(clip.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group relative ${
                                        selectedClipId === clip.id 
                                        ? 'bg-[var(--bg-input)] border-[var(--text-main)] shadow-sm' 
                                        : 'bg-transparent border-[var(--border-color)] hover:bg-[var(--bg-input)]'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-bold ${selectedClipId === clip.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Clip {idx + 1}</span>
                                        <span className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">
                                            {(clip.endTime - clip.startTime).toFixed(1)}s • {clip.filter}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <div className="flex flex-col gap-0.5">
                                            {idx > 0 && (
                                                <button onClick={(e) => handleMoveClip(e, idx, 'up')} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                                    <ChevronUpIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                            {idx < clips.length - 1 && (
                                                <button onClick={(e) => handleMoveClip(e, idx, 'down')} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                                    <ChevronDownIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        {clips.length > 1 && (
                                            <button 
                                                onClick={(e) => handleRemoveClip(e, clip.id)}
                                                className="text-[var(--text-muted)] hover:text-red-400 p-1 transition-colors"
                                            >
                                                <XMarkIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isProcessing}
                        className="w-full bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-app)] font-black py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 mt-auto text-[11px] uppercase tracking-widest active:scale-[0.98]"
                    >
                        {isProcessing ? 'Rendering...' : (
                            <>
                                <SaveIcon className="w-4 h-4" />
                                Export Video
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="absolute inset-0 z-[70] bg-[var(--bg-app)]/90 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                    <div className="w-12 h-12 border-2 border-[var(--text-main)] border-t-transparent rounded-full animate-spin"></div>
                    <h3 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[0.2em]">Rendering Final Cut...</h3>
                    <div className="w-64 h-1 bg-[var(--bg-input)] rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-[var(--text-main)] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default VideoEditor;
