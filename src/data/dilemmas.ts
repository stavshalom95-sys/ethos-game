export interface Dilemma {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  /** Pre-seeded vote counts to make results feel populated from day one */
  seedYes: number;
  seedNo: number;
}

export const dilemmas: Dilemma[] = [
  {
    id: 1,
    question: 'Messi or Ronaldo? Who is the GOAT?',
    optionA: 'Messi 🐐',
    optionB: 'Ronaldo 🐐',
    seedYes: 612,
    seedNo: 388,
  },
  {
    id: 2,
    question: "iPhone or Android? What's your vibe?",
    optionA: 'iPhone',
    optionB: 'Android',
    seedYes: 541,
    seedNo: 459,
  },
];
