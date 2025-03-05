import { Fireworks } from 'fireworks-js';
import { useEffect, useRef, useState } from 'react';
import Ball from './Ball';
import Brick from './Brick';
import Paddle from './Paddle';

interface Position {
  x: number;
  y: number;
}

export interface BrickType {
  id: number;
  position: Position;
  visible: boolean;
}

const Game = () => {
  const [paddlePosition, setPaddlePosition] = useState<number>(350);
  const [ballPosition, setBallPosition] = useState<Position>({ x: 400, y: 550 });
  const [ballDirection, setBallDirection] = useState<Position>({ x: 5, y: -5 });
  const [bricks, setBricks] = useState<BrickType[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const fireworksContainerRef = useRef<HTMLDivElement>(null);
  const fireworksInstanceRef = useRef<Fireworks | null>(null);

  // Initialize bricks
  useEffect(() => {
    const initialBricks: BrickType[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        initialBricks.push({
          id: row * 8 + col,
          position: {
            x: col * 100 + 10,
            y: row * 30 + 50,
          },
          visible: true,
        });
      }
    }
    setBricks(initialBricks);
  }, []);

  // Handle paddle movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const gameContainer = document.querySelector('.game-container');
      if (gameContainer) {
        const containerRect = gameContainer.getBoundingClientRect();
        const newPosition = e.clientX - containerRect.left - 50;
        if (newPosition >= 0 && newPosition <= 700) {
          setPaddlePosition(newPosition);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Game loop
  useEffect(() => {
    const update = () => {
      setBallPosition((prev) => {
        const nextPos = {
          x: prev.x + ballDirection.x,
          y: prev.y + ballDirection.y,
        };

        const newDirection = { ...ballDirection };

        // Wall collisions
        if (nextPos.x <= 0 || nextPos.x >= 785) {
          newDirection.x = -ballDirection.x;
          nextPos.x = nextPos.x <= 0 ? 0 : 785;
        }
        if (nextPos.y <= 0) {
          newDirection.y = -ballDirection.y;
          nextPos.y = 0;
        }

        // Paddle collision
        if (
          nextPos.y >= 560 &&
          nextPos.y <= 580 &&
          nextPos.x >= paddlePosition &&
          nextPos.x <= paddlePosition + 100
        ) {
          newDirection.y = -Math.abs(ballDirection.y);
          newDirection.x = ballDirection.x;
          nextPos.y = 559; // Place ball slightly above paddle

          // Add slight angle change based on where ball hits paddle
          const paddleCenter = paddlePosition + 50;
          const hitOffset = nextPos.x - paddleCenter;
          newDirection.x += hitOffset * 0.05; // Subtle angle change

          setBallDirection(newDirection);
        }

        // Update ball direction if changed
        if (newDirection.x !== ballDirection.x || newDirection.y !== ballDirection.y) {
          setBallDirection(newDirection);
        }

        // Game over check
        if (nextPos.y > 600) {
          setGameOver(true);
          setHighScore(prev => Math.max(prev, score));
          return prev;
        }

        // Brick collision
        bricks.forEach((brick) => {
          if (
            brick.visible &&
            nextPos.x >= brick.position.x &&
            nextPos.x <= brick.position.x + 80 &&
            nextPos.y >= brick.position.y &&
            nextPos.y <= brick.position.y + 20
          ) {
            setBricks((prev) =>
              prev.map((b) =>
                b.id === brick.id ? { ...b, visible: false } : b
              )
            );
            newDirection.y = -ballDirection.y;
            nextPos.y = brick.position.y + (ballDirection.y > 0 ? 0 : 20);
            setBallDirection(newDirection);
            setScore((prev) => prev + 10);
          }
        });

        return nextPos;
      });

      gameLoopRef.current = requestAnimationFrame(update);
    };

    if (!gameOver && isGameStarted) {
      gameLoopRef.current = requestAnimationFrame(update);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [ballDirection, gameOver, paddlePosition, bricks, score, isGameStarted]);

  // Add this effect to check for victory
  useEffect(() => {
    if (bricks.length > 0 && bricks.every(brick => !brick.visible)) {
      setHasWon(true);
      setHighScore(prev => Math.max(prev, score));
    }
  }, [bricks, score]);

  // Initialize fireworks when winning
  useEffect(() => {
    if (hasWon && fireworksContainerRef.current) {
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
  }, [hasWon]);

  return (
    <div>
      <div className="stats">
        <div className="high-score">Best: {highScore}</div>
      </div>
      <div className="game-container">
        {!isGameStarted && !gameOver && !hasWon ? (
          <div className="start-screen">
            <h2>Ready to Play?</h2>
            <button
              className="restart-button"
              onClick={() => setIsGameStarted(true)}
            >
              Start Game
            </button>
          </div>
        ) : (
          <>
            <Paddle position={paddlePosition} />
            <Ball position={ballPosition} />
            {bricks.map(
              (brick) =>
                brick.visible && <Brick key={brick.id} position={brick.position} />
            )}
          </>
        )}
        {hasWon && (
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
                  setBallPosition({ x: 400, y: 550 });
                  setBallDirection({ x: 5, y: -5 });
                  setPaddlePosition(350);
                  setHasWon(false);
                  setGameOver(false);
                  setScore(0);
                  setBricks(prev => prev.map(brick => ({ ...brick, visible: true })));
                }}
              >
                Play Again
              </button>
            </div>
          </>
        )}
        {gameOver && !hasWon && (
          <div className="game-over">
            <div>Game Over!</div>
            <div className="final-score">Final Score: {score}</div>
            <button
              className="restart-button"
              onClick={() => {
                setBallPosition({ x: 400, y: 550 });
                setBallDirection({ x: 5, y: -5 });
                setPaddlePosition(350);
                setGameOver(false);
                setScore(0);
                setBricks(prev => prev.map(brick => ({ ...brick, visible: true })));
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;