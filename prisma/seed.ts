// Seed script — populates the database with simulated demo data so the
// prototype has a living biome to render. PC3 explicitly allows simulated data.
//
// Run with: npx tsx prisma/seed.ts
//
// Uses a relative import (not the @/ alias) so it runs under tsx/node directly.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

/** Midnight of `daysAgo` days before today. */
function dayAt(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

async function main() {
  // Start clean so the seed is idempotent.
  await prisma.habitLog.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.moodEntry.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.mindfulnessSession.deleteMany();
  await prisma.biomeState.deleteMany();
  await prisma.profile.deleteMany();

  const profile = await prisma.profile.create({
    data: {
      name: "Martín",
      biomeType: "forest",
      onboarded: true,
      biome: {
        create: { type: "forest", growth: 55, health: 78 },
      },
    },
  });

  const habits = await Promise.all(
    [
      { title: "Escribir tesis", species: "roble", weight: 5, periodicity: "daily" },
      { title: "Meditar 10 min", species: "loto", weight: 3, periodicity: "daily" },
      { title: "Salir a correr", species: "helecho", weight: 4, periodicity: "daily" },
      { title: "Leer 20 páginas", species: "musgo", weight: 2, periodicity: "daily" },
    ].map((h) =>
      prisma.habit.create({ data: { ...h, profileId: profile.id } })
    )
  );

  // Last 7 days of completion history — some hits, some misses.
  const pattern = [
    [true, true, true, false],
    [true, false, true, true],
    [true, true, false, true],
    [false, true, true, true],
    [true, true, true, true],
    [true, false, false, true],
    [true, true, true, false],
  ];
  for (let day = 0; day < pattern.length; day++) {
    for (let h = 0; h < habits.length; h++) {
      if (pattern[day][h]) {
        await prisma.habitLog.create({
          data: { habitId: habits[h].id, date: dayAt(day), completed: true },
        });
      }
    }
  }

  await prisma.moodEntry.createMany({
    data: [
      { profileId: profile.id, source: "voice", rawText: "Hoy me siento con energía para avanzar.", mood: "motivated", score: 0.6, date: dayAt(0) },
      { profileId: profile.id, source: "card", mood: "calm", score: 0.3, date: dayAt(1) },
      { profileId: profile.id, source: "text", rawText: "Un poco abrumado con la tesis.", mood: "anxious", score: -0.4, date: dayAt(2) },
    ],
  });

  await prisma.mindfulnessSession.create({
    data: { profileId: profile.id, durationSec: 300 },
  });

  const counts = {
    profiles: await prisma.profile.count(),
    habits: await prisma.habit.count(),
    logs: await prisma.habitLog.count(),
    moods: await prisma.moodEntry.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
