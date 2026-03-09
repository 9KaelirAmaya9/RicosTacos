import { useEffect, useState } from "react";

interface Shape {
  id: number;
  type: "circle" | "triangle";
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

export const FloatingShapes = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    const colors = [
      "serape-red",
      "serape-pink",
      "serape-purple",
      "serape-blue",
      "serape-green",
      "serape-yellow",
      "serape-orange",
      "serape-cyan",
    ];

    const items: Shape[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      type: i % 2 === 0 ? "circle" : "triangle",
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      size: 30 + Math.random() * 40,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setShapes(items);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute opacity-10"
          style={{
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            animation: `float-shape ${shape.duration}s ease-in-out ${shape.delay}s infinite`,
          }}
        >
          {shape.type === "circle" ? (
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: `hsl(var(--${shape.color}))` }}
            ></div>
          ) : (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: `hsl(var(--${shape.color}))`,
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              }}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};
