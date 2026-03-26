const collapseGermanTransliterations = (value: string) =>
  value
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u");

export const normalizeSearchText = (value: string) =>
  collapseGermanTransliterations(
    value
      .toLowerCase()
      .trim()
      .replace(/ß/g, "ss")
      .replace(/æ/g, "ae")
      .replace(/œ/g, "oe")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ø/g, "o")
      .replace(/\s+/g, " "),
  );
