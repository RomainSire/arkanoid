interface PaddleProps {
  position: number;
}

const Paddle = ({ position }: PaddleProps) => {
  return <div className="paddle" style={{ left: position }} />;
};

export default Paddle;