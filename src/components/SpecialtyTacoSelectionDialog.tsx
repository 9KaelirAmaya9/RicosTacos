import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const SPECIALTY_TACO_OPTIONS = [
  { value: "Birria",         label: "Birria",         sub: "Slow-braised beef in rich chile broth" },
  { value: "Cochinita Pibil",label: "Cochinita Pibil", sub: "Slow-roasted pork in citrus & achiote" },
  { value: "Tacos Árabes",   label: "Tacos Árabes",   sub: "Middle Eastern-inspired pork, flour tortilla" },
  { value: "Barbachera",     label: "Barbachera",     sub: "Traditional pit-barbecued meat" },
  { value: "Carne Asada",    label: "Carne Asada",    sub: "Flame-grilled steak, smoky char" },
  { value: "Chillo",         label: "Chillo",         sub: "Fresh fish fillet, lightly seasoned" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: string) => void;
}

export const SpecialtyTacoSelectionDialog = ({ open, onOpenChange, onSelect }: Props) => {
  const [selected, setSelected] = useState(SPECIALTY_TACO_OPTIONS[0].value);

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Specialty Taco — $5</DialogTitle>
          <p className="text-sm text-muted-foreground">Premium handmade corn tortilla. Choose your taco:</p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1">
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-1">
            {SPECIALTY_TACO_OPTIONS.map(({ value, label, sub }) => (
              <div
                key={value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelected(value)}
              >
                <RadioGroupItem value={value} id={`specialty-${value}`} />
                <Label htmlFor={`specialty-${value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{sub}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Button onClick={handleConfirm} className="mt-4 w-full">
          Add {selected} Taco — $5.00
        </Button>
      </DialogContent>
    </Dialog>
  );
};
