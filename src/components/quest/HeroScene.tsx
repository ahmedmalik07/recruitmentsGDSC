"use client";

import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";

const BLUE = "#4285F4";
const RED = "#EA4335";
const YELLOW = "#FBBC04";
const GREEN = "#34A853";

/** A slanted block (trapezoid side profile), like the wings of the AU building in the GDGOC AU art */
function wedge(length: number, hLeft: number, hRight: number, depth: number): ExtrudeGeometry {
  const s = new Shape();
  s.moveTo(0, 0);
  s.lineTo(length, 0);
  s.lineTo(length, hRight);
  s.lineTo(0, hLeft);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  g.center();
  return g;
}

/**
 * Title-screen 3D scene: the Air University building rebuilt from Google-color blocks,
 * slowly turning, with a few floating bits. Pauses when off-screen or the tab is hidden.
 */
export default function HeroScene({ onReady }: { onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the SVG fallback stays
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 2, 0.1, 100);
    camera.position.set(0, 1.6, 11);
    camera.lookAt(0, 0.2, 0);

    scene.add(new HemisphereLight(0xffffff, 0xf3e9d2, 1.6));
    scene.add(new AmbientLight(0xffffff, 0.35));
    const sun = new DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 6, 5);
    scene.add(sun);

    const geometries: BufferGeometry[] = [];
    const materials: Material[] = [];
    const mat = (hex: string) => {
      const m = new MeshStandardMaterial({ color: new Color(hex), roughness: 0.55, metalness: 0.05 });
      materials.push(m);
      return m;
    };
    const add = (parent: Group, g: BufferGeometry, color: string, x: number, y: number, z: number, ry = 0) => {
      geometries.push(g);
      const mesh = new Mesh(g, mat(color));
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      parent.add(mesh);
      return mesh;
    };

    // The building
    const building = new Group();
    add(building, wedge(4.2, 1.2, 2.4, 1.6), GREEN, 0.6, 0.9, -1.2); // back slanted green
    add(building, new BoxGeometry(2.4, 1.1, 1.3), RED, -1.2, 0.35, -0.2); // red block
    add(building, wedge(6.2, 0.35, 1.7, 1.1), BLUE, 0.2, 0.15, 0.6); // long blue ramp
    add(building, new BoxGeometry(3.2, 1.05, 1.0), YELLOW, 0.9, -0.15, 1.5); // yellow front block
    add(building, new BoxGeometry(1.0, 0.7, 0.9), RED, -1.6, -0.3, 1.4); // small red
    add(building, wedge(1.2, 0.2, 1.3, 0.8), GREEN, -3.1, 0.15, -0.5); // little green spike
    building.position.y = -0.4;
    building.rotation.x = 0.08;
    scene.add(building);

    // Floating bits around it
    const bits = new Group();
    const bitDefs: Array<[BufferGeometry, string, number, number, number]> = [
      [new IcosahedronGeometry(0.28, 0), BLUE, -3.6, 1.9, 0],
      [new BoxGeometry(0.4, 0.4, 0.4), RED, 3.7, 2.0, -0.5],
      [new IcosahedronGeometry(0.22, 0), YELLOW, 3.2, -1.3, 1.5],
      [new BoxGeometry(0.3, 0.3, 0.3), GREEN, -3.3, -1.2, 1.2],
      [new IcosahedronGeometry(0.18, 0), RED, 0.4, 2.6, -1],
    ];
    const bitMeshes = bitDefs.map(([g, c, x, y, z]) => add(bits, g, c, x, y, z));
    scene.add(bits);

    // Sizing
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Pull back on narrow screens so the whole building fits
      camera.position.z = w / h < 1.4 ? 14 : 11;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Pointer tilt
    let targetX = 0;
    let targetY = 0;
    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      targetY = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      targetX = ((e.clientY - r.top) / r.height - 0.5) * 0.25;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Only animate while visible
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    });
    io.observe(el);
    const onVis = () => {
      if (!document.hidden) loop();
    };
    document.addEventListener("visibilitychange", onVis);

    let raf = 0;
    let running = false;
    const start = performance.now();
    let readySent = false;
    function frame(now: number) {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      const t = (now - start) / 1000;
      building.rotation.y += (Math.sin(t * 0.35) * 0.35 + targetY - building.rotation.y) * 0.05;
      building.rotation.x += (0.08 + targetX - building.rotation.x) * 0.05;
      building.position.y = -0.4 + Math.sin(t * 1.1) * 0.06;
      bitMeshes.forEach((mesh, i) => {
        mesh.rotation.x = t * (0.5 + i * 0.1);
        mesh.rotation.y = t * (0.7 + i * 0.07);
        mesh.position.y = bitDefs[i][3] + Math.sin(t * 1.3 + i) * 0.18;
      });
      renderer.render(scene, camera);
      if (!readySent) {
        readySent = true;
        onReady?.();
      }
      raf = requestAnimationFrame(frame);
    }
    function loop() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={host} className="absolute inset-0" aria-hidden="true" />;
}
