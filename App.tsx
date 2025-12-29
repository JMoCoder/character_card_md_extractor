
import React, { useState, useRef } from 'react';
import { extractTavernData, sanitizeFilename } from './services/pngMetadata';
import { generateEnhancedMarkdown } from './services/geminiService';
import { CharacterMetadata } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [aiStatus, setAiStatus] = useState<'idle' | 'working' | 'finished' | 'failed'>('idle');
  const [character, setCharacter] = useState<CharacterMetadata | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic Markdown template (for immediate display)
  const getBasicMarkdown = (char: CharacterMetadata) => `
# ${char.name}

> **Note**: This document was extracted from a Tavern character card.

## Personality
${char.personality || "(None)"}

## Description
${char.description || "(None)"}

## Scenario
${char.scenario || "(None)"}

## First Message
${char.first_mes || "(None)"}

## Examples
\`\`\`
${char.mes_example || "(None)"}
\`\`\`
  `.trim();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setStatus('processing');
    setAiStatus('idle');
    setCharacter(null);
    setMarkdown("");
    
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // 1. Extract metadata
      const data = await extractTavernData(file);
      
      if (!data) {
        setStatus('error');
        setError({
          title: "Read Failed",
          message: "No valid character card metadata found. Please ensure this is an original PNG file."
        });
        return;
      }
      
      // Set data and basic preview immediately
      setCharacter(data);
      const basicMd = getBasicMarkdown(data);
      setMarkdown(basicMd);
      setStatus('done');
      
      // 2. Async start AI enhancement
      setAiStatus('working');
      try {
        const enhancedMd = await generateEnhancedMarkdown(data);
        if (enhancedMd) {
          setMarkdown(enhancedMd);
          setAiStatus('finished');
        } else {
          setAiStatus('failed');
        }
      } catch (aiErr) {
        console.warn("AI enhancement failed, keeping basic version", aiErr);
        setAiStatus('failed');
      }

    } catch (err: any) {
      console.error("Parse exception:", err);
      setStatus('error');
      setError({
        title: "System Error",
        message: err.message || "Cannot process this file, please try another image."
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadMarkdown = () => {
    if (!markdown || !character) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(character.name)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0a0f1e] p-4 md:p-8 text-slate-200">
      <header className="w-full max-w-4xl mb-6 flex flex-col items-center">
        <div className="bg-indigo-600 p-3 rounded-2xl mb-4 shadow-xl shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        </div>
        <h1 className="text-3xl font-black text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-400">
          Tavern Card Extractor
        </h1>
      </header>

      <main className="w-full max-w-4xl space-y-6">
        {/* Upload & Preview Area */}
        <div 
          className={`
            relative group cursor-pointer border-2 border-dashed rounded-[2rem] p-8 transition-all duration-300 flex flex-col items-center justify-center min-h-[240px]
            ${status === 'done' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-indigo-500/5'}
            ${status === 'processing' ? 'animate-pulse pointer-events-none' : ''}
          `}
          onClick={() => status !== 'processing' && fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} className="w-36 h-36 object-cover rounded-xl mb-4 shadow-2xl ring-2 ring-white/5" alt="Preview" />
          ) : (
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-lg font-bold">
              {status === 'processing' ? 'Extracting metadata...' : 
               status === 'done' ? `Success: ${character?.name}` : 
               'Click to upload PNG Character Card'}
            </p>
            {aiStatus === 'working' && (
              <p className="text-xs text-indigo-400 mt-1 animate-pulse flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                AI is optimizing formatting...
              </p>
            )}
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png" className="hidden" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-5 rounded-3xl animate-in fade-in slide-in-from-top-2">
            <p className="font-bold text-red-400">{error.title}</p>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        )}

        {/* Result Display - Show whenever there is markdown content */}
        {markdown && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Markdown Preview
              </h3>
              
              <button 
                onClick={downloadMarkdown}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
              >
                <span>Download</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              </button>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
              {aiStatus === 'working' && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-950/60 backdrop-blur px-2 py-1 rounded-lg border border-white/5">
                   <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                   <span className="text-[10px] text-indigo-300 font-mono">AI Processing</span>
                </div>
              )}
              <div className="p-3 px-5 border-b border-slate-800 bg-slate-800/40">
                <span className="text-xs font-mono text-slate-500">{sanitizeFilename(character?.name || 'character')}.md</span>
              </div>
              <div className="p-6 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-slate-300 leading-relaxed max-h-[50vh] min-h-[200px] scrollbar-thin scrollbar-thumb-slate-700">
                {markdown}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-slate-700 text-[10px] tracking-widest text-center">
        TAVERN PNG EXTRACTOR V3.1
      </footer>
    </div>
  );
};

export default App;
