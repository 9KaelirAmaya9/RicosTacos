import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const STREET_TACO_MEATS = [
  { value: "Al Pastor",   label: "Al Pastor",   sub: "Marinated pork with pineapple" },
  { value: "Carnitas",    label: "Carnitas",     sub: "Crispy slow-fried pork" },
  { value: "Suadero",     label: "Suadero",      sub: "Melt-in-your-mouth beef brisket" },
  { value: "Enchilada",   label: "Enchilada",    sub: "Spicy chile-rubbed pork" },
  { value: "Longaniza",   label: "Longaniza",    sub: "Aromatic Mexican pork sausage" },
  { value: "Buche",       label: "Buche",        sub: "Crispy-tender pork stomach" },
  { value: "Bistec",      label: "Bistec",       sub: "Simply grilled beef steak" },
  { value: "Cueritos",    label: "Cueritos",     sub: "Tangy pickled pork skin" },
  { value: "Pollo Asada", label: "Pollo Asada",  sub: "Char-grilled chicken" },
  { value: "Cecina",      label: "Cecina",       sub: "Thinly sliced salted beef" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMeat: (meat: string) => void;
}

export const StreetTacoSelectionDialog = ({ open, onOpenChange, onSelectMeat }: Props) => {
  const [selected, setSelected] = useState(STREET_TACO_MEATS[0].value);

  const handleConfirm = () => {
    onSelectMeat(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Street Taco — $3</DialogTitle>
          <p className="text-sm text-muted-foreground">Handmade corn tortilla, cilantro, onion & salsa. Choose your meat:</p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1">
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-1">
            {STREET_TACO_MEATS.map(({ value, label, sub }) => (
              <div
                key={value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelected(value)}
              >
                <RadioGroupItem value={value} id={`street-${value}`} />
                <Label htmlFor={`street-${value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{sub}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Button onClick={handleConfirm} className="mt-4 w-full">
          Add Street Taco ({selected}) — $3.00
        </Button>
      </DialogContent>
    </Dialog>
  );
};
