import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";

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

export function MenuItemModal({ open, onOpenChange, item, onAddToCart }: MenuItemModalProps) {
  const handleAddToCart = () => {
    onAddToCart({ id: item.id, name: item.name, price: item.price, image: item.image });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
          <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-2xl font-bold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent">
            ${item.price.toFixed(2)}
          </span>
          <Button onClick={handleAddToCart} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
