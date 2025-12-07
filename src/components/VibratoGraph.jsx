import { useRef, useEffect } from 'react';

export default function VibratoGraph({ pitch, isActive }) {
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const rafRef = useRef(null);
  const lastDeviationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Configuration
    const timeWindow = 1500;
    const smoothingFactor = 0.15;

    const animate = (now) => {
      const width = canvas.width;
      const height = canvas.height;

      let targetDeviation = 0;
      if (isActive && pitch !== null) {
        targetDeviation = pitch - Math.round(pitch);
      }

      const smoothedDeviation = lastDeviationRef.current + (targetDeviation - lastDeviationRef.current) * smoothingFactor;
      lastDeviationRef.current = smoothedDeviation;

      historyRef.current.push({ time: now, val: smoothedDeviation });

      const cutoff = now - timeWindow;
      while (historyRef.current.length > 1 && historyRef.current[1].time < cutoff) {
        historyRef.current.shift();
      }

      ctx.clearRect(0, 0, width, height);

      // Draw center line
      const centerY = height / 2;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw vibrato line with gradient
      if (historyRef.current.length > 1) {
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(52, 211, 153, 0.3)'); // success faded
        gradient.addColorStop(0.7, 'rgba(52, 211, 153, 0.8)');
        gradient.addColorStop(1, '#34d399'); // success

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const scaleY = height * 1.5;

        for (let i = 0; i < historyRef.current.length; i++) {
          const point = historyRef.current[i];
          const progress = (point.time - cutoff) / timeWindow;
          const x = progress * width;
          const y = centerY - (point.val * scaleY);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Glow effect
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [pitch, isActive]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
