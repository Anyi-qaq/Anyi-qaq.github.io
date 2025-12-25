<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";
import { fade, fly, slide } from "svelte/transition";
import { audioContextStore } from "../store/audioStore";

// Props
interface Props {
	playlistId?: string;
	autoplay?: boolean;
	volume?: number;
}

let {
	playlistId: initialPlaylistId = "3778678",
	autoplay = false,
	volume = 0.5,
}: Props = $props();

// State
let playlistId = $state(initialPlaylistId);
let isExpanded = $state(false);
let isPlaying = $state(false);
let isLoading = $state(true);
let currentTime = $state(0);
let duration = $state(0);
let currentVolume = $state(volume);
let isMuted = $state(false);
let currentTrackIndex = $state(0);
let playMode = $state<"order" | "random" | "loop">("order");
let isSettingsOpen = $state(false);
let isListExpanded = $state(false);
let inputPlaylistId = $state(initialPlaylistId);
let useVisualizer = $state(true); // Attempt visualizer by default

// Track list
let tracks = $state<
	Array<{
		name: string;
		artist: string;
		url: string;
		pic: string;
		lrc?: string;
	}>
>([]);

// Audio element reference
let audioRef: HTMLAudioElement | null = $state(null);

// Computed
let currentTrack = $derived(tracks[currentTrackIndex] || null);
let progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

// Format time
function formatTime(seconds: number): string {
	if (!seconds || !Number.isFinite(seconds)) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Fetch playlist
async function fetchPlaylist() {
	try {
		isLoading = true;
		const response = await fetch(
			`https://api.injahow.cn/meting/?type=playlist&id=${playlistId}`,
		);
		const data = await response.json();
		if (Array.isArray(data) && data.length > 0) {
			tracks = data;
			isLoading = false;
		} else {
			console.error("No tracks found in playlist");
			isLoading = false;
		}
	} catch (error) {
		console.error("Failed to fetch playlist:", error);
		isLoading = false;
	}
}

// Play/Pause toggle
function togglePlay() {
	if (!audioRef || !currentTrack) return;

	if (isPlaying) {
		audioRef.pause();
	} else {
		audioRef.play();
	}
}

// Previous track
function prevTrack() {
	if (tracks.length === 0) return;

	if (playMode === "random") {
		currentTrackIndex = Math.floor(Math.random() * tracks.length);
	} else {
		currentTrackIndex =
			currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
	}
}

// Next track
function nextTrack() {
	if (tracks.length === 0) return;

	if (playMode === "random") {
		currentTrackIndex = Math.floor(Math.random() * tracks.length);
	} else {
		currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
	}
}

// Handle track end
function handleEnded() {
	if (playMode === "loop") {
		if (audioRef) {
			audioRef.currentTime = 0;
			audioRef.play();
		}
	} else {
		nextTrack();
	}
}

// Toggle play mode
function togglePlayMode() {
	if (playMode === "order") {
		playMode = "random";
	} else if (playMode === "random") {
		playMode = "loop";
	} else {
		playMode = "order";
	}
}

// Seek
function handleSeek(event: MouseEvent) {
	if (!audioRef || !duration) return;

	const target = event.currentTarget as HTMLElement;
	const rect = target.getBoundingClientRect();
	const percent = (event.clientX - rect.left) / rect.width;
	audioRef.currentTime = percent * duration;
}

// Volume change
function handleVolumeChange(event: Event) {
	const target = event.target as HTMLInputElement;
	currentVolume = Number.parseFloat(target.value);
	if (audioRef) {
		audioRef.volume = currentVolume;
	}
	if (currentVolume > 0) {
		isMuted = false;
	}
}

// Toggle mute
function toggleMute() {
	if (audioRef) {
		isMuted = !isMuted;
		audioRef.muted = isMuted;
	}
}

// Update playlist ID
function updatePlaylistId() {
	if (inputPlaylistId && inputPlaylistId.trim() !== "") {
		playlistId = inputPlaylistId.trim();
		fetchPlaylist();
		isSettingsOpen = false;
	}
}

// Watch for track changes
$effect(() => {
	if (currentTrack && audioRef) {
		audioRef.src = currentTrack.url;
		if (useVisualizer) {
			audioRef.crossOrigin = "anonymous";
		} else {
			audioRef.crossOrigin = null;
		}
		audioRef.load();
		if (isPlaying || autoplay) {
			audioRef.play().catch(() => {
				// Autoplay might be blocked
				isPlaying = false;
			});
		}
	}
});

// Handle audio error (likely CORS if useVisualizer is true)
function handleAudioError() {
	if (useVisualizer) {
		console.warn(
			"Audio load failed with CORS, falling back to non-visualizer mode",
		);
		useVisualizer = false;
		if (audioRef) {
			audioRef.crossOrigin = null;
			audioRef.load();
			audioRef.play().catch(console.error);
		}
	}
}

// Initialize
onMount(() => {
	// Restore state from localStorage
	if (typeof window !== "undefined") {
		const savedState = localStorage.getItem("musicPlayerState");
		if (savedState) {
			try {
				const state = JSON.parse(savedState);
				isExpanded = state.isExpanded ?? false;
				currentVolume = state.volume ?? volume;
				playMode = state.playMode ?? "order";
				if (state.customPlaylistId) {
					playlistId = state.customPlaylistId;
					inputPlaylistId = playlistId;
				}
			} catch {
				// Ignore parse errors
			}
		}
	}
	fetchPlaylist();
});

// Save state to localStorage
$effect(() => {
	if (typeof window !== "undefined") {
		localStorage.setItem(
			"musicPlayerState",
			JSON.stringify({
				isExpanded,
				volume: currentVolume,
				playMode,
				customPlaylistId: playlistId,
			}),
		);
	}
});

// Get play mode icon
function getPlayModeIcon(): string {
	switch (playMode) {
		case "random":
			return "material-symbols:shuffle";
		case "loop":
			return "material-symbols:repeat-one";
		default:
			return "material-symbols:repeat";
	}
}

// Get play mode title
function getPlayModeTitle(): string {
	switch (playMode) {
		case "random":
			return "随机播放";
		case "loop":
			return "单曲循环";
		default:
			return "顺序播放";
	}
}

// Initialize Audio Context
function initAudioContext() {
	if (!audioRef || $audioContextStore.audioContext) return;

	try {
		const AudioContext =
			window.AudioContext || (window as any).webkitAudioContext;
		const ctx = new AudioContext();
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 512;

		const source = ctx.createMediaElementSource(audioRef);
		source.connect(analyser);
		analyser.connect(ctx.destination);

		audioContextStore.set({
			audioContext: ctx,
			analyser: analyser,
			source: source,
		});
	} catch (e) {
		console.error("Failed to init audio context:", e);
	}
}

// Keyboard Controls
function handleKeydown(event: KeyboardEvent) {
	if (!isExpanded) return;
	switch (event.key) {
		case " ":
			event.preventDefault();
			togglePlay();
			break;
		case "ArrowLeft":
			event.preventDefault();
			prevTrack();
			break;
		case "ArrowRight":
			event.preventDefault();
			nextTrack();
			break;
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Audio Element -->
<audio
	bind:this={audioRef}
	bind:currentTime
	bind:duration
	onplay={() => {
        isPlaying = true;
        if (useVisualizer) {
            initAudioContext();
        }
        if ($audioContextStore.audioContext?.state === 'suspended') {
            $audioContextStore.audioContext.resume();
        }
    }}
	onpause={() => (isPlaying = false)}
	onended={handleEnded}
    onerror={handleAudioError}
	volume={currentVolume}
></audio>

<!-- Music Player Container -->
<div class="fixed bottom-4 right-4 z-[100] font-sans">
	{#if isExpanded}
		<!-- Expanded View -->
		<div
            class="float-panel w-80 p-4 transition-all duration-300"
            role="region"
            aria-label="音乐播放器"
            transition:fly={{ y: 20, duration: 300 }}
        >
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2 text-[var(--primary)] font-bold">
                    <span class="text-xl">🎵</span>
                    <span>音乐播放器</span>
                </div>
				<div class="flex items-center gap-1">
					<button
						type="button"
						class="btn-plain w-8 h-8 rounded-md flex items-center justify-center p-0"
						onclick={() => (isSettingsOpen = !isSettingsOpen)}
                        class:text-[var(--primary)]={isSettingsOpen}
						title="设置"
						aria-label="设置"
					>
						<Icon icon="material-symbols:settings-outline" class="text-xl" />
					</button>
					<button
						type="button"
						class="btn-plain w-8 h-8 rounded-md flex items-center justify-center p-0"
						onclick={() => (isExpanded = false)}
						aria-label="最小化"
					>
						<Icon icon="material-symbols:remove" class="text-xl" />
					</button>
				</div>
			</div>

			{#if isSettingsOpen}
				<div class="mb-4 bg-[var(--card-bg)] rounded-xl p-3 border border-black/5 dark:border-white/5" transition:slide>
					<div class="text-sm font-bold mb-2 text-black/90 dark:text-white/90">设置歌单码</div>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={inputPlaylistId}
							placeholder="输入网易云歌单ID"
							class="flex-1 bg-[var(--page-bg)] text-black/90 dark:text-white/90 border border-black/5 dark:border-white/5 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)] transition-colors"
						/>
						<button
							type="button"
							class="btn-regular rounded-lg px-3 py-1.5 text-sm font-bold"
							onclick={updatePlaylistId}
						>
							保存
						</button>
					</div>
					<div class="text-xs text-black/40 dark:text-white/40 mt-2">输入 ID 后点击保存将重新加载歌单</div>
				</div>
			{/if}

			<!-- Cover Art -->
			<div class="flex justify-center mb-6 relative">
                <div class="w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-[var(--card-bg)] relative z-10 transition-transform duration-[8s] ease-linear" class:animate-spin-slow={isPlaying}>
				{#if currentTrack?.pic}
					<img
						src={currentTrack.pic}
						alt={currentTrack.name}
						class="w-full h-full object-cover"
					/>
				{:else}
					<div class="w-full h-full flex items-center justify-center bg-[var(--page-bg)] text-4xl text-black/20 dark:text-white/20">🎵</div>
				{/if}
                </div>
                <!-- Glow effect behind cover -->
                <div class="absolute inset-0 bg-[var(--primary)] opacity-20 blur-3xl transform scale-150 -z-0 rounded-full"></div>
			</div>

			<!-- Track Info -->
			<div class="text-center mb-6">
				{#if isLoading}
					<div class="text-lg font-bold text-black/90 dark:text-white/90 mb-1">加载中...</div>
					<div class="text-sm text-black/50 dark:text-white/50">请稍候</div>
				{:else if currentTrack}
					<div class="text-lg font-bold text-black/90 dark:text-white/90 mb-1 truncate px-4" title={currentTrack.name}>
						{currentTrack.name}
					</div>
					<div class="text-sm text-black/50 dark:text-white/50 truncate px-4" title={currentTrack.artist}>
						{currentTrack.artist}
					</div>
				{:else}
					<div class="text-lg font-bold text-black/90 dark:text-white/90 mb-1">暂无歌曲</div>
					<div class="text-sm text-black/50 dark:text-white/50">请检查歌单</div>
				{/if}
			</div>

			<!-- Progress Bar -->
			<div class="flex items-center gap-3 mb-6 px-2">
				<span class="text-xs text-black/40 dark:text-white/40 min-w-[32px] text-right">{formatTime(currentTime)}</span>
				<div
					class="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full cursor-pointer relative group"
					onclick={handleSeek}
                    onkeydown={() => {}}
                    role="slider"
                    aria-valuenow={progress}
                    tabindex="0"
				>
					<div class="absolute top-0 left-0 h-full bg-[var(--primary)] rounded-full transition-all duration-100" style="width: {progress}%">
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"></div>
                    </div>
				</div>
				<span class="text-xs text-black/40 dark:text-white/40 min-w-[32px]">{formatTime(duration)}</span>
			</div>

			<!-- Controls -->
			<div class="flex items-center justify-center gap-4 mb-4">
				<button
					type="button"
					class="btn-plain w-10 h-10 rounded-full hover:text-[var(--primary)] flex items-center justify-center p-0"
					onclick={togglePlayMode}
					title={getPlayModeTitle()}
				>
                    <Icon icon={getPlayModeIcon()} class="text-2xl" />
				</button>
				<button
					type="button"
					class="btn-plain w-10 h-10 rounded-full hover:text-[var(--primary)] flex items-center justify-center p-0"
					onclick={prevTrack}
					aria-label="上一首"
				>
					<Icon icon="material-symbols:skip-previous" class="text-3xl" />
				</button>
				<button
					type="button"
					class="flex items-center justify-center w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg shadow-[var(--primary)]/30 hover:shadow-[var(--primary)]/50 hover:scale-105 active:scale-95 transition-all p-0"
					onclick={togglePlay}
					disabled={isLoading || !currentTrack}
					aria-label={isPlaying ? "暂停" : "播放"}
				>
					{#if isPlaying}
                        <Icon icon="material-symbols:pause" class="text-4xl" />
					{:else}
                        <Icon icon="material-symbols:play-arrow" class="text-4xl" />
					{/if}
				</button>
				<button
					type="button"
					class="btn-plain w-10 h-10 rounded-full hover:text-[var(--primary)] flex items-center justify-center p-0"
					onclick={nextTrack}
					aria-label="下一首"
				>
					<Icon icon="material-symbols:skip-next" class="text-3xl" />
				</button>
                <div class="relative group">
                    <button
                        type="button"
                        class="btn-plain w-10 h-10 rounded-full hover:text-[var(--primary)] flex items-center justify-center p-0"
                        onclick={toggleMute}
                        aria-label={isMuted ? "取消静音" : "静音"}
                    >
                        {#if isMuted || currentVolume === 0}
                            <Icon icon="material-symbols:volume-off" class="text-2xl" />
                        {:else if currentVolume < 0.5}
                            <Icon icon="material-symbols:volume-down" class="text-2xl" />
                        {:else}
                            <Icon icon="material-symbols:volume-up" class="text-2xl" />
                        {/if}
                    </button>
                    <!-- Volume Slider Popup -->
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-8 h-24 bg-[var(--card-bg)] rounded-full shadow-lg border border-black/5 dark:border-white/5 flex items-end justify-center py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={currentVolume}
                            oninput={handleVolumeChange}
                            class="volume-slider absolute appearance-none w-16 h-1 bg-transparent rotate-[-90deg] origin-center cursor-pointer"
                        />
                         <!-- Custom track for slider vertical -->
                         <div class="w-1 h-16 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden relative pointer-events-none">
                             <div class="absolute bottom-0 left-0 w-full bg-[var(--primary)]" style="height: {currentVolume * 100}%"></div>
                         </div>
                    </div>
                </div>
			</div>

			<div class="max-h-40 overflow-y-auto no-scrollbar scroll-smooth">
				{#each (isListExpanded ? tracks : tracks.slice(0, 3)) as track, index}
					<button
						type="button"
						class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
						class:text-[var(--primary)]={index === currentTrackIndex}
						onclick={() => (currentTrackIndex = index)}
					>
						<span class="text-xs opacity-50 font-mono w-4">{index + 1}</span>
						<div class="flex-1 min-w-0">
                            <div class="text-sm font-medium truncate {index === currentTrackIndex ? 'text-[var(--primary)]' : 'text-black/80 dark:text-white/80'}">{track.name}</div>
                            <div class="text-xs opacity-50 truncate">{track.artist}</div>
                        </div>
                        {#if index === currentTrackIndex && isPlaying}
                            <Icon icon="material-symbols:equalizer" class="text-lg animate-pulse" />
                        {/if}
					</button>
				{/each}
				{#if tracks.length > 3}
					<button
						type="button"
						class="w-full text-center text-xs text-black/40 dark:text-white/40 py-2 hover:text-[var(--primary)] transition-colors"
						onclick={() => (isListExpanded = !isListExpanded)}
					>
						{isListExpanded ? "收起列表" : `还有 ${tracks.length - 3} 首...`}
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Minimized View -->
		<button
			type="button"
			class="relative w-14 h-14 rounded-full bg-[var(--card-bg)] shadow-[var(--card-shadow)] flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 group border border-black/5 dark:border-white/5"
			onclick={() => (isExpanded = true)}
            aria-label="展开音乐播放器"
            transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="w-10 h-10 rounded-full overflow-hidden relative">
				{#if currentTrack?.pic}
					<img src={currentTrack.pic} alt="" class="w-full h-full object-cover {isPlaying ? 'animate-spin-slow' : ''}" />
				{:else}
					<div class="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center">🎵</div>
				{/if}
                <!-- Overlay mask -->
                <div class="absolute inset-0 bg-black/10 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
			</div>
            <!-- Playing Indicator ring -->
			{#if isPlaying}
				<div class="absolute -inset-1 border-2 border-[var(--primary)] rounded-full animate-ping opacity-20"></div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--card-bg)] rounded-full flex items-center justify-center shadow-sm">
                    <Icon icon="material-symbols:music-note" class="text-xs text-[var(--primary)]" />
                </div>
			{/if}
		</button>
	{/if}
</div>

<style>
/* Custom utility for slow spin */
.animate-spin-slow {
    animation: spin 8s linear infinite;
}
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
/* Hide default range input appearance */
.volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    opacity: 0;
}
.volume-slider::-moz-range-thumb {
    opacity: 0;
}
</style>
