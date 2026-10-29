export const site = {
  name: "Carlow Islamic Cultural Centre",
  shortName: "Carlow Masjid",
  legalName: "Carlow Islamic Cultural Centre CLG",
  url: "https://carlowmasjid.ie",
  description:
    "A welcoming place for prayer, learning and community in Carlow Town, Ireland.",
  email: "info@carlowmasjid.ie",
  phoneDisplay: "087 091 3763",
  phoneHref: "tel:+353870913763",
  whatsappUrl:
    "https://wa.me/353870913763?text=As-salamu%20alaikum.%20I%20am%20contacting%20Carlow%20Masjid.",
  address: {
    street: "14A Carlow Shopping Centre",
    locality: "Carlow",
    postalCode: "R93 A0E0",
    country: "Ireland",
  },
  directionsUrl:
    "https://www.google.com/maps/search/?api=1&query=14A%20Carlow%20Shopping%20Centre%2C%20Carlow%2C%20R93%20A0E0",
  mapEmbedUrl:
    "https://www.google.com/maps?q=14A%20Carlow%20Shopping%20Centre%2C%20Carlow%2C%20R93%20A0E0&output=embed",
  formAction: "https://formspree.io/f/mdornnkn",
  googleAnalyticsId: "G-57NJ9XEM85",
  companyNumber: "541774",
  registeredCharityNumber: "20200211",
} as const;

export const navigation = [
  { label: "Prayer times", href: "/prayer-times.html" },
  { label: "What's on", href: "/activities.html" },
  { label: "Madrasa", href: "/madrasa.html" },
  { label: "Mosque project", href: "/projects.html" },
  { label: "Visit", href: "/contact.html" },
  { label: "About", href: "/about.html" },
] as const;

export const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/CarlowCICC/",
  },
  {
    label: "GitHub",
    href: "https://github.com/carlowmasjidcicc",
  },
] as const;

export const donationLinks = {
  goFundMe: "https://gofund.me/6ef76ae9",
  sumUp: "https://pay.sumup.com/b2c/Q7S4QJH2",
} as const;

export const bankDetails = {
  accountName: "Carlow Islamic Cultural Centre",
  bankName: "AIB Carlow",
  accountNumber: "44097381",
  sortCode: "93-31-04",
  iban: "IE82AIBK93310444097381",
  bic: "AIBKIE2D",
} as const;

export const prayerInformation = {
  status: "Verified timetable published",
  summary:
    "Daily prayer start times and sunrise are available from October 2026 through December 2027.",
  detail:
    "The supplied timetable does not include jama’ah or Jumu’ah times. Contact the centre before travelling if you need congregation details.",
} as const;

export const programmes = [
  {
    name: "Hadith from Riyad as-Salihin",
    schedule: "Daily after Fajr",
    audience: "Everyone",
  },
  {
    name: "Men's Qur'an class",
    schedule: "Tuesday after Isha",
    audience: "Men",
  },
  {
    name: "Women's Qur'an class",
    schedule: "Wednesday at 10:30am",
    audience: "Women",
  },
  {
    name: "Durood / Salat 'ala an-Nabi",
    schedule: "Thursday after Asr",
    audience: "Everyone",
  },
  {
    name: "Tafseer of the Qur'an",
    schedule: "Friday evening — contact us to confirm the time",
    audience: "Everyone",
  },
] as const;

export const services = [
  {
    title: "Worship",
    description:
      "Five daily prayers, Jumu'ah, Ramadan worship and Eid gatherings.",
    icon: "crescent",
  },
  {
    title: "Learning",
    description:
      "Children's madrasa, Qur'an learning, tafseer and community lectures.",
    icon: "book",
  },
  {
    title: "Community support",
    description:
      "Marriage, funeral support, counselling and community connection.",
    icon: "people",
  },
] as const;
