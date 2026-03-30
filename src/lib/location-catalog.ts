import type { Locale } from "@/locales";
import { normalizeSearchText } from "@/lib/search-normalization";

export const ELIGIBLE_COUNTRY_CODES = [
  "AD",
  "AL",
  "AT",
  "BE",
  "BG",
  "BA",
  "CY",
  "DK",
  "EE",
  "FI",
  "HR",
  "CZ",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LI",
  "LT",
  "LU",
  "LV",
  "MD",
  "MC",
  "ME",
  "MT",
  "NL",
  "MK",
  "NO",
  "PL",
  "PT",
  "RO",
  "RS",
  "SE",
  "SK",
  "SI",
  "ES",
  "CH",
  "TR",
  "UA",
  "GB",
] as const;

export type CountryCode = (typeof ELIGIBLE_COUNTRY_CODES)[number];
export type CityId = string;

type LocalizedNames = {
  en: string;
  es?: string;
  de?: string;
  sr?: string;
};

type CityDefinition = {
  id: CityId;
  countryCode: CountryCode;
  names: LocalizedNames;
  aliases?: string[];
};

const CITY_DEFINITIONS: CityDefinition[] = [
  { id: "zurich", countryCode: "CH", names: { en: "Zurich", es: "Zúrich", de: "Zürich", sr: "Cirih" } },
  { id: "geneva", countryCode: "CH", names: { en: "Geneva", es: "Ginebra", de: "Genf", sr: "Ženeva" } },
  { id: "basel", countryCode: "CH", names: { en: "Basel", es: "Basilea", de: "Basel", sr: "Bazel" } },
  { id: "bern", countryCode: "CH", names: { en: "Bern", es: "Berna", de: "Bern", sr: "Bern" } },
  { id: "lausanne", countryCode: "CH", names: { en: "Lausanne", es: "Lausana", de: "Lausanne", sr: "Lozana" } },
  { id: "lucerne", countryCode: "CH", names: { en: "Lucerne", es: "Lucerna", de: "Luzern", sr: "Lucern" } },
  { id: "st-gallen", countryCode: "CH", names: { en: "St. Gallen", es: "San Galo", de: "St. Gallen", sr: "Sankt Galen" } },
  { id: "lugano", countryCode: "CH", names: { en: "Lugano", es: "Lugano", de: "Lugano", sr: "Lugano" } },

  { id: "berlin", countryCode: "DE", names: { en: "Berlin", es: "Berlín", de: "Berlin", sr: "Berlin" } },
  { id: "hamburg", countryCode: "DE", names: { en: "Hamburg" } },
  { id: "munich", countryCode: "DE", names: { en: "Munich", es: "Múnich", de: "München", sr: "Minhen" }, aliases: ["Muenchen"] },
  { id: "cologne", countryCode: "DE", names: { en: "Cologne", es: "Colonia", de: "Köln", sr: "Keln" }, aliases: ["Koeln"] },
  { id: "frankfurt", countryCode: "DE", names: { en: "Frankfurt" } },
  { id: "stuttgart", countryCode: "DE", names: { en: "Stuttgart" } },
  { id: "dusseldorf", countryCode: "DE", names: { en: "Düsseldorf", es: "Düsseldorf", de: "Düsseldorf", sr: "Diseldorf" }, aliases: ["Duesseldorf"] },
  { id: "leipzig", countryCode: "DE", names: { en: "Leipzig" } },
  { id: "dortmund", countryCode: "DE", names: { en: "Dortmund" } },
  { id: "bremen", countryCode: "DE", names: { en: "Bremen" } },
  { id: "dresden", countryCode: "DE", names: { en: "Dresden" } },
  { id: "hanover", countryCode: "DE", names: { en: "Hanover", es: "Hannover", de: "Hannover", sr: "Hanover" } },
  { id: "nuremberg", countryCode: "DE", names: { en: "Nuremberg", es: "Núremberg", de: "Nürnberg", sr: "Nirnberg" }, aliases: ["Nuernberg"] },

  { id: "zagreb", countryCode: "HR", names: { en: "Zagreb", es: "Zagreb", de: "Zagreb", sr: "Zagreb" } },
  { id: "split", countryCode: "HR", names: { en: "Split" } },
  { id: "rijeka", countryCode: "HR", names: { en: "Rijeka" } },
  { id: "osijek", countryCode: "HR", names: { en: "Osijek" } },
  { id: "zadar", countryCode: "HR", names: { en: "Zadar" } },
  { id: "dubrovnik", countryCode: "HR", names: { en: "Dubrovnik" } },
  { id: "pula", countryCode: "HR", names: { en: "Pula" } },
  { id: "karlovac", countryCode: "HR", names: { en: "Karlovac" } },
  { id: "slavonski-brod", countryCode: "HR", names: { en: "Slavonski Brod" } },
  { id: "varazdin", countryCode: "HR", names: { en: "Varaždin", es: "Varaždin", de: "Varaždin", sr: "Varaždin" } },

  { id: "madrid", countryCode: "ES", names: { en: "Madrid" } },
  { id: "barcelona", countryCode: "ES", names: { en: "Barcelona" } },
  { id: "valencia", countryCode: "ES", names: { en: "Valencia" } },
  { id: "seville", countryCode: "ES", names: { en: "Seville", es: "Sevilla", de: "Sevilla", sr: "Sevilja" } },
  { id: "malaga", countryCode: "ES", names: { en: "Malaga", es: "Málaga", de: "Málaga", sr: "Malaga" } },
  { id: "bilbao", countryCode: "ES", names: { en: "Bilbao" } },
  { id: "zaragoza", countryCode: "ES", names: { en: "Zaragoza" } },
  { id: "alicante", countryCode: "ES", names: { en: "Alicante" } },
  { id: "murcia", countryCode: "ES", names: { en: "Murcia" } },
  { id: "granada", countryCode: "ES", names: { en: "Granada" } },
  { id: "san-sebastian", countryCode: "ES", names: { en: "San Sebastian", es: "San Sebastián", de: "San Sebastián", sr: "San Sebastijan" } },
  { id: "cadiz", countryCode: "ES", names: { en: "Cadiz", es: "Cádiz", de: "Cádiz", sr: "Kadiz" } },

  { id: "lisbon", countryCode: "PT", names: { en: "Lisbon", es: "Lisboa", de: "Lissabon", sr: "Lisabon" } },
  { id: "porto", countryCode: "PT", names: { en: "Porto" } },
  { id: "faro", countryCode: "PT", names: { en: "Faro" } },
  { id: "braga", countryCode: "PT", names: { en: "Braga" } },
  { id: "coimbra", countryCode: "PT", names: { en: "Coimbra", es: "Coímbra", de: "Coimbra", sr: "Koimbra" } },

  { id: "milan", countryCode: "IT", names: { en: "Milan", es: "Milán", de: "Mailand", sr: "Milano" } },
  { id: "rome", countryCode: "IT", names: { en: "Rome", es: "Roma", de: "Rom", sr: "Rim" } },
  { id: "naples", countryCode: "IT", names: { en: "Naples", es: "Nápoles", de: "Neapel", sr: "Napulj" } },
  { id: "turin", countryCode: "IT", names: { en: "Turin", es: "Turín", de: "Turin", sr: "Torino" } },
  { id: "bologna", countryCode: "IT", names: { en: "Bologna", es: "Bolonia", de: "Bologna", sr: "Bolonja" } },
  { id: "florence", countryCode: "IT", names: { en: "Florence", es: "Florencia", de: "Florenz", sr: "Firenca" } },
  { id: "venice", countryCode: "IT", names: { en: "Venice", es: "Venecia", de: "Venedig", sr: "Venecija" } },
  { id: "bari", countryCode: "IT", names: { en: "Bari" } },
  { id: "palermo", countryCode: "IT", names: { en: "Palermo" } },
  { id: "trieste", countryCode: "IT", names: { en: "Trieste" } },

  { id: "belgrade", countryCode: "RS", names: { en: "Belgrade", es: "Belgrado", de: "Belgrad", sr: "Beograd" } },
  { id: "novi-sad", countryCode: "RS", names: { en: "Novi Sad" } },
  { id: "nis", countryCode: "RS", names: { en: "Niš", es: "Niš", de: "Niš", sr: "Niš" }, aliases: ["Nis"] },
  { id: "kragujevac", countryCode: "RS", names: { en: "Kragujevac" } },
  { id: "subotica", countryCode: "RS", names: { en: "Subotica", es: "Subótica", de: "Subotica", sr: "Subotica" } },

  { id: "paris", countryCode: "FR", names: { en: "Paris", es: "París", de: "Paris", sr: "Pariz" } },
  { id: "lyon", countryCode: "FR", names: { en: "Lyon" } },
  { id: "marseille", countryCode: "FR", names: { en: "Marseille", es: "Marsella", de: "Marseille", sr: "Marselj" } },
  { id: "toulouse", countryCode: "FR", names: { en: "Toulouse", es: "Toulouse", de: "Toulouse", sr: "Tuluz" } },
  { id: "nice", countryCode: "FR", names: { en: "Nice", es: "Niza", de: "Nizza", sr: "Nica" } },
  { id: "bordeaux", countryCode: "FR", names: { en: "Bordeaux", es: "Burdeos", de: "Bordeaux", sr: "Bordo" } },
  { id: "strasbourg", countryCode: "FR", names: { en: "Strasbourg", es: "Estrasburgo", de: "Straßburg", sr: "Strazbur" }, aliases: ["Strassburg"] },
  { id: "lille", countryCode: "FR", names: { en: "Lille" } },
  { id: "nantes", countryCode: "FR", names: { en: "Nantes" } },

  { id: "vienna", countryCode: "AT", names: { en: "Vienna", es: "Viena", de: "Wien", sr: "Beč" } },
  { id: "graz", countryCode: "AT", names: { en: "Graz" } },
  { id: "linz", countryCode: "AT", names: { en: "Linz" } },
  { id: "salzburg", countryCode: "AT", names: { en: "Salzburg", es: "Salzburgo", de: "Salzburg", sr: "Salcburg" } },
  { id: "innsbruck", countryCode: "AT", names: { en: "Innsbruck" } },

  { id: "ljubljana", countryCode: "SI", names: { en: "Ljubljana", es: "Liubliana", de: "Ljubljana", sr: "Ljubljana" } },
  { id: "maribor", countryCode: "SI", names: { en: "Maribor" } },
  { id: "koper", countryCode: "SI", names: { en: "Koper" } },
  { id: "celje", countryCode: "SI", names: { en: "Celje" } },

  { id: "sarajevo", countryCode: "BA", names: { en: "Sarajevo" } },
  { id: "banja-luka", countryCode: "BA", names: { en: "Banja Luka" } },
  { id: "mostar", countryCode: "BA", names: { en: "Mostar" } },
  { id: "tuzla", countryCode: "BA", names: { en: "Tuzla" } },

  { id: "podgorica", countryCode: "ME", names: { en: "Podgorica" } },
  { id: "budva", countryCode: "ME", names: { en: "Budva" } },
  { id: "bar", countryCode: "ME", names: { en: "Bar" } },
  { id: "niksic", countryCode: "ME", names: { en: "Nikšić", es: "Nikšić", de: "Nikšić", sr: "Nikšić" }, aliases: ["Niksic"] },

  { id: "tirana", countryCode: "AL", names: { en: "Tirana", es: "Tirana", de: "Tirana", sr: "Tirana" } },
  { id: "durres", countryCode: "AL", names: { en: "Durrës", es: "Durrës", de: "Durrës", sr: "Drač" }, aliases: ["Durres"] },
  { id: "shkoder", countryCode: "AL", names: { en: "Shkodër", es: "Shkodër", de: "Shkodër", sr: "Skadar" }, aliases: ["Shkoder"] },
  { id: "vlore", countryCode: "AL", names: { en: "Vlorë", es: "Vlorë", de: "Vlora", sr: "Valona" }, aliases: ["Vlore"] },

  { id: "skopje", countryCode: "MK", names: { en: "Skopje", es: "Skopie", de: "Skopje", sr: "Skoplje" } },
  { id: "bitola", countryCode: "MK", names: { en: "Bitola", es: "Bitola", de: "Bitola", sr: "Bitolj" } },
  { id: "ohrid", countryCode: "MK", names: { en: "Ohrid" } },
  { id: "tetovo", countryCode: "MK", names: { en: "Tetovo", es: "Tetovo", de: "Tetovo", sr: "Tetovo" } },

  { id: "amsterdam", countryCode: "NL", names: { en: "Amsterdam" } },
  { id: "rotterdam", countryCode: "NL", names: { en: "Rotterdam" } },
  { id: "the-hague", countryCode: "NL", names: { en: "The Hague", es: "La Haya", de: "Den Haag", sr: "Hag" } },
  { id: "utrecht", countryCode: "NL", names: { en: "Utrecht" } },
  { id: "eindhoven", countryCode: "NL", names: { en: "Eindhoven" } },

  { id: "brussels", countryCode: "BE", names: { en: "Brussels", es: "Bruselas", de: "Brüssel", sr: "Brisel" } },
  { id: "antwerp", countryCode: "BE", names: { en: "Antwerp", es: "Amberes", de: "Antwerpen", sr: "Antverpen" } },
  { id: "ghent", countryCode: "BE", names: { en: "Ghent", es: "Gante", de: "Gent", sr: "Gent" } },
  { id: "liege", countryCode: "BE", names: { en: "Liège", es: "Lieja", de: "Lüttich", sr: "Lijež" }, aliases: ["Liege", "Luettich"] },

  { id: "luxembourg-city", countryCode: "LU", names: { en: "Luxembourg City", es: "Luxemburgo", de: "Luxemburg", sr: "Luksemburg" } },

  { id: "warsaw", countryCode: "PL", names: { en: "Warsaw", es: "Varsovia", de: "Warschau", sr: "Varšava" } },
  { id: "krakow", countryCode: "PL", names: { en: "Krakow", es: "Cracovia", de: "Krakau", sr: "Krakov" } },
  { id: "wroclaw", countryCode: "PL", names: { en: "Wrocław", es: "Wrocław", de: "Breslau", sr: "Vroclav" }, aliases: ["Wroclaw", "Breslau"] },
  { id: "gdansk", countryCode: "PL", names: { en: "Gdańsk", es: "Gdansk", de: "Danzig", sr: "Gdanjsk" }, aliases: ["Gdansk", "Danzig"] },
  { id: "poznan", countryCode: "PL", names: { en: "Poznań", es: "Poznan", de: "Posen", sr: "Poznanj" }, aliases: ["Poznan", "Posen"] },

  { id: "prague", countryCode: "CZ", names: { en: "Prague", es: "Praga", de: "Prag", sr: "Prag" } },
  { id: "brno", countryCode: "CZ", names: { en: "Brno" } },
  { id: "ostrava", countryCode: "CZ", names: { en: "Ostrava" } },
  { id: "plzen", countryCode: "CZ", names: { en: "Plzeň", es: "Pilsen", de: "Pilsen", sr: "Plzenj" }, aliases: ["Plzen", "Pilsen"] },

  { id: "budapest", countryCode: "HU", names: { en: "Budapest", es: "Budapest", de: "Budapest", sr: "Budimpešta" } },
  { id: "debrecen", countryCode: "HU", names: { en: "Debrecen" } },
  { id: "szeged", countryCode: "HU", names: { en: "Szeged" } },

  { id: "bucharest", countryCode: "RO", names: { en: "Bucharest", es: "Bucarest", de: "Bukarest", sr: "Bukurešt" } },
  { id: "cluj-napoca", countryCode: "RO", names: { en: "Cluj-Napoca", es: "Cluj-Napoca", de: "Klausenburg", sr: "Kluž-Napoka" }, aliases: ["Klausenburg"] },
  { id: "timisoara", countryCode: "RO", names: { en: "Timișoara", es: "Timisoara", de: "Temeswar", sr: "Temišvar" }, aliases: ["Timisoara", "Temeswar"] },
  { id: "iasi", countryCode: "RO", names: { en: "Iași", es: "Iasi", de: "Jassy", sr: "Jaši" }, aliases: ["Iasi", "Jassy"] },
  { id: "constanta", countryCode: "RO", names: { en: "Constanța", es: "Constanza", de: "Konstanza", sr: "Konstanca" }, aliases: ["Constanta"] },

  { id: "sofia", countryCode: "BG", names: { en: "Sofia", es: "Sofía", de: "Sofia", sr: "Sofija" } },
  { id: "plovdiv", countryCode: "BG", names: { en: "Plovdiv" } },
  { id: "varna", countryCode: "BG", names: { en: "Varna" } },
  { id: "burgas", countryCode: "BG", names: { en: "Burgas" } },
];

const CITY_BY_ID = new Map(CITY_DEFINITIONS.map((city) => [city.id, city]));
const INTL_LOCALE_BY_APP_LOCALE: Record<Locale, string> = {
  es: "es",
  en: "en",
  de: "de",
  sr: "sr-Latn",
};

const getCountryDisplayNames = (locale: Locale) => {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames === "undefined") {
    return null;
  }

  try {
    return new Intl.DisplayNames([INTL_LOCALE_BY_APP_LOCALE[locale]], { type: "region" });
  } catch {
    return null;
  }
};

const getLocalizedName = (names: LocalizedNames, locale: Locale) => names[locale] ?? names.en;

const uniqueTerms = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

export const getCountryLabel = (countryCode: CountryCode, locale: Locale) => {
  const displayNames = getCountryDisplayNames(locale);
  return displayNames?.of(countryCode) ?? countryCode;
};

export const getCountryOptions = (locale: Locale) =>
  ELIGIBLE_COUNTRY_CODES.map((countryCode) => ({
    code: countryCode,
    label: getCountryLabel(countryCode, locale),
  }));

const getCountryCandidateLabels = (countryCode: CountryCode) =>
  uniqueTerms([
    countryCode,
    ...(["es", "en", "de", "sr"] as const).map((locale) => getCountryLabel(countryCode, locale)),
  ]);

export const resolveCountryCodeFromInput = (value: string) => {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue) {
    return null;
  }

  const matchingCountry = ELIGIBLE_COUNTRY_CODES.find((countryCode) =>
    getCountryCandidateLabels(countryCode).some((candidate) => normalizeSearchText(candidate) === normalizedValue),
  );

  return matchingCountry ?? null;
};

export const getCityById = (cityId: CityId | null | undefined) => (cityId ? CITY_BY_ID.get(cityId) ?? null : null);

export const getCityLabel = (cityId: CityId | null | undefined, locale: Locale) => {
  const city = getCityById(cityId);
  return city ? getLocalizedName(city.names, locale) : "";
};

export const getCityCountryCode = (cityId: CityId | null | undefined) => getCityById(cityId)?.countryCode ?? null;

export const getCityOptionLabel = (cityId: CityId, locale: Locale) => {
  const city = getCityById(cityId);
  if (!city) {
    return "";
  }

  return `${getLocalizedName(city.names, locale)}, ${getCountryLabel(city.countryCode, locale)}`;
};

export const getCityOptions = (locale: Locale, countryCode?: CountryCode | null) =>
  CITY_DEFINITIONS.filter((city) => !countryCode || city.countryCode === countryCode).map((city) => ({
    id: city.id,
    countryCode: city.countryCode,
    cityLabel: getLocalizedName(city.names, locale),
    label: getCityOptionLabel(city.id, locale),
  }));

const getCityCandidateLabels = (city: CityDefinition) =>
  uniqueTerms([
    ...Object.values(city.names),
    ...(city.aliases ?? []),
    ...(["es", "en", "de", "sr"] as const).flatMap((locale) => [
      getLocalizedName(city.names, locale),
      `${getLocalizedName(city.names, locale)}, ${getCountryLabel(city.countryCode, locale)}`,
    ]),
  ]);

export const resolveCityIdFromInput = (value: string, countryCode?: CountryCode | null) => {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue) {
    return null;
  }

  const matchingCity = CITY_DEFINITIONS.find((city) => {
    if (countryCode && city.countryCode !== countryCode) {
      return false;
    }

    return getCityCandidateLabels(city).some((candidate) => normalizeSearchText(candidate) === normalizedValue);
  });

  return matchingCity?.id ?? null;
};

export const getCitySearchTerms = (cityId: CityId | null | undefined) => {
  const city = getCityById(cityId);
  if (!city) {
    return [];
  }

  return uniqueTerms([...Object.values(city.names), ...(city.aliases ?? [])]).map((term) => normalizeSearchText(term));
};

export const getLocalizedTripCityLabel = (cityId: CityId | null | undefined, fallbackLabel: string, locale: Locale) => {
  return getCityLabel(cityId, locale) || fallbackLabel;
};

export const localizeLocationText = (value: string, locale: Locale) => {
  const resolvedCityId = resolveCityIdFromInput(value);
  if (resolvedCityId) {
    return getCityLabel(resolvedCityId, locale) || value;
  }

  const resolvedCountryCode = resolveCountryCodeFromInput(value);
  if (resolvedCountryCode) {
    return getCountryLabel(resolvedCountryCode, locale);
  }

  return value;
};

export const getLocalizedCountryCoverageLabel = (
  countryCode: CountryCode | null | undefined,
  locale: Locale,
  formatter: (countryLabel: string) => string,
  fallbackLabel: string,
) => {
  if (!countryCode) {
    return fallbackLabel;
  }

  return formatter(getCountryLabel(countryCode, locale));
};

export const getTripRouteLabels = (
  trip: {
    coverageMode?: string | null;
    origin: string;
    destination: string;
    originCityId?: CityId | null;
    destinationCityId?: CityId | null;
    originCountryCode?: CountryCode | null;
    destinationCountryCode?: CountryCode | null;
  },
  locale: Locale,
  formatter: {
    anyCityInCountry: (countryLabel: string) => string;
  },
) => {
  if (trip.coverageMode === "country_flexible") {
    return {
      originLabel: getLocalizedCountryCoverageLabel(trip.originCountryCode, locale, formatter.anyCityInCountry, trip.origin),
      destinationLabel: getLocalizedCountryCoverageLabel(trip.destinationCountryCode, locale, formatter.anyCityInCountry, trip.destination),
    };
  }

  return {
    originLabel: getLocalizedTripCityLabel(trip.originCityId, trip.origin, locale),
    destinationLabel: getLocalizedTripCityLabel(trip.destinationCityId, trip.destination, locale),
  };
};
