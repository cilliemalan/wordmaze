<script>
    import { onMount } from "svelte";
    import { generate } from "../lib/generation"

    /** @type {string} */
    export let text = "";

    /** @type {HTMLCanvasElement} */
    let canvasElement;

    onMount(() => {
        const ctx = canvasElement.getContext("2d");
    });
</script>

<canvas bind:this={canvasElement}></canvas>
