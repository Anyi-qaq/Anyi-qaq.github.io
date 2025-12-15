<script>
  import { onMount, onDestroy } from 'svelte';

  let cursorX = 0;
  let cursorY = 0;
  let cursorVisible = false;

  // Track mouse movement
  function updateCursorPosition(e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursorVisible = true;
  }

  // Handle cursor leaving the window
  function handleMouseLeave() {
    cursorVisible = false;
  }

  function handleMouseEnter() {
    cursorVisible = true;
  }

  onMount(() => {
    window.addEventListener('mousemove', updateCursorPosition);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // Hide default cursor globally
    document.documentElement.style.cursor = 'none';
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', updateCursorPosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.documentElement.style.cursor = '';
    }
  });
</script>

<div 
  class="custom-cursor" 
  style="left: {cursorX}px; top: {cursorY}px; opacity: {cursorVisible ? 1 : 0};"
></div>

<style>
  /* Global cursor hiding - apply to everything */
  :global(*) {
    cursor: none !important;
  }

  .custom-cursor {
    position: fixed;
    width: 20px;
    height: 20px;
    background-color: transparent;
    border: 2px solid currentColor; /* Use current text color or specific color */
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 9999;
    transition: transform 0.1s ease-out, opacity 0.2s ease;
    mix-blend-mode: difference; /* Optional: makes it visible on light/dark backgrounds */
    color: white; /* Default color for the mix-blend-mode to react with */
  }

  /* Add a dot in the center for precision */
  .custom-cursor::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    background-color: currentColor;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
</style>
