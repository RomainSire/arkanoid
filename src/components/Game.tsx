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
  // Add base speed constants
  const BASE_SPEED = 5;
  const getScaledSpeed = () => {
    const { width } = getGameDimensions();
    return (BASE_SPEED * width) / 800; // Scale speed relative to default width
  };

  // Start with default positions
  const [paddlePosition, setPaddlePosition] = useState<number>(350);
  const [ballPosition, setBallPosition] = useState<Position>({ x: 400, y: 550 });
  const [ballDirection, setBallDirection] = useState<Position>({ x: BASE_SPEED, y: -BASE_SPEED });
  const [bricks, setBricks] = useState<BrickType[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const fireworksContainerRef = useRef<HTMLDivElement>(null);
  const fireworksInstanceRef = useRef<Fireworks | null>(null);

  const getGameDimensions = () => {
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      const rect = gameContainer.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height
      };
    }
    return { width: 800, height: 600 }; // Default fallback
  };

  const getInitialPositions = () => {
    const { width, height } = getGameDimensions();
    return {
      paddlePosition: width * 0.4375, // 35% from left (centered)
      ballPosition: {
        x: width * 0.5, // Center horizontally
        y: height * 0.85 // Near the paddle but not too close
      }
    };
  };

  // Update initial positions and speed
  useEffect(() => {
    const { paddlePosition: initialPaddle, ballPosition: initialBall } = getInitialPositions();
    const scaledSpeed = getScaledSpeed();
    setPaddlePosition(initialPaddle);
    setBallPosition(initialBall);
    setBallDirection({ x: scaledSpeed, y: -scaledSpeed });
  }, []);

  // Initialize bricks with relative positions
  useEffect(() => {
    const { width, height } = getGameDimensions();
    const initialBricks: BrickType[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        initialBricks.push({
          id: row * 8 + col,
          position: {
            x: (col * width / 8) + (width * 0.0125), // 1.25% margin
            y: (row * height / 20) + (height * 0.083), // Start at ~8.3% from top
          },
          visible: true,
        });
      }
    }
    setBricks(initialBricks);
  }, []);

  // Update paddle movement handler
  const getRelativePosition = (clientX: number) => {
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      const containerRect = gameContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const paddleWidth = containerWidth * 0.125; // 12.5% of container width
      const newPosition = clientX - containerRect.left - (paddleWidth / 2);
      const maxPosition = containerWidth - paddleWidth;
      return Math.max(0, Math.min(newPosition, maxPosition));
    }
    return 0;
  };

  // Update the mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPaddlePosition(getRelativePosition(e.clientX));
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      setPaddlePosition(getRelativePosition(e.touches[0].clientX));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Update game loop with relative positions
  useEffect(() => {
    const update = () => {
      setBallPosition((prev) => {
        const { width, height } = getGameDimensions();
        const scaledSpeed = getScaledSpeed();
        const nextPos = {
          x: prev.x + ballDirection.x,
          y: prev.y + ballDirection.y,
        };

        const newDirection = { ...ballDirection };

        // Wall collisions
        if (nextPos.x <= 0 || nextPos.x >= width * 0.98) { // 98% of width
          newDirection.x = -ballDirection.x;
          nextPos.x = nextPos.x <= 0 ? 0 : width * 0.98;
        }
        if (nextPos.y <= 0) {
          newDirection.y = -ballDirection.y;
          nextPos.y = 0;
        }

        // Paddle collision
        const paddleY = height * 0.93; // 93% from top
        if (
          nextPos.y >= paddleY &&
          nextPos.y <= paddleY + height * 0.033 &&
          nextPos.x >= paddlePosition &&
          nextPos.x <= paddlePosition + width * 0.125
        ) {
          newDirection.y = -Math.abs(ballDirection.y);
          nextPos.y = paddleY - 1;

          // Improved paddle bounce physics
          const hitPosition = (nextPos.x - paddlePosition) / (width * 0.125); // 0 to 1
          const angleMultiplier = hitPosition - 0.5; // -0.5 to 0.5
          newDirection.x = scaledSpeed * angleMultiplier * 2; // More intuitive angle

          // Ensure minimum horizontal speed
          if (Math.abs(newDirection.x) < scaledSpeed * 0.2) {
            newDirection.x = scaledSpeed * 0.2 * (angleMultiplier >= 0 ? 1 : -1);
          }
        }

        // Game over check
        if (nextPos.y > height) {
          setGameOver(true);
          setHighScore(prev => Math.max(prev, score));
          return prev;
        }

        // Brick collision
        bricks.forEach((brick) => {
          if (
            brick.visible &&
            nextPos.x >= brick.position.x &&
            nextPos.x <= brick.position.x + width * 0.1 && // 10% width for brick
            nextPos.y >= brick.position.y &&
            nextPos.y <= brick.position.y + height * 0.033 // 3.33% height for brick
          ) {
            setBricks((prev) =>
              prev.map((b) =>
                b.id === brick.id ? { ...b, visible: false } : b
              )
            );
            newDirection.y = -ballDirection.y;
            nextPos.y = brick.position.y + (ballDirection.y > 0 ? 0 : height * 0.033);
            setBallDirection(newDirection);
            setScore((prev) => prev + 10);
          }
        });

        // Update ball direction if changed
        if (newDirection.x !== ballDirection.x || newDirection.y !== ballDirection.y) {
          setBallDirection(newDirection);
        }

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

  // Update reset function to use scaled speed
  const resetGame = () => {
    const { paddlePosition: newPaddlePos, ballPosition: newBallPos } = getInitialPositions();
    const scaledSpeed = getScaledSpeed();
    setBallPosition(newBallPos);
    setPaddlePosition(newPaddlePos);
    setBallDirection({ x: scaledSpeed, y: -scaledSpeed });
    setGameOver(false);
    setScore(0);
    setBricks(prev => prev.map(brick => ({ ...brick, visible: true })));
  };

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
                  setHasWon(false);
                  resetGame();
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
              onClick={resetGame}
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