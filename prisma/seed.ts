// Seed script — populates the database with simulated demo data so the
// prototype has a living biome to render. PC3 explicitly allows simulated data.
//
// Run with: npx tsx prisma/seed.ts
//
// Uses a relative import (not the @/ alias) so it runs under tsx/node directly.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

/** Midnight of `daysAgo` days before today. */
function dayAt(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

async function main() {
  const adminEmail =
    process.env.ADMIN_EMAIL ?? "admin@terrario.local";
  const adminPassword =
    process.env.ADMIN_PASSWORD ?? "changeme";

  // Upsert the admin profile (keyed on email). Idempotent.
  const adminHash = await hashPassword(adminPassword);
  const admin = await prisma.profile.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      role: "admin",
      name: "Martín",
      onboarded: true,
    },
    create: {
      name: "Martín",
      biomeType: "forest",
      onboarded: true,
      email: adminEmail,
      passwordHash: adminHash,
      role: "admin",
    },
  });

  // Ensure the admin has a biome snapshot.
  await prisma.biomeState.upsert({
    where: { profileId: admin.id },
    update: {},
    create: { profileId: admin.id, type: "forest", growth: 55, health: 78 },
  });

  // Seed demo habits only if none exist for this profile.
  const existingHabits = await prisma.habit.count({
    where: { profileId: admin.id },
  });

  let habits;
  if (existingHabits === 0) {
    habits = await Promise.all(
      [
        { title: "Escribir tesis", species: "roble", weight: 5, periodicity: "daily" },
        { title: "Meditar 10 min", species: "loto", weight: 3, periodicity: "daily" },
        { title: "Salir a correr", species: "helecho", weight: 4, periodicity: "daily" },
        { title: "Leer 20 páginas", species: "musgo", weight: 2, periodicity: "daily" },
      ].map((h) =>
        prisma.habit.create({ data: { ...h, profileId: admin.id } })
      )
    );

    // Last 7 days of completion history.
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
          await prisma.habitLog.upsert({
            where: {
              habitId_date: { habitId: habits[h].id, date: dayAt(day) },
            },
            update: {},
            create: {
              habitId: habits[h].id,
              date: dayAt(day),
              completed: true,
            },
          });
        }
      }
    }

    await prisma.moodEntry.createMany({
      data: [
        {
          profileId: admin.id,
          source: "voice",
          rawText: "Hoy me siento con energía para avanzar.",
          mood: "motivated",
          score: 0.6,
          date: dayAt(0),
        },
        { profileId: admin.id, source: "card", mood: "calm", score: 0.3, date: dayAt(1) },
        {
          profileId: admin.id,
          source: "text",
          rawText: "Un poco abrumado con la tesis.",
          mood: "anxious",
          score: -0.4,
          date: dayAt(2),
        },
      ],
    });

    await prisma.mindfulnessSession.create({
      data: { profileId: admin.id, durationSec: 300 },
    });
  }

  const counts = {
    profiles: await prisma.profile.count(),
    habits: await prisma.habit.count(),
    logs: await prisma.habitLog.count(),
    moods: await prisma.moodEntry.count(),
  };
  console.log("Seed complete:", counts);
  console.log(`Admin email: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
