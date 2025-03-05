export interface Position {
    x: number;
    y: number;
}

export interface BrickType {
    id: number;
    position: Position;
    visible: boolean;
}
