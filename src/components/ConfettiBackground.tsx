import { useEffect, useState } from "react";

interface Confetti {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
}

export const ConfettiBackground = () => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    const colors = [
      "hsl(188, 100%, 42%)",  // cyan
      "hsl(357, 81%, 51%)",   // red
      "hsl(330, 100%, 54%)",  // pink
      "hsl(293, 58%, 33%)",   // purple
      "hsl(203, 99%, 37%)",   // blue
      "hsl(103, 46%, 50%)",   // green
      "hsl(44, 98%, 53%)",    // yellow
      "hsl(27, 98%, 58%)",    // orange
    ];

    const pieces: Confetti[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setConfetti(pieces);
  }, []);

  return (
    <div className="confetti-bg pointer-events-none">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece pointer-events-none"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};
