<script>
  import { onMount } from "svelte";
  import { quintOut } from "svelte/easing";
  import { fade, fly, scale } from "svelte/transition";

  // Props
  export let quizTitle = "";
  export let quizDescription = "";
  export let scoreLabel = "";
  export let questions = [];
  export let results = [];

  // State
  let currentState = "intro"; // "intro" | "quiz" | "result"
  let currentQuestionIndex = 0;
  let scores = [];
  let totalScore = 0;
  let resultIndex = -1;
  let selectedOption = -1;
  let isTransitioning = false;

  // Derived
  $: progress = Math.round((currentQuestionIndex / questions.length) * 100);
  $: currentQuestion = questions[currentQuestionIndex];
  $: isLastQuestion = currentQuestionIndex === questions.length - 1;
  $: maxPossibleScore = questions.length * 3;

  function startQuiz() {
    scores = [];
    currentQuestionIndex = 0;
    totalScore = 0;
    resultIndex = -1;
    selectedOption = -1;
    currentState = "quiz";
  }

  function selectOption(optionIndex) {
    if (isTransitioning) return;
    isTransitioning = true;
    selectedOption = optionIndex;

    const score = currentQuestion.options[optionIndex].score;
    scores = [...scores, score];

    setTimeout(() => {
      if (isLastQuestion) {
        // Calculate result
        totalScore = scores.reduce((a, b) => a + b, 0);
        const percentage = (totalScore / maxPossibleScore) * 100;

        // Find matching result tier
        for (let i = 0; i < results.length; i++) {
          if (percentage >= results[i].minScore && percentage <= results[i].maxScore) {
            resultIndex = i;
            break;
          }
        }
        if (resultIndex === -1) resultIndex = results.length - 1;

        currentState = "result";
      } else {
        currentQuestionIndex++;
        selectedOption = -1;
      }
      isTransitioning = false;
    }, 400);
  }

  function restartQuiz() {
    currentState = "intro";
    scores = [];
    currentQuestionIndex = 0;
    totalScore = 0;
    resultIndex = -1;
    selectedOption = -1;
  }

  function getScorePercentage() {
    return Math.round((totalScore / maxPossibleScore) * 100);
  }

  // Gauge color based on score percentage
  function getGaugeClass(pct) {
    if (pct <= 25) return "bg-emerald-500";
    if (pct <= 45) return "bg-sky-500";
    if (pct <= 65) return "bg-amber-500";
    if (pct <= 80) return "bg-orange-500";
    return "bg-rose-500";
  }
</script>

{#if currentState === "intro"}
  <!-- INTRO SCREEN -->
  <div class="flex w-full rounded-[var(--radius-large)] overflow-hidden relative min-h-32" in:fly={{ y: 20, duration: 400, easing: quintOut }}>
    <div class="card-base z-10 px-6 py-8 md:px-9 md:py-10 relative w-full text-center">
      <h1 class="text-2xl md:text-3xl font-bold mb-4 text-[var(--primary)]">
        {quizTitle}
      </h1>
      <p class="text-base md:text-lg text-black/60 dark:text-white/60 mb-8 leading-relaxed max-w-md mx-auto">
        {quizDescription}
      </p>
      <div class="mb-6">
        <div class="inline-flex items-center gap-2 text-sm text-black/40 dark:text-white/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>共 {questions.length} 题 · 约需 3 分钟</span>
        </div>
      </div>
      <button
        class="btn-regular px-8 py-3 rounded-[var(--radius-large)] text-lg font-medium transition-all hover:scale-[1.03] active:scale-[0.97]"
        on:click={startQuiz}
      >
        开始测试
      </button>
    </div>
  </div>

{:else if currentState === "quiz"}
  <!-- QUIZ SCREEN -->
  <div class="flex w-full rounded-[var(--radius-large)] overflow-hidden relative min-h-32">
    <div class="card-base z-10 px-6 py-6 md:px-9 md:py-8 relative w-full">
      <!-- Progress bar -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-black/40 dark:text-white/40">
            第 {currentQuestionIndex + 1}/{questions.length} 题
          </span>
          <span class="text-xs text-black/40 dark:text-white/40">
            {progress}%
          </span>
        </div>
        <div class="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-[var(--primary)] rounded-full transition-all duration-500 ease-out"
            style="width: {progress}%"
          ></div>
        </div>
      </div>

      <!-- Question -->
      {#key currentQuestionIndex}
        <div in:fly={{ x: 30, duration: 300, easing: quintOut }} out:fly={{ x: -30, duration: 200, easing: quintOut }}>
          <h2 class="text-lg md:text-xl font-semibold mb-6 leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div class="flex flex-col gap-3">
            {#each currentQuestion.options as option, i}
              <button
                class="w-full text-left px-4 py-3 md:px-5 md:py-3.5 rounded-[var(--radius-large)] border border-black/10 dark:border-white/10 
                       bg-black/[0.02] dark:bg-white/[0.03] hover:bg-[var(--btn-plain-bg-hover)] 
                       hover:border-[var(--primary)]/30 transition-all duration-200
                       text-sm md:text-base leading-relaxed"
                class:selected={selectedOption === i}
                on:click={() => selectOption(i)}
                disabled={isTransitioning}
              >
                <span class="inline-flex items-center gap-2">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full border border-black/20 dark:border-white/20 
                               flex items-center justify-center text-xs font-medium
                               text-black/50 dark:text-white/50">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{option.text}</span>
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/key}
    </div>
  </div>

{:else if currentState === "result"}
  <!-- RESULT SCREEN -->
  <div class="flex w-full rounded-[var(--radius-large)] overflow-hidden relative min-h-32">
    <div class="card-base z-10 px-6 py-8 md:px-9 md:py-10 relative w-full text-center">
      {#if resultIndex >= 0}
        <div in:scale={{ duration: 400, start: 0.8, easing: quintOut }}>
          <!-- Result emoji -->
          <div class="text-5xl md:text-6xl mb-4">
            {results[resultIndex].emoji}
          </div>

          <!-- Result title -->
          <h2 class="text-xl md:text-2xl font-bold mb-2" style="color: {results[resultIndex].color}">
            {results[resultIndex].title}
          </h2>

          <!-- Result description -->
          <p class="text-sm md:text-base text-black/60 dark:text-white/60 mb-8 leading-relaxed max-w-md mx-auto">
            {results[resultIndex].description}
          </p>

          <!-- Score gauge -->
          <div class="max-w-sm mx-auto mb-8">
            <div class="flex justify-between text-xs text-black/40 dark:text-white/40 mb-1.5">
              <span>{scoreLabel} 0%</span>
              <span>100%</span>
            </div>
            <div class="w-full h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out {getGaugeClass(getScorePercentage())}"
                style="width: {getScorePercentage()}%"
              ></div>
            </div>
            <div class="mt-2 text-sm font-semibold text-[var(--primary)]">
              {getScorePercentage()}%
            </div>
          </div>

          <!-- Restart button -->
          <button
            class="btn-regular px-8 py-3 rounded-[var(--radius-large)] text-base font-medium transition-all hover:scale-[1.03] active:scale-[0.97]"
            on:click={restartQuiz}
          >
            重新测试
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  button.selected {
    border-color: var(--primary) !important;
    background: color-mix(in srgb, var(--primary) 8%, transparent) !important;
  }

  button.selected span:first-child {
    border-color: var(--primary) !important;
    background: var(--primary) !important;
    color: white !important;
  }

  button:disabled {
    pointer-events: none;
  }
</style>
