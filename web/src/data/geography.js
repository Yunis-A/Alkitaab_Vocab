// Places for the map game (21). `id` matches the shapes in menaMap.js.
// capitalEn/capitalAr are null where the capital is disputed, so those
// places are only asked by name, never by capital.
//
// Arabic spellings are chosen so that no prompt is ambiguous:
//  - Oman (عُمان) vs Amman (عَمّان) carry diacritics.
//  - Algiers and Tunis use the common "…العاصمة" form so they differ from
//    the country names الجزائر and تونس.

export const geoCountries = [
  { id: "EGY", nameEn: "Egypt", nameAr: "مصر", capitalEn: "Cairo", capitalAr: "القاهرة" },
  { id: "SAU", nameEn: "Saudi Arabia", nameAr: "السعودية", capitalEn: "Riyadh", capitalAr: "الرياض" },
  { id: "ARE", nameEn: "United Arab Emirates", nameAr: "الإمارات", capitalEn: "Abu Dhabi", capitalAr: "أبوظبي" },
  { id: "QAT", nameEn: "Qatar", nameAr: "قطر", capitalEn: "Doha", capitalAr: "الدوحة" },
  { id: "BHR", nameEn: "Bahrain", nameAr: "البحرين", capitalEn: "Manama", capitalAr: "المنامة" },
  { id: "KWT", nameEn: "Kuwait", nameAr: "الكويت", capitalEn: "Kuwait City", capitalAr: "مدينة الكويت" },
  { id: "OMN", nameEn: "Oman", nameAr: "عُمان", capitalEn: "Muscat", capitalAr: "مسقط" },
  { id: "YEM", nameEn: "Yemen", nameAr: "اليمن", capitalEn: "Sanaa", capitalAr: "صنعاء" },
  { id: "IRQ", nameEn: "Iraq", nameAr: "العراق", capitalEn: "Baghdad", capitalAr: "بغداد" },
  { id: "SYR", nameEn: "Syria", nameAr: "سوريا", capitalEn: "Damascus", capitalAr: "دمشق" },
  { id: "LBN", nameEn: "Lebanon", nameAr: "لبنان", capitalEn: "Beirut", capitalAr: "بيروت" },
  { id: "JOR", nameEn: "Jordan", nameAr: "الأردن", capitalEn: "Amman", capitalAr: "عَمّان" },
  { id: "PSE", nameEn: "Palestine", nameAr: "فلسطين", capitalEn: null, capitalAr: null },
  { id: "ISR", nameEn: "Israel", nameAr: "إسرائيل", capitalEn: null, capitalAr: null },
  { id: "MAR", nameEn: "Morocco", nameAr: "المغرب", capitalEn: "Rabat", capitalAr: "الرباط" },
  { id: "MRT", nameEn: "Mauritania", nameAr: "موريتانيا", capitalEn: "Nouakchott", capitalAr: "نواكشوط" },
  { id: "DZA", nameEn: "Algeria", nameAr: "الجزائر", capitalEn: "Algiers", capitalAr: "الجزائر العاصمة" },
  { id: "TUN", nameEn: "Tunisia", nameAr: "تونس", capitalEn: "Tunis", capitalAr: "تونس العاصمة" },
  { id: "LBY", nameEn: "Libya", nameAr: "ليبيا", capitalEn: "Tripoli", capitalAr: "طرابلس" },
  { id: "SDN", nameEn: "Sudan", nameAr: "السودان", capitalEn: "Khartoum", capitalAr: "الخرطوم" },
  { id: "SOM", nameEn: "Somalia", nameAr: "الصومال", capitalEn: "Mogadishu", capitalAr: "مقديشو" },
];
