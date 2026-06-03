"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import {
  type BiomeType,
  foliageColor,
  groundColor,
  plantCount,
  plantLayout,
  skyColor,
  vitality,
  type PlantPlacement,
} from "./biome-logic";

interface BiomeSceneProps {
  type: BiomeType;
  growth: number;
  health: number;
}

/** A single stylized low-poly plant that sways gently to feel alive. */
function Plant({
  placement,
  color,
  vitalityLevel,
  swayOffset,
}: {
  placement: PlantPlacement;
  color: string;
  vitalityLevel: number;
  swayOffset: number;
}) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Healthier plants sway a touch more energetically; all stay subtle.
    const amplitude = 0.02 + vitalityLevel * 0.03;
    ref.current.rotation.z =
      placement.lean + Math.sin(t * 1.2 + swayOffset) * amplitude;
  });

  // Foliage sits lower and droopier when the plant is unhealthy.
  const foliageY = 0.9 + vitalityLevel * 0.5;

  return (
    <group
      ref={ref}
      position={[placement.x, 0, placement.z]}
      scale={placement.scale}
    >
      {/* Trunk */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.9, 6]} />
        <meshStandardMaterial color="#6b4a2b" />
      </mesh>
      {/* Lower foliage */}
      <mesh position={[0, foliageY, 0]} castShadow>
        <coneGeometry args={[0.5, 0.9, 7]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Upper foliage */}
      <mesh position={[0, foliageY + 0.5, 0]} castShadow>
        <coneGeometry args={[0.36, 0.7, 7]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}

/** The circular terrain the plants grow on. */
function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <cylinderGeometry args={[7.5, 7.5, 0.4, 48]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function BiomeScene({ type, growth, health }: BiomeSceneProps) {
  const v = vitality(health);
  const foliage = foliageColor(type, health);
  const ground = groundColor(type);
  const sky = skyColor(type);

  // Recompute the layout only when the plant count or health changes.
  const placements = useMemo(
    () => plantLayout(plantCount(growth), health),
    [growth, health],
  );

  return (
    <Canvas
      shadows
      camera={{ position: [0, 6, 12], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 18, 32]} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Ground color={ground} />
      {placements.map((p, i) => (
        <Plant
          key={i}
          placement={p}
          color={foliage}
          vitalityLevel={v}
          swayOffset={i * 0.7}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
