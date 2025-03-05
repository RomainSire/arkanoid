interface BrickProps {
  position: {
    x: number;
    y: number;
  };
}

const Brick = ({ position }: BrickProps) => {
  return (
    <div
      className="brick"
      style={{ left: position.x, top: position.y }}
    />
  );
};

export default Brick;