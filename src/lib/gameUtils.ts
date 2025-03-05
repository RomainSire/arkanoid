import { BrickType } from "./types";


export const getScaledSpeed = (baseSpeed: number) => {
    const { width } = getGameDimensions();
    return (baseSpeed * width) / 800; // Scale speed relative to default width
};

export const getGameDimensions = () => {
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

export const getInitialPositions = () => {
    const { width, height } = getGameDimensions();
    return {
        paddlePosition: width * 0.4375, // 35% from left (centered)
        ballPosition: {
            x: width * 0.5, // Center horizontally
            y: height * 0.85 // Near the paddle but not too close
        }
    };
};

export const initializeBricks = (width: number, height: number) => {
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
    return initialBricks;
}

export const getPaddleRelativePosition = (clientX: number) => {
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
