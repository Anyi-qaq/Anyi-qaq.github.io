<script>
import { onMount } from "svelte";

let canvas;
let ctx;
let particles = [];
let mouse = { x: null, y: null, radius: 100 };
let animationFrameId;

// Configuration
const particleCount = 100;
const connectionDistance = 100;
const mouseRepelDistance = 100;
const particleSpeed = 0.5;

class Particle {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.vx = (Math.random() - 0.5) * particleSpeed;
		this.vy = (Math.random() - 0.5) * particleSpeed;
		this.size = Math.random() * 2 + 1;
		this.baseX = x;
		this.baseY = y;
		this.density = Math.random() * 30 + 1;
	}

	draw() {
		if (!ctx) return;
		ctx.fillStyle = "rgba(150, 150, 150, 0.8)"; // Light gray particles, adjustable
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
	}

	update() {
		// Mouse interaction
		if (mouse.x != null) {
			let dx = mouse.x - this.x;
			let dy = mouse.y - this.y;
			let distance = Math.sqrt(dx * dx + dy * dy);
			let forceDirectionX = dx / distance;
			let forceDirectionY = dy / distance;
			let maxDistance = mouse.radius;
			let force = (maxDistance - distance) / maxDistance;
			let directionX = forceDirectionX * force * this.density;
			let directionY = forceDirectionY * force * this.density;

			if (distance < mouse.radius) {
				this.x -= directionX;
				this.y -= directionY;
			}
		}

		// Movement
		this.x += this.vx;
		this.y += this.vy;

		// Bounce off edges
		if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
		if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

		// Keep within bounds (optional reset if stuck)
		if (this.x < 0) this.x = 0;
		if (this.x > canvas.width) this.x = canvas.width;
		if (this.y < 0) this.y = 0;
		if (this.y > canvas.height) this.y = canvas.height;
	}
}

function init() {
	particles = [];
	if (!canvas) return;
	for (let i = 0; i < particleCount; i++) {
		let x = Math.random() * canvas.width;
		let y = Math.random() * canvas.height;
		particles.push(new Particle(x, y));
	}
}

function connect() {
	for (let a = 0; a < particles.length; a++) {
		for (let b = a; b < particles.length; b++) {
			let dx = particles[a].x - particles[b].x;
			let dy = particles[a].y - particles[b].y;
			let distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < connectionDistance) {
				let opacity = 1 - distance / connectionDistance;
				ctx.strokeStyle = `rgba(150, 150, 150, ${opacity})`;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(particles[a].x, particles[a].y);
				ctx.lineTo(particles[b].x, particles[b].y);
				ctx.stroke();
			}
		}
	}
}

function animate() {
	if (!ctx || !canvas) return;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < particles.length; i++) {
		particles[i].update();
		particles[i].draw();
	}
	connect();
	animationFrameId = requestAnimationFrame(animate);
}

function handleResize() {
	if (!canvas) return;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	init();
}

function handleMouseMove(e) {
	mouse.x = e.x;
	mouse.y = e.y;
}

function handleMouseLeave() {
	mouse.x = null;
	mouse.y = null;
}

onMount(() => {
	if (!canvas) return;
	ctx = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	init();
	animate();

	window.addEventListener("resize", handleResize);
	window.addEventListener("mousemove", handleMouseMove);
	window.addEventListener("mouseout", handleMouseLeave);

	return () => {
		window.removeEventListener("resize", handleResize);
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseout", handleMouseLeave);
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
	};
});
</script>

<canvas
  bind:this={canvas}
  class="starry-sky"
></canvas>

<style>
  .starry-sky {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1; /* Behind everything */
    pointer-events: none; /* Let clicks pass through */
    background: transparent; /* Or a dark color if it replaces the background */
  }
</style>
