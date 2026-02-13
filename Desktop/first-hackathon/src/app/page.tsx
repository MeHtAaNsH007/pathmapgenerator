"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [showGuide, setShowGuide] = useState(false);
  const [location, setLocation] = useState('PUNJAB,INDIA');
  const [coordinates, setCoordinates] = useState({ lat: 30.7333, lon: 76.7794 }); // Default Punjab coordinates
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [duration, setDuration] = useState('3 Months');
  const [difficulty, setDifficulty] = useState('Intermediate');
  
  // Sample recent activity data - in production, this would come from localStorage or API
  const [recentActivity] = useState([
    { topic: 'Python', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago
    { topic: 'Guitar', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) }, // 5 hours ago
    { topic: 'Web Development', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 1 day ago
    { topic: 'Machine Learning', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // 3 days ago
  ]);

  // Get icon letter from topic name
  const getTopicIcon = (topic: string) => {
    return topic.charAt(0).toUpperCase();
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  useEffect(() => {
    setShowGuide(true);
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setCoordinates({ lat: latitude, lon: longitude });
            
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

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSettings && !target.closest('.settings-dropdown-container')) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

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
          <ul className="space-y-4 mb-8">
            <li className="text-white cursor-pointer flex items-center gap-2"><span>○</span> New Generation</li>
            <li className="text-zinc-400 cursor-pointer flex items-center gap-2 hover:text-white"><span>□</span> Saved Roadmaps</li>
            <li className="text-zinc-400 cursor-pointer flex items-center gap-2 hover:text-white"><span>△</span> Analytics</li>
          </ul>
          
          {/* Recent Activity History */}
          <div className="border-t border-zinc-800 pt-6">
            <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest mb-4">Recent Activity</div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold border border-blue-500/30 flex-shrink-0">
                    {getTopicIcon(activity.topic)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate group-hover:text-blue-400 transition-colors">
                      {activity.topic}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>
        
        {/* Active Architect Profile */}
        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 hover:bg-zinc-900/50 transition-all group">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                M
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-zinc-950"></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">
                Masterwayne
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse">
                  Architect
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-zinc-950 rounded-2xl text-[10px] text-center border border-zinc-800 text-zinc-400 mt-4">
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
              <div className="relative settings-dropdown-container">
                <input 
                  type="text" 
                  placeholder="Architect your learning path..." 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-5 pr-12 rounded-2xl focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                />
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-400 transition-colors p-1"
                  aria-label="Settings"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </button>
                
                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50">
                    <div className="space-y-4">
                      {/* Duration */}
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-2 block">
                          Duration
                        </label>
                        <div className="flex gap-2">
                          {['1 Month', '3 Months', '6 Months'].map((option) => (
                            <button
                              key={option}
                              onClick={() => setDuration(option)}
                              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                duration === option
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Difficulty */}
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-2 block">
                          Difficulty
                        </label>
                        <div className="flex gap-2">
                          {['Novice', 'Intermediate', 'Master'].map((option) => (
                            <button
                              key={option}
                              onClick={() => setDifficulty(option)}
                              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                difficulty === option
                                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="w-full md:w-auto bg-blue-600 px-12 py-4 rounded-xl font-bold hover:bg-blue-500 active:scale-95 transition-all">
                Begin Construction
              </button>
            </div>
            
            {/* Quick-Start Templates */}
            <div className="mt-8">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-4 text-center">
                Quick-Start Pathways
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Web Development */}
                <button className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 hover:bg-zinc-900 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">
                        Web Development
                      </h3>
                    </div>
                  </div>
                </button>

                {/* Data Science */}
                <button className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 hover:bg-zinc-900 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm group-hover:text-purple-400 transition-colors">
                        Data Science
                      </h3>
                    </div>
                  </div>
                </button>

                {/* UI/UX Design */}
                <button className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-pink-500/50 hover:bg-zinc-900 transition-all hover:shadow-lg hover:shadow-pink-500/10">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm group-hover:text-pink-400 transition-colors">
                        UI/UX Design
                      </h3>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="h-12 border-t border-zinc-800 flex items-center justify-between px-6 text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-4">
            {/* AI Engine Status */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
              </div>
              <span className="text-green-400">AI Engine: Ready</span>
            </div>
            
            {/* Location Coordinates */}
            <div className="text-zinc-500">
              COORDS: {coordinates.lat.toFixed(4)}°N, {coordinates.lon.toFixed(4)}°E
            </div>
          </div>
          
          {/* Real-time Clock */}
          <div className="text-zinc-500">
            TIME: {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </footer>
      </main>
    </div>
  );
}