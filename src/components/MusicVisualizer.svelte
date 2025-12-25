<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { audioContextStore } from "../store/audioStore";

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null;
let animationId: number;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array;

// Configuration
const BAR_WIDTH = 6;
const GAP = 2;
const MAX_HEIGHT = 150;

// Update analyser reference when store changes
$: if ($audioContextStore.analyser) {
	analyser = $audioContextStore.analyser;
	const bufferLength = analyser.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);
	if (!animationId) {
		animate();
	}
}

function animate() {
	if (!canvas || !ctx || !analyser) {
		animationId = requestAnimationFrame(animate);
		return;
	}

	animationId = requestAnimationFrame(animate);

	analyser.getByteFrequencyData(dataArray as any);

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const bars = Math.floor(canvas.width / (BAR_WIDTH + GAP));
	// We only use a part of the frequency spectrum for better visuals (low to mid-high frequencies)
	const step = Math.floor(dataArray.length / bars);

	// Get primary color from CSS variable
	const style = getComputedStyle(document.body);
	const primaryColor = style.getPropertyValue("--primary") || "#20b2aa";

	for (let i = 0; i < bars; i++) {
		const dataIndex = i * step;
		// Average a few bins for smoothness
		let value = 0;
		let count = 0;
		for (let j = 0; j < step && dataIndex + j < dataArray.length; j++) {
			value += dataArray[dataIndex + j];
			count++;
		}
		value = value / count;

		const percent = value / 255;
		const barHeight = Math.max(4, percent * MAX_HEIGHT); // Min height of 4px

		const x = i * (BAR_WIDTH + GAP);
		const y = canvas.height - barHeight;

		// Gradient or solid color
		// Let's use the primary color with varying opacity based on volume
		ctx.fillStyle = primaryColor;
		ctx.globalAlpha = 0.3 + percent * 0.5; // 0.3 to 0.8 opacity

		// Rounded bars
		ctx.beginPath();
		if (ctx.roundRect) {
			ctx.roundRect(x, y, BAR_WIDTH, barHeight, 4);
		} else {
			ctx.rect(x, y, BAR_WIDTH, barHeight);
		}
		ctx.fill();
	}
}

function handleResize() {
	if (!canvas) return;
	canvas.width = window.innerWidth;
	canvas.height = MAX_HEIGHT + 20; // Slight buffer
}

onMount(() => {
	if (typeof window !== "undefined") {
		ctx = canvas.getContext("2d");
		handleResize();
		window.addEventListener("resize", handleResize);

		// Initial animation start if analyser is already there (unlikely but safe)
		if (analyser) animate();
	}
});

onDestroy(() => {
	if (typeof window !== "undefined") {
		window.removeEventListener("resize", handleResize);
		cancelAnimationFrame(animationId);
	}
});
</script>

<div class="visualizer-container">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    .visualizer-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 200px; /* Container height */
        z-index: 0; /* Behind content but above background */
        pointer-events: none;
        display: flex;
        align-items: flex-end;
    }
    
    canvas {
        width: 100%;
        height: 100%;
    }
</style>
