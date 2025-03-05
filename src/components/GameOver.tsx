type GameOverProps = {
    score: number
    resetGame: () => void
}

const GameOver = ({score, resetGame}: GameOverProps) => {
    return (
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
    )
}

export default GameOver