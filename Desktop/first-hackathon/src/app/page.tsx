"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [showGuide, setShowGuide] = useState(false);
  const [location, setLocation] = useState('PUNJAB,INDIA');

  useEffect(() => {
    setShowGuide(true);
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Use Nominatim API for reverse geocoding (free, no API key needed)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
              const state = data.address.state || data.address.region || '';
              const country = data.address.country || '';
              
              let locationStr = '';
              if (city && state) {
                locationStr = `${city.toUpperCase()},${state.toUpperCase()}`;
              } else if (city) {
                locationStr = `${city.toUpperCase()},${country.toUpperCase()}`;
              } else if (state) {
                locationStr = `${state.toUpperCase()},${country.toUpperCase()}`;
              } else {
                locationStr = country ? country.toUpperCase() : 'PUNJAB,INDIA';
              }
              
              setLocation(locationStr || 'PUNJAB,INDIA');
            } else {
              setLocation('PUNJAB,INDIA');
            }
          } catch (error) {
            console.error('Error fetching location:', error);
            setLocation('PUNJAB,INDIA');
          }
        },
        (error) => {
          // Permission denied or error - use default
          setLocation('PUNJAB,INDIA');
        }
      );
    } else {
      // Geolocation not supported - use default
      setLocation('PUNJAB,INDIA');
    }
  }, []);

  return (
    <div className="relative flex h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* --- USER GUIDE MODAL --- */}
      {showGuide && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="text-blue-500 font-bold mb-2 tracking-widest text-xs uppercase">Welcome, Pioneer</div>
            <h2 className="text-3xl font-black mb-4 tracking-tight text-white">User Guide</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">1</div>
                <p className="text-zinc-300 text-sm">Enter any skill or topic in the central "Construction" bar.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">2</div>
                <p className="text-zinc-300 text-sm">Click "Begin" to let PROGATH AI architect your roadmap.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">3</div>
                <p className="text-zinc-300 text-sm">Track your progress via the Sidebar Navigation.</p>
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
                className="w-full bg-transparent text-zinc-400 text-xs hover:text-white transition-all"
              >
                Skip Guide (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-6 hidden md:flex">
        <div className="text-xl font-black mb-10 tracking-tighter text-blue-500">PROGATH AI</div>
        <nav className="space-y-6 flex-1 text-sm">
          <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest">Dashboard</div>
          <ul className="space-y-4">
            <li className="text-white cursor-pointer flex items-center gap-2"><span>○</span> New Generation</li>
            <li className="text-zinc-400 cursor-pointer flex items-center gap-2 hover:text-white"><span>□</span> Saved Roadmaps</li>
            <li className="text-zinc-400 cursor-pointer flex items-center gap-2 hover:text-white"><span>△</span> Analytics</li>
          </ul>
        </nav>
        <div className="p-4 bg-zinc-950 rounded-2xl text-[10px] text-center border border-zinc-800 text-zinc-400">
          PROGATH V1.0 | <span className="text-green-400">ACTIVE</span>
        </div>
      </aside>

      {/* --- MAIN INTERFACE --- */}
      <main className="flex-1 flex flex-col bg-[#050505]">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8">
          <div className="text-xs text-zinc-400 tracking-widest uppercase">System Status: Optimal</div>
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

        <footer className="h-12 border-t border-zinc-800 flex items-center justify-between px-6 text-[10px] text-zinc-500 font-mono">
          <div>LOC: {location}</div>
          <div>EST_TIME: {new Date().toLocaleTimeString()}</div>
        </footer>
      </main>
    </div>
  );
}