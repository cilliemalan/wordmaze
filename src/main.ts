import './style.css'
import { generate, draw, type MazeData } from './maze'

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const mazew = 60;
const mazeh = 30;

let maze: MazeData;

function generateMaze() {
    maze = generate({
        width: mazew,
        height: mazeh,
        seed: "123",
        text: "Hello"
    });
}

function drawMaze() {
    const w = innerWidth;
    const h = innerHeight;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.fillStyle = "rgb(255,0,0)";
    ctx.lineWidth = 1;

    let scale = w / (maze.width + 0.5);
    if ((maze.height + 0.5) * scale > h) {
        scale = h / (maze.height + 0.5);
    }
    let xoff = -(((maze.width + 0.5) * scale) - w) / 2;
    let yoff = -(((maze.height + 0.5) * scale) - h) / 2;
    ctx.translate(xoff, yoff);
    ctx.scale(scale, scale);
    ctx.lineWidth = 0.5;
    draw(ctx, maze);
}

addEventListener('resize', () => {
    drawMaze();
});

addEventListener('load', () => {
    generateMaze();
    drawMaze();
});
