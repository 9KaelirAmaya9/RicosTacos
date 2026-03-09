export const PapelPicado = () => {
  return (
    <div className="relative w-full h-12 my-8 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 flex justify-center items-start pointer-events-none">
        {/* Hanging banner string */}
        <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent"></div>
        
        {/* Papel picado flags */}
        <div className="flex gap-1 mt-1">
          {[
            "serape-red",
            "serape-pink",
            "serape-yellow",
            "serape-green",
            "serape-blue",
            "serape-purple",
            "serape-orange",
            "serape-cyan",
            "serape-red",
            "serape-pink",
            "serape-yellow",
            "serape-green",
          ].map((color, i) => (
            <div key={i} className="relative flex flex-col items-center">
              {/* String connection */}
              <div className="w-px h-2 bg-muted-foreground/20"></div>
              {/* Flag with cutout pattern */}
              <div
                className="w-8 h-10 relative"
                style={{
                  backgroundColor: `hsl(var(--${color}))`,
                  clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
                  opacity: 0.8,
                }}
              >
                {/* Decorative cutouts */}
                <div className="absolute inset-0 flex justify-center items-center">
                  <div
                    className="w-3 h-3 bg-background rounded-full opacity-60"
                    style={{
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  ></div>
                </div>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-background rounded-full opacity-40"></div>
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-background rounded-full opacity-40"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Folk art accent flowers */}
      <div className="absolute left-4 top-0 text-xl opacity-40 animate-pulse">🌺</div>
      <div className="absolute right-4 top-0 text-xl opacity-40 animate-pulse" style={{ animationDelay: "0.5s" }}>🌼</div>
    </div>
  );
};
