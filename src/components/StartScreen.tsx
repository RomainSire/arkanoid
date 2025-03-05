type StartScreenProps = {
    setIsGameStarted: (isGameStarted: boolean) => void
}

const StartScreen = ({setIsGameStarted}: StartScreenProps) => {
    return (
        <div className="start-screen">
            <h2>Ready to Play?</h2>
            <button
                className="restart-button"
                onClick={() => setIsGameStarted(true)}
            >
                Start Game
            </button>
        </div>
    )
}

export default StartScreen;