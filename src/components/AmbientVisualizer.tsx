import React, { useEffect, useRef } from 'react';
import { useAetherStore } from '../store/useAetherStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

export const AmbientVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mode } = useAetherStore();
  const particles = useRef<Particle[]>([]);
  const animationFrame = useRef<number>(0);

  const initParticles = (width: number, height: number) => {
    const count = 40;
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (mode === 'titan' ? 0.8 : 0.4),
      vy: (Math.random() - 0.5) * (mode === 'titan' ? 0.8 : 0.4),
      size: Math.random() * 2 + 1,
      color: mode === 'titan' ? '#BC13FE' : '#00F3FF',
      opacity: Math.random() * 0.5 + 0.1,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Trigger a burst when mode changes
    particles.current.forEach(p => {
      p.vx *= 3;
      p.vy *= 3;
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const color = mode === 'titan' ? '188, 19, 254' : '0, 243, 255';
      
      particles.current.forEach((p, i) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Friction (Gracefully return to base speed)
        const baseSpeed = mode === 'titan' ? 0.8 : 0.4;
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        // Ensure some minimum movement
        if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * baseSpeed;
        if (Math.abs(p.vy) < 0.1) p.vy += (Math.random() - 0.5) * baseSpeed;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw connections (Subtle neural/physical grid)
        particles.current.forEach((p2, j) => {
          if (i === j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = mode === 'titan' ? 250 : 150;

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${color}, ${(1 - dist / maxDist) * 0.15})`;
            ctx.lineWidth = mode === 'titan' ? 0.5 : 0.2;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgb(${color})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame.current);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-1000"
      style={{
        filter: 'blur(1px)',
        mixBlendMode: 'screen'
      }}
    />
  );
};
