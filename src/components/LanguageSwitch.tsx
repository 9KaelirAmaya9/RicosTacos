import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";

export const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();
  const [announcement, setAnnouncement] = useState("");

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => { setLanguage("en"); setAnnouncement("Language changed to English"); }}
        className="text-xs font-medium px-3 h-8"
      >
        EN
      </Button>
      <Button
        variant={language === "es" ? "default" : "ghost"}
        size="sm"
        onClick={() => { setLanguage("es"); setAnnouncement("Idioma cambiado a español"); }}
        className="text-xs font-medium px-3 h-8"
      >
        ES
      </Button>
      <span className="sr-only" aria-live="polite">{announcement}</span>
    </div>
  );
};
