// 100 countries for the "masculine or feminine?" game: every Arab country, a few borderline ones
// (Arabic is official or widely used), and well-known others. Country names are feminine in Arabic
// unless they are on the short list of masculine ones below.
//
// Disputed, so worth a second look: العِراق and اليَمَن can also be treated as feminine; الصُّومال,
// قَطَر, إِسرائيل and الكُوَيت are listed as feminine, the default for country names.

const MASCULINE = new Set([
  "لُبنان", "العِراق", "الأُردُن", "السُّودان", "المَغرِب", "اليَمَن", "جَنوب السُّودان", "جَنوب أَفرِيقيا",
]);

const NAMES = [
  // Arab countries
  ["Egypt", "مِصر"], ["Syria", "سورِيا"], ["Lebanon", "لُبنان"], ["Jordan", "الأُردُن"], ["Palestine", "فِلَسطين"],
  ["Iraq", "العِراق"], ["Saudi Arabia", "السَّعودِيّة"], ["Kuwait", "الكُوَيت"], ["Bahrain", "البَحرَين"], ["Qatar", "قَطَر"],
  ["the United Arab Emirates", "الإِمارات"], ["Oman", "عُمان"], ["Yemen", "اليَمَن"], ["Sudan", "السُّودان"], ["Libya", "ليبِيا"],
  ["Tunisia", "تونِس"], ["Algeria", "الجَزائِر"], ["Morocco", "المَغرِب"], ["Mauritania", "مورِيتانِيا"], ["Somalia", "الصُّومال"],
  ["Djibouti", "جيبوتي"], ["the Comoros", "جُزُر القَمَر"],
  // borderline
  ["Israel", "إِسرائيل"], ["Chad", "تْشاد"], ["Eritrea", "إِريتريا"], ["South Sudan", "جَنوب السُّودان"],
  // others
  ["Turkey", "تُركِيا"], ["Iran", "إيران"], ["Afghanistan", "أَفغانِستان"], ["Pakistan", "باكِستان"], ["India", "الهِند"],
  ["Bangladesh", "بَنغلاديش"], ["China", "الصِّين"], ["Japan", "اليابان"], ["South Korea", "كورِيا الجَنوبِيّة"],
  ["North Korea", "كورِيا الشَّمالِيّة"], ["Indonesia", "إِندونيسِيا"], ["Malaysia", "ماليزِيا"], ["Thailand", "تايلَند"],
  ["Vietnam", "فيتنام"], ["the Philippines", "الفِلِبِّين"], ["Singapore", "سِنغافورة"], ["Nepal", "نِيبال"],
  ["Russia", "رُوسِيا"], ["Ukraine", "أُوكرانِيا"], ["Poland", "بُولَندا"], ["Germany", "أَلمانِيا"], ["France", "فَرَنسا"],
  ["Italy", "إِيطالِيا"], ["Spain", "إِسبانِيا"], ["Portugal", "البُرتُغال"], ["Britain", "بِريطانِيا"], ["Ireland", "أَيرَلَندا"],
  ["the Netherlands", "هُولَندا"], ["Belgium", "بَلجِيكا"], ["Switzerland", "سُويسرا"], ["Austria", "النَّمسا"],
  ["Sweden", "السُّوِيد"], ["Norway", "النُّرويج"], ["Denmark", "الدَّنمارك"], ["Finland", "فِنلَندا"], ["Greece", "اليُونان"],
  ["Cyprus", "قُبرُص"], ["the Czech Republic", "التِّشيك"], ["Hungary", "المَجَر"], ["Romania", "رومانيا"], ["Bulgaria", "بُلغارِيا"],
  ["Serbia", "صِربِيا"], ["Bosnia", "البوسنة"], ["Albania", "أَلبانِيا"], ["Armenia", "أَرمِينِيا"], ["Georgia", "جُورجِيا"],
  ["Azerbaijan", "أَذَربيجان"], ["Kazakhstan", "كازاخستان"], ["Uzbekistan", "أُوزبَكِستان"],
  ["the United States", "الوِلايات المُتَّحِدة"], ["Canada", "كَنَدا"], ["Mexico", "المَكسِيك"], ["Brazil", "البَرازِيل"],
  ["Argentina", "الأَرجَنتِين"], ["Chile", "تشِيلي"], ["Colombia", "كُولُمبِيا"], ["Peru", "بِيرو"], ["Venezuela", "فَنَزُوِيلا"],
  ["Cuba", "كُوبا"], ["Australia", "أُستُرالِيا"], ["New Zealand", "نِيوزِيلَندا"], ["South Africa", "جَنوب أَفرِيقيا"],
  ["Nigeria", "نيجِيريا"], ["Ethiopia", "إِثيوبِيا"], ["Kenya", "كِينِيا"], ["Tanzania", "تَنزانِيا"], ["Uganda", "أُوغَندا"],
  ["Ghana", "غانا"], ["Senegal", "السِّنِغال"], ["Mali", "مالي"], ["Niger", "النِّيجَر"], ["Angola", "أَنغولا"],
  ["the Congo", "الكونغو"], ["Cameroon", "الكاميرون"],
];

export const COUNTRIES = NAMES.map(([en, ar], i) => ({
  id: `c${i + 1}`,
  en,
  ar,
  gender: MASCULINE.has(ar) ? "masculine" : "feminine",
  hasArticle: ar.startsWith("ال"),
}));

// The gender game and the "with ال or not" game use these 16 well-known countries.
const GAME_NAMES = [
  "the United States", "China", "France", "Spain", "Britain", "Turkey", "Iran", "Russia", "Japan", "Italy",
  "Canada", "Mexico", "Germany", "India", "Pakistan", "South Korea",
];
export const GAME_COUNTRIES = GAME_NAMES.map((en) => COUNTRIES.find((c) => c.en === en));
