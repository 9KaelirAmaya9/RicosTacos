import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FloatingContactButton = () => {
  const phoneNumber = "+17186334816";
  
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-6 z-40 pointer-events-none">
      <Button
        onClick={handleCall}
        size="lg"
        className="rounded-full h-16 w-16 p-0 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 pointer-events-auto"
        aria-label="Call Ricos Tacos"
      >
        <Phone className="h-6 w-6" />
      </Button>
    </div>
  );
};
