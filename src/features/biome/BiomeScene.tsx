"use client";

import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
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
import type { HabitView } from "@/features/habits/HabitsPanel";

interface BiomeSceneProps {
  type: BiomeType;
  habits: HabitView[];
}

/** Wraps a plant so it sways gently and sits at its placement. */
function SwayGroup({
  placement,
  swayOffset,
  vitalityLevel,
  onClick,
  children,
}: {
  placement: PlantPlacement;
  swayOffset: number;
  vitalityLevel: number;
  onClick: () => void;
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
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
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
      {/* Main body */}
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.24, 0.95, 4, 10]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.28, 0.75, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.26, 0.55, 0]} rotation={[0, 0, Math.PI / 5]}>
        <capsuleGeometry args={[0.11, 0.34, 4, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Bloom on top, brighter when healthy */}
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

/** Zen garden: a single colorful flower — green stem, petals and a center. */
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
      {/* Stem */}
      <mesh position={[0, bloomY / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.05, bloomY, 6]} />
        <meshStandardMaterial color={stemColor} />
      </mesh>
      {/* Leaf */}
      <mesh position={[0.12, bloomY * 0.45, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <coneGeometry args={[0.08, 0.28, 5]} />
        <meshStandardMaterial color={stemColor} flatShading />
      </mesh>
      {/* Petals — a flattened disc of color */}
      <mesh position={[0, bloomY, 0]} scale={[1, 0.45, 1]}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={petalColor} flatShading />
      </mesh>
      {/* Center */}
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
    <mesh position={[0, 0.15, 0]} rotation={[Math.PI/4, Math.PI/3, 0]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color="#888888" flatShading />
    </mesh>
  );
}

/** The circular terrain the flora grows on. */
function Ground({ color }: { color: string }) {
  // A cylinder's axis is already vertical, so its flat caps face up/down — no
  // rotation needed. The top cap sits at y≈0 where the plants are rooted.
  return (
    <group position={[0, -0.3, 0]}>
      <mesh>
        <cylinderGeometry args={[9, 9, 0.6, 64]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[9.6, 9.6, 0.5, 64]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export default function BiomeScene({ type, habits }: BiomeSceneProps) {
  useEffect(() => {
    // Suppress the THREE.Clock deprecation warning caused by React Three Fiber internals
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) {
        return;
      }
      originalWarn.apply(console, args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const router = useRouter();

  const total = habits.length;
  const done = habits.filter(h => h.doneToday).length;
  const overallHealth = total === 0 ? 80 : (done / total) * 100;

  const ground = groundColor(type);
  const sky = skyColor(type);
  const mainKind = plantKind(type);

  // Compute daily habits data based on weeklyLogs
  const daysData = useMemo(() => {
    const data: { dayIndex: number; habits: { id: string; weight: number; status: "completed" | "pending" | "failed" }[] }[] = [];
    
    // Pick top 5 habits (limit per day as requested)
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
          // If the day index (e.g. 2 days ago) is greater than how long ago the habit was created, it didn't exist then.
          return day <= createdDiffDays;
        })
        .map(h => {
          let completed = false;
          if (h.weeklyLogs) {
            for (const log of h.weeklyLogs) {
              const logDate = new Date(log);
              const logMidnight = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
              const diffTime = today.getTime() - logMidnight.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === day) {
                completed = true;
                break;
              }
            }
          }
          let status: "completed" | "pending" | "failed" = completed ? "completed" : "failed";
          // If it's today (day 0) and not completed, it's pending, not failed yet
          if (!completed && day === 0) status = "pending";

          return { id: h.id, weight: h.weight, status };
        });
      data.push({ dayIndex: day, habits: dayHabits });
    }
    
    return data;
  }, [habits]);

  const placements = useMemo(
    () => generateBiomeVegetation(daysData),
    [daysData],
  );

  return (
    <Canvas
      camera={{ position: [0, 5, 16], fov: 42 }}
      dpr={[1, 1.5]}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 18, 38]} />

      <hemisphereLight args={[sky, ground, 0.7]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 12, 6]} intensity={1.1} />

      <Ground color={ground} />
      {placements.map((p, i) => {
        // Decorative elements use random colors/vitality derived from index
        const isMain = p.kind === "main";
        // Main plants are fully healthy because they represent completions
        const v = isMain ? 1.0 : vitality(80 + (i % 20)); 
        const foliage = foliageColor(type, isMain ? 100 : 80);

        return (
          <SwayGroup
            key={p.id}
            placement={p}
            vitalityLevel={v}
            swayOffset={i * 0.7}
            onClick={() => {
              if (isMain) router.push('?coach=true', { scroll: false });
            }}
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

      <OrbitControls
        makeDefault
        target={[0, 1.2, 0]}
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.15}
      />
    </Canvas>
  );
}
