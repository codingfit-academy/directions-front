"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Search, Navigation2, ChevronRight, Activity, Zap, ShieldAlert } from 'lucide-react';

const Page = () => {
  // State for traffic light simulation
  const [isGreenLight, setIsGreenLight] = useState(false);
  const [countdown, setCountdown] = useState(45);

  // Simulating traffic light countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsGreenLight((current) => !current);
          // 30 seconds for green, 45 seconds for red
          return !isGreenLight ? 30 : 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGreenLight]);

  // Backend Communication Sample
  const [serverStatus, setServerStatus] = useState<any>(null);
  useEffect(() => {
    fetch('http://localhost:5000/api/hello')
      .then((res) => res.json())
      .then((data) => setServerStatus(data))
      .catch((err) => console.error('Error fetching backend:', err));
  }, []);

  // Handle Search state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [age, setAge] = useState('');

  return (
    <div className="flex h-screen w-full bg-gray-100 flex-col md:flex-row overflow-hidden relative font-sans">
      
      {/* 
        DESKTOP SIDEBAR / MOBILE BOTTOM SHEET
      */}
      <div className="
        absolute md:relative z-20
        bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto
        w-full md:w-[400px] h-[65vh] md:h-full 
        bg-white md:bg-white/95 md:backdrop-blur-xl
        rounded-t-[32px] md:rounded-none
        shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-2xl
        flex flex-col overflow-hidden
        transition-transform duration-500 ease-in-out
      ">
        {/* Mobile Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 md:hidden">
          <div className="w-14 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Search Section */}
        <div className="p-6 pb-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Navigation2 className="text-primary w-7 h-7" />
              RouteFinder
            </h1>
            {serverStatus ? (
              <div className="text-[10px] font-bold bg-success/10 text-success px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-success/20">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> API Connected
              </div>
            ) : (
              <div className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-gray-200">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" /> Offline
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border-2 border-primary/20" />
              <input 
                type="text" 
                placeholder="출발지를 입력하세요" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
              />
            </div>
            
            <div className="relative group">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />
              <input 
                type="text" 
                placeholder="도착지를 입력하세요" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-danger/10 focus:border-danger outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="flex gap-4">
              <div className="relative group flex-1">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="number" 
                  placeholder="연령 (나이)" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                />
              </div>

              <button className="flex-[0.5] bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-gray-900/20 active:scale-95 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content (Traffic & Times) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
          
          {/* Real-time Traffic Light ETA */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
             {/* Glowing gradient background */}
             <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-colors duration-700 ${isGreenLight ? 'bg-success' : 'bg-danger'}`} />

             <div className="flex justify-between items-start mb-5 relative z-10">
               <div>
                 <p className="text-sm font-semibold text-gray-500 mb-1">예상 도착 시간(ETA)</p>
                 <div className="flex items-baseline gap-1">
                   <h2 className="text-4xl font-black text-gray-900 tracking-tight">45</h2>
                   <span className="text-lg font-bold text-gray-400">min</span>
                 </div>
               </div>
               
               {/* Traffic indicator UI */}
               <div className="flex flex-col items-center bg-gray-50 p-2.5 rounded-full gap-2.5 shadow-inner border border-gray-200">
                  <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${!isGreenLight ? 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-gray-200'}`} />
                  <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${isGreenLight ? 'bg-success shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-gray-200'}`} />
               </div>
             </div>

             <div className={`rounded-2xl p-4 flex items-center justify-between transition-colors duration-300 ${isGreenLight ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                <div className="flex items-center gap-2.5">
                  {isGreenLight ? <Navigation className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  <span className="font-bold">{isGreenLight ? '현재 원활 (녹색 신호)' : '현재 대기 (적색 신호)'}</span>
                </div>
                {!isGreenLight && (
                  <div className="text-right font-black text-lg tabular-nums animate-pulse">
                    {countdown}초 후 출발
                  </div>
                )}
             </div>
          </div>

          {/* Recommended Departure Times */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                출발 추천 시간
              </h3>
            </div>
            
            <div className="space-y-3">
              {/* Faster Card */}
              <div className="group bg-white rounded-2xl p-4 border border-primary/20 shadow-sm shadow-primary/5 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between relative overflow-hidden active:scale-[0.98]">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                <div className="pl-2">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-2xl font-black text-gray-900 tracking-tight">14:20</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> 가장 빠름
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500">도착 예정 • 14:55 (35분 소요)</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ChevronRight className="text-gray-400 group-hover:text-primary transition-colors w-5 h-5" />
                </div>
              </div>

              {/* Optimal Card */}
              <div className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between active:scale-[0.98]">
                <div className="pl-2">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-2xl font-black text-gray-900 tracking-tight">14:35</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
                      최적
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500">도착 예정 • 15:15 (40분 소요)</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <ChevronRight className="text-gray-400 group-hover:text-gray-600 transition-colors w-5 h-5" />
                </div>
              </div>

              {/* Traffic Card */}
              <div className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between active:scale-[0.98]">
                <div className="pl-2">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-2xl font-black text-gray-900 tracking-tight">14:50</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-600">
                      혼잡 예상
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500">도착 예정 • 15:35 (45분 소요)</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                  <ChevronRight className="text-gray-400 group-hover:text-orange-500 transition-colors w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        MAP RENDERER
      */}
      <div className="flex-1 relative bg-[#f0ede5] overflow-hidden flex items-center justify-center h-[45vh] md:h-full z-10 isolate">
         {/* Fake Map Grid Pattern */}
         <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />
         
         {/* Decorative elements representing geographical areas */}
         <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-success/20 rounded-full blur-3xl opacity-50" />
         <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60" />

         {/* Curved Route Line (SVG) */}
         {/* Using viewBox to handle responsiveness and aspect ratio dynamically */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
            {/* Shadow path */}
            <path 
              d="M 300,800 C 400,600 700,500 750,300" 
              fill="none" 
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="12"
              strokeLinecap="round"
              className="translate-y-2 translate-x-1"
            />
            {/* Animated blue route path */}
            <path 
              d="M 300,800 C 400,600 700,500 750,300" 
              fill="none" 
              stroke="#3B82F6"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="20 15"
              className="animate-dash"
            />
         </svg>

         {/* Markers Container mapped to SVG coordinates visually (approx) */}
         <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
           {/* We use percentage or relative positioning based on SVG above */}
           
           {/* Destination Marker */}
           <div className="absolute top-[30%] left-[75%] -translate-x-1/2 -translate-y-full mt-4 flex flex-col items-center">
              <div className="bg-danger text-white p-3 rounded-full shadow-lg shadow-danger/40 relative animate-bounce z-10 border-2 border-white">
                 <MapPin className="w-8 h-8" fill="currentColor" strokeWidth={1} />
              </div>
              {/* Shadow */}
              <div className="w-6 h-1.5 bg-black/15 rounded-full mt-2 blur-[2px]" />
           </div>

           {/* Origin Marker (User location) */}
           <div className="absolute top-[80%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-primary text-white w-14 h-14 rounded-full shadow-lg shadow-primary/40 relative border-4 border-white flex items-center justify-center z-10">
                 <Navigation className="w-6 h-6 rotate-45" fill="currentColor" strokeWidth={1.5} />
              </div>
              {/* Radar rings */}
              <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
              <div className="absolute -inset-4 border border-primary/20 rounded-full" />
              <div className="absolute -inset-8 border border-primary/10 rounded-full" />
           </div>
         </div>
      </div>

    </div>
  );
};

export default Page;
