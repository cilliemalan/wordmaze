import './style.css'
import { generate, draw, type MazeData, drawSolution, MazeDataWithStartAndEnd } from './maze'

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const mazew = 60;
const mazeh = 30;

let maze: MazeDataWithStartAndEnd;

function generateMaze() {
    maze = generate({
        width: mazew,
        height: mazeh,
        seed: Math.random().toString(),
        text: "Hello"
    });
}

function drawMaze() {
    const w = innerWidth;
    const h = innerHeight;
    const mw = maze.bounds.w;
    const mh = maze.bounds.h;
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

    ctx.strokeStyle = "rgb(0,0,255)";
    ctx.lineWidth = 0.25;
    drawSolution(ctx, maze);
}

addEventListener('resize', () => {
    drawMaze();
});

addEventListener('load', () => {
    generateMaze();
    drawMaze();
});
