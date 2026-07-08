export interface Dilemma {
  id: string;
  question: string;
  description: string;
  /** Pre-seeded vote counts to make results feel populated from day one */
  seedYes: number;
  seedNo: number;
}

export const dilemmas: Dilemma[] = [
  {
    id: 'trolley',
    question: 'האם היית דוחף אדם אחד בפני רכבת כדי להציל חמישה?',
    description:
      'עגלת רכבת חסרת בלמים בדרכה לדרוס חמישה אנשים קשורים. אתה עומד על גשר עם זר לצדך. הדרך היחידה לעצור את הרכבת היא לדחוף אותו. מה תעשה?',
    seedYes: 312,
    seedNo: 688,
  },
  {
    id: 'friend-crime',
    question: 'האם היית מסגיר חבר קרוב שביצע פשע חמור?',
    description:
      'גילית שחברך הטוב ביצע עבירה פלילית חמורה שפגעה בקורבן תמים. לרשויות אין ראיות. הוא ביקש ממך לשמור את הסוד. מה תעשה?',
    seedYes: 534,
    seedNo: 466,
  },
  {
    id: 'life-lie',
    question: 'האם היית משקר כדי להציל חיי אדם תמים?',
    description:
      'אדם חמוש שואל אותך היכן מסתתר אדם תמים שהוא רודף אחריו. אתה יודע היכן הוא. שקר אחד יכול להציל חיים. מה תעשה?',
    seedYes: 891,
    seedNo: 109,
  },
];
