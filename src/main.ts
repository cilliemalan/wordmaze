import './style.css'
import { generate, draw } from './maze'

const canvas = document.querySelector("canvas")!;
const cellSize = 64;

debugger;
const maze = generate({
    width: canvas.width / cellSize,
    height: canvas.height / cellSize,
    seed: "123",
    text: "Hello"
});

const ctx = canvas.getContext("2d")!;
draw(ctx, maze, cellSize);
