import { getTodayNepal, bsToAd, toDevanagariDigits } from './bsConverter';
import { BS_MONTHS } from './bsData';

export type RashiId =
  | 'mesha'
  | 'vrisha'
  | 'mithun'
  | 'karkat'
  | 'simha'
  | 'kanya'
  | 'tula'
  | 'vrischik'
  | 'dhanu'
  | 'makar'
  | 'kumbha'
  | 'meen';

export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly';

export interface RashiMeta {
  id: RashiId;
  nameNe: string;
  nameEn: string;
  englishSign: string;
  order: number; // 1 to 12
  symbolNe: string;
  elementNe: string;
  rulingPlanetNe: string;
  lettersNe: string; // Vedic name syllables
}

export const RASHIS: readonly RashiMeta[] = [
  {
    id: 'mesha',
    nameNe: 'मेष',
    nameEn: 'Mesha',
    englishSign: 'Aries',
    order: 1,
    symbolNe: 'भेँडा',
    elementNe: 'अग्नि',
    rulingPlanetNe: 'मंगल',
    lettersNe: 'चु, चे, चो, ला, ली, लू, ले, लो, अ',
  },
  {
    id: 'vrisha',
    nameNe: 'वृष',
    nameEn: 'Vrisha',
    englishSign: 'Taurus',
    order: 2,
    symbolNe: 'बैल',
    elementNe: 'पृथ्वी',
    rulingPlanetNe: 'शुक्र',
    lettersNe: 'इ, उ, ए, ओ, वा, वी, वू, वे, वो',
  },
  {
    id: 'mithun',
    nameNe: 'मिथुन',
    nameEn: 'Mithun',
    englishSign: 'Gemini',
    order: 3,
    symbolNe: 'जुम्ल्याहा',
    elementNe: 'वायु',
    rulingPlanetNe: 'बुध',
    lettersNe: 'का, की, कू, घ, ङ, छ, के, को, हा',
  },
  {
    id: 'karkat',
    nameNe: 'कर्कट',
    nameEn: 'Karkat',
    englishSign: 'Cancer',
    order: 4,
    symbolNe: 'गँगटो',
    elementNe: 'जल',
    rulingPlanetNe: 'चन्द्रमा',
    lettersNe: 'ही, हू, हे, हो, डा, डी, डू, डे, डो',
  },
  {
    id: 'simha',
    nameNe: 'सिंह',
    nameEn: 'Simha',
    englishSign: 'Leo',
    order: 5,
    symbolNe: 'सिंह',
    elementNe: 'अग्नि',
    rulingPlanetNe: 'सूर्य',
    lettersNe: 'मा, मी, मू, मे, मो, टा, टी, टू, टे',
  },
  {
    id: 'kanya',
    nameNe: 'कन्या',
    nameEn: 'Kanya',
    englishSign: 'Virgo',
    order: 6,
    symbolNe: 'कन्या',
    elementNe: 'पृथ्वी',
    rulingPlanetNe: 'बुध',
    lettersNe: 'टो, पा, पी, पू, ष, ण, ठ, पे, पो',
  },
  {
    id: 'tula',
    nameNe: 'तुला',
    nameEn: 'Tula',
    englishSign: 'Libra',
    order: 7,
    symbolNe: 'तराजु',
    elementNe: 'वायु',
    rulingPlanetNe: 'शुक्र',
    lettersNe: 'रा, री, रू, रे, रो, ता, ती, तू, ते',
  },
  {
    id: 'vrischik',
    nameNe: 'वृश्चिक',
    nameEn: 'Vrischik',
    englishSign: 'Scorpio',
    order: 8,
    symbolNe: 'बिच्छी',
    elementNe: 'जल',
    rulingPlanetNe: 'मंगल',
    lettersNe: 'तो, ना, नी, नू, ने, नो, या, यी, यू',
  },
  {
    id: 'dhanu',
    nameNe: 'धनु',
    nameEn: 'Dhanu',
    englishSign: 'Sagittarius',
    order: 9,
    symbolNe: 'धनुष',
    elementNe: 'अग्नि',
    rulingPlanetNe: 'बृहस्पति (गुरु)',
    lettersNe: 'ये, यो, भा, भी, भू, धा, फा, ढा, भे',
  },
  {
    id: 'makar',
    nameNe: 'मकर',
    nameEn: 'Makar',
    englishSign: 'Capricorn',
    order: 10,
    symbolNe: 'मगरमच्छ',
    elementNe: 'पृथ्वी',
    rulingPlanetNe: 'शनि',
    lettersNe: 'भो, जा, जी, खी, खू, खे, खो, गा, गी',
  },
  {
    id: 'kumbha',
    nameNe: 'कुम्भ',
    nameEn: 'Kumbha',
    englishSign: 'Aquarius',
    order: 11,
    symbolNe: 'घडा (कलश)',
    elementNe: 'वायु',
    rulingPlanetNe: 'शनि',
    lettersNe: 'गू, गे, गो, सा, सी, सू, से, सो, दा',
  },
  {
    id: 'meen',
    nameNe: 'मीन',
    nameEn: 'Meen',
    englishSign: 'Pisces',
    order: 12,
    symbolNe: 'माछा',
    elementNe: 'जल',
    rulingPlanetNe: 'बृहस्पति (गुरु)',
    lettersNe: 'दी, दू, थ, झ, ञ, दे, दो, चा, ची',
  },
] as const;

export interface HoroscopeRecord {
  rashiId: RashiId;
  rashiNameNe: string;
  period: HoroscopePeriod;
  bsYear: number;
  bsMonth?: number;
  startDate: string; // YYYY-MM-DD (BS)
  endDate: string;   // YYYY-MM-DD (BS)
  startDateAd?: string; // YYYY-MM-DD (AD)
  endDateAd?: string;   // YYYY-MM-DD (AD)
  labelNe?: string;
  labelEn?: string;
  descriptionNe: string;
  careerNe?: string;
  financialNe?: string;
  relationshipNe?: string;
  healthNe?: string;
  luckyColorNe?: string;
  luckyNumber?: number | string;
}

// Backward compatibility aliases
export type DailyPrediction = HoroscopeRecord;
export interface DailyRashifalRecord {
  bsDate: string;
  adDate: string;
  predictions: Record<RashiId, HoroscopeRecord>;
}

export interface PeriodGroupRecord {
  key: string;
  period: HoroscopePeriod;
  bsYear: number;
  bsMonth?: number;
  startDate: string;
  endDate: string;
  startDateAd: string;
  endDateAd: string;
  labelNe: string;
  labelEn: string;
  predictions: Record<RashiId, HoroscopeRecord>;
}

/**
 * Editorial policy:
 * Daily, Weekly, and Monthly sample horoscope content are stored separately.
 * When sample content is unavailable for a requested period, the system returns an explicit
 * missing status and never fabricates or randomly generates horoscope predictions or astronomical claims.
 */

// 1. SAMPLE DAILY RASHIFAL DATA
export const SAMPLE_DAILY_DATA: Record<string, DailyRashifalRecord> = {
  // Reference date: Kartik 29, 2083 BS (2026-11-15 AD)
  '2083-07-29': {
    bsDate: '2083-07-29',
    adDate: '2026-11-15',
    predictions: {
      mesha: {
        rashiId: 'mesha',
        rashiNameNe: 'मेष',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'आजको दिन उत्साहवर्धक रहनेछ। रोकिएका कार्यहरू सुचारु हुनेछन् र पारिवारिक सहयोग प्राप्त हुनेछ।',
        careerNe: 'नयाँ योजना कार्यान्वयनमा ल्याउन अनुकूल समय छ। सहकर्मीहरूको सहयोगले कार्य सम्पादन सहज हुनेछ।',
        financialNe: 'आर्थिक स्थिति सबल रहनेछ। अनावश्यक खर्च नियन्त्रण गर्न ध्यान दिनुहोला।',
        relationshipNe: 'परिवारमा आत्मीयता बढ्नेछ र प्रियजनसँग रमाइलो समय बित्नेछ।',
        healthNe: 'स्वास्थ्य सामान्यतया राम्रो रहनेछ। खानपानमा सन्तुलन कायम राख्नुहोस्।',
        luckyColorNe: 'रातो',
        luckyNumber: 9,
      },
      vrisha: {
        rashiId: 'vrisha',
        rashiNameNe: 'वृष',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'धैर्य र संयमका साथ काम गर्ने दिन छ। बोलीको प्रभावले अरूलाई आकर्षित गर्न सकिनेछ।',
        careerNe: 'कार्यक्षेत्रमा अतिरिक्त जिम्मेवारी प्राप्त हुन सक्छ। निष्ठापूर्वक काम गर्दा प्रशंसा मिल्नेछ।',
        financialNe: 'लगानी गर्दा विचार पुर्याउनु बुद्धिमानी हुनेछ। ऋण लेनदेनबाट टाढै रहनुहोस्।',
        relationshipNe: 'दाम्पत्य जीवनमा समझदारी कायम रहनेछ। पारिवारिक विषयमा छलफल फलदायी हुनेछ।',
        healthNe: 'घाँटी तथा मौसमी स्वास्थ्यमा सजग रहनुहोला।',
        luckyColorNe: 'सेतो',
        luckyNumber: 6,
      },
      mithun: {
        rashiId: 'mithun',
        rashiNameNe: 'मिथुन',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'बौद्धिक कार्यमा सफलता मिल्नेछ। सामाजिक तथा रचनात्मक क्षेत्रमा सक्रियता बढ्नेछ।',
        careerNe: 'नयाँ सम्भावनाहरूको ढोका खुल्नेछ। संचार तथा प्रविधिको क्षेत्रमा राम्रो प्रगति हुनेछ।',
        financialNe: 'आम्दानीका नयाँ स्रोतहरू पहिचान हुनेछन्। बचतमा ध्यान दिनुहोला।',
        relationshipNe: 'मित्रजन तथा आफन्तहरूसँग भेटघाट हुने सम्भावना छ। सम्बन्ध थप प्रगाढ बन्नेछ।',
        healthNe: 'मानसिक शान्ति कायम रहनेछ। योग तथा ध्यान लाभदायी हुनेछ।',
        luckyColorNe: 'हरियो',
        luckyNumber: 5,
      },
      karkat: {
        rashiId: 'karkat',
        rashiNameNe: 'कर्कट',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'घरेलु वातावरण सुखद रहनेछ। भावनात्मक निर्णयभन्दा व्यावहारिक दृष्टिकोण अपनाउनु उत्तम हुनेछ।',
        careerNe: 'मेहनत अनुसारको प्रतिफल हात लाग्नेछ। उच्च अधिकारीहरूसँगको समन्वय राम्रो रहनेछ।',
        financialNe: 'भौतिक साधन जुटाउन खर्च हुन सक्छ। दीर्घकालीन फाइदा हुने विषयमा लगानी सोच्नुहोस्।',
        relationshipNe: 'पारिवारिक सौहार्दता वृद्धि हुनेछ। मातापिताको आशीर्वादले हौसला थप्नेछ।',
        healthNe: 'पाचन प्रणाली तथा आराममा विशेष ध्यान दिनुहोला।',
        luckyColorNe: 'दूधिया सेतो',
        luckyNumber: 2,
      },
      simha: {
        rashiId: 'simha',
        rashiNameNe: 'सिंह',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'आत्मविश्वास उच्च रहनेछ र नेतृत्व क्षमता प्रदर्शन गर्ने अवसर प्राप्त हुनेछ।',
        careerNe: 'महत्त्वपूर्ण जिम्मेवारी सफलतापूर्वक पूरा गर्न सकिनेछ। प्रतिष्ठामा वृद्धि हुनेछ।',
        financialNe: 'आर्थिक लाभका योगहरू छन्। व्यावसायिक सहकार्य फलदायी ठहरिनेछ।',
        relationshipNe: 'अहंकार त्यागेर संवाद गर्दा पारिवारिक सम्बन्ध अझ बलियो हुनेछ।',
        healthNe: 'शारीरिक स्फूर्ति कायम रहनेछ। नियमित व्यायाममा जोड दिनुहोस्।',
        luckyColorNe: 'पहेंलो वा सुनौलो',
        luckyNumber: 1,
      },
      kanya: {
        rashiId: 'kanya',
        rashiNameNe: 'कन्या',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'व्यवस्थापकीय क्षमताको कदर हुनेछ। अध्ययन तथा अनुसन्धानमा रुचि बढ्नेछ।',
        careerNe: 'योजनाबद्ध ढंगले अगाडि बढ्दा कार्य सफल हुनेछ। कानुनी वा प्रशासनिक विषय सहज बन्नेछन्।',
        financialNe: 'खर्चको तुलनामा आम्दानी सन्तोषजनक रहनेछ। हिसाबकिताब स्पष्ट राख्नुहोला।',
        relationshipNe: 'सहयोगी मित्रहरूको साथ मिल्नेछ। पारिवारिक सरसल्लाहले नयाँ दिशा दिनेछ।',
        healthNe: 'तनावमुक्त रहने प्रयास गर्नुहोस्। पर्याप्त पानी पिउनुहोस्।',
        luckyColorNe: 'गाढा हरियो',
        luckyNumber: 5,
      },
      tula: {
        rashiId: 'tula',
        rashiNameNe: 'तुला',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'सन्तुलित विचार र मिहिनेतले दिन फलदायी बन्नेछ। साझेदारीका काममा प्रगति हुनेछ।',
        careerNe: 'नयाँ सम्झौता वा व्यापारिक विस्तारको अवसर आउन सक्छ। विवेकपूर्ण निर्णय लिनुहोस्।',
        financialNe: 'धनार्जनका बाटाहरू सुदृढ हुनेछन्। मनोरञ्जनमा थोरै खर्च हुन सक्छ।',
        relationshipNe: 'प्रेम सम्बन्ध सुमधुर रहनेछ। जीवनसाथीसँगको सहकार्यले आनन्द दिलाउनेछ।',
        healthNe: 'स्वास्थ्य सामान्य रहनेछ। छाला वा ढाडसम्बन्धी समस्यामा सतर्कता अपनाउनुहोस्।',
        luckyColorNe: 'गुलाबी वा हल्का नीलो',
        luckyNumber: 7,
      },
      vrischik: {
        rashiId: 'vrischik',
        rashiNameNe: 'वृश्चिक',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'गोपनीयता कायम राख्दै अघि बढ्नु बुद्धिमानी हुनेछ। दृढ संकल्पले चुनौती पार लगाउनेछ।',
        careerNe: 'प्रतिस्पर्धात्मक कार्यमा अग्रता मिल्नेछ। जटिल समस्याको समाधान फेला पर्नेछ।',
        financialNe: 'अचानक धन लाभको सम्भावना छ। लगानी गर्दा जोखिमको मूल्याङ्कन गर्नुहोस्।',
        relationshipNe: 'अनावश्यक शंकाबाट बच्नुहोस्। पारदर्शी संवादले मनमुटाव हटाउनेछ।',
        healthNe: 'रक्तचाप तथा तनाव नियन्त्रणमा ध्यान दिनुहोला।',
        luckyColorNe: 'रातो वा मरुन',
        luckyNumber: 9,
      },
      dhanu: {
        rashiId: 'dhanu',
        rashiNameNe: 'धनु',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'धार्मिक तथा आध्यात्मिक कार्यमा रुचि बढ्नेछ। भाग्यले साथ दिने समय छ।',
        careerNe: 'उच्च शिक्षा वा वैदेशिक कार्यसँग सम्बन्धित काममा सकारात्मक नतिजा आउनेछ।',
        financialNe: 'आर्थिक स्थिति सन्तोषजनक रहनेछ। दान-पुण्य वा समाजसेवामा खर्च हुन सक्छ।',
        relationshipNe: 'गुरुजन तथा अग्रजहरूको मार्गदर्शन उपयोगी सिद्ध हुनेछ।',
        healthNe: 'कलेजो तथा कम्मरको स्वास्थ्यप्रति सचेत रहनुहोस्।',
        luckyColorNe: 'पहेंलो',
        luckyNumber: 3,
      },
      makar: {
        rashiId: 'makar',
        rashiNameNe: 'मकर',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'कडा परिश्रमको फल ढिलो भए पनि दिगो रूपमा मिल्नेछ। धैर्य कायम राख्नुहोस्।',
        careerNe: 'कार्यक्षेत्रमा निरन्तरता र अनुशासनले विशिष्ट स्थान दिलाउनेछ।',
        financialNe: 'सञ्चित पुँजी संरक्षणमा ध्यान दिनुहोस्। फजुल खर्चबाट जोगिनुहोस्।',
        relationshipNe: 'घरपरिवारका ज्येष्ठ सदस्यहरूको स्वास्थ्य र सेवामा समय दिनुहोला।',
        healthNe: 'जोर्नी तथा हाडजोर्नीसम्बन्धी सतर्कता आवश्यक छ।',
        luckyColorNe: 'नीलो वा कालो',
        luckyNumber: 8,
      },
      kumbha: {
        rashiId: 'kumbha',
        rashiNameNe: 'कुम्भ',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'नवीन सोच र सिर्जनशीलताले प्रशंसा दिलाउनेछ। सामूहिक कार्यमा सफलता प्राप्त हुनेछ।',
        careerNe: 'प्रविधि वा सामाजिक क्षेत्रमा कार्यरतहरूका लागि दिन विशेष अनुकूल रहनेछ।',
        financialNe: 'आम्दानीको निरन्तरता रहनेछ। पुराना लगानीबाट फाइदा लिन सकिनेछ।',
        relationshipNe: 'मित्रहरूसँगको सहकार्य सुखद रहनेछ। नयाँ सम्बन्धको सुरुआत हुन सक्छ।',
        healthNe: 'वायुविकार तथा नसासम्बन्धी सामान्य समस्या देखिन सक्छ।',
        luckyColorNe: 'आसमानी नीलो',
        luckyNumber: 8,
      },
      meen: {
        rashiId: 'meen',
        rashiNameNe: 'मीन',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-29',
        endDate: '2083-07-29',
        startDateAd: '2026-11-15',
        endDateAd: '2026-11-15',
        descriptionNe: 'परोपकारी भावना जागृत हुनेछ। कला, साहित्य तथा चिन्तनमा मन रमाउनेछ।',
        careerNe: 'रचनात्मक काममा सम्मान मिल्नेछ। कार्यक्षेत्रको वातावरण सहयोगी रहनेछ।',
        financialNe: 'आर्थिक कारोबार सहज रहनेछ। शुभ कार्यमा खर्च गर्ने योजना बन्न सक्छ।',
        relationshipNe: 'परिवारमा मेलमिलाप र शान्ति कायम रहनेछ। प्रियजनको सहयोग प्राप्त हुनेछ।',
        healthNe: 'निद्रा तथा आराममा ध्यान दिनुहोस्। आँखाको हेरचाह गर्नुहोस्।',
        luckyColorNe: 'पहेंलो वा केसरिया',
        luckyNumber: 3,
      },
    },
  },

  // Reference date: Kartik 28, 2083 BS (2026-11-14 AD)
  '2083-07-28': {
    bsDate: '2083-07-28',
    adDate: '2026-11-14',
    predictions: {
      mesha: {
        rashiId: 'mesha',
        rashiNameNe: 'मेष',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'पारिवारिक सुख र कार्यसिद्धि हुने दिन छ। रोकिएको कामले गति लिनेछ।',
        careerNe: 'सहकर्मीहरूको सहयोगले कार्य सम्पादन छिटो हुनेछ।',
        financialNe: 'व्यवसायमा सामान्य लाभ हुनेछ।',
        relationshipNe: 'पारिवारिक सम्बन्ध प्रगाढ रहनेछ।',
        healthNe: 'स्वास्थ्य अनुकूल रहनेछ।',
        luckyColorNe: 'रातो',
        luckyNumber: 1,
      },
      vrisha: {
        rashiId: 'vrisha',
        rashiNameNe: 'वृष',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'अध्ययन र नयाँ कार्यको योजना बनाउन उपयुक्त समय छ। खर्चमा संयम अपनाउनुहोला।',
        careerNe: 'नयाँ अवसरका लागि तयारी गर्ने दिन छ।',
        financialNe: 'अनावश्यक खर्च नियन्त्रण गर्नुहोस्।',
        relationshipNe: 'मित्रहरूसँग समझदारी बढ्नेछ।',
        healthNe: 'घाँटीको समस्याबाट जोगिनुहोला।',
        luckyColorNe: 'सेतो',
        luckyNumber: 6,
      },
      mithun: {
        rashiId: 'mithun',
        rashiNameNe: 'मिथुन',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'बौद्धिक छलफलमा विजय प्राप्त हुनेछ। व्यापार तथा व्यवसायमा फाइदा पुग्नेछ।',
        careerNe: 'सञ्चार माध्यम तथा सूचना प्रविधिमा लाभ मिल्नेछ।',
        financialNe: 'आर्थिक सन्तुलन कायम रहनेछ।',
        relationshipNe: 'पारिवारिक जमघट रमाइलो हुनेछ।',
        healthNe: 'शारीरिक स्फूर्ति रहनेछ।',
        luckyColorNe: 'हरियो',
        luckyNumber: 5,
      },
      karkat: {
        rashiId: 'karkat',
        rashiNameNe: 'कर्कट',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'मनमा शान्ति र आत्मसन्तुष्टि मिल्नेछ। मातापिताको सल्लाह उपयोगी हुनेछ।',
        careerNe: 'स्थिर भएर काम गर्दा प्रतिफल मिल्नेछ।',
        financialNe: 'घरायसी सामग्रीमा लगानी हुन सक्छ।',
        relationshipNe: 'दाम्पत्य जीवनमा मिठास रहनेछ।',
        healthNe: 'सन्तुलित भोजन गर्नुहोला।',
        luckyColorNe: 'दूधिया',
        luckyNumber: 2,
      },
      simha: {
        rashiId: 'simha',
        rashiNameNe: 'सिंह',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'मान प्रतिष्ठा वृद्धि हुने दिन छ। रोकिएका कार्यहरू बन्ने सम्भावना छ।',
        careerNe: 'उच्च अधिकारीसँगको भेटघाट फलदायी हुनेछ।',
        financialNe: 'आर्थिक स्थिति सुदृढ बन्नेछ।',
        relationshipNe: 'आफन्तजनको सहयोग प्राप्त हुनेछ।',
        healthNe: 'स्वास्थ्य राम्रो रहनेछ।',
        luckyColorNe: 'पहेंलो',
        luckyNumber: 1,
      },
      kanya: {
        rashiId: 'kanya',
        rashiNameNe: 'कन्या',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'मेहनतले काममा सफलता दिलाउनेछ। अनावश्यक वादविवादबाट टाढै रहनुहोस्।',
        careerNe: 'दैनिक कार्यमा प्रगति हुनेछ।',
        financialNe: 'खर्चमा नियन्त्रण आवश्यक छ।',
        relationshipNe: 'सकारात्मक संवादले सम्बन्ध बलियो बनाउनेछ।',
        healthNe: 'पर्याप्त विश्राम लिनुहोला।',
        luckyColorNe: 'हरियो',
        luckyNumber: 5,
      },
      tula: {
        rashiId: 'tula',
        rashiNameNe: 'तुला',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'नयाँ योजना कार्यान्वयनमा ल्याउन सकिनेछ। मनोरञ्जन र यात्राको अवसर मिल्न सक्छ।',
        careerNe: 'साझेदारीमा गरिएका कामबाट सन्तोष मिल्नेछ।',
        financialNe: 'आम्दानीको नयाँ स्रोत फेला पर्न सक्छ।',
        relationshipNe: 'प्रेम सम्बन्धमा निकटता आउनेछ।',
        healthNe: 'मौसम परिवर्तनमा सजग रहनुहोस्।',
        luckyColorNe: 'गुलाबी',
        luckyNumber: 7,
      },
      vrischik: {
        rashiId: 'vrischik',
        rashiNameNe: 'वृश्चिक',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'आँटेका काममा सफलता मिल्नेछ। सहकर्मीको विश्वास जित्न सकिनेछ।',
        careerNe: 'कडा प्रतिस्पर्धाका बाबजुद सफलता हात लाग्नेछ।',
        financialNe: 'आर्थिक कारोबारमा सावधानी अपनाउनुहोस्।',
        relationshipNe: 'परिवारमा खुसीको माहोल रहनेछ।',
        healthNe: 'नियमित व्यायाम लाभदायक हुनेछ।',
        luckyColorNe: 'रातो',
        luckyNumber: 9,
      },
      dhanu: {
        rashiId: 'dhanu',
        rashiNameNe: 'धनु',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'धार्मिक कार्यमा सहभागिता बढ्नेछ। अग्रजहरूको आशीर्वादले आत्मबल बढ्नेछ।',
        careerNe: 'पठनपाठन र लेखनमा प्रगति हुनेछ।',
        financialNe: 'बचत वृद्धि गर्ने अवसर मिल्नेछ।',
        relationshipNe: 'इष्टमित्रसँगको भेटघाटले मन प्रसन्न रहनेछ।',
        healthNe: 'स्वास्थ्य सामान्य रहनेछ।',
        luckyColorNe: 'पहेंलो',
        luckyNumber: 3,
      },
      makar: {
        rashiId: 'makar',
        rashiNameNe: 'मकर',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'धैर्यताका साथ अघि बढ्दा कार्य सफल हुनेछ। स्वास्थ्यमा सामान्य ध्यान दिनुहोला।',
        careerNe: 'लामो समयदेखि अड्किएका काम बन्नेछन्।',
        financialNe: 'आर्थिक संकलनमा सफलता मिल्नेछ।',
        relationshipNe: 'पारिवारिक समझदारी कायम रहनेछ।',
        healthNe: 'खानपानमा सरलता अपनाउनुहोस्।',
        luckyColorNe: 'नीलो',
        luckyNumber: 8,
      },
      kumbha: {
        rashiId: 'kumbha',
        rashiNameNe: 'कुम्भ',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'नयाँ विचार र सिर्जनशीलताको विकास हुनेछ। साथीभाइको राम्रो सहयोग मिल्नेछ।',
        careerNe: 'समूहगत कार्यमा उत्कृष्ट नतिजा आउनेछ।',
        financialNe: 'आर्थिक लाभका अवसरहरू देखिनेछन्।',
        relationshipNe: 'सामाजिक सम्बन्ध विस्तार हुनेछ।',
        healthNe: 'मानसिक शान्ति प्राप्त हुनेछ।',
        luckyColorNe: 'आसमानी',
        luckyNumber: 8,
      },
      meen: {
        rashiId: 'meen',
        rashiNameNe: 'मीन',
        period: 'daily',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-28',
        endDate: '2083-07-28',
        startDateAd: '2026-11-14',
        endDateAd: '2026-11-14',
        descriptionNe: 'आध्यात्मिक चिन्तनले मन आनन्दित रहनेछ। परोपकारी कार्यमा संलग्नता रहनेछ।',
        careerNe: 'रचनात्मक क्षेत्रमा पहिचान मिल्नेछ।',
        financialNe: 'शुभ काममा खर्च हुनेछ।',
        relationshipNe: 'पारिवारिक वातावरण सौहार्दपूर्ण रहनेछ।',
        healthNe: 'स्वास्थ्य सबल रहनेछ।',
        luckyColorNe: 'सुनौलो',
        luckyNumber: 3,
      },
    },
  },
};

// 2. SAMPLE WEEKLY RASHIFAL DATA
export const SAMPLE_WEEKLY_DATA: Record<string, PeriodGroupRecord> = {
  '2083-W32': {
    key: '2083-W32',
    period: 'weekly',
    bsYear: 2083,
    bsMonth: 7,
    startDate: '2083-07-22',
    endDate: '2083-07-28',
    startDateAd: '2026-11-08',
    endDateAd: '2026-11-14',
    labelNe: 'कार्तिक २२ देखि २८, २०८३',
    labelEn: 'Kartik 22 – 28, 2083 BS',
    predictions: {
      mesha: {
        rashiId: 'mesha',
        rashiNameNe: 'मेष',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'यस साता मेष राशिका जातकहरूका लागि समग्रमा पराक्रम र उत्साह बढ्नेछ। साताको सुरुका दिनहरूमा केही भागदौड रहे पनि मध्यतिर महत्त्वपूर्ण कार्य बन्नेछन्। मित्रजनको राम्रो साथ रहनेछ।',
        careerNe: 'कार्यक्षेत्रमा नयाँ जिम्मेवारी वा पदोन्नतिको अवसर आउन सक्छ। व्यापार व्यवसायमा प्रतिस्पर्धाका बाबजुद राम्रो नाफा आर्जन हुनेछ।',
        financialNe: 'आर्थिक पक्ष सबल रहनेछ। पुराना लगानीबाट प्रतिफल मिल्नेछ, तर साताको अन्त्यमा घरायसी वस्तु खरिदमा खर्च बढ्न सक्छ।',
        relationshipNe: 'पारिवारिक सम्बन्धमा आत्मीयता र समझदारी कायम रहनेछ। प्रेम सम्बन्धमा साता सुखद रहनेछ।',
        healthNe: 'मौसमजन्य सामान्य समस्या बाहेक स्वास्थ्य राम्रो रहनेछ। शारीरिक व्यायामलाई निरन्तरता दिनुहोला।',
        luckyColorNe: 'रातो वा पहेंलो',
        luckyNumber: 9,
      },
      vrisha: {
        rashiId: 'vrisha',
        rashiNameNe: 'वृष',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'यो साता धैर्य र योजनाबद्ध कार्यशैली अपनाउनु लाभदायक हुनेछ। बोली र व्यवहारमा संयम राख्दा जटिल परिस्थिति पनि सहज बन्नेछ। धार्मिक तथा सामाजिक कार्यमा रुचि बढ्नेछ।',
        careerNe: 'रोकिएका कामहरूले बिस्तारै गति लिनेछन्। सरकारी वा प्रशासनिक काममा केही ढिलाइ भए पनि अन्ततः सफलता मिल्नेछ।',
        financialNe: 'आर्थिक कारोबार गर्दा कागजी सम्झौता स्पष्ट राख्नुहोला। अनावश्यक विलासिताका वस्तुमा खर्च नियन्त्रण गर्नु बुद्धिमानी हुनेछ।',
        relationshipNe: 'दाम्पत्य जीवनमा मधुरता छाउनेछ। परिवारका सदस्यहरूसँग साताको अन्त्यतिर रमाइलो यात्राको योग छ।',
        healthNe: 'घाँटी तथा कण्ठसम्बन्धी समस्याबाट जोगिन चिसोबाट बच्नुहोस्।',
        luckyColorNe: 'सेतो वा चम्किलो खरानी',
        luckyNumber: 6,
      },
      mithun: {
        rashiId: 'mithun',
        rashiNameNe: 'मिथुन',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'साताभर बौद्धिक क्षमता र सिर्जनशीलता उच्च रहनेछ। अध्ययन, अनुसन्धान तथा सञ्चार क्षेत्रमा कार्यरतहरूका लागि विशेष फलदायी साता सावित हुनेछ। नयाँ मित्रहरूसँग सम्पर्क विस्तार हुनेछ।',
        careerNe: 'नयाँ परियोजना वा व्यवसाय सुरु गर्न अनुकूल समय छ। सहकर्मीहरूको पूर्ण समर्थन प्राप्त हुनेछ।',
        financialNe: 'आम्दानीका बहुआयामिक बाटाहरू खुल्नेछन्। सेयर वा बचत क्षेत्रमा सुझबुझपूर्ण लगानी फलदायी हुनेछ।',
        relationshipNe: 'मित्रजन तथा आफन्तहरूसँगको भेटघाटले मन प्रफुल्लित रहनेछ। प्रेम जीवनमा नयाँ ऊर्जा आउनेछ।',
        healthNe: 'मानसिक तनाव कम गर्न पर्याप्त निद्रा र आराममा ध्यान दिनुहोला।',
        luckyColorNe: 'हरियो वा हल्का पहेंलो',
        luckyNumber: 5,
      },
      karkat: {
        rashiId: 'karkat',
        rashiNameNe: 'कर्कट',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'यस साता घरपरिवार र भावनात्मक सम्बन्धहरूमा विशेष ध्यान पुग्नेछ। साताको प्रारम्भिक दिनहरूमा केही मानसिक अस्थिरता रहे पनि मध्य सातादेखि सुखद परिणामहरू देखा पर्नेछन्।',
        careerNe: 'मेहनतको पूर्ण मूल्याङ्कन हुनेछ। नयाँ जिम्मेवारी सम्हाल्ने अवसर मिल्न सक्छ।',
        financialNe: 'घरजग्गा वा घरायसी उपकरणमा लगानीको योग छ। ऋण वा सापटी लेनदेनमा सतर्कता अपनाउनुहोस्।',
        relationshipNe: 'मातापिताको आशीर्वाद र पारिवारिक सहयोगले आत्मबल बढाउनेछ। जीवनसाथीसँगको सहकार्य फलदायी हुनेछ।',
        healthNe: 'खानपानमा सरसफाइ र सन्तुलन कायम राख्नुहोस्, पेटको समस्याबाट सजग रहनुहोला।',
        luckyColorNe: 'दूधिया सेतो वा मोती रङ्ग',
        luckyNumber: 2,
      },
      simha: {
        rashiId: 'simha',
        rashiNameNe: 'सिंह',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'साताभर आत्मबल, नेतृत्व क्षमता र प्रतिष्ठामा वृद्धि हुनेछ। राजनीतिक वा सामाजिक क्षेत्रमा प्रभाव बढ्नेछ। आफ्ना योजनाहरू दृढताका साथ अगाडि बढाउने समय छ।',
        careerNe: 'उच्चपदस्थ अधिकारीहरूसँगको सम्बन्ध सुदृढ हुनेछ। नयाँ व्यापारिक सम्झौता हुन सक्ने प्रबल सम्भावना छ।',
        financialNe: 'आर्थिक स्थिति मजबुत बन्नेछ। व्यावसायिक नाफा र आकस्मिक लाभको योग छ।',
        relationshipNe: 'अहंकार त्यागेर विनम्र बन्दा सम्बन्ध अझ प्रगाढ हुनेछ। सन्तान पक्षबाट खुसीको समाचार प्राप्त हुन सक्छ।',
        healthNe: 'शारीरिक स्फूर्ति कायम रहनेछ। मुटु तथा आँखाको नियमित जाँच गराउनु उचित हुनेछ।',
        luckyColorNe: 'सुनौलो वा सुन्तला',
        luckyNumber: 1,
      },
      kanya: {
        rashiId: 'kanya',
        rashiNameNe: 'कन्या',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'साताको प्रारम्भमा खर्च बढ्न सक्छ, तर मध्य सातादेखि रोकिएका महत्त्वपूर्ण कार्य सम्पन्न हुनेछन्। व्यवस्थापकीय कौशल र तार्किक क्षमताले समस्याहरूको समाधान दिलाउनेछ।',
        careerNe: 'कार्यालयमा जिम्मेवारीपूर्वक काम गर्दा प्रशंसा मिल्नेछ। कानुनी वा लेखासम्बन्धी काम सहजै टुंगिनेछन्।',
        financialNe: 'आर्थिक अनुशासन कायम राख्दा बचतमा वृद्धि हुनेछ। साताको अन्त्यतिर आम्दानीका नयाँ स्रोत भेटिनेछन्।',
        relationshipNe: 'सहयोगी मित्रहरूको साथ रहनेछ। पारिवारिक विषयमा समझदारीपूर्ण निर्णय लिनुहोला।',
        healthNe: 'तनाव व्यवस्थापनका लागि योग र ध्यान लाभदायी हुनेछ। पर्याप्त पानी पिउनुहोस्।',
        luckyColorNe: 'गाढा हरियो वा फिरोजी',
        luckyNumber: 5,
      },
      tula: {
        rashiId: 'tula',
        rashiNameNe: 'तुला',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'साताभर भाग्यको साथ रहनेछ र विभिन्न क्षेत्रबाट सफलता मिल्नेछ। सामाजिक प्रतिष्ठामा वृद्धि हुनेछ। कला, साहित्य तथा मनोरञ्जनका क्षेत्रमा रुचि बढ्नेछ।',
        careerNe: 'साझेदारी व्यापारमा उल्लेखनीय लाभ हुनेछ। नयाँ कामको प्रस्ताव आउन सक्छ।',
        financialNe: 'आर्थिक उन्नति र धन आर्जनका अवसरहरू प्रशस्त मिल्नेछन्। रोकिएको रकम हात पर्नेछ।',
        relationshipNe: 'दाम्पत्य तथा प्रेम सम्बन्धमा विश्वास र सामिप्यता बढ्नेछ। पारिवारिक यात्राको सम्भावना छ।',
        healthNe: 'स्वास्थ्य सामान्यतया सबल रहनेछ। नियमित दिनचर्या अपनाउनुहोस्।',
        luckyColorNe: 'गुलाबी वा हल्का नीलो',
        luckyNumber: 7,
      },
      vrischik: {
        rashiId: 'vrischik',
        rashiNameNe: 'वृश्चिक',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'साताको सुरुमा केही चुनौतीहरू देखा परे पनि दृढ संकल्प र आत्मविश्वासले ती सबै पार लगाइनेछ। गोप्य योजनाहरू कार्यान्वयन गर्न यो साता फलदायी रहनेछ।',
        careerNe: 'प्रतिस्पर्धीहरूलाई पछि पार्दै कार्यक्षेत्रमा अग्रस्थान हासिल गर्न सकिनेछ। जटिल कार्यहरू सफलतापूर्वक सम्पन्न हुनेछन्।',
        financialNe: 'आर्थिक क्षेत्रमा सतर्क रहनु आवश्यक छ। अनावश्यक जोखिमपूर्ण लगानी नगर्नुहोला।',
        relationshipNe: 'अनावश्यक शंकाबाट बच्नुहोस्। आफन्तजनसँगको भेटघाटले मन हलुका बनाउनेछ।',
        healthNe: 'रक्तचाप तथा पाचन प्रणालीको ख्याल राख्नुहोला। व्यायामलाई प्राथमिकता दिनुहोस्।',
        luckyColorNe: 'गाढा रातो वा मरुन',
        luckyNumber: 9,
      },
      dhanu: {
        rashiId: 'dhanu',
        rashiNameNe: 'धनु',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'धार्मिक तथा आध्यात्मिक कार्यमा सहभागिता बढ्नेछ। साताभर भाग्यको बलियो साथ रहनेछ। अध्ययन, अध्यापन तथा वैदेशिक कार्यहरूमा सकारात्मक नतिजा आउनेछ।',
        careerNe: 'व्यापार व्यवसायमा राम्रो प्रगति हुनेछ। नयाँ ज्ञान र सीप आर्जन गर्ने अवसर मिल्नेछ।',
        financialNe: 'आर्थिक पक्ष सन्तोषजनक रहनेछ। शुभ कार्य र परोपकारमा खर्च हुन सक्छ।',
        relationshipNe: 'गुरुजन तथा अग्रजहरूको मार्गदर्शन उपयोगी सिद्ध हुनेछ। परिवारमा शान्त वातावरण रहनेछ।',
        healthNe: 'स्वास्थ्य सबल रहनेछ। कलेजो र कम्मरको हेरचाहमा ध्यान दिनुहोला।',
        luckyColorNe: 'पहेंलो वा केसरिया',
        luckyNumber: 3,
      },
      makar: {
        rashiId: 'makar',
        rashiNameNe: 'मकर',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'निरन्तरको परिश्रमले दिगो नतिजा दिलाउने साता छ। व्यावहारिक सोच र अनुशासनले जटिल समस्याहरूको सजिलो समाधान दिनेछ। ज्येष्ठ नागरिकहरूको आशीर्वाद प्राप्त हुनेछ।',
        careerNe: 'कार्यक्षेत्रमा जिम्मेवारी थपिनेछ। धैर्यतापूर्वक काम गर्दा वरिष्ठ अधिकारीहरूको विश्वास जितिनेछ।',
        financialNe: 'आर्थिक स्थिति स्थिर रहनेछ। फजुल खर्च नियन्त्रण गरी सञ्चित पुँजी संरक्षणमा ध्यान दिनुहोस्।',
        relationshipNe: 'पारिवारिक दायित्व पूरा गर्न समय दिनुपर्नेछ। जीवनसाथीको सल्लाह लाभदायक हुनेछ।',
        healthNe: 'जोर्नी तथा हड्डीसम्बन्धी समस्याबाट सजग रहनुहोला। न्यानो लुगा लगाउनुहोस्।',
        luckyColorNe: 'नीलो वा खैरो',
        luckyNumber: 8,
      },
      kumbha: {
        rashiId: 'kumbha',
        rashiNameNe: 'कुम्भ',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'नवीन विचार र सिर्जनशीलताले सातालाई विशेष बनाउनेछ। सामूहिक र सामाजिक कार्यहरूमा संलग्नता बढ्नेछ। मित्रमण्डलीको सहयोगले अप्ठ्यारा काम सजिलै बन्नेछन्।',
        careerNe: 'सूचना प्रविधि, सामाजिक सेवा तथा अनुसन्धानका क्षेत्रमा उल्लेख्य प्रगति हुनेछ। नयाँ सहकार्यको सुरुआत हुन सक्छ।',
        financialNe: 'आम्दानीको गति राम्रो रहनेछ। पुराना लगानीबाट फाइदा हुने सम्भावना छ।',
        relationshipNe: 'पारिवारिक सम्बन्ध सुदृढ रहनेछ। प्रेम जीवनमा नयाँ समझदारी र विश्वास स्थापित हुनेछ।',
        healthNe: 'वायुविकार र खुट्टाको नसामा ध्यान दिनुहोस्। बिहानको हिँडाइ स्वास्थ्यवद्र्धक हुनेछ।',
        luckyColorNe: 'आसमानी वा कालो',
        luckyNumber: 8,
      },
      meen: {
        rashiId: 'meen',
        rashiNameNe: 'मीन',
        period: 'weekly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-22',
        endDate: '2083-07-28',
        startDateAd: '2026-11-08',
        endDateAd: '2026-11-14',
        descriptionNe: 'परोपकारी र रचनात्मक भावनाले साता आनन्दमय बन्नेछ। धार्मिक यात्रा वा तीर्थाटनको योग छ। अरूको भलाइ गर्दा आत्मसन्तुष्टि मिल्नेछ।',
        careerNe: 'कला, साहित्य, परामर्श तथा शिक्षा क्षेत्रमा कार्यरतहरूका लागि साता अत्यन्तै शुभ छ। कार्यक्षेत्रमा मानसम्मान मिल्नेछ।',
        financialNe: 'आर्थिक कारोबार सहज रहनेछ। शुभ र मङ्गलमय कार्यमा खर्च हुन सक्छ।',
        relationshipNe: 'पारिवारिक मेलमिलाप र दाम्पत्य सुख कायम रहनेछ। प्रियजनसँग आत्मीय कुराकानी हुनेछ।',
        healthNe: 'पर्याप्त निद्रा र मानसिक शान्तिमा जोड दिनुहोस्। आँखा र पैतालाको ख्याल राख्नुहोला।',
        luckyColorNe: 'सुनौलो वा पहेँलो',
        luckyNumber: 3,
      },
    },
  },
};

// 3. SAMPLE MONTHLY RASHIFAL DATA
export const SAMPLE_MONTHLY_DATA: Record<string, PeriodGroupRecord> = {
  '2083-07': {
    key: '2083-07',
    period: 'monthly',
    bsYear: 2083,
    bsMonth: 7,
    startDate: '2083-07-01',
    endDate: '2083-07-30',
    startDateAd: '2026-10-18',
    endDateAd: '2026-11-16',
    labelNe: 'कार्तिक २०८३',
    labelEn: 'Kartik 2083 BS',
    predictions: {
      mesha: {
        rashiId: 'mesha',
        rashiNameNe: 'मेष',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'कार्तिक महिना मेष राशिका लागि ऊर्जावान र फलदायी रहनेछ। महिनाको पहिलो र दोस्रो हप्तामा कडा मिहिनेत गर्नुपरे पनि तेस्रो हप्तादेखि ठोस उपलब्धिका ढोकाहरू खुल्नेछन्।',
        careerNe: 'नयाँ रोजगारी वा पदोन्नतिको योग छ। व्यवसाय विस्तारका लागि साझेदारहरूसँगको वार्ता सफल हुनेछ।',
        financialNe: 'आर्थिक दृष्टिकोणले महिना मध्यमदेखि उत्तम रहनेछ। महिनाको अन्त्यतिर रोकिएको रकम फिर्ता आउनेछ।',
        relationshipNe: 'चाडपर्व तथा पारिवारिक उत्सवहरूले घरमा उल्लासमय वातावरण बनाउनेछ। दाम्पत्य जीवन सुखद रहनेछ।',
        healthNe: 'मौसमी रुघाखोकी बाहेक स्वास्थ्य राम्रो रहनेछ। रक्तचाप सन्तुलनमा राख्नुहोला।',
        luckyColorNe: 'रातो',
        luckyNumber: 9,
      },
      vrisha: {
        rashiId: 'vrisha',
        rashiNameNe: 'वृष',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'यो महिना धैर्य र लगनशीलताका साथ अघि बढ्ने महिना हो। महिनाको पूर्वार्धमा खर्च बढे पनि उत्तरार्धमा आम्दानीका नयाँ स्रोतहरू पहिचान हुनेछन्।',
        careerNe: 'कार्यक्षेत्रमा प्रतिस्पर्धा बढे पनि आफ्नो दक्षता प्रमाणित गर्न सकिनेछ। वैदेशिक कार्यमा प्रगति हुनेछ।',
        financialNe: 'अनावश्यक ऋण र कर्जाबाट बच्नुहोस्। बचत योजनाहरूमा ध्यान केन्द्रित गर्नु लाभदायी हुनेछ।',
        relationshipNe: 'पारिवारिक सम्बन्धमा सौहार्दता छाउनेछ। मित्रहरूको सहयोगले जटिल समस्या समाधान हुनेछ।',
        healthNe: 'घाँटी र छातीको विशेष हेरचाह गर्नुहोस्। चिसोबाट जोगिनुहोला।',
        luckyColorNe: 'सेतो',
        luckyNumber: 6,
      },
      mithun: {
        rashiId: 'mithun',
        rashiNameNe: 'मिथुन',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'कार्तिक महिना अध्ययन, अनुसन्धान र बौद्धिक कार्यका लागि अत्यन्तै अनुकूल रहनेछ। सिर्जनात्मक कार्यहरूले समाजमा प्रशंसा र पहिचान दिलाउनेछन्।',
        careerNe: 'सञ्चार, बैंकिङ र प्रविधि क्षेत्रमा काम गर्नेहरूका लागि महिना लाभदायक छ। नयाँ अवसर हात लाग्नेछ।',
        financialNe: 'आर्थिक पक्ष सुदृढ रहनेछ। महिनाको मध्यतिर सेयर बजार वा व्यापारबाट राम्रो प्रतिफल मिल्नेछ।',
        relationshipNe: 'दाम्पत्य जीवनमा मिठास रहनेछ। प्रेम सम्बन्ध विवाहमा परिणत हुने योग बन्न सक्छ।',
        healthNe: 'मानसिक शान्ति कायम रहनेछ। नियमित ध्यान र योगलाई दिनचर्यामा समावेश गर्नुहोस्।',
        luckyColorNe: 'हरियो',
        luckyNumber: 5,
      },
      karkat: {
        rashiId: 'karkat',
        rashiNameNe: 'कर्कट',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'पारिवारिक सुख, मातृसुख र जग्गाजमिनका विषयहरूमा महिना सकारात्मक रहनेछ। सानातिना विवादहरूलाई समयमै संवादमार्फत टुंग्याउनु बेस हुनेछ।',
        careerNe: 'स्थिर भएर काम गर्दा राम्रो प्रतिफल पाइनेछ। सहकर्मीहरूको विश्वास जित्न सकिनेछ।',
        financialNe: 'घर निर्माण वा सजावटमा खर्च हुनेछ। दीर्घकालीन लगानीका योजनाहरू सफल हुनेछन्।',
        relationshipNe: 'आफन्तजनसँगको सम्बन्ध अझ नजिक बन्नेछ। घरमा शुभ कार्यको आयोजना हुन सक्छ।',
        healthNe: 'पाचन प्रणाली र खानपानमा विशेष सावधानी अपनाउनुहोला।',
        luckyColorNe: 'दूधिया',
        luckyNumber: 2,
      },
      simha: {
        rashiId: 'simha',
        rashiNameNe: 'सिंह',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'आत्मबल उच्च रहनेछ र सामाजिक प्रतिष्ठामा उल्लेखनीय वृद्धि हुनेछ। नेतृत्वदायी भूमिकाहरू सफलतापूर्वक सम्पादन गर्न सकिनेछ।',
        careerNe: 'व्यापार व्यवसायमा उच्च मुनाफा हुनेछ। सरकारी क्षेत्रसँग सम्बन्धित कामहरू सहजै सम्पन्न हुनेछन्।',
        financialNe: 'आर्थिक स्थिति सबल रहनेछ। नयाँ भौतिक साधन खरिद गर्ने योग छ।',
        relationshipNe: 'पारिवारिक सम्बन्धमा आत्मीयता बढ्नेछ। सन्तान पक्षबाट गर्व गर्न लायक खबर सुन्न पाइनेछ।',
        healthNe: 'शारीरिक स्फूर्ति कायम रहनेछ। नियमित व्यायाम र सन्तुलित आहार आवश्यक छ।',
        luckyColorNe: 'पहेंलो',
        luckyNumber: 1,
      },
      kanya: {
        rashiId: 'kanya',
        rashiNameNe: 'कन्या',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'मिहिनेतको यथोचित मूल्याङ्कन हुने महिना छ। सुरुवाती दिनहरूमा केही अन्योल रहे पनि क्रमशः सबै काम लयमा फर्किनेछन्।',
        careerNe: 'कार्यालयमा जिम्मेवारी बढ्नेछ। वैदेशिक यात्रा वा अध्ययनका प्रयासहरू सफल हुनेछन्।',
        financialNe: 'आर्थिक कारोबारमा पारदर्शिता राख्नुहोला। फजुल खर्च घटाउन सके बचत सन्तोषजनक रहनेछ।',
        relationshipNe: 'मित्रहरूसँगको सहकार्य सुखद रहनेछ। पारिवारिक सरसल्लाह लिएर अघि बढ्दा सफलता मिल्नेछ।',
        healthNe: 'तनाव व्यवस्थापनमा ध्यान दिनुहोस्। आँखा तथा दाँतको हेरचाह गर्नुहोला।',
        luckyColorNe: 'गाढा हरियो',
        luckyNumber: 5,
      },
      tula: {
        rashiId: 'tula',
        rashiNameNe: 'तुला',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'भाग्य र कर्मको सुन्दर समन्वयले यो महिना सर्वतोमुखी लाभ दिलाउनेछ। कला, फेसन तथा व्यापारिक क्षेत्रमा विशेष प्रगति हुनेछ।',
        careerNe: 'साझेदारीका काममा राम्रो प्रतिफल मिल्नेछ। पदोन्नति वा नयाँ अनुबन्धको अवसर आउन सक्छ।',
        financialNe: 'धन आगमनका बाटाहरू प्रशस्त हुनेछन्। विलासिता र मनोरञ्जनमा केही खर्च बढ्न सक्छ।',
        relationshipNe: 'प्रेम तथा वैवाहिक जीवन सुखमय रहनेछ। नयाँ सम्बन्धहरू सुरु हुन सक्छन्।',
        healthNe: 'स्वास्थ्य राम्रो रहनेछ। मौसम परिवर्तनका बेला सामान्य सतर्कता राख्नुहोस्।',
        luckyColorNe: 'गुलाबी',
        luckyNumber: 7,
      },
      vrischik: {
        rashiId: 'vrischik',
        rashiNameNe: 'वृश्चिक',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'दृढ आत्मविश्वासका साथ अघि बढ्दा महिनाभरिका चुनौतीहरूलाई अवसरमा बदल्न सकिनेछ। प्रतिस्पर्धीहरू पछि पर्नेछन्।',
        careerNe: 'कार्यक्षेत्रमा प्रभावकारी उपस्थिति रहनेछ। जटिल समस्याहरूको समाधान आफ्नै बलबुतामा खोजिनेछ।',
        financialNe: 'आर्थिक स्थिति बलियो बन्नेछ। पुख्र्यौली सम्पत्ति वा पुराना लगानीबाट लाभ हुनेछ।',
        relationshipNe: 'परिवारमा मेलमिलाप कायम रहनेछ। आफ्ना भावनाहरू स्पष्ट रूपमा व्यक्त गर्दा भ्रम हट्नेछ।',
        healthNe: 'नियमित व्यायाम र खानपानमा नियन्त्रण राख्नुहोला। टाउको दुखाइबाट बच्नुहोस्।',
        luckyColorNe: 'रातो',
        luckyNumber: 9,
      },
      dhanu: {
        rashiId: 'dhanu',
        rashiNameNe: 'धनु',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'धार्मिक कार्य, तीर्थयात्रा र सामाजिक प्रतिष्ठाको महिना छ। गुरु तथा अग्रजहरूको मार्गदर्शनले सही निर्णय लिन मद्दत गर्नेछ।',
        careerNe: 'उच्च शिक्षा, शिक्षण र परामर्शका क्षेत्रमा उत्कृष्ट नतिजा आउनेछ। नयाँ जिम्मेवारी प्राप्त हुनेछ।',
        financialNe: 'आर्थिक स्थिति सन्तोषप्रद रहनेछ। परोपकार र समाजसेवामा खर्च गर्ने अवसर मिल्नेछ।',
        relationshipNe: 'इष्टमित्रहरूसँगको सम्बन्ध सुमधुर रहनेछ। परिवारमा शान्त र आध्यात्मिक वातावरण छाउनेछ।',
        healthNe: 'स्वास्थ्य सामान्यतया राम्रो रहनेछ। कम्मर र जोर्नीको हेरचाह गर्नुहोस्।',
        luckyColorNe: 'पहेंलो',
        luckyNumber: 3,
      },
      makar: {
        rashiId: 'makar',
        rashiNameNe: 'मकर',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'कडा परिश्रम र निरन्तरताले सफलता दिलाउनेछ। धैर्य नगुमाई काम गर्दा महिनाको मध्यतिरबाट ठूला उपलब्धि हात लाग्नेछन्।',
        careerNe: 'कार्यक्षेत्रमा स्थायित्व आउनेछ। पुराना अड्किएका आयोजनाहरू पुनः सुरु हुनेछन्।',
        financialNe: 'आर्थिक अनुशासनले धन सञ्चयमा सहयोग पुग्नेछ। अनावश्यक जोखिम नलिनुहोला।',
        relationshipNe: 'परिवारका ज्येष्ठ सदस्यहरूको स्वास्थ्यमा समय दिनुहोला। दाम्पत्य जीवन सामान्य रहनेछ।',
        healthNe: 'हाडजोर्नी र चिसोबाट जोगिन आवश्यक छ। न्यानो रहनुहोस्।',
        luckyColorNe: 'नीलो',
        luckyNumber: 8,
      },
      kumbha: {
        rashiId: 'kumbha',
        rashiNameNe: 'कुम्भ',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'सिर्जनशीलता, नयाँ अनुसन्धान र सामाजिक सञ्जाल विस्तारका लागि कार्तिक महिना विशेष फलदायी रहनेछ। साथीभाइको राम्रो साथ मिल्नेछ।',
        careerNe: 'सामूहिक कार्यमा ठूलो सफलता मिल्नेछ। प्रविधि तथा उद्यमशीलतामा नयाँ फड्को मार्न सकिनेछ।',
        financialNe: 'आम्दानीको निरन्तरता रहनेछ। पुराना आर्थिक दायित्वहरू पूरा गर्न सकिनेछ।',
        relationshipNe: 'सामाजिक र पारिवारिक सम्बन्धहरू फराकिला बन्नेछन्। प्रेम सम्बन्धमा नयाँ आयाम थपिनेछ।',
        healthNe: 'मानसिक स्फूर्ति उच्च रहनेछ। नियमित शारीरिक क्रियाकलापमा सक्रिय रहनुहोस्।',
        luckyColorNe: 'आसमानी',
        luckyNumber: 8,
      },
      meen: {
        rashiId: 'meen',
        rashiNameNe: 'मीन',
        period: 'monthly',
        bsYear: 2083,
        bsMonth: 7,
        startDate: '2083-07-01',
        endDate: '2083-07-30',
        startDateAd: '2026-10-18',
        endDateAd: '2026-11-16',
        descriptionNe: 'परोपकार, आध्यात्मिक चिन्तन र आन्तरिक शान्तिले महिना सुखद बन्नेछ। रचनात्मक कार्यहरूमा मन लाग्नेछ र सम्मान मिल्नेछ।',
        careerNe: 'शिक्षा, कला, साहित्य तथा स्वास्थ्य क्षेत्रमा कार्यरतहरूका लागि महिना प्रगतिशील रहनेछ।',
        financialNe: 'आर्थिक स्थिति सन्तुलित रहनेछ। शुभ र मङ्गल कार्यहरूमा खर्च हुनेछ।',
        relationshipNe: 'परिवारमा सौहार्दपूर्ण वातावरण रहनेछ। जीवनसाथीसँगको सम्बन्ध प्रगाढ बन्नेछ।',
        healthNe: 'निद्रा तथा आराममा ध्यान दिनुहोस्। नियमित स्वास्थ्य परीक्षण गराउनु उचित हुनेछ।',
        luckyColorNe: 'सुनौलो',
        luckyNumber: 3,
      },
    },
  },
};

// Alias for callers that need the daily sample dataset.
export const SAMPLE_RASHIFAL_DATA = SAMPLE_DAILY_DATA;

export interface RashifalQueryResult {
  isAvailable: boolean;
  period: HoroscopePeriod;
  periodTitleNe: string;
  periodTitleEn: string;
  coverageLabelNe: string;
  coverageLabelEn: string;
  bsDate: string; // anchor date for daily, start date for weekly/monthly
  startDate: string;
  endDate: string;
  startDateAd?: string;
  endDateAd?: string;
  adDate?: string;
  rashiMeta?: RashiMeta;
  prediction?: HoroscopeRecord;
  allPredictions?: Record<RashiId, HoroscopeRecord>;
  missingMessageNe: string;
  missingMessageEn: string;
}

export function getRashiById(id: string): RashiMeta | undefined {
  const normalized = id.trim().toLowerCase();
  return RASHIS.find((r) => r.id === normalized);
}

export function getAvailableRashifalDates(): string[] {
  return Object.keys(SAMPLE_DAILY_DATA).sort();
}

export function getAvailableWeeklyKeys(): string[] {
  return Object.keys(SAMPLE_WEEKLY_DATA).sort();
}

export function getAvailableMonthlyKeys(): string[] {
  return Object.keys(SAMPLE_MONTHLY_DATA).sort();
}

export function isRashifalAvailableForDate(bsDate: string): boolean {
  return Boolean(SAMPLE_DAILY_DATA[bsDate]);
}

function formatBsDateLabelNe(bsDate: string): string {
  const [year, month, day] = bsDate.split('-').map(Number);
  const monthMeta = BS_MONTHS[month - 1];
  if (!monthMeta || !Number.isInteger(year) || !Number.isInteger(day)) {
    return `${bsDate} वि.सं.`;
  }
  return `${monthMeta.ne} ${toDevanagariDigits(day)}, ${toDevanagariDigits(year)}`;
}

/**
 * Unified query function for Daily, Weekly, and Monthly horoscopes.
 * Always returns sample content or an explicit missing status.
 */
export function getHoroscope(
  period: HoroscopePeriod,
  options?: {
    rashiId?: RashiId;
    dateOrKey?: string;
    nowMs?: number;
  },
): RashifalQueryResult {
  const { rashiId, dateOrKey, nowMs } = options || {};
  const today = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined);
  const rashiMeta = rashiId ? getRashiById(rashiId) : undefined;

  if (period === 'daily') {
    const targetDate = dateOrKey || today.bs.iso;
    const record = SAMPLE_DAILY_DATA[targetDate];

    if (!record) {
      return {
        isAvailable: false,
        period: 'daily',
        periodTitleNe: 'दैनिक राशिफल',
        periodTitleEn: 'Daily Horoscope',
        coverageLabelNe: `${targetDate} वि.सं.`,
        coverageLabelEn: `${targetDate} BS`,
        bsDate: targetDate,
        startDate: targetDate,
        endDate: targetDate,
        rashiMeta,
        missingMessageNe: `यस मिति (${targetDate} वि.सं.) को आधिकारिक दैनिक राशिफल हाल उपलब्ध छैन। मितिपत्रोले प्रमाणित र आधिकारिक राशिफल सामग्री मात्र प्रस्तुत गर्दछ।`,
        missingMessageEn: `Sample daily horoscope content is not available for ${targetDate} BS.`,
      };
    }

    const prediction = rashiId ? record.predictions[rashiId] : undefined;

    return {
      isAvailable: true,
      period: 'daily',
      periodTitleNe: 'दैनिक राशिफल',
      periodTitleEn: 'Daily Horoscope',
      coverageLabelNe: formatBsDateLabelNe(record.bsDate),
      coverageLabelEn: `${record.bsDate} BS (${record.adDate})`,
      bsDate: record.bsDate,
      startDate: record.bsDate,
      endDate: record.bsDate,
      startDateAd: record.adDate,
      endDateAd: record.adDate,
      adDate: record.adDate,
      rashiMeta,
      prediction,
      allPredictions: record.predictions,
      missingMessageNe: '',
      missingMessageEn: '',
    };
  }

  if (period === 'weekly') {
    const group = dateOrKey
      ? SAMPLE_WEEKLY_DATA[dateOrKey]
      : Object.values(SAMPLE_WEEKLY_DATA).find(
          (record) => record.startDate <= today.bs.iso && today.bs.iso <= record.endDate,
        );

    if (!group) {
      return {
        isAvailable: false,
        period: 'weekly',
        periodTitleNe: 'साप्ताहिक राशिफल',
        periodTitleEn: 'Weekly Horoscope',
        coverageLabelNe: 'यस साता',
        coverageLabelEn: 'This Week',
        bsDate: today.bs.iso,
        startDate: today.bs.iso,
        endDate: today.bs.iso,
        rashiMeta,
        missingMessageNe: 'यस साताको आधिकारिक साप्ताहिक राशिफल हाल उपलब्ध छैन। नयाँ सामग्री प्रमाणीकरणपछि प्रकाशित गरिनेछ।',
        missingMessageEn: 'Sample weekly horoscope content is not available for this week.',
      };
    }

    const prediction = rashiId ? group.predictions[rashiId] : undefined;

    return {
      isAvailable: true,
      period: 'weekly',
      periodTitleNe: 'साप्ताहिक राशिफल',
      periodTitleEn: 'Weekly Horoscope',
      coverageLabelNe: group.labelNe,
      coverageLabelEn: `${group.labelEn} (${group.startDateAd} to ${group.endDateAd})`,
      bsDate: group.startDate,
      startDate: group.startDate,
      endDate: group.endDate,
      startDateAd: group.startDateAd,
      endDateAd: group.endDateAd,
      adDate: group.startDateAd,
      rashiMeta,
      prediction,
      allPredictions: group.predictions,
      missingMessageNe: '',
      missingMessageEn: '',
    };
  }

  // Monthly
  const currentMonthKey = `${today.bs.year}-${String(today.bs.month).padStart(2, '0')}`;
  const targetKey = dateOrKey || currentMonthKey;
  const group = targetKey ? SAMPLE_MONTHLY_DATA[targetKey] : undefined;

  if (!group) {
    return {
      isAvailable: false,
      period: 'monthly',
      periodTitleNe: 'मासिक राशिफल',
      periodTitleEn: 'Monthly Horoscope',
      coverageLabelNe: `${today.bs.monthNameNe} ${toDevanagariDigits(today.bs.year)}`,
      coverageLabelEn: `${today.bs.monthNameEn} ${today.bs.year} BS`,
      bsDate: `${today.bs.year}-${String(today.bs.month).padStart(2, '0')}-01`,
      startDate: `${today.bs.year}-${String(today.bs.month).padStart(2, '0')}-01`,
      endDate: `${today.bs.year}-${String(today.bs.month).padStart(2, '0')}-30`,
      rashiMeta,
      missingMessageNe: `यस महिना (${today.bs.monthNameNe} ${toDevanagariDigits(today.bs.year)}) को आधिकारिक मासिक राशिफल हाल उपलब्ध छैन।`,
      missingMessageEn: `Sample monthly horoscope content is not available for ${today.bs.monthNameEn} ${today.bs.year} BS.`,
    };
  }

  const prediction = rashiId ? group.predictions[rashiId] : undefined;

  return {
    isAvailable: true,
    period: 'monthly',
    periodTitleNe: 'मासिक राशिफल',
    periodTitleEn: 'Monthly Horoscope',
    coverageLabelNe: group.labelNe,
    coverageLabelEn: `${group.labelEn} (${group.startDateAd} to ${group.endDateAd})`,
    bsDate: group.startDate,
    startDate: group.startDate,
    endDate: group.endDate,
    startDateAd: group.startDateAd,
    endDateAd: group.endDateAd,
    adDate: group.startDateAd,
    rashiMeta,
    prediction,
    allPredictions: group.predictions,
    missingMessageNe: '',
    missingMessageEn: '',
  };
}

/**
 * Backward-compatible helper for daily queries
 */
export function getDailyRashifal(bsDate: string, rashiId?: RashiId): RashifalQueryResult {
  return getHoroscope('daily', { rashiId, dateOrKey: bsDate });
}

export function getWeeklyRashifal(weekKey?: string, rashiId?: RashiId, nowMs?: number): RashifalQueryResult {
  return getHoroscope('weekly', { rashiId, dateOrKey: weekKey, nowMs });
}

export function getMonthlyRashifal(year?: number, month?: number, rashiId?: RashiId, nowMs?: number): RashifalQueryResult {
  const monthKey = year && month ? `${year}-${String(month).padStart(2, '0')}` : undefined;
  return getHoroscope('monthly', { rashiId, dateOrKey: monthKey, nowMs });
}

/**
 * Helper to get the BS date string for today in Asia/Kathmandu.
 */
export function getTodayNepalBsDate(nowMs?: number): string {
  const today = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined);
  return today.bs.iso;
}
