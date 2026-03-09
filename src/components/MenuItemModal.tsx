import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Star } from "lucide-react";
import { useState } from "react";

interface MenuItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    bestSeller?: boolean;
    subcategory?: string;
  };
  onAddToCart: (item: { id: string; name: string; price: number; image?: string }) => void;
}

// Sample ingredients and add-ons (you can expand this or make it dynamic per item)
const defaultIngredients = [
  "Fresh tortillas",
  "Premium meat selection",
  "Cilantro",
  "Onions",
  "House-made salsa",
];

const defaultAddons = [
  { id: "guac", name: "Guacamole", price: 2.00 },
  { id: "cheese", name: "Extra Cheese", price: 1.50 },
  { id: "cream", name: "Sour Cream", price: 1.00 },
  { id: "jalapeños", name: "Jalapeños", price: 0.75 },
  { id: "beans", name: "Refried Beans", price: 1.50 },
];

// Flavor options for different drink categories
const smoothieFlavors = [
  "Chocolate",
  "Mamey",
  "Strawberry",
  "Banana",
  "Mango",
  "Papaya",
];

const aguasFrescasFlavors = [
  "Horchata",
  "Jamaica (Hibiscus)",
  "Tamarindo",
  "Piña (Pineapple)",
  "Limón (Limeade)",
  "Sandía (Watermelon)",
];

const sodaFlavors = [
  "Jarritos Tamarindo",
  "Jarritos Mandarina",
  "Jarritos Limón",
  "Coca-Cola",
  "Pepsi",
  "Sprite",
  "Orange Fanta",
];

const specialtyDrinkFlavors = [
  "Piña Colada",
  "Mango",
  "Strawberry",
  "Coconut",
];

const wingsFlavors = [
  "Mango Habanero",
  "Buffalo",
  "BBQ",
];

export function MenuItemModal({ open, onOpenChange, item, onAddToCart }: MenuItemModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");

  // Determine if this item should show flavors instead of add-ons
  const isDrinkWithFlavors = 
    item.subcategory === "Smoothies" || 
    item.subcategory === "Specialty Drinks" || 
    item.subcategory === "Sodas" ||
    item.subcategory === "Fresh Drinks";
  
  const isWings = item.id === "k7";

  // Get the appropriate flavor list
  const getFlavors = () => {
    if (item.subcategory === "Smoothies") return smoothieFlavors;
    if (item.subcategory === "Fresh Drinks") return aguasFrescasFlavors;
    if (item.subcategory === "Sodas") return sodaFlavors;
    if (item.subcategory === "Specialty Drinks") return specialtyDrinkFlavors;
    if (isWings) return wingsFlavors;
    return [];
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(addonId)) {
        newSet.delete(addonId);
      } else {
        newSet.add(addonId);
      }
      return newSet;
    });
  };

  const calculateTotal = () => {
    if (isDrinkWithFlavors || isWings) {
      return item.price;
    }
    const addonsTotal = defaultAddons
      .filter((addon) => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
    return item.price + addonsTotal;
  };

  const handleAddToCart = () => {
    if (isDrinkWithFlavors || isWings) {
      onAddToCart({
        id: item.id,
        name: selectedFlavor ? `${item.name} - ${selectedFlavor}` : item.name,
        price: item.price,
        image: item.image,
      });
      setSelectedFlavor("");
    } else {
      const addonsText = defaultAddons
        .filter((addon) => selectedAddons.has(addon.id))
        .map((addon) => addon.name)
        .join(", ");
      
      onAddToCart({
        id: item.id,
        name: addonsText ? `${item.name} + ${addonsText}` : item.name,
        price: calculateTotal(),
        image: item.image,
      });
      
      setSelectedAddons(new Set());
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif flex items-center gap-2">
            {item.name}
            {item.bestSeller && (
              <Badge className="gap-1 bg-gradient-to-r from-serape-yellow to-serape-orange text-white border-0">
                <Star className="h-3 w-3 fill-current" />
                Best Seller
              </Badge>
            )}
          </DialogTitle>
          {item.description && (
            <DialogDescription className="text-base">
              {item.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {item.image && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 text-[8px] text-white/30 font-mono tracking-tight backdrop-blur-[2px] px-1.5 py-0.5 rounded bg-black/10">
              AI
            </div>
          </div>
        )}

        {/* Ingredients Section - Only show for non-drink items and non-wings */}
        {!isDrinkWithFlavors && !isWings && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Ingredients</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {defaultIngredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Flavors Section - For drinks and wings */}
        {(isDrinkWithFlavors || isWings) && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Available Flavors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {getFlavors().map((flavor) => (
                <button
                  key={flavor}
                  onClick={() => setSelectedFlavor(flavor)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedFlavor === flavor
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  {flavor}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons Section - Only show for non-drink items and non-wings */}
        {!isDrinkWithFlavors && !isWings && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Add-ons</h3>
            <div className="space-y-2">
              {defaultAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={addon.id}
                      checked={selectedAddons.has(addon.id)}
                      onCheckedChange={() => toggleAddon(addon.id)}
                    />
                    <label htmlFor={addon.id} className="cursor-pointer text-sm font-medium">
                      {addon.name}
                    </label>
                  </div>
                  <span className="text-sm font-semibold">+${addon.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="border-t border-border pt-4 space-y-3">
          {!isDrinkWithFlavors && !isWings && (
            <div className="flex items-center justify-between text-xl font-semibold">
              <span>Total</span>
              <span className="bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          )}
          {(isDrinkWithFlavors || isWings) && (
            <div className="flex items-center justify-between text-xl font-semibold">
              <span>Price</span>
              <span className="bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent">
                ${item.price.toFixed(2)}
              </span>
            </div>
          )}
          <Button 
            onClick={handleAddToCart} 
            className="w-full gap-2" 
            size="lg"
            disabled={(isDrinkWithFlavors || isWings) && !selectedFlavor}
          >
            <Plus className="h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
