export interface DecorationTypeConfig {
  id: string;
  name: string;
  cost: number;
  description: string;
  emoji: string;
}

export const DECORATIONS_CONFIG: Record<string, DecorationTypeConfig> = {
  pine: {
    id: "pine",
    name: "Pino Silvestre",
    cost: 50,
    description: "Un pino conífero elegante y resistente.",
    emoji: "🌲",
  },
  palm: {
    id: "palm",
    name: "Palmera Tropical",
    cost: 75,
    description: "Una palmera con hojas grandes y exóticas.",
    emoji: "🌴",
  },
  flower_pink: {
    id: "flower_pink",
    name: "Flor Rosada",
    cost: 25,
    description: "Una hermosa flor silvestre de pétalos rosados.",
    emoji: "🌸",
  },
  flower_purple: {
    id: "flower_purple",
    name: "Flor Violeta",
    cost: 30,
    description: "Una flor exótica de color violeta intenso.",
    emoji: "🪻",
  },
  crystal: {
    id: "crystal",
    name: "Cristal Luminoso",
    cost: 100,
    description: "Un cristal que brilla tenuemente en la oscuridad.",
    emoji: "💎",
  },
  rock: {
    id: "rock",
    name: "Roca Zen",
    cost: 15,
    description: "Un par de piedras equilibradas para dar paz al bioma.",
    emoji: "🪨",
  },
};

export const DECORATIONS_LIST = Object.values(DECORATIONS_CONFIG);
