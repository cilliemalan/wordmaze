import Prando from 'prando';

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

export type Point = [number, number];

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
    data: Uint8Array;
}

export interface MazeOptions {
    width: number;
    height: number;
    text: string;
    start?: Point;
    end?: Point;
    seed: string;
}

function topLeft({ x, y }: Block): Point {
    return [x, y];
}

function bottomRight({ x, y, w, h }: Block): Point {
    return [x + w, y + h];
}

function constrainPoint(m: MazeData, p: Point): Point {
    const x = p[0] < 0 ? 0 :
        p[0] >= m.width ? m.width - 1 :
            p[0];

    const y = p[1] < 0 ? 0 :
        p[1] >= m.width ? m.width - 1 :
            p[1];

    return [x, y];
}

function comparePoint(a: Point, b: Point): number {
    if (a[0] < b[0])
        return -1;
    if (a[0] > b[0])
        return 1;
    if (a[1] < b[1])
        return -1;
    if (a[1] > b[1])
        return 1;
    return 0;
}

function advance(p: Point, edge: number): Point {
    const [x, y] = p;
    if (edge & L) {
        return [x - 1, y];
    }
    else if (edge & R) {
        return [x + 1, y];
    }
    else if (edge & T) {
        return [x, y - 1];
    }
    else if (edge & B) {
        return [x, y + 1];
    }
    else {
        return p;
    }
}

function setCell(m: MazeData, p: Point, value: number) {
    const [x, y] = constrainPoint(m, p);
    m.data[y * m.height + x] = value;
}

function getCell(m: MazeData, p: Point): number {
    const [x, y] = constrainPoint(m, p);
    return m.data[y * m.height + x];
}

function getEdge(m: MazeData, p: Point, edge: number): boolean {
    return (getCell(m, p) & edge) != 0;
}

function isInside(m: MazeData, p: Point, edge?: number): boolean {
    if (edge !== undefined) {
        p = advance(p, edge);
    }

    if (p[0] < 0 || p[1] << 0) {
        return false;
    }
    if (p[0] >= m.width || p[1] >= m.height) {
        return false;
    }
    return true;
}

function changeEdge(m: MazeData, p: Point, add: number, remove: number) {


    const { width, height } = m;
    const [x, y] = p;
    setCell(m, p, (getCell(m, p) | add) & (~remove));
    if (x > 0) {
        setCell(m, [x - 1, y], (getCell(m, p) | (add & L)) & (~(remove & L)));
    }
    if (x < width - 1) {
        setCell(m, [x + 1, y], (getCell(m, p) | (add & R)) & (~(remove & R)));
    }
    if (y > 0) {
        setCell(m, [x, y - 1], (getCell(m, p) | (add & T)) & (~(remove & T)));
    }
    if (y < height - 1) {
        setCell(m, [x, y + 1], (getCell(m, p) | (add & B)) & (~(remove & B)));
    }
}

function removeEdge(m: MazeData, p: Point, edge: number) {
    changeEdge(m, p, 0, edge);
}

function addEdge(m: MazeData, p: Point, edge: number) {
    changeEdge(m, p, edge, 0);
}

function makeGap(m: MazeData, p: Point) {
    const [x, y] = p;
    if (x == 0) {
        removeEdge(m, p, L);
    }
    else if (x == m.width - 1) {
        removeEdge(m, p, R);
    }
    else if (y == 0) {
        removeEdge(m, p, T);
    }
    else if (y == m.height - 1) {
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
}

export function generate(options: MazeOptions): MazeData {
    const width = Math.min(Math.max(options.width, MIN_WIDTH), MAX_WIDTH);
    const height = Math.min(Math.max(options.height, MIN_HEIGHT), MAX_HEIGHT);
    const data = new Uint8Array(options.width * options.height);
    const start = options.start ?? [0, 0]
    const end = options.end ?? [width - 1, height - 1];
    const rng = new Prando(options.seed ?? "seed");
    const m = { width, height, data, start, end };
    initializeMaze(m);
    build(m, rng);
    makeGap(m, m.start);
    makeGap(m, m.end);
    return m;
}

function build(m: MazeData, rng: Prando) {
    const s = [m.start];

    while (s.length > 0) {
        const p = s.pop() ?? [0, 0];
        const initialDirection = rng.next(0, 4);
        for (let i = 0; i < 4; i++) {
            const direction = (initialDirection + i) % 4;
            const edge = 1 << direction;
            const adjacentCell = advance(p, edge);
            if (!isInside(m, adjacentCell)) {
                continue;
            }
            if (getCell(m, adjacentCell) == FILLED) {
                removeEdge(m, p, edge);
                s.push(adjacentCell);
                break;
            }
        }
    }
}

export function draw(ctx: CanvasRenderingContext2D, m: MazeData, cellSize: number = 64) {
    const olw = ctx.lineWidth;
    ctx.lineWidth = cellSize / 4;
    const ola = ctx.lineWidth / 2;
    const w = m.width;
    const h = m.height;
    for (let y = 0; y < m.height; y++) {
        for (let x = 0; x < m.width; x++) {
            const c = getCell(m, [x, y]);
            if (c == FILLED) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            } else {
                if (c & T) {
                    ctx.moveTo((x + 0) * cellSize, (y + 0) * cellSize);
                    ctx.lineTo((x + 1) * cellSize, (y + 0) * cellSize);
                }
                if (c & R) {
                    ctx.moveTo((x + 1) * cellSize, (y + 0) * cellSize);
                    ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize);
                }
                if (c & B) {
                    ctx.moveTo((x + 1) * cellSize, (y + 1) * cellSize);
                    ctx.lineTo((x + 0) * cellSize, (y + 1) * cellSize);
                }
                if (c & L) {
                    ctx.moveTo((x + 0) * cellSize, (y + 1) * cellSize);
                    ctx.lineTo((x + 0) * cellSize, (y + 0) * cellSize);
                }
            }
        }
    }
}