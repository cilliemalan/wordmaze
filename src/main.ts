import './style.css'
import { generate, draw, type MazeData, drawSolution, MazeDataWithStartAndEnd } from './maze'

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const mazew = 64;
const mazeh = 32;

let maze: MazeDataWithStartAndEnd;

async function generateMaze() {
    maze = await generate({
        width: mazew,
        height: mazeh,
        seed: Math.random().toString(),
        text: "Hello",
        drawfn: drawMaze
    });
    drawMaze(maze);
}

function drawMaze(maze: MazeData) {
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

    ctx.strokeStyle = "rgb(0,0,255)";
    ctx.lineWidth = 0.25;
    const mse = maze as MazeDataWithStartAndEnd;
    if (mse.start && mse.end) {
        drawSolution(ctx, mse);
    }
}

addEventListener('resize', () => {
    drawMaze(maze);
});

addEventListener('load', () => {
    generateMaze();
});
