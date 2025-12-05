import { useRef, useEffect } from 'react';

export default function Visualizer({ data }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Draw visualizer
            if (data && data.length > 0) {
                const barWidth = (width / data.length) * 2.5;
                let x = 0;

                for (let i = 0; i < data.length; i++) {
                    const barHeight = (data[i] / 255) * height;

                    // Neon gradient
                    const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
                    gradient.addColorStop(0, '#00f3ff');
                    gradient.addColorStop(1, '#bc13fe');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationId);
    }, [data]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <canvas ref={canvasRef} className="w-full h-full rounded-xl" />
    );
}
