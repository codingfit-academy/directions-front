"use client";

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { MapPin, Navigation, Clock, Search, Navigation2, ChevronRight, ChevronLeft, Activity, Zap, ShieldAlert, Crosshair, Menu } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver: any;
  }
}

const ANIMAL_OPTIONS = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐻', '🦝'];

const API_BASE_URL = 'https://directions-api.codingfit.kr'
// process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Signal = {
  id: number;
  source: string;
  source_id: string;
  name: string | null;
  region_cd: string | null;
  has_ped_signal: boolean | null;
  cycle_time: number | null;
  lat: number;
  lng: number;
  distance_m: number | null;
};

type GeocodeOut = {
  lat: number;
  lng: number;
  address: string;
  road_address: string | null;
};

type RouteResponse = {
  origin: GeocodeOut;
  destination: GeocodeOut;
  duration_ms: number;
  distance_m: number;
  path: [number, number][]; // [lat, lng]
  signals: Signal[];
  signal_delay_estimate_s: number;
};

const Page = () => {
  // Drawer & Layout State
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // GPS Location State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');

  // Map State
  const [clientId, setClientId] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signalMarkersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routePolylineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeMarkersRef = useRef<any[]>([]);
  const [nearbySignals, setNearbySignals] = useState<Signal[]>([]);
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState(ANIMAL_OPTIONS[0]);

  // Route State
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [configRes, healthRes] = await Promise.all([
          fetch(`${API_BASE_URL}/config`),
          fetch(`${API_BASE_URL}/health`).catch(() => null),
        ]);
        if (cancelled) return;
        if (configRes.ok) {
          const data = await configRes.json();
          if (data.naverMapsClientId) setClientId(data.naverMapsClientId);
        }
        setServerStatus(!!(healthRes && healthRes.ok));
      } catch (err) {
        console.error('Failed to fetch backend config/health:', err);
        if (!cancelled) setServerStatus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearRouteOverlays = () => {
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    routeMarkersRef.current.forEach((m) => m.setMap(null));
    routeMarkersRef.current = [];
  };

  const drawRouteOnMap = (route: RouteResponse) => {
    if (!mapRef.current || !window.naver || !window.naver.maps) return;
    clearRouteOverlays();

    const naver = window.naver;
    const latlngs = route.path.map(([lat, lng]) => new naver.maps.LatLng(lat, lng));

    routePolylineRef.current = new naver.maps.Polyline({
      map: mapRef.current,
      path: latlngs,
      strokeColor: '#2563eb',
      strokeOpacity: 0.85,
      strokeWeight: 6,
    });

    // 출발/도착 마커
    routeMarkersRef.current.push(
      new naver.maps.Marker({
        position: new naver.maps.LatLng(route.origin.lat, route.origin.lng),
        map: mapRef.current,
        title: `출발: ${route.origin.address}`,
        icon: {
          content:
            '<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
          anchor: new naver.maps.Point(10, 10),
        },
      }),
    );
    routeMarkersRef.current.push(
      new naver.maps.Marker({
        position: new naver.maps.LatLng(route.destination.lat, route.destination.lng),
        map: mapRef.current,
        title: `도착: ${route.destination.address}`,
        icon: {
          content:
            '<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
          anchor: new naver.maps.Point(10, 10),
        },
      }),
    );

    // 경로상 신호등 마커 (주황색)
    route.signals.forEach((s) => {
      routeMarkersRef.current.push(
        new naver.maps.Marker({
          position: new naver.maps.LatLng(s.lat, s.lng),
          map: mapRef.current,
          title: s.name || `신호등 #${s.id}`,
          icon: {
            content:
              '<div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>',
            anchor: new naver.maps.Point(8, 8),
          },
        }),
      );
    });

    // 경로 전체가 보이도록 fit bounds
    if (latlngs.length > 0) {
      const bounds = new naver.maps.LatLngBounds(latlngs[0], latlngs[0]);
      latlngs.forEach((p: unknown) => bounds.extend(p as never));
      mapRef.current.fitBounds(bounds);
    }
  };

  const fetchRoute = async () => {
    setRouteError('');
    if (!origin.trim() || !destination.trim()) {
      setRouteError('출발지와 도착지를 모두 입력해주세요.');
      return;
    }

    const usingMyLocation = origin === '현재 내 위치' && userLocation;
    const body = {
      origin: usingMyLocation
        ? { lat: userLocation!.lat, lng: userLocation!.lng, text: origin }
        : { text: origin },
      destination: { text: destination },
      option: 'trafast',
      signal_buffer_m: 30,
    };

    setRouteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/directions/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        throw new Error(errPayload?.detail || `status ${res.status}`);
      }
      const data: RouteResponse = await res.json();
      setRouteResult(data);
      drawRouteOnMap(data);
    } catch (err) {
      console.error('Route request failed:', err);
      setRouteError(err instanceof Error ? err.message : '경로를 가져오지 못했습니다.');
      setRouteResult(null);
      clearRouteOverlays();
    } finally {
      setRouteLoading(false);
    }
  };

  const fetchNearbySignals = async (lat: number, lng: number) => {
    try {
      const url = `${API_BASE_URL}/signals/nearby?lat=${lat}&lng=${lng}&radius_m=500&limit=50`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data: Signal[] = await res.json();
      setNearbySignals(data);

      if (mapRef.current && window.naver && window.naver.maps) {
        signalMarkersRef.current.forEach((m) => m.setMap(null));
        signalMarkersRef.current = data.map(
          (s) =>
            new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(s.lat, s.lng),
              map: mapRef.current,
              title: s.name || `신호등 #${s.id}`,
              icon: {
                content:
                  '<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>',
                anchor: new window.naver.maps.Point(7, 7),
              },
            }),
        );
      }
    } catch (err) {
      console.error('Failed to fetch nearby signals:', err);
    }
  };

  const initializeMap = () => {
    if (window.naver && window.naver.maps) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5666103, 126.9783882), // 서울 시청
        zoom: 13,
      };
      mapRef.current = new window.naver.maps.Map('map', mapOptions);
    }
  };

  // State for traffic light simulation
  const [trafficLight, setTrafficLight] = useState({ isGreen: false, timer: 45 });
  const isGreenLight = trafficLight.isGreen;
  const countdown = trafficLight.timer;

  // 가장 가까운 신호등 중 cycle_time이 있는 항목
  const closestSignal =
    nearbySignals.find((s) => s.cycle_time != null) ?? nearbySignals[0] ?? null;

  // 위치 허용 요청 함수
  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setOrigin('현재 내 위치');
          setLocationError('');
          
          if (mapRef.current && window.naver && window.naver.maps) {
            const loc = new window.naver.maps.LatLng(lat, lng);
            mapRef.current.setCenter(loc);
            mapRef.current.setZoom(16);
            // 내 위치 마커
            new window.naver.maps.Marker({
              position: loc,
              map: mapRef.current
            });
          }
          // 주변 신호등 마커 표시
          fetchNearbySignals(lat, lng);
        },
        (error) => {
          setLocationError('위치 정보를 가져올 수 없습니다.');
          console.error("Error getting location:", error);
        }
      );
    } else {
      setLocationError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    }
  };

  // Simulating traffic light countdown
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTrafficLight((prev) => {
        if (prev.timer <= 1) {
          const nextIsGreen = !prev.isGreen;
          // 30 seconds for green, 45 seconds for red
          return { isGreen: nextIsGreen, timer: nextIsGreen ? 30 : 45 };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedAnimal(ANIMAL_OPTIONS[Math.floor(Math.random() * ANIMAL_OPTIONS.length)]);
  }, []);

  // Handle Search state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [age, setAge] = useState('');

  // 모바일 드로워 터치 드래그 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;

    // 40px 이상 이동 시 열고 닫히도록 설정
    if (diff > 40 && isDrawerOpen) {
      setIsDrawerOpen(false);
      setTouchStartY(null); 
    } else if (diff < -40 && !isDrawerOpen) {
      setIsDrawerOpen(true);
      setTouchStartY(null); 
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  return (
    <>
      {clientId && (
        <Script
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
          strategy="afterInteractive"
          onLoad={initializeMap}
        />
      )}
      <div className="flex h-screen w-full bg-gray-100 flex-col md:flex-row overflow-hidden relative font-sans">
      <div className="absolute top-4 right-4 z-40 pointer-events-none">
        <div className="stairs-badge">
          <div className="stairs-base" />
          <div className="stairs-step stairs-step-1" />
          <div className="stairs-step stairs-step-2" />
          <div className="stairs-step stairs-step-3" />
          <div className="stairs-step stairs-step-4" />
          <div className="stairs-animal" aria-hidden="true">{selectedAnimal}</div>
          <div className="stairs-shadow" />
        </div>
      </div>
      
      {/* 
        DESKTOP SIDEBAR / MOBILE BOTTOM SHEET
      */}
      <div className={`
        absolute md:relative z-20
        bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto
        w-full md:w-[400px] shrink-0
        bg-white md:bg-white/95 md:backdrop-blur-xl
        rounded-t-[32px] md:rounded-none
        shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-2xl
        transition-all duration-500 ease-in-out
        ${isDrawerOpen 
          ? 'h-[65vh] md:h-full translate-y-0 md:ml-0 md:opacity-100' 
          : 'h-[80px] md:h-full md:-ml-[400px] translate-y-0'}
      `}>
        <div className="w-full md:w-[400px] h-full flex flex-col overflow-hidden pointer-events-auto">
          {/* Mobile Handle */}
          <div 
            className="w-full flex justify-center pt-4 pb-4 md:hidden cursor-pointer active:bg-gray-50 touch-none"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-14 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Search Section */}
          <div className="p-6 pb-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Navigation2 className="text-primary w-7 h-7" />
              집 가는 길!!!
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
                className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
              />
              <button 
                onClick={requestLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary hover:bg-white rounded-xl transition-all"
                title="내 위치 가져오기"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>
            
            {locationError && (
              <p className="text-xs text-danger mt-1 px-1">{locationError}</p>
            )}
            
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

              <button
                onClick={fetchRoute}
                disabled={routeLoading}
                className="flex-[0.5] bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-gray-900/20 active:scale-95 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {routeLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>

            {routeError && (
              <p className="text-xs text-danger mt-1 px-1">{routeError}</p>
            )}
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
                 <p className="text-sm font-semibold text-gray-500 mb-1">
                   {routeResult ? '예상 소요 시간' : '예상 도착 시간(ETA)'}
                 </p>
                 <div className="flex items-baseline gap-1">
                   <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                     {routeResult
                       ? Math.max(1, Math.round((routeResult.duration_ms + routeResult.signal_delay_estimate_s * 1000) / 60000))
                       : 45}
                   </h2>
                   <span className="text-lg font-bold text-gray-400">min</span>
                 </div>
                 {routeResult && (
                   <p className="text-xs font-semibold text-gray-400 mt-1">
                     {(routeResult.distance_m / 1000).toFixed(1)}km
                     {routeResult.signal_delay_estimate_s > 0 && (
                       <> · 신호 대기 ≈ {routeResult.signal_delay_estimate_s}초</>
                     )}
                   </p>
                 )}
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
                <div className="text-right font-black text-lg tabular-nums animate-pulse">
                  {countdown}초 {isGreenLight ? '남음' : '후 출발'}
                </div>
             </div>

             {/* 경로상 신호등 요약 (경로 검색 후) */}
             {routeResult && (
               <div className="mt-3 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100 relative z-10">
                 <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                   경로상 신호등
                 </p>
                 <div className="flex items-baseline gap-1.5">
                   <span className="text-2xl font-black text-gray-900 tabular-nums">
                     {routeResult.signals.length}
                   </span>
                   <span className="text-sm font-bold text-gray-500">개</span>
                   {routeResult.signal_delay_estimate_s > 0 && (
                     <span className="ml-auto text-xs font-semibold text-amber-700">
                       예상 대기 {routeResult.signal_delay_estimate_s}초
                     </span>
                   )}
                 </div>
               </div>
             )}

             {/* 가장 가까운 신호등의 API cycle_time */}
             <div className="mt-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 relative z-10">
               <div className="flex items-center justify-between mb-1">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                   가장 가까운 신호등
                 </p>
                 {closestSignal?.distance_m != null && (
                   <span className="text-xs font-semibold text-gray-400">
                     {Math.round(closestSignal.distance_m)}m
                   </span>
                 )}
               </div>
               {closestSignal ? (
                 <>
                   <p className="text-sm font-bold text-gray-900 truncate">
                     {closestSignal.name || `신호등 #${closestSignal.id}`}
                   </p>
                   <div className="mt-1 flex items-baseline gap-1.5">
                     {closestSignal.cycle_time != null ? (
                       <>
                         <span className="text-2xl font-black text-gray-900 tabular-nums">
                           {closestSignal.cycle_time}
                         </span>
                         <span className="text-sm font-bold text-gray-400">초 주기</span>
                       </>
                     ) : (
                       <span className="text-sm font-semibold text-gray-400">
                         주기 정보 없음
                       </span>
                     )}
                   </div>
                 </>
               ) : (
                 <p className="text-sm font-medium text-gray-400">
                   내 위치 버튼을 눌러 주변 신호등을 불러오세요
                 </p>
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
      </div>

      {/* Desktop Drawer Toggle Button */}
      <button 
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className={`fixed top-6 z-30 bg-white p-3.5 rounded-2xl shadow-xl border border-gray-100 text-gray-700 hover:text-primary transition-all duration-500 hidden md:flex items-center justify-center hover:scale-105 active:scale-95 ${isDrawerOpen ? 'left-[424px]' : 'left-6'}`}
      >
        {isDrawerOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* 
        MAP RENDERER
      */}
      <div className="flex-1 relative bg-[#f0ede5] overflow-hidden flex items-center justify-center h-[45vh] md:h-full z-10 isolate">
         <div id="map" className="absolute inset-0 w-full h-full" />

         {/* GPS Floating Action Button (내 위치로 이동) */}
         <button 
           onClick={requestLocation}
           className={`absolute right-4 md:right-6 z-30 bg-white p-3.5 rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-primary transition-all duration-500 flex items-center justify-center hover:scale-105 active:scale-95
             ${isDrawerOpen ? 'bottom-[calc(65vh+20px)] md:bottom-6' : 'bottom-[100px] md:bottom-6'}
           `}
           title="내 위치로 이동"
         >
           <Crosshair className="w-6 h-6" />
         </button>
      </div>

      </div>
    </>
  );
};

export default Page;
