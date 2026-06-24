"use client";

import dynamic from "next/dynamic";
import type { BiomeType } from "./biome-logic";
import type { HabitView } from "@/features/habits/HabitsPanel";
import type { BiomeDecoration } from "@/generated/prisma/client";

// Load BiomeScene dynamically here in a Client Component to avoid SSR errors
const BiomeScene = dynamic(() => import("./BiomeScene"), { ssr: false });

export default function BiomeSceneWrapper({
  type,
  habits,
  readOnly = false,
  isAdmin = false,
  decorations = [],
  seeds = 0,
  showShop = false,
}: {
  type: BiomeType;
  habits: HabitView[];
  readOnly?: boolean;
  isAdmin?: boolean;
  decorations?: BiomeDecoration[];
  seeds?: number;
  showShop?: boolean;
}) {
  return (
    <BiomeScene
      type={type}
      habits={habits}
      readOnly={readOnly}
      isAdmin={isAdmin}
      decorations={decorations}
      seeds={seeds}
      showShop={showShop}
    />
  );
}
