import { useEffect, useRef } from "react";

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>{}[]|/\\!@#$%^&*";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -50);
    const speeds: number[] = Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.7);
    const brightCols = new Set<number>(
      Array.from({ length: Math.floor(columns * 0.15) }, () => Math.floor(Math.random() * columns))
    );

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const y = Math.floor(drops[i]) * fontSize;
        if (y < 0) { drops[i] += speeds[i]; continue; }

        // Tête blanche brillante
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 10;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y);

        // Corps vert
        const bright = brightCols.has(i);
        ctx.fillStyle = bright ? "#00ff44" : "#00cc33";
        ctx.shadowColor = bright ? "#00ff44" : "#009922";
        ctx.shadowBlur = bright ? 6 : 2;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y - fontSize);

        // Queue sombre
        ctx.fillStyle = "#003311";
        ctx.shadowBlur = 0;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y - fontSize * 2);

        drops[i] += speeds[i];
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = Math.random() * -30;
        }
      }
      ctx.shadowBlur = 0;
    };

    const interval = setInterval(draw, 40);
    return () => { clearInterval(interval); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.8 }} />;
}