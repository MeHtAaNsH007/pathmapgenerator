import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 font-sans">
      <div className="max-w-3xl w-full text-center space-y-8">
        <header className="space-y-2">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent">
            PROGATH
          </h1>
          <p className="text-xl text-gray-500 font-light tracking-widest uppercase">
            The Smart Path
          </p>
        </header>

        <div className="relative mt-12 group">
          <input 
            type="text" 
            placeholder="Enter any topic (e.g. Web Development)" 
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-5 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
          <button className="mt-6 w-full md:w-auto bg-white text-black font-bold py-4 px-10 rounded-xl hover:bg-gray-200 transition-colors">
            Generate Learning Roadmap
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
            <h3 className="text-blue-500 font-mono text-sm mb-2">01. ANALYZE</h3>
            <p className="text-gray-400 text-sm">AI identifies core concepts.</p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
            <h3 className="text-blue-500 font-mono text-sm mb-2">02. STRUCTURE</h3>
            <p className="text-gray-400 text-sm">Weekly tasks generated.</p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
            <h3 className="text-blue-500 font-mono text-sm mb-2">03. MASTER</h3>
            <p className="text-gray-400 text-sm">Track your progress live.</p>
          </div>
        </div>
      </div>
    </main>
  );
}