// Seed script — populates the database with simulated demo data so the
// prototype has a living, multi-user cohort to render. PC3 explicitly allows
// simulated data.
//
// Run with: npm run db:seed
//
// Idempotent: profiles are upserted by email; per-profile habits, logs, moods
// and cohort encouragements are only created when absent, so re-running is safe.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — cannot connect to PostgreSQL.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** Midnight of `daysAgo` days before today. */
function dayAt(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/** Deterministic pseudo-random in [0,1) so demo history is stable across runs. */
function noise(a: number, b: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const HISTORY_DAYS = 7;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@terrario.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme";
const DEMO_PASSWORD = "demo1234";

type HabitSpec = {
  title: string;
  species: string;
  weight: number;
  periodicity?: string;
};

type MoodSpec = {
  source: string;
  rawText?: string;
  mood: string;
  score: number;
  daysAgo: number;
};

type UserSpec = {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  biomeType: string;
  growth: number;
  health: number;
  seeds: number;
  water: number;
  currentStreak: number;
  shareTerrarium: boolean;
  /** 0..1 — how reliably this user completes habits in the demo history. */
  adherence: number;
  habits: HabitSpec[];
  moods: MoodSpec[];
  mindfulnessSec?: number;
};

const USERS: UserSpec[] = [
  {
    name: "Martín",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    biomeType: "forest",
    growth: 55,
    health: 78,
    seeds: 40,
    water: 25,
    currentStreak: 6,
    shareTerrarium: true,
    adherence: 0.85,
    habits: [
      { title: "Escribir tesis", species: "roble", weight: 5 },
      { title: "Meditar 10 min", species: "loto", weight: 3 },
      { title: "Salir a correr", species: "helecho", weight: 4 },
      { title: "Leer 20 páginas", species: "musgo", weight: 2 },
    ],
    moods: [
      { source: "voice", rawText: "Hoy me siento con energía para avanzar.", mood: "motivated", score: 0.6, daysAgo: 0 },
      { source: "card", mood: "calm", score: 0.3, daysAgo: 1 },
      { source: "text", rawText: "Un poco abrumado con la tesis.", mood: "anxious", score: -0.4, daysAgo: 2 },
    ],
    mindfulnessSec: 300,
  },
  {
    name: "Lucía",
    email: "lucia@terrario.local",
    password: DEMO_PASSWORD,
    role: "user",
    biomeType: "desert",
    growth: 70,
    health: 88,
    seeds: 60,
    water: 45,
    currentStreak: 12,
    shareTerrarium: true,
    adherence: 0.92,
    habits: [
      { title: "Tomar 2L de agua", species: "cactus", weight: 3 },
      { title: "Yoga matutino", species: "agave", weight: 4 },
      { title: "Journaling", species: "suculenta", weight: 2 },
      { title: "Dormir 8 horas", species: "palmera", weight: 5 },
    ],
    moods: [
      { source: "card", mood: "calm", score: 0.5, daysAgo: 0 },
      { source: "text", rawText: "Buen ritmo esta semana.", mood: "content", score: 0.4, daysAgo: 2 },
    ],
    mindfulnessSec: 420,
  },
  {
    name: "Diego",
    email: "diego@terrario.local",
    password: DEMO_PASSWORD,
    role: "user",
    biomeType: "forest",
    growth: 40,
    health: 60,
    seeds: 15,
    water: 10,
    currentStreak: 2,
    shareTerrarium: true,
    adherence: 0.6,
    habits: [
      { title: "Ir al gimnasio", species: "pino", weight: 4 },
      { title: "Practicar código", species: "roble", weight: 5 },
      { title: "Leer noticias", species: "musgo", weight: 1 },
      { title: "Beber agua", species: "helecho", weight: 2 },
    ],
    moods: [
      { source: "text", rawText: "Me costó arrancar el lunes.", mood: "tired", score: -0.2, daysAgo: 1 },
      { source: "card", mood: "neutral", score: 0.0, daysAgo: 3 },
    ],
  },
  {
    name: "Sofía",
    email: "sofia@terrario.local",
    password: DEMO_PASSWORD,
    role: "user",
    biomeType: "zen",
    growth: 80,
    health: 92,
    seeds: 90,
    water: 70,
    currentStreak: 21,
    shareTerrarium: true,
    adherence: 0.95,
    habits: [
      { title: "Meditar 15 min", species: "loto", weight: 5 },
      { title: "Pintar", species: "bonsai", weight: 3 },
      { title: "Caminar al aire libre", species: "bambú", weight: 4 },
      { title: "Té y lectura", species: "musgo", weight: 2 },
    ],
    moods: [
      { source: "voice", rawText: "Día tranquilo y enfocado.", mood: "serene", score: 0.7, daysAgo: 0 },
      { source: "card", mood: "calm", score: 0.5, daysAgo: 2 },
    ],
    mindfulnessSec: 600,
  },
  {
    name: "Mateo",
    email: "mateo@terrario.local",
    password: DEMO_PASSWORD,
    role: "user",
    biomeType: "forest",
    growth: 30,
    health: 45,
    seeds: 8,
    water: 5,
    currentStreak: 0,
    shareTerrarium: false,
    adherence: 0.4,
    habits: [
      { title: "Salir a correr", species: "helecho", weight: 4 },
      { title: "Estudiar inglés", species: "roble", weight: 3 },
      { title: "Tocar guitarra", species: "pino", weight: 2 },
      { title: "Estirar", species: "musgo", weight: 1 },
    ],
    moods: [
      { source: "text", rawText: "Semana difícil, perdí la racha.", mood: "frustrated", score: -0.5, daysAgo: 0 },
      { source: "card", mood: "tired", score: -0.3, daysAgo: 1 },
    ],
  },
  {
    name: "Valentina",
    email: "valentina@terrario.local",
    password: DEMO_PASSWORD,
    role: "user",
    biomeType: "desert",
    growth: 65,
    health: 80,
    seeds: 50,
    water: 35,
    currentStreak: 9,
    shareTerrarium: true,
    adherence: 0.8,
    habits: [
      { title: "Escribir 500 palabras", species: "cactus", weight: 5 },
      { title: "Tomar agua", species: "suculenta", weight: 2 },
      { title: "Leer 30 min", species: "agave", weight: 3 },
      { title: "Planificar el día", species: "palmera", weight: 4 },
    ],
    moods: [
      { source: "voice", rawText: "Productiva pero algo cansada.", mood: "motivated", score: 0.3, daysAgo: 0 },
      { source: "text", rawText: "Avancé con la escritura.", mood: "content", score: 0.4, daysAgo: 2 },
    ],
    mindfulnessSec: 300,
  },
];

async function seedUser(spec: UserSpec): Promise<string> {
  const passwordHash = await hashPassword(spec.password);

  // Upsert keyed on email. `update` is intentionally minimal so re-seeding does
  // not clobber a user's own progress (seeds, water, biome) on an existing row.
  const profile = await prisma.profile.upsert({
    where: { email: spec.email },
    update: {
      passwordHash,
      role: spec.role,
      name: spec.name,
      onboarded: true,
    },
    create: {
      name: spec.name,
      biomeType: spec.biomeType,
      onboarded: true,
      email: spec.email,
      passwordHash,
      role: spec.role,
      shareTerrarium: spec.shareTerrarium,
      seeds: spec.seeds,
      water: spec.water,
      currentStreak: spec.currentStreak,
      lastActiveDate: dayAt(0),
    },
  });

  await prisma.biomeState.upsert({
    where: { profileId: profile.id },
    update: {},
    create: {
      profileId: profile.id,
      type: spec.biomeType,
      growth: spec.growth,
      health: spec.health,
    },
  });

  // Habits + history are only created on a fresh profile.
  const existingHabits = await prisma.habit.count({ where: { profileId: profile.id } });
  if (existingHabits > 0) return profile.id;

  const habits = await Promise.all(
    spec.habits.map((h) =>
      prisma.habit.create({
        data: {
          title: h.title,
          species: h.species,
          weight: h.weight,
          periodicity: h.periodicity ?? "daily",
          profileId: profile.id,
        },
      })
    )
  );

  // Completion history: a habit on a given day counts as done when deterministic
  // noise falls under the user's adherence, so high-adherence users grow lush
  // biomes and low-adherence ones visibly struggle.
  for (let day = 0; day < HISTORY_DAYS; day++) {
    for (let h = 0; h < habits.length; h++) {
      if (noise(day + 1, h + 1) < spec.adherence) {
        await prisma.habitLog.create({
          data: { habitId: habits[h].id, date: dayAt(day), completed: true },
        });
      }
    }
  }

  if (spec.moods.length > 0) {
    await prisma.moodEntry.createMany({
      data: spec.moods.map((m) => ({
        profileId: profile.id,
        source: m.source,
        rawText: m.rawText,
        mood: m.mood,
        score: m.score,
        date: dayAt(m.daysAgo),
      })),
    });
  }

  if (spec.mindfulnessSec) {
    await prisma.mindfulnessSession.create({
      data: { profileId: profile.id, durationSec: spec.mindfulnessSec },
    });
  }

  return profile.id;
}

/** A few cooperative gestures so the cohort river / inbox has data to show. */
async function seedEncouragements(idByEmail: Map<string, string>): Promise<void> {
  if ((await prisma.encouragement.count()) > 0) return;

  const gestures = [
    { from: "lucia@terrario.local", to: ADMIN_EMAIL, type: "water", message: undefined as string | undefined },
    { from: "sofia@terrario.local", to: "diego@terrario.local", type: "kudos", message: "¡Vas muy bien, seguí así! 🌱" },
    { from: ADMIN_EMAIL, to: "mateo@terrario.local", type: "kudos", message: "Un día a la vez, Mateo. 💪" },
    { from: "valentina@terrario.local", to: "lucia@terrario.local", type: "water", message: undefined as string | undefined },
  ];

  await prisma.encouragement.createMany({
    data: gestures
      .filter((g) => idByEmail.has(g.from) && idByEmail.has(g.to))
      .map((g) => ({
        fromProfileId: idByEmail.get(g.from)!,
        toProfileId: idByEmail.get(g.to)!,
        type: g.type,
        message: g.message,
      })),
  });
}

async function main() {
  const idByEmail = new Map<string, string>();
  for (const spec of USERS) {
    idByEmail.set(spec.email, await seedUser(spec));
  }

  await seedEncouragements(idByEmail);

  const counts = {
    profiles: await prisma.profile.count(),
    habits: await prisma.habit.count(),
    logs: await prisma.habitLog.count(),
    moods: await prisma.moodEntry.count(),
    encouragements: await prisma.encouragement.count(),
  };
  console.log("Seed complete:", counts);
  console.log("\nDemo credentials:");
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(5)}  ${u.email.padEnd(26)}  ${u.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
