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
    mask?: Uint8Array;
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
    image?: Uint8Array;
    drawfn?: (m: MazeData) => void;
}

export function advance(p: Point, edge: number): Point {
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

export function setCell(m: MazeData, p: Point, value: number) {
    m.data[cellAddress(m, p)] = value;
}

export function getCell(m: MazeData, p: Point): number {
    return m.data[cellAddress(m, p)];
}

function getMaskValue(m: MazeData, p: Point): boolean {

    if (m.mask) {
        const bb = cellAddress(m, p);
        const byte = Math.trunc(bb / 8);
        const bit = 7 - (bb % 8);
        const mv = !!((m.mask[byte] >> bit) & 1);
        if (mv) {
            return false;
        }
    }

    return true;
}

export function isInside(m: MazeData, p: Point, edge?: number): boolean {
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

    if (!getMaskValue(m, p)) {
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
    const rng = new Prando(options.seed ?? "seed");
    const bounds = { w: width, h: height, x: 0, y: 0 };
    const m = { bounds, stride, data, mask: options.image };
    initializeMaze(m);
    buildRandomizedDepthFirst(m, rng);
    m.mask = undefined;
    buildWilsons(m, rng, options);

    const start: Point = [0, 0];
    const end: Point = [width - 1, height - 1];
    makeGap(m, start);
    makeGap(m, end);
    return { ...m, start, end };
}

function buildWilsons(m: MazeData, rng: Prando, options: MazeOptions) {

    const maze = new PointSet();
    const filleds = new PointSet();

    // initialize sets of spaces
    for (let y = 0; y < m.bounds.h; y++) {
        for (let x = 0; x < m.bounds.w; x++) {
            const p: Point = [x, y];
            const c = getCell(m, p);
            if (isInside(m, p) && c == FILLED) {
                filleds.add(p);
            } else {
                maze.add(p);
            }
        }
    }

    // if the maze is blank, add a random section
    // and build the maze.
    if (maze.length == 0) {
        const p: Point = [
            rng.nextInt(1, m.bounds.w - 2),
            rng.nextInt(1, m.bounds.h - 2)];
        const edge = 1 << rng.nextInt(0, 3);
        removeEdge(m, p, edge);

        return buildWilsons(m, rng, options);
    }


    while (filleds.length != 0) {
        const walk = new PointSet();
        let p = filleds.at(rng.nextInt(0, filleds.length - 1));
        walk.add(p);
        let pp = p;
        let hasWalked = false;

        for (let i = 0; i < 100000; i++) {
            let rdir = rng.nextInt(0, 3);

            let np: Point = [0, 0];
            let j = 0;
            for (j = 0; j < 5; j++) {
                rdir = (rdir + 1) % 4;
                np = advance(p, 1 << rdir);

                if ((pp[0] != np[0] || pp[1] != np[1]) &&
                    isInside(m, np)) {
                    break;
                }

                if (j >= 4) {
                    debugger;
                }
            }

            if (walk.has(np)) {
                // loop. Remove the loop.
                // console.log(`loop! [${np[0]},${np[1]}] is at index ${walk.indexOf(np)}`);
                walk.removeAfter(np);
            }

            walk.add(np);
            //console.log(walk.debugstr);
            if (!walk.isContiguous()) {
                debugger;
            }

            pp = p;
            p = np;

            if (maze.has(np)) {
                // we have found the maze. np is inside the maze
                for (let i = 1; i < walk.length; i++) {
                    const p = walk.at(i);
                    const pp = walk.at(i - 1);
                    if (pp[0] == p[0] - 1) {
                        removeEdge(m, p, L);
                    } else if (pp[1] == p[1] - 1) {
                        removeEdge(m, p, T);
                    } else if (pp[0] == p[0] + 1) {
                        removeEdge(m, p, R);
                    } else if (pp[1] == p[1] + 1) {
                        removeEdge(m, p, B);
                    } else {
                        console.error("invalid walk");
                        debugger;
                        break;
                    }
                    const hasAdded = maze.add(pp);
                    console.assert(hasAdded);
                    const hasRemoved = filleds.remove(pp);
                    console.assert(hasRemoved);
                }
                hasWalked = true;
                break;
            }
        }

        if (!hasWalked) {
            console.error('Could not walk');
            return;
        }
    }
}

function buildRandomizedDepthFirst(m: MazeData, rng: Prando) {

    const start: Point = [0, 0];
    while (!isInside(m, start)) {
        start[0] = start[0] + 1;
        if (start[0] > m.bounds.w) {
            start[1] = start[1] + 1;
            start[0] = 0;
        }
    }

    const s = [start];

    while (s.length > 0) {
        const p = s.pop()!;
        const initialDirection = rng.nextInt(0, 3);
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

export function solve(m: MazeData, start: Point, end: Point): Point[] | undefined {
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

export function drawMazeLine(ctx: CanvasRenderingContext2D, pts: Point[]) {
    if (pts.length <= 1) {
        return;
    }

    const po = 0.75;
    ctx.translate(po, po);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.translate(-po, -po);
}

export class PointSet {
    array = new Array<number>();

    add(p: Point) {
        if (p[0] < 0 || p[0] >= 65536 ||
            p[1] < 0 || p[1] >= 65536) {
            debugger;
            return false;
        }
        const n = this.#pspec(p);
        if (this.array.indexOf(n) != -1) {
            return false;
        }
        this.array.push(n);
        return true;
    }

    remove(p: Point) {
        const n = this.#pspec(p);
        const ix = this.array.indexOf(n);
        if (ix == -1) {
            return false;
        }
        const spliced = this.array.splice(ix, 1);
        console.assert(spliced.length == 1);
        return true;
    }

    has(p: Point) {
        return this.indexOf(p) != -1;
    }

    indexOf(p: Point) {
        const n = this.#pspec(p);
        const ix = this.array.indexOf(n);
        return ix;
    }

    at(index: number): Point {
        console.assert(index >= 0 && index < this.array.length);
        return this.#unspec(this.array[index]);
    }

    removeAfter(p: Point) {
        const n = this.#pspec(p);
        const ix = this.array.indexOf(n);
        console.assert(ix != -1);
        if (ix == -1) {
            return 0;
        }

        const deleted = this.array.splice(ix);
        return deleted.length;
    }

    get length() {
        return this.array.length;
    }

    get debugstr() {
        if (this.array.length == 0) {
            return "<empty>";
        }

        let s = "";
        for (let i = 0; i < this.array.length; i++) {
            const p = this.#unspec(this.array[i]);
            s += `[${p[0]},${p[1]}] `;
        }
        return s;
    }

    isContiguous(): boolean {
        if (this.array.length <= 1) {
            return true;
        }

        for (let i = 1; i < this.array.length; i++) {
            const p = this.#unspec(this.array[i]);
            const q = this.#unspec(this.array[i - 1]);
            if (p[0] == q[0] && p[1] == q[1]) {
                return false;
            }
            const joined = (
                (p[0] == q[0] - 1 && p[1] == q[1]) ||
                (p[0] == q[0] + 1 && p[1] == q[1]) ||
                (p[0] == q[0] && p[1] == q[1] - 1) ||
                (p[0] == q[0] && p[1] == q[1] + 1));
            if (!joined) {
                return false;
            }
        }

        return true;
    }

    #pspec(p: Point) {
        return p[0] << 16 | p[1];
    }

    #unspec(n: number): Point {
        return [n >> 16, n & 0xffff];
    }
}
