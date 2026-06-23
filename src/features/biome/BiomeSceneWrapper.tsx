"use client";

import dynamic from "next/dynamic";
import type { BiomeType } from "./biome-logic";
import type { HabitView } from "@/features/habits/HabitsPanel";

// Load BiomeScene dynamically here in a Client Component to avoid SSR errors
const BiomeScene = dynamic(() => import("./BiomeScene"), { ssr: false });

export default function BiomeSceneWrapper({
  type,
  habits,
  readOnly = false,
}: {
  type: BiomeType;
  habits: HabitView[];
  readOnly?: boolean;
}) {
  return <BiomeScene type={type} habits={habits} readOnly={readOnly} />;
}
