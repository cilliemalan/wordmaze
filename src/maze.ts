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
    data: Uint8Array;
    stride: number;
    bounds: Block;
}

export interface MazeDataWithStartAndEnd
    extends MazeData {

    start: Point;
    end: Point;
}

export interface MazeOptions {
    width: number;
    height: number;
    text: string;
    start?: Point;
    end?: Point;
    seed: string;
}

function constrainPoint(m: MazeData, p: Point): Point {
    const x = Math.max(Math.min(m.bounds.w - 1, p[0]), 0);
    const y = Math.max(Math.min(m.bounds.h - 1, p[1]), 0);
    return [x, y];
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

function cellAddress(m: MazeData, p: Point) {
    const [x, y] = p;
    return (y + m.bounds.y) * m.stride + x + m.bounds.x;
}

function setCell(m: MazeData, p: Point, value: number) {
    m.data[cellAddress(m, p)] = value;
}

function getCell(m: MazeData, p: Point): number {
    return m.data[cellAddress(m, p)];
}

function isInside(m: MazeData, p: Point, edge?: number): boolean {
    if (edge !== undefined) {
        return isInside(m, advance(p, edge), undefined);
    }

    const [x, y] = p;

    if (x < 0 || y < 0) {
        return false;
    }

    const { w, h } = m.bounds;
    if (x >= w || y >= h) {
        return false;
    }
    return true;
}

function removeEdge(m: MazeData, p: Point, edge: number) {
    const ap = advance(p, edge);
    const ee = ~edge;
    setCell(m, p, getCell(m, p) & ee);
    if ((edge & L) && isInside(m, ap)) {
        setCell(m, ap, getCell(m, ap) & ~R);
    }
    if ((edge & R) && isInside(m, ap)) {
        setCell(m, ap, getCell(m, ap) & ~L);
    }
    if ((edge & T) && isInside(m, ap)) {
        setCell(m, ap, getCell(m, ap) & ~B);
    }
    if ((edge & B) && isInside(m, ap)) {
        setCell(m, ap, getCell(m, ap) & ~T);
    }
}

function makeGap(m: MazeData, p: Point) {
    const [x, y] = p;
    const { w, h } = m.bounds;
    if (x == 0) {
        removeEdge(m, p, L);
    }
    else if (x == w - 1) {
        removeEdge(m, p, R);
    }
    else if (y == 0) {
        removeEdge(m, p, T);
    }
    else if (y == h - 1) {
        removeEdge(m, p, B);
    }
}

function initializeMaze(m: MazeData) {
    const { w, h } = m.bounds;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            setCell(m, [x, y], FILLED);
        }
    }
}

export function generate(options: MazeOptions): MazeDataWithStartAndEnd {
    const width = Math.min(Math.max(options.width, MIN_WIDTH), MAX_WIDTH);
    const height = Math.min(Math.max(options.height, MIN_HEIGHT), MAX_HEIGHT);
    const stride = width;
    const data = new Uint8Array(options.width * options.height);
    const start = options.start ?? [0, 0]
    const end = options.end ?? [width - 1, height - 1];
    const rng = new Prando(options.seed ?? "seed");
    const bounds = { w: width, h: height, x: 0, y: 0 };
    const m = { bounds, stride, data, start, end };
    initializeMaze(m);
    build(m, rng);
    makeGap(m, m.start);
    makeGap(m, m.end);
    return m;
}

function build(m: MazeData, rng: Prando) {
    const start: Point = [
        Math.trunc(rng.next(0, m.bounds.w)),
        Math.trunc(rng.next(0, m.bounds.h))
    ];
    const s = [start];

    while (s.length > 0) {
        const p = s.pop()!;
        const initialDirection = Math.trunc(rng.next(0, 4));
        for (let i = 0; i < 4; i++) {
            const direction = (initialDirection + i) % 4;
            const edge = 1 << direction;
            const adjacentCell = advance(p, edge);
            if (!isInside(m, adjacentCell)) {
                continue;
            }
            if (getCell(m, adjacentCell) == FILLED) {
                s.push(p);
                removeEdge(m, p, edge);
                s.push(adjacentCell);
                break;
            }
        }
    }
}

function solve(m: MazeData, start: Point, end: Point): Point[] | undefined {
    interface VisitPoint {
        point: Point;
        parent?: VisitPoint;
    }

    const r = { point: start };
    const q = new Array<VisitPoint>();
    const x = new Set<number>();

    visit(r);
    enqueue(r);
    while (q.length != 0) {
        const v = dequeue()!;

        if (v.point[0] == end[0] && v.point[1] == end[1]) {
            return buildSolution(v);
        }

        const p = getCell(m, v.point);

        for (let i = 0; i < 4; i++) {
            const edge = 1 << i;
            if (!isInside(m, v.point, edge)) {
                continue;
            }
            if (p & edge) {
                continue;
            }
            const w: VisitPoint = { point: advance(v.point, edge) };
            if (visited(w)) {
                continue;
            }
            visit(w);
            w.parent = v;
            enqueue(w);
        }
    }

    return undefined;

    function buildSolution(p: VisitPoint | undefined): Point[] {
        const result = new Array<Point>();
        while (p) {
            result.push(p.point);
            p = p.parent;
        }

        result.reverse();
        return result;
    }

    function enqueue(p: VisitPoint) {
        q.push(p);
    }

    function dequeue(): VisitPoint | undefined {
        return q.shift();
    }

    function visit(p: VisitPoint) {
        x.add(pspec(p));
    }

    function visited(p: VisitPoint) {
        return x.has(pspec(p));
    }

    function pspec(p: VisitPoint) {
        return p.point[0] << 16 | p.point[1];
    }
}

export function draw(ctx: CanvasRenderingContext2D, m: MazeData) {
    const pf = ctx.lineWidth;
    const po = pf / 2;
    const { w, h } = m.bounds;
    ctx.translate(po, po);
    ctx.beginPath();
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const c = getCell(m, [x, y]);
            if (y == 0 && c & T) {
                ctx.moveTo(x + 0 - po, y + 0);
                ctx.lineTo(x + 1 + po, y + 0);
            }
            if (c & R) {
                ctx.moveTo(x + 1, y + 0 - po);
                ctx.lineTo(x + 1, y + 1 + po);
            }
            if (c & B) {
                ctx.moveTo(x + 1 + po, y + 1);
                ctx.lineTo(x + 0 - po, y + 1);
            }
            if (x == 0 && c & L) {
                ctx.moveTo(x + 0, y + 1 + po);
                ctx.lineTo(x + 0, y + 0 - po);
            }
        }
    }
    ctx.stroke();
    ctx.translate(-po, -po);
}

export function drawSolution(ctx: CanvasRenderingContext2D, m: MazeDataWithStartAndEnd) {
    const solution = solve(m, m.start, m.end);
    if (!solution || !solution.length) {
        return;
    }

    const pf = ctx.lineWidth;
    const po = 0.75;
    ctx.translate(po, po);
    ctx.beginPath();
    ctx.moveTo(solution[0][0], solution[0][1]);
    for (let i = 0; i < solution.length; i++) {
        const p = solution[i];
        ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.translate(-po, -po);
}