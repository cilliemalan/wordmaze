
export const T = 1;
export const R = 2;
export const B = 4;
export const L = 8;
export const BLOCK = 16;
export const FILLED = T + R + B + L;
export const MAX_HEIGHT = 100;
export const MAX_WIDTH = 200;
export const MIN_HEIGHT = 10;
export const MIN_WIDTH = 10;

export interface Point {
    x: number;
    y: number;
}

export interface Block {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface MazeData {
    start: Point;
    end: Point;
    width: number;
    height: number;
    data: number[];
}

export interface MazeOptions {
    width: number;
    height: number;
    text: string;
    start?: Point;
    end?: Point;
}

function topLeft({ x, y }: Block): Point {
    return { x, y };
}

function bottomRight({ x, y, w, h }: Block): Point {
    return { x: x + w, y: y + h };
}

function removeEdge(m: MazeData, p: Point, edge: number) {
    m.data[p.y * m.width + p.y] &= ~edge;
}

function addEdge(m: MazeData, p: Point, edge: number) {
    m.data[p.y * m.width + p.y] |= edge;
}

function pt(x: number, y: number): Point {
    return { x, y };
}

function makeGap(m: MazeData, p: Point) {
    if (p.x == 0) {
        removeEdge(m, p, L);
    }
    if (p.x == m.width - 1) {
        removeEdge(m, p, R);
    }
    if (p.y == 0) {
        removeEdge(m, p, T);
    }
    if (p.y == m.height - 1) {
        removeEdge(m, p, B);
    }
}

function initializeMaze(m: MazeData) {
    const { width, height, data, start, end } = m;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; y++) {
            data[y * width + x] = FILLED;
        }
    }

    makeGap(m, m.start);
    makeGap(m, m.end);
}

export function generate(options: MazeOptions): MazeData {
    const width = Math.min(Math.max(options.width, MIN_WIDTH), MAX_WIDTH);
    const height = Math.min(Math.max(options.height, MIN_HEIGHT), MAX_HEIGHT);
    const data = new Array<number>(options.width * options.height);
    const start = options.start ?? pt(0, 0);
    const end = options.end ?? pt(width - 1, height - 1);
    const m = { width, height, data, start, end };
    initializeMaze(m);

    return m;
}

export function build(m: MazeData) {
    
}