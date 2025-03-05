import { useEffect, useRef, useState } from 'react';
import { getGameDimensions, getInitialPositions, getPaddleRelativePosition, getScaledSpeed, initializeBricks } from '../lib/gameUtils';
import { BrickType, Position } from '../lib/types';
import Ball from './Ball';
import Brick from './Brick';
import GameOver from './GameOver';
import Paddle from './Paddle';
import StartScreen from './StartScreen';
import Victory from './Victory';


const Game = () => {
  // Add base speed constants
  const BASE_SPEED = 5;

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

  // Update initial positions and speed
  useEffect(() => {
    const { paddlePosition: initialPaddle, ballPosition: initialBall } = getInitialPositions();
    const scaledSpeed = getScaledSpeed(BASE_SPEED);
    setPaddlePosition(initialPaddle);
    setBallPosition(initialBall);
    setBallDirection({ x: scaledSpeed, y: -scaledSpeed });
  }, []);

  // Initialize bricks with relative positions
  useEffect(() => {
    const { width, height } = getGameDimensions();
    const initialBricks = initializeBricks(width, height);
    setBricks(initialBricks);
  }, []);

  // Update the mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPaddlePosition(getPaddleRelativePosition(e.clientX));
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      setPaddlePosition(getPaddleRelativePosition(e.touches[0].clientX));
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
        const scaledSpeed = getScaledSpeed(BASE_SPEED);
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

  // Update reset function to use scaled speed
  const resetGame = () => {
    const { paddlePosition: newPaddlePos, ballPosition: newBallPos } = getInitialPositions();
    const scaledSpeed = getScaledSpeed(BASE_SPEED);
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
          <StartScreen  setIsGameStarted={setIsGameStarted} />
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
          <Victory
            setHasWon={setHasWon}
            resetGame={resetGame}
            score={score}
            />
        )}
        {gameOver && !hasWon && (
          <GameOver
            score={score}
            resetGame={resetGame}
          />
        )}
      </div>
    </div>
  );
};

export default Game;