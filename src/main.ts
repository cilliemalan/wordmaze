import './style.css'
import { generate, draw, advance, MazeDataWithStartAndEnd, Point, solve, T, R, B, L, getCell, isInside } from './maze'

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const mazew = 64;
const mazeh = 32;
let points: Point[] = [];
let isFullScreen = false;

const image = Uint8Array.from([
    0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x3f, 0xff, 0x8f, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x80, 0x1c, 0x27, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xdd, 0xf0, 0x3f, 0xff, 0xff, 0xff, 0xff,
    0xf8, 0x1d, 0xff, 0x84, 0x01, 0xff, 0xff, 0xff,
    0xfb, 0xfd, 0xff, 0xf5, 0xfd, 0xfc, 0x3f, 0xff,
    0xfb, 0xfd, 0xff, 0xe4, 0xfd, 0xfd, 0xbf, 0xff,
    0xfb, 0xfd, 0xff, 0xce, 0x7d, 0xfd, 0xb0, 0xff,
    0xfb, 0xfd, 0xff, 0x9f, 0x3c, 0xf9, 0xa6, 0x7f,
    0xfa, 0x05, 0xff, 0xbf, 0xbe, 0xfb, 0x8f, 0x3f,
    0xfa, 0xf5, 0xff, 0xbf, 0xbe, 0x73, 0xff, 0xbf,
    0xc2, 0x14, 0x03, 0x9f, 0x3f, 0x77, 0xc0, 0x3f,
    0xdf, 0xd7, 0xfb, 0xce, 0x7f, 0x27, 0xdf, 0xff,
    0xc0, 0x10, 0x03, 0xe0, 0xff, 0x8f, 0xcf, 0x1f,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xe6, 0x5f,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf0, 0xdf,
    0x1f, 0xc1, 0x87, 0xff, 0xff, 0xff, 0xff, 0xc3,
    0x4f, 0x9d, 0x37, 0xff, 0x08, 0x7f, 0xff, 0xfb,
    0x67, 0x3d, 0x73, 0xff, 0x6b, 0x7f, 0xfc, 0x7b,
    0x72, 0x7d, 0x7b, 0xff, 0x6b, 0x7c, 0x79, 0x3b,
    0x3a, 0xfd, 0x1b, 0xff, 0x6b, 0x79, 0x33, 0x9b,
    0x3a, 0xf9, 0xc9, 0xc7, 0x6b, 0x43, 0x97, 0xc3,
    0x3a, 0xf3, 0xe5, 0xd7, 0x6b, 0x5f, 0xd3, 0xff,
    0x1a, 0xf7, 0xf5, 0xd7, 0x63, 0x50, 0x18, 0x1f,
    0x1a, 0xf7, 0xf5, 0xd3, 0x7f, 0x57, 0xff, 0xdf,
    0x1a, 0xf3, 0xe5, 0xdb, 0x7f, 0x53, 0xe3, 0xd8,
    0x18, 0xf9, 0xcd, 0xd9, 0x7f, 0x59, 0xe9, 0x98,
    0x1f, 0xfc, 0x1c, 0x1c, 0x7f, 0x1c, 0x0c, 0x38,
    0x03, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf8,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

let maze: MazeDataWithStartAndEnd;


function drawMazeLine(ctx: CanvasRenderingContext2D, pts: Point[]) {
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

async function generateMaze() {
    maze = generate({
        width: mazew,
        height: mazeh,
        seed: Math.random().toString(),
        text: "Hello",
        image
    });
    points = [advance(maze.start, (~getCell(maze, maze.start)) & 0x0f), maze.start];

    drawMaze(maze);
}

function drawMaze(maze: MazeDataWithStartAndEnd) {
    const w = innerWidth;
    const h = innerHeight;
    const mw = maze.stride
    const mh = maze.data.length / mw;
    maze = { ...maze, bounds: { x: 0, y: 0, w: mw, h: mh } };
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgb(255,0,0)";
    ctx.lineWidth = 1;

    let scale = w / (mw + 0.5);
    if ((mh + 0.5) * scale > h) {
        scale = h / (mh + 0.5);
    }
    let xoff = -(((mw + 0.5) * scale) - w) / 2;
    let yoff = -(((mh + 0.5) * scale) - h) / 2;
    ctx.translate(xoff, yoff);
    ctx.scale(scale, scale);
    ctx.lineWidth = 0.5;

    ctx.strokeStyle = "rgb(0,0,0)";
    draw(ctx, maze);

    ctx.lineWidth = 0.25;
    if (points && points.length > 1) {
        const fp = points[1];
        const lp = points[points.length - 1];
        if (fp[0] == maze.start[0] && fp[1] == maze.start[1] &&
            lp[0] == maze.end[0] && lp[1] == maze.end[1]) {
            ctx.strokeStyle = "rgb(0,255,0)";
        } else {
            ctx.strokeStyle = "rgb(0,0,255)";
        }
        drawMazeLine(ctx, points);
    }
}

addEventListener('resize', () => {
    drawMaze(maze);
});

addEventListener('load', () => {
    generateMaze();
});

(window as any).cheat = function () {
    points = solve(maze, maze.start, maze.end) ?? points;
    points = [[-1, 0], ...points];
    drawMaze(maze);
}

function move(edge: number) {
    if (!points || !points.length) {
        return;
    }

    const pp = points[points.length - 2];
    const p = points[points.length - 1];
    const np = advance(p, edge);
    const v = getCell(maze, p);
    if (pp && np[0] == pp[0] && np[1] == pp[1] && isInside(maze, pp)) {
        points.pop();
        drawMaze(maze);
    } else if ((v & edge) == 0 && isInside(maze, np)) {
        points.push(np);
        drawMaze(maze);
    }

    if (!isFullScreen) {
        canvas.requestFullscreen();
        isFullScreen = true;
    }
}
canvas.addEventListener('dblclick', () => {
    canvas.requestFullscreen();
});
function up() { move(T); }
function left() { move(L); }
function down() { move(B); }
function right() { move(R); }
document.addEventListener('swiped-up', up);
document.addEventListener('swiped-left', left);
document.addEventListener('swiped-down', down);
document.addEventListener('swiped-right', right);
const downKeys = new Set<string>();
window.addEventListener('keydown', e => {
    if (!downKeys.has(e.key)) {
        downKeys.add(e.key);

        switch (e.key) {
            case "ArrowDown": down(); break;
            case "ArrowUp": up(); break;
            case "ArrowLeft": left(); break;
            case "ArrowRight": right(); break;
        }
    }
});
window.addEventListener('keyup', e => {
    downKeys.delete(e.key);
});