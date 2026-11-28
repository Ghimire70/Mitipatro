export interface RashiI18n {
  nameNe: string;
  nameEn: string;
  englishSign: string;
  symbolNe: string;
  elementNe: string;
  rulingPlanetNe: string;
  luckyColorNe: string;
  luckyNumber: number | string;
}

/** Rashi metadata with both English and Nepali labels */
export const RASHIS_I18N: readonly RashiI18n[] = [
  {
    nameNe: 'मेष',
    nameEn: 'Mesha',
    englishSign: 'Aries',
    symbolNe: 'भेँडा',
    elementNe: 'अग्नि',
    rulingPlanetNe: 'मंगल',
    luckyColorNe: 'लाल',
    luckyNumber: 9,
  },
  {
    nameNe: 'वृष',
    nameEn: 'Vrisha',
    englishSign: 'Taurus',
    symbolNe: 'बैल',
    elementNe: 'पृथ्वी',
    rulingPlanetNe: 'शुक्र',
    luckyColorNe: ' हरा',
    luckyNumber: 6,
  },
  {
    nameNe: 'मिथुन',
    nameEn: 'Mithun',
    englishSign: 'Gemini',
    symbolNe: 'जुम्ल्याहा',
    elementNe: 'वायु',
    rulingPlanetNe: 'बुध',
    luckyColorNe: 'पीला',
    luckyNumber: 5,
  },
  {
    nameNe: 'कर्कट',
    nameEn: 'Karkat',
    englishSign: 'Cancer',
    symbolNe: 'गँगटो',
    elementNe: 'जल',
    rulingPlanetNe: 'चन्द्रमा',
    luckyColorNe: 'नारंगी',
    luckyNumber: 2,
  },
  {
    nameNe: 'सिंह',
    nameEn: 'Simha',
    englishSign: 'Leo',
    symbolNe: 'सिंह',
    elementNe: 'अग्नि',
    rulingPlanetNe: 'सूर्य',
    luckyColorNe: 'स्वर्णिम',
    luckyNumber: 1,
  },
  {
    nameNe: 'कन्या',
    nameEn: 'Kanya',
    englishSign: 'Virgo',
    symbolNe: 'कन्या',
    elementNe: 'पृथ्वी',
    rulingPlanetNe: 'बुध',
    luckyColorNe: 'हरा',
    luckyNumber: 5,
  },
  {
    nameNe: 'तुला',
    nameEn: 'Tula',
    englishSign: 'Libra',
    symbolNe: 'तराजु',
    elementNe: 'वायु',
    rulingPlanetNe: 'शुक्र',
    luckyColorNe: 'गुलाबी',
    luckyNumber: 7,
  },
  {
    nameNe: 'वृश्चिक',
    nameEn: 'Vrischik',
    englishSign: 'Scorpio',
    symbolNe: 'बिच्छी',
    elementNe: 'जल',
    rulingPlanetNe: 'मंगल',
    luckyColorNe: 'लाल',
    luckyNumber: 9,
  },
  {
    nameNe: 'धनु',
    nameEn: 'Dhanu',
    englishSign: 'Sagittarius',
    symbolNe: 'धनुष',
    elementNe: 'अग्नि',
    rulingPlanetNe: 'बृहस्पति (गुरु)',
    luckyColorNe: 'पीलो',
    luckyNumber: 3,
  },
  {
    nameNe: 'मकर',
    nameEn: 'Makar',
    englishSign: 'Capricorn',
    symbolNe: 'मगरमच्छ',
    elementNe: 'पृथ्वी',
    rulingPlanetNe: 'शनि',
    luckyColorNe: 'निलो',
    luckyNumber: 8,
  },
  {
    nameNe: 'कुम्भ',
    nameEn: 'Kumbha',
    englishSign: 'Aquarius',
    symbolNe: 'घडा (कलश)',
    elementNe: 'वायु',
    rulingPlanetNe: 'शनि',
    luckyColorNe: 'आसमानी',
    luckyNumber: 8,
  },
  {
    nameNe: 'मीन',
    nameEn: 'Meen',
    englishSign: 'Pisces',
    symbolNe: 'माछा',
    elementNe: 'जल',
    rulingPlanetNe: 'बृहस्पति (गुरु)',
    luckyColorNe: 'केसरिया',
    luckyNumber: 3,
  },
] as const;