// lib/rashifalReadings.ts
//
// Rashifal reading content — position-based (Moon position counted from the
// reader's sign), shared by all 12 rashis. Daily only.
//
// EDITORIAL POLICY:
// - Readings are keyed by position (1–12) and variant.
// - Same reading text applies to all signs at the same position.
// - Multiple variants per position enable deterministic daily rotation.
// - Approved readings must have source === 'original-editorial'
//   and non-empty textNe.
// - Unapproved readings must never render.
// - Editorial readings are not verified astrological predictions.

export type RashifalVariant = "a" | "b" | "c";

export interface RashifalReading {
  position: number;
  variant: RashifalVariant;
  textNe: string;
  source: string;
  approved: boolean;
  updatedAt?: string;
  luckyColorNe?: string;
  luckyNumber?: number | string;
}

// One approved editorial reading per position.
// Variants b and c remain unpublished placeholders.

export const RASHIFAL_READINGS: RashifalReading[] = [
  // Position 1
  {
    position: 1,
    variant: "a",
    textNe:
      "आज आफ्ना प्राथमिकतामा ध्यान दिनुहोस्। नयाँ काम सुरु गर्नुअघि योजना स्पष्ट बनाउँदा सहज हुनेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "रातो",
    luckyNumber: 9,
  },
  {
    position: 1,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 1,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 2
  {
    position: 2,
    variant: "a",
    textNe:
      "आर्थिक तथा पारिवारिक विषयमा सोचविचार गरेर निर्णय लिनुहोस्। अनावश्यक खर्चभन्दा बचतलाई प्राथमिकता दिनु राम्रो हुनेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "सेतो",
    luckyNumber: 6,
  },
  {
    position: 2,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 2,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 3
  {
    position: 3,
    variant: "a",
    textNe:
      "आज कुराकानी र विचार आदानप्रदानका लागि समय निकाल्नुहोस्। आफ्ना कुरा स्पष्ट राख्दा गलतफहमी कम गर्न मद्दत पुग्नेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "हरियो",
    luckyNumber: 5,
  },
  {
    position: 3,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 3,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 4
  {
    position: 4,
    variant: "a",
    textNe:
      "घरपरिवार र व्यक्तिगत जीवनलाई केही समय दिनुहोस्। शान्त वातावरणमा बिताएको समयले मन हल्का बनाउन सक्छ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "दूधिया सेतो",
    luckyNumber: 2,
  },
  {
    position: 4,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 4,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 5
  {
    position: 5,
    variant: "a",
    textNe:
      "आफ्नो सिर्जनात्मक सोच र क्षमतामा विश्वास राख्नुहोस्। नयाँ विचार अघि सार्दा अरूको सुझाव पनि सुन्नु उपयोगी हुनेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "पहेंलो",
    luckyNumber: 1,
  },
  {
    position: 5,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 5,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 6
  {
    position: 6,
    variant: "a",
    textNe:
      "अधुरा कामलाई क्रमशः पूरा गर्ने प्रयास गर्नुहोस्। समय व्यवस्थापन र नियमितताले आजको काम सहज बनाउन सक्छ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "गाढा हरियो",
    luckyNumber: 5,
  },
  {
    position: 6,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 6,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 7
  {
    position: 7,
    variant: "a",
    textNe:
      "सम्बन्ध र साझेदारीमा आपसी समझदारीलाई महत्व दिनुहोस्। निर्णय गर्दा दुवै पक्षको विचार सुन्नु राम्रो हुनेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "गुलाबी",
    luckyNumber: 7,
  },
  {
    position: 7,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 7,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 8
  {
    position: 8,
    variant: "a",
    textNe:
      "महत्वपूर्ण निर्णयमा हतार नगर्नुहोस्। कुनै विषय अस्पष्ट भए थप जानकारी लिएर मात्र अघि बढ्नु उपयुक्त हुनेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "रातो वा मरुन",
    luckyNumber: 9,
  },
  {
    position: 8,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 8,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 9
  {
    position: 9,
    variant: "a",
    textNe:
      "नयाँ कुरा सिक्ने र आफ्नो ज्ञान विस्तार गर्ने अवसर खोज्नुहोस्। फरक दृष्टिकोणले कुनै समस्याको नयाँ समाधान देखाउन सक्छ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "पहेंलो",
    luckyNumber: 3,
  },
  {
    position: 9,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 9,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 10
  {
    position: 10,
    variant: "a",
    textNe:
      "काम र जिम्मेवारीलाई प्राथमिकताका आधारमा व्यवस्थित गर्नुहोस्। निरन्तर प्रयासले महत्वपूर्ण काम अघि बढाउन सहयोग गर्नेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "नीलो",
    luckyNumber: 8,
  },
  {
    position: 10,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 10,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 11
  {
    position: 11,
    variant: "a",
    textNe:
      "मित्रता र सामाजिक सम्बन्धका लागि समय निकाल्नुहोस्। अरूसँग विचार साझा गर्दा नयाँ सम्भावना पहिचान गर्न सक्नुहुनेछ।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "आसमानी नीलो",
    luckyNumber: 8,
  },
  {
    position: 11,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 11,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },

  // Position 12
  {
    position: 12,
    variant: "a",
    textNe:
      "आज आफ्नो आराम र मानसिक शान्तिलाई पनि महत्व दिनुहोस्। आवश्यकताभन्दा बढी जिम्मेवारी नलिई कामलाई सन्तुलित राख्नुहोस्।",
    source: "original-editorial",
    approved: true,
    updatedAt: "2026-11-21",
    luckyColorNe: "पहेंलो वा केसरिया",
    luckyNumber: 3,
  },
  {
    position: 12,
    variant: "b",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
  {
    position: 12,
    variant: "c",
    textNe: "SAMPLE, not for publication",
    source: "unsourced",
    approved: false,
  },
];
