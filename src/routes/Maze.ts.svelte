<script lang="ts">
    import { onMount } from "svelte";
    import { generate, type MazeData } from "../lib/generation";
    import * as maze from "../lib/generation";

    export let text = "";
    export let seed = "";

    const cellSize = 64;
    let canvasElement: HTMLCanvasElement;

    function drawMaze(m: MazeData) {
        const ctx = canvasElement.getContext("2d");
        if (!ctx) {
            return;
        }

        ctx?.clearRect(0, 0, canvasElement.width, canvasElement.height);
        maze.draw(ctx, m, 64);
    }

    $: drawMaze(
        generate({
            width: canvasElement.width / cellSize,
            height: canvasElement.height / cellSize,
            seed,
            text,
        }),
    );
</script>

<canvas bind:this={canvasElement}></canvas>
