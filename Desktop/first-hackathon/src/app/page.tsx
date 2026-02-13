"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setShowGuide(true);
  }, []);

  return (
    <div className="relative flex h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* --- USER GUIDE MODAL --- */}
      {showGuide && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent font-bold mb-2 tracking-widest text-xs uppercase">Welcome, Pioneer</div>
            <h2 className="text-3xl font-black mb-4 tracking-tight bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent">User Guide</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">1</div>
                <p className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent text-sm">Enter any skill or topic in the central "Construction" bar.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">2</div>
                <p className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent text-sm">Click "Begin" to let PROGATH AI architect your roadmap.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">3</div>
                <p className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent text-sm">Track your progress via the Sidebar Navigation.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all"
              >
                Get Started
              </button>
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full bg-transparent bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent text-xs hover:opacity-80 transition-all"
              >
                Skip Guide (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-6 hidden md:flex">
        <div className="text-xl font-black mb-10 tracking-tighter bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent">PROGATH AI</div>
        <nav className="space-y-6 flex-1 text-sm">
          <div className="text-[10px] uppercase bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent font-bold tracking-widest">Dashboard</div>
          <ul className="space-y-4">
            <li className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent cursor-pointer flex items-center gap-2"><span>○</span> New Generation</li>
            <li className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent cursor-pointer flex items-center gap-2 hover:opacity-80"><span>□</span> Saved Roadmaps</li>
            <li className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent cursor-pointer flex items-center gap-2 hover:opacity-80"><span>△</span> Analytics</li>
          </ul>
        </nav>
        <div className="p-4 bg-zinc-950 rounded-2xl text-[10px] text-center border border-zinc-800 bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent">
          PROGATH V1.0 | <span className="bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent">ACTIVE</span>
        </div>
      </aside>

      {/* --- MAIN INTERFACE --- */}
      <main className="flex-1 flex flex-col bg-[#050505]">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8">
          <div className="text-xs bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent tracking-widest uppercase">System Status: Optimal</div>
          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-xl w-full text-center space-y-10">
            <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-gray-900 to-gray-400 bg-clip-text text-transparent">
              PROGATH
            </h1>
            <p className="text-xl bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent font-light tracking-widest uppercase mt-4">
              The Smart Path
            </p>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Architect your learning path..." 
                className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-5 rounded-2xl focus:outline-none focus:border-blue-500 transition-all shadow-inner"
              />
              <button className="w-full md:w-auto bg-blue-600 px-12 py-4 rounded-xl font-bold hover:bg-blue-500 active:scale-95 transition-all">
                Begin Construction
              </button>
            </div>
          </div>
        </div>

        <footer className="h-12 border-t border-zinc-800 flex items-center justify-between px-6 text-[10px] bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent font-mono">
          <div>LOC: MUMBAI_IN</div>
          <div>EST_TIME: {new Date().toLocaleTimeString()}</div>
        </footer>
      </main>
    </div>
  );
}