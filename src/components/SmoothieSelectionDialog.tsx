import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const SMOOTHIE_FLAVORS = [
  { en: "Chocomilk", es: "Chocomilk" },
  { en: "Mamey",     es: "Mamey" },
  { en: "Fresa",     es: "Fresa" },
  { en: "Plátano",   es: "Plátano" },
  { en: "Mango",     es: "Mango" },
  { en: "Papaya",    es: "Papaya" },
];

const SMOOTHIE_SIZES = [
  { en: "Regular", es: "Regular", price: 5.00 },
  { en: "Large",   es: "Grande",  price: 6.00 },
];

interface SmoothieSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (flavor: string, size: string, price: number) => void;
}

export const SmoothieSelectionDialog = ({
  open,
  onOpenChange,
  onSelect,
}: SmoothieSelectionDialogProps) => {
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const { language } = useLanguage();

  const selectedSizeObj = SMOOTHIE_SIZES.find(s => s.en === selectedSize);

  const handleConfirm = () => {
    if (!selectedFlavor || !selectedSize || !selectedSizeObj) return;
    onSelect(selectedFlavor, selectedSize, selectedSizeObj.price);
    setSelectedFlavor("");
    setSelectedSize("");
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) { setSelectedFlavor(""); setSelectedSize(""); }
    onOpenChange(v);
  };

  const canConfirm = !!selectedFlavor && !!selectedSize;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {language === "es" ? "Elige tu Licuado" : "Choose Your Smoothie"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Flavor */}
          <div>
            <p className="text-sm font-semibold mb-3 text-foreground">
              {language === "es" ? "Sabor" : "Flavor"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SMOOTHIE_FLAVORS.map((flavor) => (
                <button
                  key={flavor.en}
                  type="button"
                  onClick={() => setSelectedFlavor(flavor.en)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedFlavor === flavor.en
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {language === "es" ? flavor.es : flavor.en}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <p className="text-sm font-semibold mb-3 text-foreground">
              {language === "es" ? "Tamaño" : "Size"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SMOOTHIE_SIZES.map((size) => (
                <button
                  key={size.en}
                  type="button"
                  onClick={() => setSelectedSize(size.en)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    selectedSize === size.en
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span>{language === "es" ? size.es : size.en}</span>
                  <span className="font-bold">${size.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 h-11">
            {language === "es" ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="flex-1 h-11">
            {selectedSizeObj ? `$${selectedSizeObj.price.toFixed(2)} — ` : ""}
            {language === "es" ? "Agregar" : "Add to Cart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
