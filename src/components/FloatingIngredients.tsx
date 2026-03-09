import { useEffect, useState } from "react";

interface Ingredient {
  id: number;
  emoji: string;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
}

export const FloatingIngredients = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const emojis = ["🌿", "🍋", "🌶️", "🥑", "🧅", "🌮"];
    
    const items: Ingredient[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 3,
      size: 24 + Math.random() * 16,
    }));

    setIngredients(items);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {ingredients.map((item) => (
        <div
          key={item.id}
          className="absolute opacity-20"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            fontSize: `${item.size}px`,
            animation: `float-ingredient ${item.duration}s ease-in-out ${item.delay}s infinite`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
};
