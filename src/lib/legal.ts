export const LEGAL_LAST_UPDATED = "27 marzo 2026";

export const LEGAL_LINKS = {
  terms: "/legal/agb",
  privacy: "/legal/privacy",
  disclaimer: "/legal/disclaimer",
  imprint: "/legal/impressum",
} as const;

export const LEGAL_COMPANY = {
  brandName: "Cargoo",
  legalEntity: "Jobsaun",
  representative: "",
  street: "st.Karlistrasse 3",
  postalCodeCity: "6004 Luzern",
  country: "Suiza",
  email: "jobsaun20@gmail.com",
  phone: "",
  commercialRegister: "",
  uid: "",
} as const;

export const interpolateLegalText = (value: string) =>
  value.replace(/\{(\w+)\}/g, (_match, key: keyof typeof LEGAL_COMPANY) => LEGAL_COMPANY[key] ?? "");
