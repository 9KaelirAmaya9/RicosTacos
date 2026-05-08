import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const BURRITO_MEATS = [
  { en: "Birria",          es: "Birria" },
  { en: "Al Pastor",       es: "Al Pastor" },
  { en: "Carnitas",        es: "Carnitas" },
  { en: "Bistec Asado",    es: "Bistec Asado" },
  { en: "Pollo",           es: "Pollo" },
  { en: "Lengua",          es: "Lengua" },
  { en: "Cecina",          es: "Cecina" },
  { en: "Picadillo",       es: "Picadillo" },
  { en: "Mole",            es: "Mole" },
  { en: "Arabe",           es: "Arabe" },
  { en: "Vegetariano",     es: "Vegetariano" },
];

interface MeatSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMeat: (meat: string) => void;
  itemName: string;
}

export const MeatSelectionDialog = ({
  open,
  onOpenChange,
  onSelectMeat,
  itemName,
}: MeatSelectionDialogProps) => {
  const [selectedMeat, setSelectedMeat] = useState("");
  const { language } = useLanguage();

  const handleConfirm = () => {
    if (!selectedMeat) return;
    onSelectMeat(selectedMeat);
    setSelectedMeat("");
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setSelectedMeat("");
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {language === "es" ? "Elige tu Relleno" : "Choose Your Filling"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          <p className="text-sm text-muted-foreground">
            {language === "es"
              ? `Selecciona el relleno para tu ${itemName}:`
              : `Select the filling for your ${itemName}:`}
          </p>

          <RadioGroup value={selectedMeat} onValueChange={setSelectedMeat}>
            <div className="space-y-2">
              {BURRITO_MEATS.map((meat) => (
                <div
                  key={meat.en}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedMeat(meat.en)}
                >
                  <RadioGroupItem value={meat.en} id={`meat-${meat.en}`} />
                  <Label htmlFor={`meat-${meat.en}`} className="flex-1 cursor-pointer font-medium">
                    {language === "es" ? meat.es : meat.en}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 h-11">
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedMeat} className="flex-1 h-11">
            {language === "es" ? "Agregar al Carrito" : "Add to Cart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
