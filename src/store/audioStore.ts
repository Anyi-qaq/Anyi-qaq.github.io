import { writable } from "svelte/store";

export const audioContextStore = writable<{
	analyser: AnalyserNode | null;
	audioContext: AudioContext | null;
	source: MediaElementAudioSourceNode | null;
}>({
	analyser: null,
	audioContext: null,
	source: null,
});
