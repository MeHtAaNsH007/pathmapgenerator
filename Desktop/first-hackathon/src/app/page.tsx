"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [showGuide, setShowGuide] = useState(false);
  const [userName, setUserName] = useState('');
  const [isUserSet, setIsUserSet] = useState(false);
  const [location, setLocation] = useState('PUNJAB,INDIA');
  
  const [recentActivity] = useState([
    { topic: 'Python', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { topic: 'Guitar', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { topic: 'Web Development', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { topic: 'Machine Learning', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ]);

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
    setShowGuide(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || '';
              const state = data.address.state || '';
              const country = data.address.country || '';
              setLocation(`${city ? city.toUpperCase() + ',' : ''}${state ? state.toUpperCase() : ''}${country ? ',' + country.toUpperCase() : ''}`.trim());
            }
          } catch (error) {
            console.error('Error fetching location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Your existing JSX content here */}
    </div>
  );
}