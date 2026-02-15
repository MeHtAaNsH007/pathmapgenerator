"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jtbyrnlbbxnjyipxajmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnlybmxiYnhuanlpcHhham10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTExMzMsImV4cCI6MjA4NjU2NzEzM30.xBKQ0Q2t54E93Ra_SEvi9cPp-1WtwvYmQU-ByWTydwQ';
const supabase = createClient( supabaseUrl, supabaseKey);

export default function Home() {
  const router = useRouter();
  const [showGuide, setShowGuide] = useState(false);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConstructing, setIsConstructing] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [location, setLocation] = useState('PUNJAB,INDIA');
  const [coordinates, setCoordinates] = useState({ lat: 30.7333, lon: 76.7794 }); // Default Punjab coordinates
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [duration, setDuration] = useState('3 Months');
  const [difficulty, setDifficulty] = useState('Intermediate');
  
  // Recent activity data - loaded from localStorage or empty array
  const [recentActivity, setRecentActivity] = useState<Array<{ topic: string; timestamp: Date }>>([]);
  
  // Battery & network for header
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStrength, setConnectionStrength] = useState<'none' | 'low' | 'good'>('good');

  // Search bar
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Location prompt (show our message before browser permission)
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(false);

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
    // Check for saved nickname in localStorage
    const savedNickname = localStorage.getItem('progath_nickname');
    const locationPromptSeen = localStorage.getItem('progath_location_prompt_seen');
    if (savedNickname) {
      setNickname(savedNickname);
      // Show location prompt once if never seen, else show guide
      if (navigator.geolocation && !locationPromptSeen) {
        setShowLocationPrompt(true);
      } else {
        setShowGuide(true);
      }
    } else {
      setShowNicknamePrompt(true);
    }
    
    // Load recent activity from localStorage
    const savedActivity = localStorage.getItem('progath_recent_activity');
    if (savedActivity) {
      try {
        const parsed = JSON.parse(savedActivity);
        // Convert timestamp strings back to Date objects
        const activities = parsed.map((activity: { topic: string; timestamp: string }) => ({
          topic: activity.topic,
          timestamp: new Date(activity.timestamp)
        }));
        setRecentActivity(activities);
      } catch (error) {
        console.error('Error loading recent activity:', error);
        setRecentActivity([]);
      }
    }
    
    if (!navigator.geolocation) {
      setLocation('PUNJAB,INDIA');
    }
  }, []);

  const requestLocation = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('progath_location_prompt_seen', 'true');
    if (!navigator.geolocation) {
      setLocation('PUNJAB,INDIA');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lon: longitude });
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const state = data.address.state || data.address.region || '';
            const country = data.address.country || '';
            let locationStr = '';
            if (city && state) locationStr = `${city.toUpperCase()},${state.toUpperCase()}`;
            else if (city) locationStr = `${city.toUpperCase()},${country.toUpperCase()}`;
            else if (state) locationStr = `${state.toUpperCase()},${country.toUpperCase()}`;
            else locationStr = country ? country.toUpperCase() : 'PUNJAB,INDIA';
            setLocation(locationStr || 'PUNJAB,INDIA');
          } else setLocation('PUNJAB,INDIA');
        } catch (error) {
          console.error('Error fetching location:', error);
          setLocation('PUNJAB,INDIA');
        }
        setShowGuide(true);
      },
      () => {
        setLocation('PUNJAB,INDIA');
        setShowGuide(true);
      }
    );
  };

  const skipLocation = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('progath_location_prompt_seen', 'true');
    setLocation('PUNJAB,INDIA');
    setShowGuide(true);
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Battery level (when available, e.g. some browsers on supported devices)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as Navigator & { getBattery(): Promise<{ level: number; addEventListener: (t: string, h: () => void) => void }> })
        .getBattery()
        .then((battery) => {
          setBatteryLevel(Math.round(battery.level * 100));
          battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
        })
        .catch(() => setBatteryLevel(null));
    } else {
      setBatteryLevel(null);
    }
  }, []);

  // Network connectivity and strength
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStrength('none');
    };

    const conn = typeof navigator !== 'undefined' ? (navigator as Navigator & { connection?: { effectiveType?: string; addEventListener?: (type: string, fn: () => void) => void; removeEventListener?: (type: string, fn: () => void) => void } }).connection : undefined;
    const updateStrength = () => {
      if (!navigator.onLine) {
        setConnectionStrength('none');
        return;
      }
      const effectiveType = conn?.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setConnectionStrength('low');
      } else {
        setConnectionStrength('good');
      }
    };

    setIsOnline(navigator.onLine);
    updateStrength();

    window.addEventListener('online', () => {
      setIsOnline(true);
      updateStrength();
    });
    window.addEventListener('offline', handleOffline);
    conn?.addEventListener?.('change', updateStrength);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      conn?.removeEventListener?.('change', updateStrength);
    };
  }, []);

  const startRecognition = () => {
    const win = typeof window !== 'undefined' ? window : null;
    const SR =
      win &&
      ((win as unknown as {
        SpeechRecognition?: new () => {
          start(): void;
          stop(): void;
          onstart: () => void;
          onend: () => void;
          onresult: (e: unknown) => void;
          onerror: () => void;
          continuous: boolean;
          interimResults: boolean;
          lang: string;
        };
      }).SpeechRecognition ??
        (win as unknown as {
          webkitSpeechRecognition?: new () => {
            start(): void;
            stop(): void;
            onstart: () => void;
            onend: () => void;
            onresult: (e: unknown) => void;
            onerror: () => void;
            continuous: boolean;
            interimResults: boolean;
            lang: string;
          };
        }).webkitSpeechRecognition);
    if (!SR || !win) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: unknown) => {
      const e = event as {
        results: {
          length: number;
          [i: number]: { [j: number]: { transcript: string } };
        };
      };
      const last = e.results[e.results.length - 1];
      const transcript = last?.[0]?.transcript ?? '';
      setSearchQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleMicAllow = () => {
    localStorage.setItem('progath_mic_prompt_seen', 'true');
    setShowMicPrompt(false);
    startRecognition();
  };

  const handleMicDeny = () => {
    setShowMicPrompt(false);
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const seen = localStorage.getItem('progath_mic_prompt_seen');
    if (!seen) {
      setShowMicPrompt(true);
      return;
    }
    startRecognition();
  };

  const handleBeginConstruction = async () => {
    setIsConstructing(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const user = data.user;
      if (user) {
        const lat = coordinates.lat;
        const lng = coordinates.lon;
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          nickname: nickname,
          location_name: location,
          latitude: Number(lat),
          longitude: Number(lng),
        });
        if (insertError) throw insertError;
        alert('Success');
        router.push('/');
      }
    } catch (err) {
      alert(String((err as Error).message ?? err));
    } finally {
      setIsConstructing(false);
    }
  };

  const handleLogin = async () => {
    setIsConstructing(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          if (searchQuery && searchQuery.trim()) {
            try { localStorage.setItem('progath_topic', searchQuery.trim()); } catch {}
          }
          router.push('/dashboard');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Signed up successfully');
        setIsLogin(true);
      }
    } catch (err) {
      alert(String((err as Error).message ?? err));
    } finally {
      setIsConstructing(false);
    }
  };

  // Handle nickname submission
  const handleNicknameSubmit = () => {
    const trimmedNickname = nicknameInput.trim();
    if (trimmedNickname) {
      setNickname(trimmedNickname);
      localStorage.setItem('progath_nickname', trimmedNickname);
      setShowNicknamePrompt(false);
      // Show location prompt if we haven't asked yet, else show guide
      if (navigator.geolocation && !localStorage.getItem('progath_location_prompt_seen')) {
        setShowLocationPrompt(true);
      } else {
        setShowGuide(true);
      }
    }
  };

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
      
      {/* --- NICKNAME PROMPT MODAL --- */}
      {showNicknamePrompt && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="text-blue-500 font-bold mb-2 tracking-widest text-xs uppercase">Welcome to PROGATH</div>
            <h2 className="text-3xl font-black mb-4 tracking-tight text-white">Choose Your Nickname</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Personalize your workspace with a nickname. This will be displayed in your profile.
            </p>
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNicknameSubmit();
                  }
                }}
                placeholder="Enter your nickname..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleNicknameSubmit}
                disabled={!nicknameInput.trim()}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LOCATION PROMPT --- */}
      {showLocationPrompt && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <p className="text-white text-center text-lg mb-6">
              progath.ai wants to know your location
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={requestLocation}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all"
              >
                Allow
              </button>
              <button
                onClick={skipLocation}
                className="w-full bg-transparent text-zinc-400 text-sm hover:text-white transition-all"
              >
                Use default (Punjab, India)
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showMicPrompt && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <p className="text-white text-center text-lg mb-6">
              progath wants to access your microphone
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleMicAllow}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all"
              >
                Allow
              </button>
              <button
                onClick={handleMicDeny}
                className="w-full bg-transparent text-zinc-400 text-sm hover:text-white transition-all"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- USER GUIDE MODAL --- */}
      {showGuide && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="text-blue-500 font-bold mb-2 tracking-widest text-xs uppercase">
              Hey {nickname || 'there'}, welcome to PROGATH — your own learning assistant
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight text-white">User Guide</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">1</div>
                <p className="text-zinc-300 text-sm">Enter any skill or topic in the central &quot;Construction&quot; bar.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">2</div>
                <p className="text-zinc-300 text-sm">Click &quot;Begin&quot; to let PROGATH AI architect your roadmap.</p>
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
            {recentActivity.length > 0 ? (
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
            ) : (
              <div className="text-center py-6 px-4">
                <div className="text-zinc-500 text-xs leading-relaxed">
                  <p className="mb-1">No recent activity</p>
                  <p className="text-zinc-600">Get your customized plan ready first</p>
                </div>
              </div>
            )}
          </div>
        </nav>
        
        {/* Active Architect Profile */}
        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 hover:bg-zinc-900/50 transition-all group">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                {nickname ? nickname.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-zinc-950"></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">
                {nickname || 'Guest'}
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
          
          <div className="flex items-center gap-5">
            {/* Battery */}
            {batteryLevel !== null && (
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{batteryLevel}%</span>
              </div>
            )}
            {batteryLevel === null && (
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono" title="Battery API not available">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>--%</span>
              </div>
            )}

            {/* WiFi / Network */}
            <div className="flex items-center gap-1.5" title={isOnline ? `Connection: ${connectionStrength}` : 'No connection'}>
              {isOnline ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${connectionStrength === 'good' ? 'text-green-500' : connectionStrength === 'low' ? 'text-yellow-500' : 'text-zinc-500'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {connectionStrength === 'good' && (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </>
                  )}
                  {connectionStrength === 'low' && (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0" />
                    </>
                  )}
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
              <span className={`text-xs font-mono hidden sm:inline ${isOnline ? (connectionStrength === 'good' ? 'text-green-500' : connectionStrength === 'low' ? 'text-yellow-500' : 'text-zinc-500') : 'text-red-500'}`}>
                {isOnline ? (connectionStrength === 'good' ? 'Connected' : 'Low') : 'Offline'}
              </span>
            </div>

            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0"></div>
          </div>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Architect your learning path..." 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-5 pr-24 rounded-2xl focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`absolute right-12 top-1/2 -translate-y-1/2 p-1 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-blue-400'}`}
                  aria-label={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v7m5-5.61A9 9 0 0012 3v.01M12 12v.01" />
                  </svg>
                </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500 transition-all"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={isConstructing}
                className={`w-full md:w-auto px-12 py-4 rounded-xl font-bold active:scale-95 transition-all ${isConstructing ? 'bg-zinc-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {isConstructing ? 'Constructing...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
              <button
                type="button"
                onClick={() => setIsLogin((v) => !v)}
                className="w-full md:w-auto bg-transparent text-zinc-400 text-xs hover:text-white transition-all mt-2"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
              </button>
            </div>
            
            {/* Quick-Start Templates */}
            <div className="mt-8">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-4 text-center">
                Quick-Start Pathways
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Web Development */}
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('progath_topic', 'Web Development');
                      localStorage.setItem('progath_quickstart', 'Web Development');
                    } catch {}
                    router.push('/dashboard');
                  }}
                  className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 hover:bg-zinc-900 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
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
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('progath_topic', 'Data Science');
                      localStorage.setItem('progath_quickstart', 'Data Science');
                    } catch {}
                    router.push('/dashboard');
                  }}
                  className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 hover:bg-zinc-900 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                >
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
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('progath_topic', 'UI/UX Design');
                      localStorage.setItem('progath_quickstart', 'UI/UX Design');
                    } catch {}
                    router.push('/dashboard');
                  }}
                  className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-pink-500/50 hover:bg-zinc-900 transition-all hover:shadow-lg hover:shadow-pink-500/10"
                >
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
            
            {/* Location & Coordinates */}
            <div className="text-zinc-500 flex items-center gap-4">
              <span>LOC: {location}</span>
              <span>COORDS: {coordinates.lat.toFixed(4)}°N, {coordinates.lon.toFixed(4)}°E</span>
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
