import { useEffect, useRef, useState } from "react";
import { REGIONS } from "../../../shared/regions.js";

const MAX_POINTS = 30;
const MAX_ARCS = 15;

function getSocketUrl() {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/globe`;
}

function toGlobeEvent(region) {
  return {
    region: region.id,
    label: region.label,
    lat: region.lat,
    lng: region.lng,
    timestamp: Date.now()
  };
}

export default function SignInGlobe() {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const arcsRef = useRef([]);
  const pointsRef = useRef([]);
  const recentRegionsRef = useRef([]);
  const eventCountRef = useRef(0);
  const demoTimerRef = useRef(null);
  const eventTimeoutsRef = useRef([]);
  const [latestEvent, setLatestEvent] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ws;

    function addSignInEvent(event) {
      const globe = globeRef.current;
      if (!globe || !event?.lat || !event?.lng) return;

      const newPoint = {
        lat: event.lat,
        lng: event.lng,
        label: event.label,
        region: event.region,
        size: 0.5 + Math.random() * 0.35
      };

      pointsRef.current = [...pointsRef.current, newPoint].slice(-MAX_POINTS);
      globe.pointsData(pointsRef.current);

      if (recentRegionsRef.current.length > 0) {
        const origin = recentRegionsRef.current[Math.floor(Math.random() * recentRegionsRef.current.length)];
        arcsRef.current = [
          ...arcsRef.current,
          {
            startLat: origin.lat,
            startLng: origin.lng,
            endLat: event.lat,
            endLng: event.lng
          }
        ].slice(-MAX_ARCS);
        globe.arcsData(arcsRef.current);
      }

      recentRegionsRef.current = [...recentRegionsRef.current, newPoint].slice(-10);
      eventCountRef.current += 1;
      setEventCount(eventCountRef.current);
      setLatestEvent(event);

      const timeout = window.setTimeout(() => {
        pointsRef.current = pointsRef.current.filter((point) => point !== newPoint);
        globe.pointsData(pointsRef.current);
      }, 6500);
      eventTimeoutsRef.current.push(timeout);
    }

    function startDemoMode() {
      if (demoTimerRef.current || cancelled) return;
      setIsDemoMode(true);
      demoTimerRef.current = window.setInterval(() => {
        const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
        addSignInEvent(toGlobeEvent(region));
      }, 2200);
    }

    async function initGlobe() {
      try {
        const [{ default: Globe }, THREE] = await Promise.all([
          import("globe.gl"),
          import("three")
        ]);
        if (cancelled || !containerRef.current) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const globe = Globe()(containerRef.current);
        globe
          .backgroundColor("rgba(0,0,0,0)")
          .atmosphereColor("#c4b8e8")
          .atmosphereAltitude(0.18)
          .globeMaterial(new THREE.MeshPhongMaterial({
            color: "#19172f",
            emissive: "#0d0d1a",
            shininess: 12,
            transparent: true,
            opacity: 0.96
          }))
          .arcColor(() => "#a8c4a2")
          .arcAltitude(0.28)
          .arcStroke(0.55)
          .arcDashLength(0.42)
          .arcDashGap(0.18)
          .arcDashAnimateTime(reduceMotion ? 0 : 1800)
          .pointColor(() => "#f5e4c4")
          .pointAltitude(0.012)
          .pointRadius((point) => point.size || 0.55)
          .pointsMerge(false)
          .pointLabel((point) => `<div class="globe-tooltip">${point.label}</div>`);

        globe.controls().autoRotate = !reduceMotion;
        globe.controls().autoRotateSpeed = 0.45;
        globe.controls().enableZoom = false;

        globeRef.current = globe;

        const handleResize = () => {
          if (!containerRef.current) return;
          globe.width(containerRef.current.clientWidth);
          globe.height(containerRef.current.clientHeight);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        ws = new WebSocket(getSocketUrl());
        ws.onmessage = (message) => {
          try {
            addSignInEvent(JSON.parse(message.data));
          } catch {
            // Ignore malformed globe messages rather than interrupting the page.
          }
        };
        ws.onerror = startDemoMode;
        ws.onclose = () => {
          if (eventCountRef.current === 0) startDemoMode();
        };

        const demoFallback = window.setTimeout(() => {
          if (eventCountRef.current === 0) startDemoMode();
        }, 5000);

        return () => {
          window.clearTimeout(demoFallback);
          window.removeEventListener("resize", handleResize);
        };
      } catch {
        setLoadError(true);
        startDemoMode();
      }
    }

    let cleanupResize;
    initGlobe().then((cleanup) => {
      cleanupResize = cleanup;
    });

    return () => {
      cancelled = true;
      if (ws) ws.close();
      if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
      eventTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      cleanupResize?.();
      if (globeRef.current?._destructor) globeRef.current._destructor();
    };
  }, []);

  return (
    <section className="signin-globe-card" aria-label="Regional sign-in activity">
      <div className="signin-globe-copy">
        <p className="eyebrow">Privacy-safe activity</p>
        <h2>Active across the globe</h2>
        <p>Sign-ins appear by region only. No IPs, exact locations, usernames, or emails are stored or shown.</p>
      </div>
      <div className="signin-globe-shell">
        <div ref={containerRef} className="signin-globe-canvas" aria-hidden="true" />
        {loadError && (
          <div className="signin-globe-fallback" aria-hidden="true">
            Live globe preview
          </div>
        )}
        <div className="signin-globe-badge">
          <span>{isDemoMode ? "Demo mode" : "Live stream"}</span>
          <strong>{eventCount || "0"}</strong>
        </div>
      </div>
      <div className="signin-globe-meta">
        <span>{latestEvent ? `Latest regional sign-in: ${latestEvent.label}` : "Waiting for regional sign-ins..."}</span>
      </div>
      <div className="sr-only" aria-live="polite">
        {latestEvent ? `New sign-in from ${latestEvent.label}` : ""}
      </div>
    </section>
  );
}
