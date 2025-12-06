import { useRef, useEffect } from 'react';

export default function VibratoGraph({ pitch, isActive }) {
    const canvasRef = useRef(null);
    const historyRef = useRef([]); // Stores { time: number, deviation: number }
    const rafRef = useRef(null);

    const lastDeviationRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Configuration
        const timeWindow = 1500; // Show last 1.5 seconds
        const smoothingFactor = 0.15; // Lower = smoother, Higher = more responsive

        const animate = (now) => {
            const width = canvas.width;
            const height = canvas.height;

            // 1. Update Data Loop
            let targetDeviation = 0;

            if (isActive && pitch !== null) {
                targetDeviation = pitch - Math.round(pitch);
            }

            // Apply Low-Pass Filter (Smoothing)
            // current = prev + (target - prev) * factor
            const smoothedDeviation = lastDeviationRef.current + (targetDeviation - lastDeviationRef.current) * smoothingFactor;
            lastDeviationRef.current = smoothedDeviation;

            historyRef.current.push({ time: now, val: smoothedDeviation });

            // Prune old data
            const cutoff = now - timeWindow;
            // Optimization: Remove only what's needed, keep buffer clean
            // Fix: Keep one point BEFORE the cutoff (off-screen left) to avoid flickering
            while (historyRef.current.length > 1 && historyRef.current[1].time < cutoff) {
                historyRef.current.shift();
            }

            // 2. Draw Loop
            ctx.clearRect(0, 0, width, height);

            // Draw Center Line (Grid)
            const centerY = height / 2;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();

            // Draw Vibrato Line
            if (historyRef.current.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = '#34d399'; // Green-400
                ctx.lineWidth = 3.5; // Thicker line
                ctx.lineJoin = 'round';

                // Scale Y: Amplified to make vibrations taller/easier to see
                const scaleY = height * 1.5;

                // We map time [now - timeWindow, now] -> [0, width]
                // X = ((point.time - (now - timeWindow)) / timeWindow) * width

                // Optimization: Start drawing from index 0

                for (let i = 0; i < historyRef.current.length; i++) {
                    const point = historyRef.current[i];

                    // Normalize time to 0..1
                    const progress = (point.time - cutoff) / timeWindow;
                    const x = progress * width;

                    // Y: Center - (Value * Scale)
                    const y = centerY - (point.val * scaleY);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        const handleResize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize(); // Init

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', handleResize);
        }
    }, [pitch, isActive]);

    return <canvas ref={canvasRef} className="w-full h-full block" />;
}
