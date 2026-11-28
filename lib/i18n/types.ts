export type Locale = 'en' | 'ne';

export interface LocaleDictionary {
  common: {
    loading: string;
    retry: string;
    submit: string;
    generate: string;
    reset: string;
    error: string;
    success: string;
    notAvailable: string;
  };
  navigation: {
    today: string;
    calendar: string;
    holidays: string;
    rashifal: string;
    panchang: string;
    kundali: string;
    about: string;
    contact: string;
    dateConverter: string;
  };
  kundali: {
    title: string;
    subtitle: string;
    birthDetails: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    calculate: string;
    chartSummary: string;
    lagna: string;
    ayanamsha: string;
    mahadasha: string;
    antardasha: string;
    graha: string;
    rashi: string;
    house: string;
    nakshatra: string;
    pada: string;
    aiReading: string;
    generateReading: string;
    askJyotish: string;
  };
  dasha: {
    unavailable: string;
    mahadasha: string;
    antardasha: string;
  };
  errors: {
    invalidBirthDetails: string;
    chartCalculationFailed: string;
    birthDetailsRequired: string;
    emptyQuestion: string;
    questionTooLong: string;
    rateLimited: string;
    network: string;
    invalidResponse: string;
    readingFailed: string;
    questionFailed: string;
  };
  loadingStates: {
    chart: string;
    reading: string;
    asking: string;
  };
  footer: {
    description: string;
    range: string;
    calendarsTools: string;
    today: string;
    rashifal: string;
    panchang: string;
    converter: string;
    dateDifference: string;
    ageCalculator: string;
    numberConverter: string;
    calendarYear: string;
    publicHolidays: string;
    editorialPolicies: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    sitemap: string;
    copyright: string;
    timezone: string;
  };
  routes: {
    home: string;
    todayTitle: string;
    todaySubtitle: string;
    converterTitle: string;
    converterSubtitle: string;
    moreTools: string;
    referenceDates: string;
    rashifalSampleTitle: string;
  };
  jyotish: {
    aiTitle: string;
    traditionalGuidance: string;
    regenerate: string;
    retry: string;
    loading: string;
    chartIndicators: string;
    overview: string;
    personality: string;
    career: string;
    relationships: string;
    dashaTransit: string;
    remedies: string;
    noRemedies: string;
    disclaimer: string;
    questionLabel: string;
    answerLabel: string;
    house: string;
    graha: string;
    sadeSati: string;
    notActive: string;
    suggestedQuestions: string;
    starterDasha: string;
    starterCareer: string;
    starterRelationships: string;
    starterSadeSati: string;
    questionPlaceholder: string;
  };
  multiDasha: {
    title: string;
    subtitle: string;
    tabs: {
      vimshottari: string;
      yogini: string;
      tribhagi: string;
    };
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    active: string;
    notAvailable: string;
    startDate: string;
    endDate: string;
    bsDate: string;
    adDate: string;
    shloka: string;
    plainSummary: string;
    toggleView: string;
    askAI: string;
    asking: string;
    notImplemented: string;
  };
  planetaryTable: {
    title: string;
    subtitle: string;
    columns: {
      graha: string;
      rashi: string;
      degree: string;
      nakshatra: string;
      pada: string;
      house: string;
      dignity: string;
    };
    lagna: string;
    retrograde: string;
    combust: string;
    askAboutPlanet: string;
    dignity: {
      exalted: string;
      debilitated: string;
      own_sign: string;
      moolatrikona: string;
      friendly: string;
      neutral: string;
      enemy: string;
    };
  };
}
