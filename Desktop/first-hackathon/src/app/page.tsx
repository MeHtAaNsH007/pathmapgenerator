"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [showGuide, setShowGuide] = useState(false);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [location, setLocation] = useState('PUNJAB,INDIA');
  const [coordinates, setCoordinates] = useState({ lat: 30.7333, lon: 76.7794 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [duration, setDuration] = useState('3 Months');
  const [difficulty, setDifficulty] = useState('Intermediate');
  
  const [recentActivity, setRecentActivity] = useState<Array<{ topic: string; timestamp: Date }>>([]);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStrength, setConnectionStrength] = useState<'none' | 'low' | 'good'>('good');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const getTopicIcon = (topic: string) => topic.charAt(0).toUpperCase();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    const savedNickname = localStorage.getItem('progath_nickname');
    const locationPromptSeen = localStorage.getItem('progath_location_prompt_seen');
    if (savedNickname) {
      setNickname(savedNickname);
      if (navigator.geolocation && !locationPromptSeen) setShowLocationPrompt(true);
      else setShowGuide(true);
    } else setShowNicknamePrompt(true);
    
    const savedActivity = localStorage.getItem('progath_recent_activity');
    if (savedActivity) {
      try {
        const parsed = JSON.parse(savedActivity);
        setRecentActivity(parsed.map((a: any) => ({ topic: a.topic, timestamp: new Date(a.timestamp) })));
      } catch (e) { setRecentActivity([]); }
    }
  }, []);

  const requestLocation = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('progath_location_prompt_seen', 'true');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        setCoordinates({ lat: latitude, lon: longitude });
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        if (data.address) {
          const city = data.address.city || data.address.town || data.address.village || '';
          const state = data.address.state || '';
          setLocation(`${city.toUpperCase()},${state.toUpperCase()}` || 'PUNJAB,INDIA');
        }
      } catch (e) { setLocation('PUNJAB,INDIA'); }
      setShowGuide(true);
    }, () => { setLocation('PUNJAB,INDIA'); setShowGuide(true); });
  };

  const skipLocation = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('progath_location_prompt_seen', 'true');
    setLocation('PUNJAB,INDIA');
    setShowGuide(true);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
      });
    }
  }, []);

  const startRecognition = () => {
    const win = window as any;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript;
      setSearchQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
  };

  const toggleMic = () => {
    if (isListening) { setIsListening(false); return; }
    if (!localStorage.getItem('progath_mic_permission')) { setShowMicPrompt(true); return; }
    startRecognition();
  };

  return (
    <div className="relative flex h-screen bg-black text-white overflow-hidden font-sans text-left">
      
      {showNicknamePrompt && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="text-blue-500 font-bold mb-2 tracking-widest text-xs uppercase">Welcome to PROGATH</div>
            <h2 className="text-3xl font-black mb-4 tracking-tight text-white">Choose Your Nickname</h2>
            <input type="text" value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="Enter nickname..." className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl mb-6 outline-none focus:border-blue-500 transition-all" />
            <button onClick={() => { if(nicknameInput.trim()){ setNickname(nicknameInput); localStorage.setItem('progath_nickname', nicknameInput); setShowNicknamePrompt(false); if(navigator.geolocation) setShowLocationPrompt(true); else setShowGuide(true); }}} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200">Continue</button>
          </div>
        </div>
      )}

      {showMicPrompt && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-center">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <p className="text-white text-lg mb-6 leading-relaxed">Allow microphone access to turn on <span className="text-blue-500 font-bold">speech-to-text</span></p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { localStorage.setItem('progath_mic_permission', 'true'); setShowMicPrompt(false); startRecognition(); }} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all">Allow</button>
              <button onClick={() => setShowMicPrompt(false)} className="w-full bg-transparent text-zinc-400 text-sm hover:text-white transition-all">Maybe later</button>
            </div>
          </div>
        </div>
      )}

      {showLocationPrompt && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-center">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <p className="text-white text-lg mb-6">progath.ai wants to know your location</p>
            <div className="flex flex-col gap-3">
              <button onClick={requestLocation} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200">Allow</button>
              <button onClick={skipLocation} className="w-full bg-transparent text-zinc-400 text-sm hover:text-white">Use default (Punjab, India)</button>
            </div>
          </div>
        </div>
      )}
      
      {showGuide && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="text-blue-500 font-bold mb-2 tracking-widest text-xs uppercase text-center">Hey {nickname}, welcome to PROGATH</div>
            <h2 className="text-3xl font-black mb-4 tracking-tight text-white text-center">User Guide</h2>
            <div className="space-y-4 mb-8">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">{num}</div>
                  <p className="text-zinc-300 text-sm">{num === 1 ? 'Enter any skill or topic.' : num === 2 ? 'Click Begin to architect your roadmap.' : 'Track progress in the Sidebar.'}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowGuide(false)} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200">Get Started</button>
          </div>
        </div>
      )}

      <aside className="w-64 border-r border-zinc-800 flex flex-col p-6 hidden md:flex">
        <div className="text-xl font-black mb-10 tracking-tighter text-blue-500">PROGATH AI</div>
        <nav className="space-y-6 flex-1 text-sm">
          <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest">Dashboard</div>
          <ul className="space-y-4 mb-8">
            <li className="text-white cursor-pointer flex items-center gap-2"><span>○</span> New Generation</li>
            <li className="text-zinc-400 cursor-pointer flex items-center gap-2 hover:text-white"><span>□</span> Saved Roadmaps</li>
            <li className="text-zinc-400 cursor-pointer flex items-center gap-2 hover:text-white"><span>△</span> Analytics</li>
          </ul>
          <div className="border-t border-zinc-800 pt-6">
            <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest mb-4">Recent Activity</div>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 cursor-pointer hover:opacity-80 group">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold border border-blue-500/30">{getTopicIcon(a.topic)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs truncate group-hover:text-blue-400">{a.topic}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{formatTimestamp(a.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-zinc-600 text-[10px]">No recent activity</p>}
          </div>
        </nav>
        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 group">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">{nickname ? nickname.charAt(0).toUpperCase() : '?'}</div>
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-zinc-950"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{nickname || 'Guest'}</div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 animate-pulse">Architect</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#050505]">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8">
          <div className="text-xs text-zinc-400 tracking-widest uppercase">System Status: Optimal</div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono"><span>{batteryLevel ?? '--'}%</span></div>
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xl w-full space-y-10">
            <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-gray-900 to-gray-400 bg-clip-text text-transparent">PROGATH</h1>
            <p className="text-xl bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent font-light tracking-widest uppercase mt-4">The Smart Path</p>
            <div className="space-y-4 relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Architect your learning path..." className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-5 pr-24 rounded-2xl focus:border-blue-500 transition-all outline-none" />
              <div className="absolute right-4 top-5 flex gap-2">
                <button onClick={toggleMic} className={`p-1 ${isListening ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v7m5-5.61A9 9 0 0012 3v.01M12 12v.01" /></svg></button>
                <button onClick={() => setShowSettings(!showSettings)} className="text-zinc-400 hover:text-blue-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></button>
              </div>
              {showSettings && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 z-50 flex gap-4">
                  <div className="flex-1"><label className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Duration</label><select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-zinc-800 border-none text-white text-xs rounded-lg p-2"><option>1 Month</option><option>3 Months</option><option>6 Months</option></select></div>
                  <div className="flex-1"><label className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-zinc-800 border-none text-white text-xs rounded-lg p-2"><option>Novice</option><option>Intermediate</option><option>Master</option></select></div>
                </div>
              )}
              <button className="w-full md:w-auto bg-blue-600 px-12 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all">Begin Construction</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {['Web Dev', 'Data Science', 'UI/UX Design'].map((path) => (
                <button key={path} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-blue-500 transition-all text-sm font-semibold">{path}</button>
              ))}
            </div>
          </div>
        </div>

        <footer className="h-12 border-t border-zinc-800 flex items-center justify-between px-6 text-[10px] text-zinc-500 font-mono">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div><span>AI ENGINE: READY</span></div>
            <span>LOC: {location}</span>
            <span>COORDS: {coordinates.lat.toFixed(4)}°N, {coordinates.lon.toFixed(4)}°E</span>
          </div>
          <div>TIME: {currentTime.toLocaleTimeString('en-US', { hour12: false })}</div>
        </footer>
      </main>
    </div>
  );
}