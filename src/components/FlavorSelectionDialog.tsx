import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FlavorSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFlavor: (flavor: string) => void;
  itemName: string;
}

const flavors = [
  { value: "mango-habanero", label: "Mango Habanero", labelEs: "Mango Habanero" },
  { value: "buffalo", label: "Buffalo", labelEs: "Buffalo" },
  { value: "bbq", label: "BBQ", labelEs: "BBQ" }
];

export const FlavorSelectionDialog = ({ 
  open, 
  onOpenChange, 
  onSelectFlavor,
  itemName 
}: FlavorSelectionDialogProps) => {
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const { language } = useLanguage();

  const handleConfirm = () => {
    if (selectedFlavor) {
      onSelectFlavor(selectedFlavor);
      setSelectedFlavor("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {language === "es" ? "Selecciona tu Sabor" : "Select Your Flavor"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-muted-foreground">
            {language === "es" 
              ? "Elige el sabor para tus alitas:" 
              : "Choose the flavor for your wings:"}
          </p>
          
          <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor}>
            <div className="space-y-3">
              {flavors.map((flavor) => (
                <div key={flavor.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value={flavor.value} id={flavor.value} />
                  <Label 
                    htmlFor={flavor.value} 
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {language === "es" ? flavor.labelEs : flavor.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedFlavor}
              className="flex-1"
            >
              {language === "es" ? "Agregar al Carrito" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
