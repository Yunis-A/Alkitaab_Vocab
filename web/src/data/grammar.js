// Static grammar sections. Edit or add freely.
//
//   id        unique; used in the URL (/grammar#id)
//   unlock    {book, unit}: visible once the student's level reaches it
//   arabicTitleFrom (optional) level at which the title shows in Arabic (default book 3)
//   title     { en, ar }
//   appliesTo (optional) rule for which word cards this section connects to:
//               pos, gender, forms:[…], hasRoot, hasPrepositions, hasPlural
//   body      blocks: { p }, { examples:[{ar,en}] }, { table:{ head:[…], rows:[[…]] } }

export const grammarSections = [
  {
    id: "script",
    unlock: { book: 1, unit: 1 },
    title: { en: "The Arabic script", ar: "الكتابة العربية" },
    body: [
      { p: "Arabic is written and read from right to left. There are no capital letters." },
      { p: "Letters change shape depending on where they sit in a word (isolated, initial, medial, final). Six letters never connect to the letter after them: ا د ذ ر ز و." },
      { p: "Mostly consonants and long vowels are written. Short vowels are small marks that are usually left out of everyday text, but they are written in learning materials, and on the word cards here." },
    ],
  },
  {
    id: "vowels",
    unlock: { book: 1, unit: 2 },
    title: { en: "Short and long vowels", ar: "الحركات والمدود" },
    body: [
      { p: "Three short vowels are written as marks above or below a letter. Three long vowels are written with letters, and last about twice as long." },
      {
        table: {
          head: ["Vowel", "Sound", "Example"],
          rows: [
            ["فَتْحة", "a", "بَ  ba"],
            ["ضَمّة", "u", "بُ  bu"],
            ["كَسْرة", "i", "بِ  bi"],
            ["ا", "aa", "با  baa"],
            ["و", "uu", "بو  buu"],
            ["ي", "ii", "بي  bii"],
          ],
        },
      },
    ],
  },
  {
    id: "sukuun",
    unlock: { book: 1, unit: 3 },
    title: { en: "Sukuun, and و / ي as consonants", ar: "السكون" },
    body: [
      { p: "The mark ْ (sukuun) means a consonant has no vowel after it." },
      { p: "و and ي can also be consonants (w and y), especially next to a sukuun or at the start of a word." },
      {
        examples: [
          { ar: "بَيْت", en: "bayt: house" },
          { ar: "مَكْتَب", en: "maktab: office" },
        ],
      },
    ],
  },
  {
    id: "shadda",
    unlock: { book: 1, unit: 5 },
    title: { en: "Shadda (doubled letters)", ar: "الشدة" },
    body: [
      { p: "The mark ّ (shadda) doubles a consonant: it is pronounced twice, the first closing the previous syllable. Any vowel on that letter is written with the shadda." },
      {
        examples: [
          { ar: "مُعَلِّم", en: "muʿallim: teacher" },
          { ar: "دَرَّسَ", en: "darrasa: he taught" },
        ],
      },
    ],
  },
  {
    id: "roots",
    unlock: { book: 2, unit: 1 },
    title: { en: "The root system", ar: "الجذر" },
    appliesTo: { hasRoot: true },
    body: [
      { p: "Most Arabic words are built from a root of usually three consonants that carries a core meaning, combined with a pattern of vowels and extra letters. Knowing the root helps you guess and remember related words." },
      {
        examples: [
          { ar: "كَتَبَ", en: "he wrote" },
          { ar: "كِتاب", en: "book" },
          { ar: "كاتِب", en: "writer" },
          { ar: "مَكْتَبة", en: "library; bookstore" },
          { ar: "مَكْتوب", en: "written" },
        ],
      },
      { p: "Click a root on any word card to see every word you know with the same root." },
    ],
  },
  {
    id: "gender",
    unlock: { book: 2, unit: 2 },
    title: { en: "Gender and the taa marbuuta", ar: "التذكير والتأنيث" },
    appliesTo: { gender: "feminine" },
    body: [
      { p: "Every noun is masculine or feminine. A final ة (taa marbuuta) usually marks a feminine noun, and is also how many feminine forms are made from masculine ones. A few feminine nouns have no ة, including many country and city names." },
      {
        examples: [
          { ar: "طالِب  ←  طالِبة", en: "student (m.)  ←  student (f.)" },
          { ar: "مَدْرَسة", en: "school (f.)" },
        ],
      },
    ],
  },
  {
    id: "definite",
    unlock: { book: 2, unit: 3 },
    title: { en: "The definite article", ar: "أداة التعريف" },
    body: [
      { p: "ال attaches to the front of a noun to mean “the”. Before 14 “sun letters” the ل is not pronounced and the next letter is doubled. Before the other letters (“moon letters”) it is pronounced normally." },
      {
        table: {
          head: ["Type", "Letters", "Example"],
          rows: [
            ["Sun", "ت ث د ذ ر ز س ش ص ض ط ظ ل ن", "الشَّمْس  ash-shams"],
            ["Moon", "ء ب ج ح خ ع غ ف ق ك م ه و ي", "الكِتاب  al-kitaab"],
          ],
        },
      },
    ],
  },
  {
    id: "prepositions",
    unlock: { book: 2, unit: 4 },
    title: { en: "Words with fixed prepositions", ar: "حروف الجر" },
    appliesTo: { hasPrepositions: true },
    body: [
      { p: "Many verbs go with a particular preposition, and the preposition can change the meaning. Learn the pair together. The word cards list the prepositions each word takes." },
      {
        examples: [
          { ar: "ذَهَبَ إِلى", en: "to go to" },
          { ar: "سَكَنَ في", en: "to live in" },
          { ar: "تَكَلَّمَ مَعَ", en: "to speak with" },
          { ar: "تَكَلَّمَ عَنْ", en: "to speak about" },
        ],
      },
    ],
  },
  {
    id: "past",
    unlock: { book: 2, unit: 5 },
    title: { en: "The past tense", ar: "الفعل الماضي" },
    appliesTo: { pos: "verb" },
    body: [
      { p: "The past tense is built from the past stem, which is the he-form (the dictionary form), plus endings for person. Shown with كَتَبَ (to write):" },
      {
        table: {
          head: ["Person", "Form"],
          rows: [
            ["he", "كَتَبَ"],
            ["she", "كَتَبَتْ"],
            ["you (m.)", "كَتَبْتَ"],
            ["you (f.)", "كَتَبْتِ"],
            ["I", "كَتَبْتُ"],
            ["they (m.)", "كَتَبُوا"],
            ["we", "كَتَبْنا"],
          ],
        },
      },
    ],
  },
  {
    id: "present",
    unlock: { book: 2, unit: 7 },
    title: { en: "The present tense", ar: "الفعل المضارع" },
    appliesTo: { pos: "verb" },
    body: [
      { p: "The present tense adds a prefix for the person before the stem, and for some persons a suffix too. The vowel after the middle letter (u, a or i) differs from verb to verb, so learn it with each verb. Shown with يَكْتُبُ (to write):" },
      {
        table: {
          head: ["Person", "Form"],
          rows: [
            ["he", "يَكْتُبُ"],
            ["she / you (m.)", "تَكْتُبُ"],
            ["you (f.)", "تَكْتُبينَ"],
            ["I", "أَكْتُبُ"],
            ["we", "نَكْتُبُ"],
            ["they (m.)", "يَكْتُبونَ"],
          ],
        },
      },
    ],
  },
  {
    id: "forms",
    unlock: { book: 2, unit: 9 },
    title: { en: "Derived verb forms (II–X)", ar: "الأوزان المزيدة" },
    appliesTo: { pos: "verb", forms: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
    body: [
      { p: "Starting from the basic Form I, Arabic adds letters or doubles a root letter to make related verbs. Each form has a typical meaning, shown here on the model root ف ع ل. Meanings are tendencies, not rules." },
      {
        table: {
          head: ["Form", "Past (he)", "Typical meaning"],
          rows: [
            ["I", "فَعَلَ", "basic meaning"],
            ["II", "فَعَّلَ", "intensive or causative (make someone do or be)"],
            ["III", "فاعَلَ", "do something to or with someone"],
            ["IV", "أَفْعَلَ", "causative"],
            ["V", "تَفَعَّلَ", "reflexive or result of II"],
            ["VI", "تَفاعَلَ", "reciprocal (do to each other)"],
            ["VII", "اِنْفَعَلَ", "passive or reflexive"],
            ["VIII", "اِفْتَعَلَ", "reflexive"],
            ["IX", "اِفْعَلَّ", "colors and defects"],
            ["X", "اِسْتَفْعَلَ", "ask for, seek, or consider"],
          ],
        },
      },
    ],
  },
  {
    id: "idafa",
    unlock: { book: 2, unit: 6 },
    title: { en: "The possessive construct (iDaafa)", ar: "الإضافة" },
    body: [
      { p: "Two nouns in a row express “X of Y”. The first noun never takes ال or tanwiin; the second noun can be definite, and is in the genitive case." },
      {
        examples: [
          { ar: "كِتابُ الطّالِبِ", en: "the student's book" },
          { ar: "مَدينةُ القاهِرةِ", en: "the city of Cairo" },
        ],
      },
    ],
  },
  {
    id: "adjectives",
    unlock: { book: 2, unit: 8 },
    title: { en: "Adjective agreement", ar: "الصفة والموصوف" },
    appliesTo: { pos: "adjective" },
    body: [
      { p: "An adjective follows its noun and agrees with it in gender, definiteness and case. A definite noun needs a definite adjective." },
      {
        examples: [
          { ar: "طالِبٌ كَبيرٌ", en: "a big student (m.)" },
          { ar: "مَدْرَسةٌ كَبيرةٌ", en: "a big school (f.)" },
          { ar: "المَدْرَسةُ الكَبيرةُ", en: "the big school" },
        ],
      },
    ],
  },
  {
    id: "imperative",
    unlock: { book: 4, unit: 3 }, // matches IMPERATIVE_LEVEL in config/books.js
    title: { en: "The imperative", ar: "فعل الأمر" },
    appliesTo: { pos: "verb" },
    body: [
      { p: "To command someone, take the you-form of the present tense, drop the prefix, and put a sukuun on the last letter. If that leaves a word starting with two consonants, add a helping alif first." },
      {
        examples: [
          { ar: "تَكْتُبُ  ←  اُكْتُبْ", en: "you write  ←  write!" },
          { ar: "تُدَرِّسُ  ←  دَرِّسْ", en: "you teach  ←  teach!" },
        ],
      },
    ],
  },
  {
    id: "masdar",
    unlock: { book: 3, unit: 1 },
    title: { en: "The verbal noun (masdar)", ar: "المصدر" },
    appliesTo: { pos: "verb" },
    body: [
      { p: "The masdar names the action (“writing”, “studying”). For Form I it is not predictable, so learn it with the verb. For the derived forms it follows a fixed pattern." },
      {
        table: {
          head: ["Form", "Masdar pattern"],
          rows: [
            ["I", "varies: كِتابة, دِراسة, ذَهاب"],
            ["II", "تَفْعيل"],
            ["III", "مُفاعَلة"],
            ["IV", "إِفْعال"],
            ["V", "تَفَعُّل"],
            ["VI", "تَفاعُل"],
            ["VII", "اِنْفِعال"],
            ["VIII", "اِفْتِعال"],
            ["X", "اِسْتِفْعال"],
          ],
        },
      },
    ],
  },
  {
    id: "participles",
    unlock: { book: 3, unit: 3 },
    title: { en: "Active and passive participles", ar: "اسم الفاعل واسم المفعول" },
    appliesTo: { pos: "verb" },
    body: [
      { p: "The active participle (ism faaʿil) means “the one who does”. The passive participle (ism mafʿuul) means “the one it is done to”. Form I uses فاعِل and مَفْعول. Derived forms start with مُـ, with a kasra before the last letter for the active participle and a fatha for the passive." },
      {
        table: {
          head: ["Form", "Active", "Passive"],
          rows: [
            ["I", "كاتِب", "مَكْتوب"],
            ["II", "مُدَرِّس", "مُدَرَّس"],
            ["III", "مُكاتِب", "مُكاتَب"],
            ["IV", "مُخْرِج", "مُخْرَج"],
          ],
        },
      },
    ],
  },
  {
    id: "plurals",
    unlock: { book: 3, unit: 5 },
    title: { en: "Plurals", ar: "جمع التكسير" },
    appliesTo: { hasPlural: true },
    body: [
      { p: "Sound plurals add an ending: ـون (or ـين) for masculine people, ـات for feminine nouns. Most other nouns use a “broken” plural, where the internal pattern changes. Broken plurals have to be learned with each noun, though the patterns repeat." },
      {
        table: {
          head: ["Pattern", "Singular", "Plural"],
          rows: [
            ["أَفْعال", "قَلَم", "أَقْلام"],
            ["أَفْعال", "اِسْم", "أَسْماء"],
            ["فُعُول", "دَرْس", "دُرُوس"],
            ["فُعُول", "بَيْت", "بُيُوت"],
            ["فُعُل", "مَدينة", "مُدُن"],
            ["مَفاعِل", "مَدْرَسة", "مَدارِس"],
          ],
        },
      },
      { p: "Plurals of things (not people) take feminine singular agreement." },
    ],
  },
];
