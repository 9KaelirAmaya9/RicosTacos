import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const TORTA_OPTIONS = [
  { value: "Birria",            sub: "Rich braised beef",                     price: 12 },
  { value: "Milaneza de Res",   sub: "Crispy breaded beef cutlet",             price: 12 },
  { value: "Milaneza de Pollo", sub: "Golden breaded chicken breast",          price: 14 },
  { value: "Pierna Adobada",    sub: "Marinated pork leg in adobo sauce",      price: 12 },
  { value: "Pollo Asado",       sub: "Smoky grilled chicken",                  price: 14 },
  { value: "Chuleta",           sub: "Crispy fried pork chop",                 price: 12 },
  { value: "Cubana",            sub: "Loaded — multiple meats and cheese",     price: 12 },
  { value: "Tinga",             sub: "Smoky chipotle chicken in tomato sauce", price: 12 },
  { value: "Cecina",            sub: "Thin-sliced salted beef",                price: 12 },
  { value: "Árabe",             sub: "Middle Eastern-inspired spiced pork",    price: 12 },
  { value: "Carnitas",          sub: "Crispy-tender pork",                     price: 12 },
  { value: "Al Pastor",         sub: "Juicy pork with pineapple",              price: 12 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (filling: string, price: number) => void;
}

export const TortaSelectionDialog = ({ open, onOpenChange, onSelect }: Props) => {
  const [selected, setSelected] = useState(TORTA_OPTIONS[0].value);
  const current = TORTA_OPTIONS.find(o => o.value === selected) ?? TORTA_OPTIONS[0];

  const handleConfirm = () => {
    onSelect(current.value, current.price);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Torta — from $12</DialogTitle>
          <p className="text-sm text-muted-foreground">Toasted telera roll, beans, avocado, fresh toppings. Choose your filling:</p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1">
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-1">
            {TORTA_OPTIONS.map(({ value, sub, price }) => (
              <div
                key={value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelected(value)}
              >
                <RadioGroupItem value={value} id={`torta-${value}`} />
                <Label htmlFor={`torta-${value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{value}</span>
                  <span className="block text-xs text-muted-foreground">{sub}</span>
                </Label>
                <span className="text-sm font-semibold text-primary shrink-0">${price}</span>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Button onClick={handleConfirm} className="mt-4 w-full">
          Add {current.value} Torta — ${current.price}.00
        </Button>
      </DialogContent>
    </Dialog>
  );
};
