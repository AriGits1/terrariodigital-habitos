"use client";

import dynamic from "next/dynamic";
import type { BiomeType } from "./biome-logic";
import type { HabitView } from "@/features/habits/HabitsPanel";

// Load BiomeScene dynamically here in a Client Component to avoid SSR errors
const BiomeScene = dynamic(() => import("./BiomeScene"), { ssr: false });

export default function BiomeSceneWrapper({
  type,
  habits,
}: {
  type: BiomeType;
  habits: HabitView[];
}) {
  return <BiomeScene type={type} habits={habits} />;
}
