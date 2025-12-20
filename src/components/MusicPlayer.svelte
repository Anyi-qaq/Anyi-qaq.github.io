<script lang="ts">
import { onMount } from "svelte";

// Props
interface Props {
	playlistId?: string;
	autoplay?: boolean;
	volume?: number;
}

let {
	playlistId = "3778678",
	autoplay = false,
	volume = 0.5,
}: Props = $props();

// State
let isExpanded = $state(false);
let isPlaying = $state(false);
let isLoading = $state(true);
let currentTime = $state(0);
let duration = $state(0);
let currentVolume = $state(volume);
let isMuted = $state(false);
let currentTrackIndex = $state(0);
let playMode = $state<"order" | "random" | "loop">("order");
let showVolumeSlider = $state(false);
let isSettingsOpen = $state(false);
let isListExpanded = $state(false);
let inputPlaylistId = $state(playlistId);

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
		audioRef.load();
		if (isPlaying || autoplay) {
			audioRef.play().catch(() => {
				// Autoplay might be blocked
				isPlaying = false;
			});
		}
	}
});

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
			return "🔀";
		case "loop":
			return "🔂";
		default:
			return "🔁";
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
</script>

<!-- Audio Element -->
<audio
	bind:this={audioRef}
	bind:currentTime
	bind:duration
	onplay={() => (isPlaying = true)}
	onpause={() => (isPlaying = false)}
	onended={handleEnded}
	volume={currentVolume}
></audio>

<!-- Music Player Container -->
<div
	class="music-player"
	class:expanded={isExpanded}
	role="region"
	aria-label="音乐播放器"
>
	{#if isExpanded}
		<!-- Expanded View -->
		<div class="player-expanded">
			<!-- Header -->
			<div class="player-header">
				<span class="player-title">🎵 音乐播放器</span>
				<div class="header-btns">
					<button
						type="button"
						class="header-icon-btn"
						onclick={() => (isSettingsOpen = !isSettingsOpen)}
						title="设置"
						aria-label="设置"
					>
						⚙️
					</button>
					<button
						type="button"
						class="minimize-btn"
						onclick={() => (isExpanded = false)}
						aria-label="最小化"
					>
						−
					</button>
				</div>
			</div>

			{#if isSettingsOpen}
				<div class="settings-panel">
					<div class="settings-title">设置歌单码</div>
					<div class="settings-input-group">
						<input
							type="text"
							bind:value={inputPlaylistId}
							placeholder="输入网易云歌单ID"
							class="settings-input"
						/>
						<button
							type="button"
							class="settings-btn"
							onclick={updatePlaylistId}
						>
							保存
						</button>
					</div>
					<div class="settings-hint">输入 ID 后点击保存将重新加载歌单</div>
				</div>
			{/if}

			<!-- Cover Art -->
			<div class="cover-container">
				{#if currentTrack?.pic}
					<img
						src={currentTrack.pic}
						alt={currentTrack.name}
						class="cover-art"
						class:spinning={isPlaying}
					/>
				{:else}
					<div class="cover-placeholder" class:spinning={isPlaying}>🎵</div>
				{/if}
			</div>

			<!-- Track Info -->
			<div class="track-info">
				{#if isLoading}
					<div class="track-name">加载中...</div>
					<div class="track-artist">请稍候</div>
				{:else if currentTrack}
					<div class="track-name" title={currentTrack.name}>
						{currentTrack.name}
					</div>
					<div class="track-artist" title={currentTrack.artist}>
						{currentTrack.artist}
					</div>
				{:else}
					<div class="track-name">暂无歌曲</div>
					<div class="track-artist">请检查歌单</div>
				{/if}
			</div>

			<!-- Progress Bar -->
			<div class="progress-container">
				<span class="time-display">{formatTime(currentTime)}</span>
				<button
					type="button"
					class="progress-bar"
					onclick={handleSeek}
					aria-label="进度条"
				>
					<div class="progress-fill" style="width: {progress}%"></div>
				</button>
				<span class="time-display">{formatTime(duration)}</span>
			</div>

			<!-- Controls -->
			<div class="controls">
				<button
					type="button"
					class="control-btn mode-btn"
					onclick={togglePlayMode}
					title={getPlayModeTitle()}
				>
					{getPlayModeIcon()}
				</button>
				<button
					type="button"
					class="control-btn"
					onclick={prevTrack}
					aria-label="上一首"
				>
					⏮
				</button>
				<button
					type="button"
					class="control-btn play-btn"
					onclick={togglePlay}
					disabled={isLoading || !currentTrack}
					aria-label={isPlaying ? "暂停" : "播放"}
				>
					{#if isPlaying}
						⏸
					{:else}
						▶
					{/if}
				</button>
				<button
					type="button"
					class="control-btn"
					onclick={nextTrack}
					aria-label="下一首"
				>
					⏭
				</button>
				<div class="volume-container">
					<button
						type="button"
						class="control-btn"
						onclick={toggleMute}
						onmouseenter={() => (showVolumeSlider = true)}
						aria-label={isMuted ? "取消静音" : "静音"}
					>
						{#if isMuted || currentVolume === 0}
							🔇
						{:else if currentVolume < 0.5}
							🔉
						{:else}
							🔊
						{/if}
					</button>
					{#if showVolumeSlider}
						<div
							class="volume-slider-container"
							onmouseleave={() => (showVolumeSlider = false)}
						>
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={currentVolume}
								oninput={handleVolumeChange}
								class="volume-slider"
							/>
						</div>
					{/if}
				</div>
			</div>

			<div class="track-list">
				{#each (isListExpanded ? tracks : tracks.slice(0, 5)) as track, index}
					<button
						type="button"
						class="track-item"
						class:active={index === currentTrackIndex}
						onclick={() => (currentTrackIndex = index)}
					>
						<span class="track-index">{index + 1}</span>
						<span class="track-item-name">{track.name}</span>
					</button>
				{/each}
				{#if tracks.length > 5}
					<button
						type="button"
						class="track-more-btn"
						onclick={() => (isListExpanded = !isListExpanded)}
					>
						{isListExpanded ? "收起列表" : `还有 ${tracks.length - 5} 首...`}
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Minimized View -->
		<button
			type="button"
			class="player-minimized"
			onclick={() => (isExpanded = true)}
			aria-label="展开音乐播放器"
		>
			<div class="mini-cover" class:spinning={isPlaying}>
				{#if currentTrack?.pic}
					<img src={currentTrack.pic} alt="" />
				{:else}
					<span>🎵</span>
				{/if}
			</div>
			{#if isPlaying}
				<div class="playing-indicator">
					<span></span>
					<span></span>
					<span></span>
				</div>
			{/if}
		</button>
	{/if}
</div>

<style>
	.music-player {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1000;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}

	/* Minimized View */
	.player-minimized {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.9));
		backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.player-minimized:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 30px rgba(99, 102, 241, 0.6);
	}

	.mini-cover {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
	}

	.mini-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.mini-cover span {
		font-size: 20px;
	}

	.spinning {
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

	.playing-indicator {
		position: absolute;
		bottom: 4px;
		display: flex;
		gap: 2px;
	}

	.playing-indicator span {
		width: 3px;
		height: 8px;
		background: white;
		border-radius: 2px;
		animation: wave 0.5s ease infinite alternate;
	}

	.playing-indicator span:nth-child(2) {
		animation-delay: 0.15s;
	}

	.playing-indicator span:nth-child(3) {
		animation-delay: 0.3s;
	}

	@keyframes wave {
		from {
			height: 4px;
		}
		to {
			height: 12px;
		}
	}

	/* Expanded View */
	.player-expanded {
		width: 320px;
		background: linear-gradient(
			145deg,
			rgba(30, 30, 45, 0.95),
			rgba(20, 20, 35, 0.98)
		);
		backdrop-filter: blur(20px);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		overflow: hidden;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.player-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.player-title {
		color: rgba(255, 255, 255, 0.9);
		font-size: 14px;
		font-weight: 600;
	}

	.minimize-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		font-size: 18px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.minimize-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.header-btns {
		display: flex;
		gap: 8px;
	}

	.header-icon-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.header-icon-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.settings-panel {
		padding: 16px 20px;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.settings-title {
		color: rgba(255, 255, 255, 0.8);
		font-size: 13px;
		font-weight: 600;
		margin-bottom: 10px;
	}

	.settings-input-group {
		display: flex;
		gap: 8px;
	}

	.settings-input {
		flex: 1;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 6px 10px;
		color: white;
		font-size: 13px;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.settings-input:focus {
		border-color: #667eea;
	}

	.settings-btn {
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 6px 15px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.settings-btn:hover {
		background: #7c8ff8;
	}

	.settings-hint {
		color: rgba(255, 255, 255, 0.4);
		font-size: 11px;
		margin-top: 6px;
	}

	.cover-container {
		display: flex;
		justify-content: center;
		padding: 20px;
	}

	.cover-art {
		width: 160px;
		height: 160px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
		border: 4px solid rgba(255, 255, 255, 0.1);
	}

	.cover-placeholder {
		width: 160px;
		height: 160px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 60px;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
	}

	.track-info {
		text-align: center;
		padding: 0 20px 16px;
	}

	.track-name {
		color: white;
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-artist {
		color: rgba(255, 255, 255, 0.5);
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 20px 16px;
	}

	.time-display {
		color: rgba(255, 255, 255, 0.5);
		font-size: 11px;
		min-width: 35px;
	}

	.progress-bar {
		flex: 1;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		cursor: pointer;
		overflow: hidden;
		border: none;
		padding: 0;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea, #764ba2);
		border-radius: 3px;
		transition: width 0.1s linear;
	}

	.controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		padding: 0 20px 20px;
	}

	.control-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.control-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.play-btn {
		width: 52px;
		height: 52px;
		background: linear-gradient(135deg, #667eea, #764ba2);
		font-size: 20px;
	}

	.play-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #7c8ff8, #8e5cbf);
		box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
	}

	.mode-btn {
		font-size: 14px;
	}

	.volume-container {
		position: relative;
	}

	.volume-slider-container {
		position: absolute;
		bottom: 50px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(30, 30, 45, 0.95);
		padding: 12px 8px;
		border-radius: 10px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.volume-slider {
		writing-mode: vertical-lr;
		direction: rtl;
		width: 6px;
		height: 80px;
		-webkit-appearance: none;
		appearance: none;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		outline: none;
	}

	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		cursor: pointer;
	}

	.track-list {
		max-height: 160px;
		overflow-y: auto;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding: 8px;
	}

	.track-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		background: transparent;
		border: none;
		width: 100%;
		text-align: left;
	}

	.track-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.track-item.active {
		background: rgba(102, 126, 234, 0.2);
	}

	.track-index {
		color: rgba(255, 255, 255, 0.3);
		font-size: 12px;
		min-width: 20px;
	}

	.track-item.active .track-index {
		color: #667eea;
	}

	.track-item-name {
		color: rgba(255, 255, 255, 0.8);
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-item.active .track-item-name {
		color: white;
	}

	.track-more-btn {
		width: 100%;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		font-size: 12px;
		text-align: center;
		padding: 12px 8px;
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.track-more-btn:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	/* Scrollbar Styling */
	.track-list::-webkit-scrollbar {
		width: 4px;
	}

	.track-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.track-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
	}

	/* Animation for expanded state */
	.music-player.expanded {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
