/** "Español / English" → texto en el idioma activo (y el otro como secundario). */
export const splitBilingual = (text: string, language: "en" | "es") => {
  const idx = text.indexOf(" / ");
  if (idx < 0) return { primary: text, secondary: undefined as string | undefined };
  const es = text.slice(0, idx).trim();
  const en = text.slice(idx + 3).trim();
  return language === "es" ? { primary: es, secondary: en } : { primary: en, secondary: es };
};
