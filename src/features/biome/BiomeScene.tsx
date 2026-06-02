"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import {
  type BiomeType,
  flowerColor,
  foliageColor,
  groundColor,
  plantCount,
  plantKind,
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

/** Wraps a plant so it sways gently and sits at its placement. */
function SwayGroup({
  placement,
  swayOffset,
  vitalityLevel,
  children,
}: {
  placement: PlantPlacement;
  swayOffset: number;
  vitalityLevel: number;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const amplitude = 0.02 + vitalityLevel * 0.03;
    ref.current.rotation.z =
      placement.lean + Math.sin(t * 1.2 + swayOffset) * amplitude;
  });
  return (
    <group
      ref={ref}
      position={[placement.x, 0, placement.z]}
      scale={placement.scale}
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

export default function BiomeScene({ type, growth, health }: BiomeSceneProps) {
  const v = vitality(health);
  const foliage = foliageColor(type, health);
  const ground = groundColor(type);
  const sky = skyColor(type);
  const kind = plantKind(type);

  const placements = useMemo(
    () => plantLayout(plantCount(growth), health),
    [growth, health],
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
      {placements.map((p, i) => (
        <SwayGroup
          key={i}
          placement={p}
          vitalityLevel={v}
          swayOffset={i * 0.7}
        >
          {kind === "cactus" ? (
            <Cactus color={foliage} vitalityLevel={v} />
          ) : kind === "flower" ? (
            <Flower
              stemColor={foliage}
              petalColor={flowerColor(i)}
              vitalityLevel={v}
            />
          ) : (
            <ForestTree color={foliage} vitalityLevel={v} />
          )}
        </SwayGroup>
      ))}

      {/* Fixed, always-flattering framing: gentle auto-rotation, no zoom so the
          user can never end up inside a plant, and a clamped vertical angle. */}
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
