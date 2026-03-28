import type { Locale } from "@/locales";

type TravelerCityKey =
  | "zurich"
  | "lucerne"
  | "lausanne"
  | "madrid"
  | "barcelona"
  | "valencia"
  | "belgrade"
  | "noviSad"
  | "paris"
  | "lyon"
  | "lisbon"
  | "porto"
  | "rome"
  | "milan"
  | "bilbao"
  | "sanSebastian";

type TravelerCountryKey = "switzerland" | "spain" | "serbia" | "france" | "portugal" | "italy";

export interface TravelerPlace {
  city: TravelerCityKey;
  country: TravelerCountryKey;
}

export interface Traveler {
  id: string;
  name: string;
  avatar: string;
  origin: TravelerPlace;
  destination: TravelerPlace;
  date: string;
  capacity: string;
  rating: number;
  trips: number;
  isPublic: boolean;
}

const CITY_NAMES: Record<TravelerCityKey, Record<Locale, string>> = {
  zurich: { es: "Zúrich", en: "Zurich", de: "Zürich", sr: "Cirih" },
  lucerne: { es: "Lucerna", en: "Lucerne", de: "Luzern", sr: "Lucern" },
  lausanne: { es: "Lausana", en: "Lausanne", de: "Lausanne", sr: "Lozana" },
  madrid: { es: "Madrid", en: "Madrid", de: "Madrid", sr: "Madrid" },
  barcelona: { es: "Barcelona", en: "Barcelona", de: "Barcelona", sr: "Barselona" },
  valencia: { es: "Valencia", en: "Valencia", de: "Valencia", sr: "Valensija" },
  belgrade: { es: "Belgrado", en: "Belgrade", de: "Belgrad", sr: "Beograd" },
  noviSad: { es: "Novi Sad", en: "Novi Sad", de: "Novi Sad", sr: "Novi Sad" },
  paris: { es: "París", en: "Paris", de: "Paris", sr: "Pariz" },
  lyon: { es: "Lyon", en: "Lyon", de: "Lyon", sr: "Lion" },
  lisbon: { es: "Lisboa", en: "Lisbon", de: "Lissabon", sr: "Lisabon" },
  porto: { es: "Oporto", en: "Porto", de: "Porto", sr: "Porto" },
  rome: { es: "Roma", en: "Rome", de: "Rom", sr: "Rim" },
  milan: { es: "Milán", en: "Milan", de: "Mailand", sr: "Milano" },
  bilbao: { es: "Bilbao", en: "Bilbao", de: "Bilbao", sr: "Bilbao" },
  sanSebastian: { es: "San Sebastián", en: "San Sebastian", de: "San Sebastián", sr: "San Sebastijan" },
};

const COUNTRY_NAMES: Record<TravelerCountryKey, Record<Locale, string>> = {
  switzerland: { es: "Suiza", en: "Switzerland", de: "Schweiz", sr: "Švajcarska" },
  spain: { es: "España", en: "Spain", de: "Spanien", sr: "Spanija" },
  serbia: { es: "Serbia", en: "Serbia", de: "Serbien", sr: "Srbija" },
  france: { es: "Francia", en: "France", de: "Frankreich", sr: "Francuska" },
  portugal: { es: "Portugal", en: "Portugal", de: "Portugal", sr: "Portugal" },
  italy: { es: "Italia", en: "Italy", de: "Italien", sr: "Italija" },
};

export const formatTravelerPlace = (place: TravelerPlace, locale: Locale) => {
  return `${CITY_NAMES[place.city][locale]}, ${COUNTRY_NAMES[place.country][locale]}`;
};

export const MOCK_TRAVELERS: Traveler[] = [
  {
    id: "1",
    name: "Nikola Jovanovic",
    avatar: "",
    origin: { city: "zurich", country: "switzerland" },
    destination: { city: "belgrade", country: "serbia" },
    date: "2026-04-15",
    capacity: "10 kg",
    rating: 4.8,
    trips: 23,
    isPublic: true,
  },
  {
    id: "2",
    name: "Anna Meier",
    avatar: "",
    origin: { city: "lucerne", country: "switzerland" },
    destination: { city: "madrid", country: "spain" },
    date: "2026-04-20",
    capacity: "5 kg",
    rating: 4.9,
    trips: 45,
    isPublic: true,
  },
  {
    id: "3",
    name: "Claire Dubois",
    avatar: "",
    origin: { city: "lausanne", country: "switzerland" },
    destination: { city: "lisbon", country: "portugal" },
    date: "2026-05-01",
    capacity: "8 kg",
    rating: 4.7,
    trips: 12,
    isPublic: true,
  },
  {
    id: "4",
    name: "Pedro Sanchez",
    avatar: "",
    origin: { city: "lisbon", country: "portugal" },
    destination: { city: "porto", country: "portugal" },
    date: "2026-04-25",
    capacity: "15 kg",
    rating: 4.6,
    trips: 8,
    isPublic: true,
  },
  {
    id: "5",
    name: "Laura Diaz",
    avatar: "",
    origin: { city: "rome", country: "italy" },
    destination: { city: "milan", country: "italy" },
    date: "2026-05-10",
    capacity: "7 kg",
    rating: 5,
    trips: 31,
    isPublic: true,
  },
  {
    id: "6",
    name: "Roberto Fernandez",
    avatar: "",
    origin: { city: "bilbao", country: "spain" },
    destination: { city: "sanSebastian", country: "spain" },
    date: "2026-04-28",
    capacity: "12 kg",
    rating: 4.5,
    trips: 19,
    isPublic: true,
  },
];
