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

type RealtimeTraffic = {
  sample_count: number;
  avg_speed_kmh: number;
  timestamp: string | null;
  congestion: string;
  eta_factor: number;
};

type RouteResponse = {
  origin: GeocodeOut;
  destination: GeocodeOut;
  duration_ms: number;
  distance_m: number;
  path: [number, number][]; // [lat, lng]
  signals: Signal[];
  signal_delay_estimate_s: number;
  realtime_traffic: RealtimeTraffic | null;
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

  // Geocoded points (검색으로 확정된 좌표)
  const [originPoint, setOriginPoint] = useState<GeocodeOut | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<GeocodeOut | null>(null);
  const [originSearching, setOriginSearching] = useState(false);
  const [destinationSearching, setDestinationSearching] = useState(false);
  const [originSearchError, setOriginSearchError] = useState('');
  const [destinationSearchError, setDestinationSearchError] = useState('');

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

  const geocodeAddress = async (
    query: string,
    setPoint: (p: GeocodeOut | null) => void,
    setText: (s: string) => void,
    setSearching: (b: boolean) => void,
    setError: (s: string) => void,
  ) => {
    setError('');
    if (!query.trim()) {
      setError('검색어를 입력하세요.');
      return;
    }
    setSearching(true);
    try {
      const url = `${API_BASE_URL}/directions/geocode?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        throw new Error(errPayload?.detail || `status ${res.status}`);
      }
      const data: GeocodeOut = await res.json();
      setPoint(data);
      setText(data.address);
      // 검색 성공 시 지도에 임시 마커 표시 + 이동
      if (mapRef.current && window.naver && window.naver.maps) {
        const naver = window.naver;
        const loc = new naver.maps.LatLng(data.lat, data.lng);
        mapRef.current.setCenter(loc);
        mapRef.current.setZoom(15);
      }
    } catch (err) {
      console.error('Geocode failed:', err);
      setPoint(null);
      setError(err instanceof Error ? err.message : '검색 실패');
    } finally {
      setSearching(false);
    }
  };

  const searchOrigin = () =>
    geocodeAddress(
      origin,
      setOriginPoint,
      setOrigin,
      setOriginSearching,
      setOriginSearchError,
    );

  const searchDestination = () =>
    geocodeAddress(
      destination,
      setDestinationPoint,
      setDestination,
      setDestinationSearching,
      setDestinationSearchError,
    );

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

    // 우선순위: 검색으로 확정된 좌표 > GPS > 텍스트
    const usingMyLocation = origin === '현재 내 위치' && userLocation;
    const originBody = originPoint
      ? { lat: originPoint.lat, lng: originPoint.lng, text: originPoint.address }
      : usingMyLocation
        ? { lat: userLocation!.lat, lng: userLocation!.lng, text: origin }
        : { text: origin };
    const destinationBody = destinationPoint
      ? { lat: destinationPoint.lat, lng: destinationPoint.lng, text: destinationPoint.address }
      : { text: destination };

    const body = {
      origin: originBody,
      destination: destinationBody,
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

  // 가장 가까운 신호등 중 cycle_time이 있는 항목
  const closestSignal =
    nearbySignals.find((s) => s.cycle_time != null) ?? nearbySignals[0] ?? null;

  // 신호등 phase 시뮬레이션 — closestSignal.cycle_time + 신호등별 결정적 오프셋 + wall clock
  // 한국 평균: 적 ≈ 60%, 녹 ≈ 40% 가정.
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const trafficPhase = (() => {
    const cycle = closestSignal?.cycle_time && closestSignal.cycle_time > 0
      ? closestSignal.cycle_time
      : 75;
    const greenDuration = Math.max(1, Math.round(cycle * 0.4));
    const redDuration = Math.max(1, cycle - greenDuration);
    // signal.id 기반 결정적 오프셋(같은 신호등은 항상 같은 phase)
    const offset = closestSignal ? (closestSignal.id * 13) % cycle : 0;
    const elapsed = (nowSec + offset) % cycle;
    const isGreen = elapsed < greenDuration;
    const timer = isGreen
      ? greenDuration - elapsed
      : cycle - elapsed; // 적색 잔여 = 사이클 끝까지
    return { isGreen, timer, cycle, greenDuration, redDuration };
  })();

  const isGreenLight = trafficPhase.isGreen;
  const countdown = trafficPhase.timer;

  // 위치 허용 요청 함수
  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setOrigin('현재 내 위치');
          setOriginPoint({ lat, lng, address: '현재 내 위치', road_address: null });
          setLocationError('');
          setOriginSearchError('');
          
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
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setOriginPoint(null);
                  setOriginSearchError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchOrigin();
                }}
                className="w-full pl-10 pr-20 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button
                  onClick={searchOrigin}
                  disabled={originSearching}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-xl transition-all disabled:opacity-50"
                  title="검색"
                >
                  {originSearching ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={requestLocation}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-xl transition-all"
                  title="내 위치 가져오기"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
            </div>

            {originPoint && (
              <p className="text-xs text-success mt-1 px-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-success rounded-full" />
                {originPoint.address} ({originPoint.lat.toFixed(5)}, {originPoint.lng.toFixed(5)})
              </p>
            )}
            {originSearchError && (
              <p className="text-xs text-danger mt-1 px-1">{originSearchError}</p>
            )}
            {locationError && (
              <p className="text-xs text-danger mt-1 px-1">{locationError}</p>
            )}

            <div className="relative group">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />
              <input
                type="text"
                placeholder="도착지를 입력하세요"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setDestinationPoint(null);
                  setDestinationSearchError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchDestination();
                }}
                className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-danger/10 focus:border-danger outline-none transition-all text-sm font-medium"
              />
              <button
                onClick={searchDestination}
                disabled={destinationSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-danger hover:bg-white rounded-xl transition-all disabled:opacity-50"
                title="검색"
              >
                {destinationSearching ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-danger rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>

            {destinationPoint && (
              <p className="text-xs text-success mt-1 px-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-success rounded-full" />
                {destinationPoint.address} ({destinationPoint.lat.toFixed(5)}, {destinationPoint.lng.toFixed(5)})
              </p>
            )}
            {destinationSearchError && (
              <p className="text-xs text-danger mt-1 px-1">{destinationSearchError}</p>
            )}

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
                     {routeResult.realtime_traffic && (
                       <> · 실시간 {routeResult.realtime_traffic.avg_speed_kmh}km/h</>
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

             {/* 서울 TOPIS 실시간 도로 소통 */}
             {routeResult?.realtime_traffic && (
               <div className="mt-3 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100 relative z-10">
                 <div className="flex items-center justify-between mb-1">
                   <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                     실시간 도로 소통 (서울)
                   </p>
                   <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                     routeResult.realtime_traffic.congestion === '원활' ? 'bg-success/10 text-success' :
                     routeResult.realtime_traffic.congestion === '서행' ? 'bg-yellow-100 text-yellow-700' :
                     routeResult.realtime_traffic.congestion === '지정체' ? 'bg-orange-100 text-orange-700' :
                     'bg-danger/10 text-danger'
                   }`}>
                     {routeResult.realtime_traffic.congestion}
                   </span>
                 </div>
                 <div className="flex items-baseline gap-1.5">
                   <span className="text-2xl font-black text-gray-900 tabular-nums">
                     {routeResult.realtime_traffic.avg_speed_kmh}
                   </span>
                   <span className="text-sm font-bold text-gray-500">km/h 평균</span>
                   {routeResult.realtime_traffic.eta_factor !== 1 && (
                     <span className="ml-auto text-xs font-semibold text-blue-700">
                       ETA ×{routeResult.realtime_traffic.eta_factor.toFixed(2)}
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
