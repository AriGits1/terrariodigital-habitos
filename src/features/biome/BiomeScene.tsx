"use client";

import { useMemo, useRef, useEffect, useState } from "react";
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
  onHover,
  onUnhover,
  children,
}: {
  placement: PlantPlacement;
  swayOffset: number;
  vitalityLevel: number;
  onClick: () => void;
  onHover: (e: { clientX: number; clientY: number }) => void;
  onUnhover: () => void;
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
        onHover({ clientX: e.clientX, clientY: e.clientY });
        document.body.style.cursor = "pointer";
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover({ clientX: e.clientX, clientY: e.clientY });
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

/** The circular terrain the flora grows on — enlarged to match new radius. */
function Ground({ color }: { color: string }) {
  return (
    <group position={[0, -0.3, 0]}>
      <mesh>
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

export default function BiomeScene({ type, habits }: BiomeSceneProps) {
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

  // Tooltip state: tracks hovered plant and cursor position
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ground = groundColor(type);
  const sky = skyColor(type);
  const mainKind = plantKind(type);

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

  /** Convert pointer event position relative to container for the tooltip. */
  function toRelative(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 6, 22], fov: 42 }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
        onPointerMissed={() => setTooltip(null)}
      >
        <color attach="background" args={[sky]} />
        <fog attach="fog" args={[sky, 24, 48]} />

        <hemisphereLight args={[sky, ground, 0.7]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[6, 12, 6]} intensity={1.1} />

        <Ground color={ground} />

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
              onClick={() => {
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

      {/* HTML Tooltip overlay — follows cursor position within container */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: tooltip.x,
            top: tooltip.y - 44,
            transform: "translateX(-50%)",
          }}
        >
          <div className="rounded-xl bg-black/80 px-3 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-sm whitespace-nowrap ring-1 ring-white/10">
            {tooltip.title}
          </div>
          {/* Caret */}
          <div className="mx-auto mt-0.5 h-2 w-2 rotate-45 bg-black/80" />
        </div>
      )}
    </div>
  );
}
