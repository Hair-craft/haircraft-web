"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, Vector3, type Group, type Mesh } from "three";

/**
 * Softly floating gold strands: a few glossy tubes that sway slowly and
 * catch the light. Purely decorative. Loaded only on desktop, after the
 * page is visible (see HeroAccent), and rendered only while on screen.
 */

const STRANDS = 6;

function strandCurve(index: number): CatmullRomCurve3 {
  // Half the strands fall just left of the hero photo, half just right of it
  // (the photo covers the middle of the canvas).
  const side = index % 2 === 0 ? -1 : 1;
  const offset = side * (1.62 + Math.floor(index / 2) * 0.08);
  const points: Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    points.push(
      new Vector3(
        offset + Math.sin(t * Math.PI * 2 + index) * 0.06,
        2.2 - t * 4.4,
        Math.cos(t * Math.PI * 1.5 + index * 0.7) * 0.2,
      ),
    );
  }
  return new CatmullRomCurve3(points);
}

function Strand({ index }: { index: number }) {
  const mesh = useRef<Mesh>(null);
  const curve = useMemo(() => strandCurve(index), [index]);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    // A gentle drift in place (rotating would swing the off-centre strands behind the photo).
    mesh.current.position.x = Math.sin(t * 0.3 + index) * 0.04;
    mesh.current.position.y = Math.sin(t * 0.4 + index * 0.8) * 0.08;
  });
  return (
    <mesh ref={mesh}>
      <tubeGeometry args={[curve, 96, 0.012 + (index % 3) * 0.005, 10, false]} />
      <meshStandardMaterial
        color={index % 2 === 0 ? "#d9982f" : "#f2c45c"}
        metalness={0.85}
        roughness={0.28}
      />
    </mesh>
  );
}

function Strands() {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.15) * 0.06;
  });
  return (
    <group ref={group} rotation={[0, 0, -0.35]}>
      {Array.from({ length: STRANDS }, (_, i) => (
        <Strand key={i} index={i} />
      ))}
    </group>
  );
}

export default function HeroAccentScene({ active }: { active: boolean }) {
  return (
    <Canvas
      // Render only while the hero is on screen; nothing runs once scrolled away.
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -2, 2]} intensity={0.6} color="#cdeebb" />
      <Strands />
    </Canvas>
  );
}
