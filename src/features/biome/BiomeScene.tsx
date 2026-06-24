"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group, DirectionalLight as DL, HemisphereLight as HL, AmbientLight as AL } from "three";
import { Color } from "three";
import { useRouter } from "next/navigation";
import {
  type BiomeType,
  flowerColor,
  foliageColor,
  groundColor,
  plantKind,
  generateBiomeVegetation,
  skyColor,
  vitality,
  type PlantPlacement,
} from "./biome-logic";
import { getCurrentPhase, getPhaseColors, type DayPhase } from "./day-phase";
import type { HabitView } from "@/features/habits/HabitsPanel";
import type { BiomeDecoration } from "@/generated/prisma/client";
import { placeDecoration, deleteDecoration } from "./decorations-actions";
import { DECORATIONS_LIST, DECORATIONS_CONFIG } from "./decorations-config";
import { Sparkles, Sprout, X, Store } from "lucide-react";
import { createPortal } from "react-dom";

interface BiomeSceneProps {
  type: BiomeType;
  habits: HabitView[];
  readOnly?: boolean;
  isAdmin?: boolean;
}

/** Wraps a plant so it sways gently and sits at its placement. */
function SwayGroup({
  placement,
  swayOffset,
  vitalityLevel,
  onClick,
  onHover,
  onUnhover,
  disableCursor,
  children,
}: {
  placement: PlantPlacement;
  swayOffset: number;
  vitalityLevel: number;
  onClick: () => void;
  onHover: (e: { clientX: number; clientY: number }) => void;
  onUnhover: () => void;
  /** MF-1 guard B: when true, suppresses pointer cursor and hover tooltip in read-only mode. */
  disableCursor?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    const amplitude = 0.02 + vitalityLevel * 0.03;
    ref.current.rotation.z =
      placement.lean + Math.sin(t * 1.2 + swayOffset) * amplitude;
  });
  return (
    <group
      ref={ref}
      position={[placement.x, 0, placement.z]}
      scale={placement.scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!disableCursor) {
          // MF-1 guard B: skip cursor and tooltip when in read-only visit mode
          onHover({ clientX: e.clientX, clientY: e.clientY });
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (!disableCursor) {
          onHover({ clientX: e.clientX, clientY: e.clientY });
        }
      }}
      onPointerOut={() => {
        onUnhover();
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}

/** Forest: low-poly conifer — brown trunk, green cones. */
function ForestTree({ color, vitalityLevel }: { color: string; vitalityLevel: number }) {
  const foliageY = 0.9 + vitalityLevel * 0.5;
  return (
    <>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.9, 6]} />
        <meshStandardMaterial color="#6b4a2b" />
      </mesh>
      <mesh position={[0, foliageY, 0]}>
        <coneGeometry args={[0.5, 0.9, 7]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, foliageY + 0.5, 0]}>
        <coneGeometry args={[0.36, 0.7, 7]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </>
  );
}

/** Desert: a saguaro-style cactus — tall body with two arms and a tiny bloom. */
function Cactus({ color, vitalityLevel }: { color: string; vitalityLevel: number }) {
  return (
    <>
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.24, 0.95, 4, 10]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0.28, 0.75, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[-0.26, 0.55, 0]} rotation={[0, 0, Math.PI / 5]}>
        <capsuleGeometry args={[0.11, 0.34, 4, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color={vitalityLevel > 0.4 ? "#ff6f8d" : "#caa06a"}
          flatShading
        />
      </mesh>
    </>
  );
}

/** Zen garden: a single colorful flower. */
function Flower({
  stemColor,
  petalColor,
  vitalityLevel,
}: {
  stemColor: string;
  petalColor: string;
  vitalityLevel: number;
}) {
  const bloomY = 1.0 + vitalityLevel * 0.2;
  return (
    <>
      <mesh position={[0, bloomY / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.05, bloomY, 6]} />
        <meshStandardMaterial color={stemColor} />
      </mesh>
      <mesh position={[0.12, bloomY * 0.45, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <coneGeometry args={[0.08, 0.28, 5]} />
        <meshStandardMaterial color={stemColor} flatShading />
      </mesh>
      <mesh position={[0, bloomY, 0]} scale={[1, 0.45, 1]}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={petalColor} flatShading />
      </mesh>
      <mesh position={[0, bloomY + 0.06, 0]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial color="#f4c430" flatShading />
      </mesh>
    </>
  );
}

function Grass({ color }: { color: string }) {
  return (
    <>
      <mesh position={[-0.05, 0.15, 0.05]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.03, 0.3, 3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0.05, 0.2, -0.05]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.035, 0.4, 3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 0.1, 0.08]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.025, 0.2, 3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </>
  );
}

function Bush({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.3, 0]}>
      <icosahedronGeometry args={[0.4, 1]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function SmallFlower({ stemColor, petalColor }: { stemColor: string; petalColor: string }) {
  return (
    <>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
        <meshStandardMaterial color={stemColor} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <icosahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={petalColor} flatShading />
      </mesh>
    </>
  );
}

function Rock() {
  return (
    <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 4, Math.PI / 3, 0]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color="#888888" flatShading />
    </mesh>
  );
}

// ── Elementos Decorativos Personalizados ─────────────────────────────────────

function Pine({ preview = false }: { preview?: boolean }) {
  const op = preview ? 0.6 : 1.0;
  const tr = preview;
  return (
    <>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.9, 6]} />
        <meshStandardMaterial color="#5c4033" transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <coneGeometry args={[0.4, 0.8, 6]} />
        <meshStandardMaterial color="#1e4620" flatShading transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.3, 0.6, 6]} />
        <meshStandardMaterial color="#2e5c30" flatShading transparent={tr} opacity={op} />
      </mesh>
    </>
  );
}

function Palm({ preview = false }: { preview?: boolean }) {
  const op = preview ? 0.6 : 1.0;
  const tr = preview;
  return (
    <>
      <mesh position={[0, 0.4, 0]} rotation={[0.08, 0, 0.05]}>
        <cylinderGeometry args={[0.06, 0.08, 0.8, 6]} />
        <meshStandardMaterial color="#8b5a2b" transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0.04, 1.1, 0.02]} rotation={[-0.05, 0, -0.08]}>
        <cylinderGeometry args={[0.045, 0.06, 0.7, 6]} />
        <meshStandardMaterial color="#8b5a2b" transparent={tr} opacity={op} />
      </mesh>
      <group position={[0.08, 1.4, 0.04]}>
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 5;
          return (
            <mesh key={i} rotation={[0.15, angle, 0.35]}>
              <boxGeometry args={[0.65, 0.015, 0.12]} />
              <meshStandardMaterial color="#228b22" flatShading transparent={tr} opacity={op} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

function FlowerPink({ preview = false }: { preview?: boolean }) {
  const op = preview ? 0.6 : 1.0;
  const tr = preview;
  return (
    <>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.5, 4]} />
        <meshStandardMaterial color="#4caf50" transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0, 0.5, 0]} scale={[1, 0.3, 1]}>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#ff69b4" flatShading transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0, 0.53, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#ffeb3b" flatShading transparent={tr} opacity={op} />
      </mesh>
    </>
  );
}

function FlowerPurple({ preview = false }: { preview?: boolean }) {
  const op = preview ? 0.6 : 1.0;
  const tr = preview;
  return (
    <>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.6, 4]} />
        <meshStandardMaterial color="#4caf50" transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0, 0.6, 0]} scale={[1, 0.3, 1]}>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#9c27b0" flatShading transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0, 0.63, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#ffeb3b" flatShading transparent={tr} opacity={op} />
      </mesh>
    </>
  );
}

function Crystal({ preview = false }: { preview?: boolean }) {
  const op = preview ? 0.6 : 1.0;
  const tr = preview;
  return (
    <mesh position={[0, 0.3, 0]} rotation={[0.25, 0.35, 0.15]}>
      <octahedronGeometry args={[0.26, 0]} />
      <meshStandardMaterial
        color="#00f3ff"
        emissive="#004455"
        roughness={0.05}
        metalness={0.95}
        flatShading
        transparent={tr}
        opacity={op}
      />
    </mesh>
  );
}

function RockDeco({ preview = false }: { preview?: boolean }) {
  const op = preview ? 0.6 : 1.0;
  const tr = preview;
  return (
    <group position={[0, 0.1, 0]}>
      <mesh position={[0, 0, 0]} rotation={[0.1, 0.2, 0.3]}>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#7f8c8d" flatShading transparent={tr} opacity={op} />
      </mesh>
      <mesh position={[0.04, 0.14, -0.02]} rotation={[0.4, -0.2, 0.1]}>
        <dodecahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#95a5a6" flatShading transparent={tr} opacity={op} />
      </mesh>
    </group>
  );
}

function CustomDecorationWrapper({
  deco,
  onClick,
  onHover,
  onUnhover,
  disableCursor,
  children,
}: {
  deco: BiomeDecoration;
  onClick: () => void;
  onHover: (e: { clientX: number; clientY: number }) => void;
  onUnhover: () => void;
  disableCursor?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.rotation.z = Math.sin(t * 0.8 + deco.x * 2) * 0.015;
  });
  return (
    <group
      ref={ref}
      position={[deco.x, 0, deco.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!disableCursor) {
          onHover({ clientX: e.clientX, clientY: e.clientY });
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (!disableCursor) {
          onHover({ clientX: e.clientX, clientY: e.clientY });
        }
      }}
      onPointerOut={() => {
        onUnhover();
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}

/** The circular terrain the flora grows on — enlarged to match new radius. */
function Ground({
  color,
  onPointerMove,
  onPointerOut,
  onClick,
}: {
  color: string;
  onPointerMove?: (e: any) => void;
  onPointerOut?: (e: any) => void;
  onClick?: (e: any) => void;
}) {
  return (
    <group position={[0, -0.3, 0]}>
      <mesh
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <cylinderGeometry args={[12, 12, 0.6, 64]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[12.6, 12.6, 0.5, 64]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

// ── Dynamic lighting ─────────────────────────────────────────────────────────

/**
 * Smoothly interpolates Three.js lights between the current phase colors.
 * Also updates the renderer's clear color (sky) and the scene fog via useThree.
 * Runs inside the R3F Canvas so it has access to the render loop.
 */
function DynamicLighting({ phase, biome }: { phase: DayPhase; biome: BiomeType }) {
  const dirRef  = useRef<DL>(null);
  const hemiRef = useRef<HL>(null);
  const ambRef  = useRef<AL>(null);
  const { scene, gl } = useThree();

  const target = getPhaseColors(phase, biome);
  const targetSky    = useMemo(() => new Color(target.sky),       [target.sky]);
  const targetHemiSky = useMemo(() => new Color(target.hemiSky),  [target.hemiSky]);
  const targetHemiGnd = useMemo(() => new Color(target.hemiGround),[target.hemiGround]);
  const targetSun    = useMemo(() => new Color(target.sunColor),   [target.sunColor]);

  useFrame((_, delta) => {
    const t = Math.min(delta * 0.8, 1); // smooth but not instant

    if (dirRef.current) {
      dirRef.current.color.lerp(targetSun, t);
      dirRef.current.intensity += (target.sunIntensity - dirRef.current.intensity) * t;
      const [tx, ty, tz] = target.sunPosition;
      dirRef.current.position.x += (tx - dirRef.current.position.x) * t;
      dirRef.current.position.y += (ty - dirRef.current.position.y) * t;
      dirRef.current.position.z += (tz - dirRef.current.position.z) * t;
    }
    if (hemiRef.current) {
      (hemiRef.current as HL).color.lerp(targetHemiSky, t);
      (hemiRef.current as HL & { groundColor: Color }).groundColor.lerp(targetHemiGnd, t);
      hemiRef.current.intensity += (target.hemiIntensity - hemiRef.current.intensity) * t;
    }
    if (ambRef.current) {
      ambRef.current.intensity += (target.ambientIntensity - ambRef.current.intensity) * t;
    }
    // Fade scene background and fog
    if (scene.background instanceof Color) {
      scene.background.lerp(targetSky, t);
    } else {
      scene.background = new Color(target.sky);
    }
    if (scene.fog && "color" in scene.fog) {
      (scene.fog as { color: Color }).color.lerp(targetSky, t);
    }
  });

  return (
    <>
      <hemisphereLight
        ref={hemiRef}
        args={[target.hemiSky, target.hemiGround, target.hemiIntensity]}
      />
      <ambientLight ref={ambRef} intensity={target.ambientIntensity} />
      <directionalLight
        ref={dirRef}
        color={target.sunColor}
        intensity={target.sunIntensity}
        position={target.sunPosition}
        castShadow
      />
    </>
  );
}

/**
 * Procedural star field.
 * KEY FIX: fog={false} so stars are never eaten by scene fog.
 * Stars are placed at r=16-20 (inside fog near distance) so they're always sharp.
 * They span all azimuths so they appear regardless of camera orbit angle.
 */
function Stars({ visible }: { visible: boolean }) {
  const positions = useMemo(() => {
    const pts: [number, number, number][] = [];
    let s = 0xdeadbeef;
    const rng = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 0xffffffff; };
    for (let i = 0; i < 200; i++) {
      const theta = rng() * Math.PI * 2;         // full 360° azimuth
      const elev  = rng() * Math.PI * 0.45 + 0.1; // elevation 6°–87° above horizon
      const r     = 16 + rng() * 6;              // r=16-22, inside fog range
      pts.push([
        r * Math.cos(elev) * Math.cos(theta),
        r * Math.sin(elev) + 4,                  // always above terrain
        r * Math.cos(elev) * Math.sin(theta),
      ]);
    }
    return pts;
  }, []);

  if (!visible) return null;

  return (
    <>
      {positions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.09 + (i % 4) * 0.04, 4, 4]} />
          {/* fog={false}: stars must never be hidden by scene fog */}
          <meshBasicMaterial color="#e8f0ff" fog={false} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Moon with soft glow — visible only at night.
 * Positioned directly overhead (high Y, XZ near center) so it's visible
 * from every azimuth angle as the camera auto-rotates.
 */
function Moon({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    // High overhead, slightly offset — visible from any orbit angle
    <group position={[4, 16, 4]}>
      {/* Core disc */}
      <mesh>
        <sphereGeometry args={[1.6, 20, 20]} />
        <meshBasicMaterial color="#e8f4ff" fog={false} />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[2.3, 14, 14]} />
        <meshBasicMaterial color="#c0d8ff" transparent opacity={0.22} fog={false} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[3.5, 12, 12]} />
        <meshBasicMaterial color="#90b4ff" transparent opacity={0.08} fog={false} />
      </mesh>
    </group>
  );
}

/**
 * Animated sun with pulsing corona — visible during dawn / day / dusk.
 * Positioned high overhead (large Y) so it stays in view as the camera
 * orbits around the scene on the Y axis.
 */
function Sun({ phase }: { phase: DayPhase }) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 0.7) * 0.045;
    groupRef.current.scale.setScalar(pulse);
  });

  // High Y keeps the sun visible from all orbit angles.
  // Slight XZ offset differentiates dawn (east) from dusk (west).
  const pos: [number, number, number] =
    phase === "dawn" ? [18,  5,  0] :  // rising — far horizon east
    phase === "dusk" ? [-18, 5,  0] :  // setting — far horizon west
                       [0,  10,  0];   // midday  — overhead

  const core  = phase === "day"  ? "#fff9c4" : phase === "dawn" ? "#ffdd88" : "#ff9944";
  const inner = phase === "day"  ? "#ffe082" : phase === "dawn" ? "#ffbb55" : "#ff7722";
  const outer = phase === "day"  ? "#ffcc33" : phase === "dawn" ? "#ff9933" : "#ff5500";

  return (
    <group position={pos} ref={groupRef}>
      {/* Bright core */}
      <mesh>
        <sphereGeometry args={[1.2, 20, 20]} />
        <meshBasicMaterial color={core} fog={false} />
      </mesh>
      {/* Inner corona */}
      <mesh>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial color={inner} transparent opacity={0.38} fog={false} />
      </mesh>
      {/* Outer soft corona */}
      <mesh>
        <sphereGeometry args={[2.8, 14, 14]} />
        <meshBasicMaterial color={outer} transparent opacity={0.14} fog={false} />
      </mesh>
      {/* Wide atmospheric glow */}
      <mesh>
        <sphereGeometry args={[4.2, 10, 10]} />
        <meshBasicMaterial color={outer} transparent opacity={0.05} fog={false} />
      </mesh>
    </group>
  );
}

/** Single fluffy cloud — 5 overlapping spheres, all with fog={false}. */
function CloudCluster({
  position,
  color,
  opacity,
  driftSeed,
}: {
  position: [number, number, number];
  color: string;
  opacity: number;
  driftSeed: number;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // Very slow orbit drift on the XZ plane so clouds don't drift off-screen
    const angle = driftSeed + t * 0.008;
    const r = Math.sqrt(position[0] ** 2 + position[2] ** 2);
    ref.current.position.x = r * Math.cos(angle);
    ref.current.position.z = r * Math.sin(angle);
    ref.current.position.y = position[1] + Math.sin(t * 0.07 + driftSeed) * 0.4;
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} fog={false} />
      </mesh>
      <mesh position={[1.4, 0.3, 0.2]}>
        <sphereGeometry args={[0.95, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.9} fog={false} />
      </mesh>
      <mesh position={[-1.3, 0.2, -0.1]}>
        <sphereGeometry args={[0.85, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.9} fog={false} />
      </mesh>
      <mesh position={[0.4, 0.7, 0]}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.85} fog={false} />
      </mesh>
      <mesh position={[-0.5, 0.6, 0.3]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.8} fog={false} />
      </mesh>
    </group>
  );
}

/**
 * 8 drifting cloud clusters spread at every 45° azimuth — visible during
 * all non-night phases from any camera orbit angle.
 * Radius=17 keeps them within the fog-free zone but still sky-level.
 */
function Clouds({ phase }: { phase: DayPhase }) {
  if (phase === "night") return null;

  const color =
    phase === "dusk" ? "#ffc0a0" :
    phase === "dawn" ? "#ffd8b8" :
                       "#ffffff";
  const opacity = phase === "day" ? 0.80 : 0.60;

  // 8 positions at radius=17, Y=7-9, lower in the sky
  const clusters: { pos: [number, number, number]; seed: number }[] = [
    { pos: [ 17,   8,   0], seed: 0.0  },
    { pos: [ 12,   9,  12], seed: 0.8  },
    { pos: [  0,   8,  17], seed: 1.6  },
    { pos: [-12,   7,  12], seed: 2.4  },
    { pos: [-17,   9,   0], seed: 3.2  },
    { pos: [-12,   8, -12], seed: 4.0  },
    { pos: [  0,   8, -17], seed: 4.8  },
    { pos: [ 12,   7, -12], seed: 5.6  },
  ];

  return (
    <>
      {clusters.map(({ pos, seed }, i) => (
        <CloudCluster key={i} position={pos} color={color} opacity={opacity} driftSeed={seed} />
      ))}
    </>
  );
}

interface BiomeSceneProps {
  type: BiomeType;
  habits: HabitView[];
  readOnly?: boolean;
  isAdmin?: boolean;
  decorations?: BiomeDecoration[];
  seeds?: number;
  showShop?: boolean;
}

export default function BiomeScene({
  type,
  habits,
  readOnly = false,
  isAdmin = false,
  decorations = [],
  seeds = 0,
  showShop = false,
}: BiomeSceneProps) {
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) {
        return;
      }
      originalWarn.apply(console, args);
    };
    return () => { console.warn = originalWarn; };
  }, []);

  const router = useRouter();

  // ── Day phase: recompute once per minute (or use admin override) ───────────
  const [phase, setPhase] = useState<DayPhase>(() => getCurrentPhase(new Date().getHours()));
  const [hourOverride, setHourOverride] = useState<number | null>(null);

  useEffect(() => {
    if (hourOverride !== null) return;
    const tick = () => setPhase(getCurrentPhase(new Date().getHours()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hourOverride]);

  const effectivePhase: DayPhase = hourOverride !== null
    ? getCurrentPhase(hourOverride)
    : phase;

  const isNight = effectivePhase === "night";

  // Tooltip state: tracks hovered plant and cursor position
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ground = groundColor(type);
  const initialSky = skyColor(type);
  const mainKind = plantKind(type);

  // Shop & placement states
  const [selectedDecorationType, setSelectedDecorationType] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<[number, number, number] | null>(null);
  const [selectedDecoToDelete, setSelectedDecoToDelete] = useState<{
    id: string;
    name: string;
    cost: number;
    x: number;
    z: number;
  } | null>(null);

  // Build daysData including habit title for tooltips
  const daysData = useMemo(() => {
    const data: { dayIndex: number; habits: { id: string; title: string; weight: number; status: "completed" | "pending" | "failed" }[] }[] = [];
    const topHabits = habits.slice(0, 5);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let day = 0; day < 7; day++) {
      const dayHabits = topHabits
        .filter(h => {
          if (!h.createdAt) return true;
          const createdDate = new Date(h.createdAt);
          const createdMidnight = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
          const createdDiffDays = Math.floor((today.getTime() - createdMidnight.getTime()) / (1000 * 60 * 60 * 24));
          return day <= createdDiffDays;
        })
        .map(h => {
          let completed = false;
          if (h.weeklyLogs) {
            for (const log of h.weeklyLogs) {
              const logDate = new Date(log);
              const logMidnight = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
              const diffDays = Math.floor((today.getTime() - logMidnight.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays === day) { completed = true; break; }
            }
          }
          let status: "completed" | "pending" | "failed" = completed ? "completed" : "failed";
          if (!completed && day === 0) status = "pending";
          return { id: h.id, title: h.title, weight: h.weight, status };
        });
      data.push({ dayIndex: day, habits: dayHabits });
    }
    return data;
  }, [habits]);

  const placements = useMemo(
    () => generateBiomeVegetation(daysData),
    [daysData],
  );

  function toRelative(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <Canvas
        camera={{ position: [0, 6, 22], fov: 42 }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
        onPointerMissed={() => setTooltip(null)}
      >
        <color attach="background" args={[initialSky]} />
        <fog attach="fog" args={[initialSky, 24, 48]} />

        {/* Dynamic lighting */}
        <DynamicLighting phase={effectivePhase} biome={type} />

        {/* Day elements */}
        {effectivePhase !== "night" && <Sun phase={effectivePhase} />}
        <Clouds phase={effectivePhase} />

        {/* Night elements */}
        <Moon  visible={isNight} />
        <Stars visible={isNight} />

        <Ground
          color={ground}
          onPointerMove={(e) => {
            if (selectedDecorationType) {
              e.stopPropagation();
              setHoverPoint([e.point.x, 0, e.point.z]);
            }
          }}
          onPointerOut={() => {
            setHoverPoint(null);
          }}
          onClick={async (e) => {
            if (selectedDecorationType) {
              e.stopPropagation();
              const x = e.point.x;
              const z = e.point.z;
              if (x * x + z * z > 11 * 11) return;

              const typeToPlace = selectedDecorationType;
              setSelectedDecorationType(null);
              setHoverPoint(null);

              const res = await placeDecoration(typeToPlace, x, z);
              if (!res.success) {
                alert(res.error || "Error al colocar elemento.");
              }
            }
          }}
        />

        {/* Render procedural vegetation */}
        {placements.map((p, i) => {
          const isMain = p.kind === "main";
          const v = isMain ? 1.0 : vitality(80 + (i % 20));
          const foliage = foliageColor(type, isMain ? 100 : 80);

          return (
            <SwayGroup
              key={p.id}
              placement={p}
              vitalityLevel={v}
              swayOffset={i * 0.7}
              disableCursor={readOnly && isMain}
              onClick={() => {
                if (readOnly) return;
                if (isMain && p.habitId) {
                  const habitTitle = encodeURIComponent(p.habitTitle ?? "");
                  router.push(`?coach=true&habitId=${p.habitId}&habitTitle=${habitTitle}`, { scroll: false });
                }
              }}
              onHover={({ clientX, clientY }) => {
                if (isMain && p.habitTitle) {
                  const pos = toRelative(clientX, clientY);
                  setTooltip({ title: p.habitTitle, x: pos.x, y: pos.y });
                }
              }}
              onUnhover={() => setTooltip(null)}
            >
              {p.kind === "main" ? (
                mainKind === "cactus" ? (
                  <Cactus color={foliage} vitalityLevel={v} />
                ) : mainKind === "flower" ? (
                  <Flower
                    stemColor={foliage}
                    petalColor={flowerColor(p.dayIndex)}
                    vitalityLevel={v}
                  />
                ) : (
                  <ForestTree color={foliage} vitalityLevel={v} />
                )
              ) : p.kind === "grass" ? (
                <Grass color={foliage} />
              ) : p.kind === "bush" ? (
                <Bush color={foliage} />
              ) : p.kind === "smallFlower" ? (
                <SmallFlower stemColor={foliage} petalColor={flowerColor(i)} />
              ) : (
                <Rock />
              )}
            </SwayGroup>
          );
        })}

        {/* Render user placed decorations */}
        {decorations.map((deco) => {
          return (
            <CustomDecorationWrapper
              key={deco.id}
              deco={deco}
              onClick={() => {
                if (readOnly) return;
                setSelectedDecoToDelete({
                  id: deco.id,
                  name: DECORATIONS_CONFIG[deco.type]?.name ?? deco.type,
                  cost: DECORATIONS_CONFIG[deco.type]?.cost ?? 0,
                  x: deco.x,
                  z: deco.z,
                });
              }}
              onHover={({ clientX, clientY }) => {
                const name = DECORATIONS_CONFIG[deco.type]?.name ?? deco.type;
                const pos = toRelative(clientX, clientY);
                setTooltip({ title: `${name} (Haz clic para eliminar)`, x: pos.x, y: pos.y });
              }}
              onUnhover={() => setTooltip(null)}
              disableCursor={readOnly}
            >
              {deco.type === "pine" ? (
                <Pine />
              ) : deco.type === "palm" ? (
                <Palm />
              ) : deco.type === "flower_pink" ? (
                <FlowerPink />
              ) : deco.type === "flower_purple" ? (
                <FlowerPurple />
              ) : deco.type === "crystal" ? (
                <Crystal />
              ) : (
                <RockDeco />
              )}
            </CustomDecorationWrapper>
          );
        })}

        {/* Render active placement preview */}
        {selectedDecorationType && hoverPoint && (
          <group position={hoverPoint}>
            <group name="preview">
              {selectedDecorationType === "pine" ? (
                <Pine preview />
              ) : selectedDecorationType === "palm" ? (
                <Palm preview />
              ) : selectedDecorationType === "flower_pink" ? (
                <FlowerPink preview />
              ) : selectedDecorationType === "flower_purple" ? (
                <FlowerPurple preview />
              ) : selectedDecorationType === "crystal" ? (
                <Crystal preview />
              ) : (
                <RockDeco preview />
              )}
            </group>
            {/* Visual footprint ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.3, 0.35, 32]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
            </mesh>
          </group>
        )}

        <OrbitControls
          makeDefault
          target={[0, 1.2, 0]}
          enablePan={false}
          enableZoom={false}
          autoRotate={!selectedDecorationType} // Stop rotating during placement for easier aim
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>

      {/* HTML Tooltip overlay */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: tooltip.x,
            top: tooltip.y - 44,
            transform: "translateX(-50%)",
          }}
        >
          <div className="rounded-xl bg-black/85 px-3 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-sm whitespace-nowrap ring-1 ring-white/10">
            {tooltip.title}
          </div>
          <div className="mx-auto mt-0.5 h-2 w-2 rotate-45 bg-black/85" />
        </div>
      )}



      {/* Placement Mode Banner */}
      {selectedDecorationType && (
        <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm rounded-xl bg-emerald-950/90 text-emerald-100 px-4 py-3 backdrop-blur-md ring-1 ring-emerald-500/30 shadow-2xl flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-medium">
            Plantar <strong>{DECORATIONS_CONFIG[selectedDecorationType]?.name}</strong>
          </p>
          <p className="text-[10px] text-emerald-300">
            Haz clic en el terreno verde para colocarlo.
          </p>
          <button
            onClick={() => {
              setSelectedDecorationType(null);
              setHoverPoint(null);
            }}
            className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] hover:bg-emerald-500/40 transition"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Seed shop panel modal */}
      {showShop && !readOnly && typeof document !== "undefined" && createPortal(
        <div className="pointer-events-auto fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6">
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Store className="h-5 w-5 text-emerald-400" />
                Tienda de Decoraciones
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                  🌱 {seeds}
                </div>
                <button
                  onClick={() => router.push("?", { scroll: false })}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-4 pt-3">
              <p className="text-sm text-white/60">
                ¡Completa tus hábitos para conseguir más semillas!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 max-h-[60vh] overflow-y-auto">
              {DECORATIONS_LIST.map((item) => {
                const canAfford = seeds >= item.cost;
                const isSelected = selectedDecorationType === item.id;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div>
                      <div className="text-2xl mb-1 select-none">{item.emoji}</div>
                      <div className="text-sm font-semibold text-white">{item.name}</div>
                      <div className="text-xs text-zinc-400 line-clamp-2 leading-tight mt-1">
                        {item.description}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded">
                        {item.cost} 🌱
                      </span>
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          if (!isSelected) {
                            setSelectedDecorationType(item.id);
                            setHoverPoint(null);
                            router.push("?", { scroll: false }); // Cierra la tienda para entrar en modo colocación
                          } else {
                            setSelectedDecorationType(null);
                            setHoverPoint(null);
                          }
                        }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                          isSelected
                            ? "bg-emerald-500 text-black hover:bg-emerald-400"
                            : canAfford
                              ? "bg-white text-black hover:bg-zinc-200"
                              : "bg-white/5 text-zinc-500 cursor-not-allowed"
                        }`}
                      >
                        {isSelected ? "Listo" : "Plantar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {selectedDecoToDelete && typeof document !== "undefined" && createPortal(
        <div className="pointer-events-auto fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-[90%] max-w-xs rounded-2xl bg-zinc-900 p-5 text-white ring-1 ring-white/10 shadow-2xl flex flex-col gap-4 text-center">
            <h3 className="font-semibold text-base">¿Eliminar elemento?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ¿Quieres quitar tu <strong>{selectedDecoToDelete.name}</strong>? Se te reembolsarán las <strong>{selectedDecoToDelete.cost}</strong> semillas.
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setSelectedDecoToDelete(null)}
                className="flex-1 rounded-xl bg-zinc-800 py-2 text-xs font-medium hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const id = selectedDecoToDelete.id;
                  setSelectedDecoToDelete(null);
                  const res = await deleteDecoration(id);
                  if (!res.success) {
                    alert(res.error || "Error al eliminar elemento.");
                  }
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-medium hover:bg-rose-500 transition text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Control de hora del día (Simulador) */}
      <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-black/60 px-4 py-2.5 backdrop-blur-md ring-1 ring-white/10 shadow-xl">
        <span className="text-lg select-none" title={`Fase: ${effectivePhase}`}>
          {effectivePhase === "dawn"  ? "🌅"
         : effectivePhase === "day"   ? "☀️"
         : effectivePhase === "dusk"  ? "🌆"
         : "🌙"}
        </span>

        <input
          id="admin-hour-slider"
          type="range"
          min={0}
          max={23}
          step={1}
          value={hourOverride ?? new Date().getHours()}
          onChange={(e) => setHourOverride(Number(e.target.value))}
          className="h-1.5 w-32 cursor-pointer accent-emerald-400"
          title="Simular hora del día"
        />

        <span className="min-w-[2.5rem] text-center text-xs font-mono text-white/80">
          {String(hourOverride ?? new Date().getHours()).padStart(2, "0")}:00
        </span>

        {hourOverride !== null && (
          <button
            onClick={() => setHourOverride(null)}
            className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60 hover:bg-white/20 hover:text-white transition"
            title="Restaurar hora real"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
