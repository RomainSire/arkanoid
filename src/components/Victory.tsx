import { Fireworks } from 'fireworks-js';
import { useEffect, useRef } from "react";

type VictoryProps = {
    setHasWon: (value: boolean) => void;
    resetGame: () => void;
    score: number;
}

const Victory = ({setHasWon, resetGame, score}: VictoryProps) => {
    const fireworksContainerRef = useRef<HTMLDivElement>(null);
    const fireworksInstanceRef = useRef<Fireworks | null>(null);

      // Initialize fireworks when winning
    useEffect(() => {
        if (fireworksContainerRef.current) {
            fireworksInstanceRef.current = new Fireworks(fireworksContainerRef.current, {
            autoresize: true,
            opacity: 0.5,
            acceleration: 1.05,
            friction: 0.97,
            gravity: 1.5,
            particles: 50,
            traceLength: 3,
            traceSpeed: 10,
            explosion: 5,
            intensity: 30,
            flickering: 50,
            lineStyle: 'round',
            hue: {
                min: 0,
                max: 360
            },
            delay: {
                min: 30,
                max: 60
            }
            });

            fireworksInstanceRef.current.start();
        }

        return () => {
            fireworksInstanceRef.current?.stop();
        };
    }, []);

    return (
    <>
        <div
            ref={fireworksContainerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}
        />
        <div className="victory">
        <div>🎉 Amazing Victory! 🎉</div>
        <div className="final-score">Final Score: {score}</div>
        <button
            className="restart-button"
            onClick={() => {
            setHasWon(false);
            resetGame();
            }}
        >
            Play Again
        </button>
        </div>
    </>
  )
}

export default Victory;