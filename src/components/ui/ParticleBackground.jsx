import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 1800;
const CONNECTION_DISTANCE = 118;
const MAX_CONNECTIONS = 620;

const colorPalettes = [
  { primary: 0x7a6dc4, secondary: 0xc4b8e8 },
  { primary: 0xc8a055, secondary: 0xf5e4c4 },
  { primary: 0x7aaa72, secondary: 0xc8d8c4 },
  { primary: 0x6aa8d4, secondary: 0xcce0f0 }
];

function mixColor(primary, secondary, mix, noise = 0) {
  const primaryRgb = [
    ((primary >> 16) & 255) / 255,
    ((primary >> 8) & 255) / 255,
    (primary & 255) / 255
  ];
  const secondaryRgb = [
    ((secondary >> 16) & 255) / 255,
    ((secondary >> 8) & 255) / 255,
    (secondary & 255) / 255
  ];

  return primaryRgb.map((channel, index) => (
    Math.max(0, Math.min(1, channel * (1 - mix) + secondaryRgb[index] * mix + noise))
  ));
}

function createParticleTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d", { alpha: true });
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);

  gradient.addColorStop(0, "rgba(255,253,249,1)");
  gradient.addColorStop(0.25, "rgba(221,213,240,0.95)");
  gradient.addColorStop(0.62, "rgba(155,143,212,0.45)");
  gradient.addColorStop(1, "rgba(196,184,232,0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,253,249,0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(32, 32, 17, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let renderer;
    let scene;
    let camera;
    let particles;
    let lines;
    let animationFrame;
    let lastConnectionUpdate = 0;
    let frame = 0;
    let disposed = false;
    const velocities = [];
    const mouse = {
      x: window.innerWidth * 0.58,
      y: window.innerHeight * 0.34,
      down: false
    };

    async function init() {
      const THREE = await import("three");
      if (disposed || !canvasRef.current) return;

      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(
        -window.innerWidth / 2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        -window.innerHeight / 2,
        1,
        1000
      );
      camera.position.z = 500;

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);
      const sizes = new Float32Array(PARTICLE_COUNT);

      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const i3 = i * 3;
        const palette = colorPalettes[i % colorPalettes.length];
        const [r, g, b] = mixColor(palette.primary, palette.secondary, Math.random(), (Math.random() - 0.5) * 0.08);

        positions[i3] = (Math.random() - 0.5) * window.innerWidth * 1.12;
        positions[i3 + 1] = (Math.random() - 0.5) * window.innerHeight * 1.12;
        positions[i3 + 2] = (Math.random() - 0.5) * 160;

        colors[i3] = r;
        colors[i3 + 1] = g;
        colors[i3 + 2] = b;
        sizes[i] = Math.random() * 3.2 + 1.8;

        velocities.push({
          x: (Math.random() - 0.5) * 0.34,
          y: (Math.random() - 0.5) * 0.34,
          z: (Math.random() - 0.5) * 0.05,
          phase: Math.random() * Math.PI * 2
        });
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      particles = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 5.8,
        map: createParticleTexture(THREE),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
        opacity: 0.78,
        sizeAttenuation: true
      }));
      scene.add(particles);

      lines = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
          color: 0x9b8fd4,
          transparent: true,
          opacity: 0.16,
          blending: THREE.AdditiveBlending
        })
      );
      scene.add(lines);

      function updateParticles() {
        const positionArray = particles.geometry.attributes.position.array;
        const time = Date.now() * 0.0007;
        const halfW = (window.innerWidth / 2) * 1.18;
        const halfH = (window.innerHeight / 2) * 1.18;
        const mouseX = mouse.x - window.innerWidth / 2;
        const mouseY = window.innerHeight / 2 - mouse.y;

        for (let i = 0; i < PARTICLE_COUNT; i += 1) {
          const i3 = i * 3;
          const vel = velocities[i];
          const floatX = Math.sin(time * 0.7 + vel.phase) * 0.18;
          const floatY = Math.cos(time * 0.5 + vel.phase * 1.3) * 0.14;

          positionArray[i3] += vel.x + floatX;
          positionArray[i3 + 1] += vel.y + floatY;
          positionArray[i3 + 2] += vel.z;

          const dx = positionArray[i3] - mouseX;
          const dy = positionArray[i3 + 1] - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 220 && dist > 1) {
            const force = (220 - dist) / 220;
            const strength = mouse.down ? 1.55 : 0.58;
            positionArray[i3] += (dx / dist) * force * strength;
            positionArray[i3 + 1] += (dy / dist) * force * strength;
          }

          if (positionArray[i3] > halfW) positionArray[i3] = -halfW;
          if (positionArray[i3] < -halfW) positionArray[i3] = halfW;
          if (positionArray[i3 + 1] > halfH) positionArray[i3 + 1] = -halfH;
          if (positionArray[i3 + 1] < -halfH) positionArray[i3 + 1] = halfH;

          vel.x *= 0.995;
          vel.y *= 0.995;
          vel.x += (Math.random() - 0.5) * 0.004;
          vel.y += (Math.random() - 0.5) * 0.004;
        }

        particles.geometry.attributes.position.needsUpdate = true;
      }

      function updateConnections() {
        if (Date.now() - lastConnectionUpdate < 90) return;
        lastConnectionUpdate = Date.now();

        const positionArray = particles.geometry.attributes.position.array;
        const linePositions = [];
        let connectionCount = 0;

        for (let i = 0; i < PARTICLE_COUNT && connectionCount < MAX_CONNECTIONS; i += 3) {
          for (let j = i + 3; j < PARTICLE_COUNT && connectionCount < MAX_CONNECTIONS; j += 7) {
            const i3 = i * 3;
            const j3 = j * 3;
            const dx = positionArray[i3] - positionArray[j3];
            const dy = positionArray[i3 + 1] - positionArray[j3 + 1];
            const distSq = dx * dx + dy * dy;

            if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
              linePositions.push(positionArray[i3], positionArray[i3 + 1], positionArray[i3 + 2]);
              linePositions.push(positionArray[j3], positionArray[j3 + 1], positionArray[j3 + 2]);
              connectionCount += 1;
            }
          }
        }

        const nextGeometry = new THREE.BufferGeometry();
        nextGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
        lines.geometry.dispose();
        lines.geometry = nextGeometry;
      }

      function animate() {
        if (disposed) return;
        frame += 1;
        updateParticles();
        if (frame % 2 === 0) updateConnections();
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      }

      animate();
    }

    function onResize() {
      if (!renderer || !camera) return;
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.left = -window.innerWidth / 2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = -window.innerHeight / 2;
      camera.updateProjectionMatrix();
    }

    function onPointerMove(event) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }

    function onPointerDown() {
      mouse.down = true;
    }

    function onPointerUp() {
      mouse.down = false;
    }

    init();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      particles?.geometry?.dispose();
      particles?.material?.map?.dispose();
      particles?.material?.dispose();
      lines?.geometry?.dispose();
      lines?.material?.dispose();
      renderer?.dispose();
    };
  }, []);

  return <canvas className="particle-background" ref={canvasRef} aria-hidden="true" />;
}
