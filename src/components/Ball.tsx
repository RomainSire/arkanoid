interface BallProps {
  position: {
    x: number;
    y: number;
  };
}

const Ball = ({ position }: BallProps) => {
  return (
    <div
      className="ball"
      style={{ left: position.x, top: position.y }}
    />
  );
};

export default Ball;