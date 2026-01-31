// script.js
// Click Speed Test - game logic (external file)
// Save as: script.js
// This code is defensive, accessible, and well-commented so you can understand & modify it easily.

"use strict";

(function () {
  /* -------------------------
     Config / constants
     ------------------------- */
  const STORAGE_KEY = "clickSpeedHighScore";
  const TICK_MS = 100; // clock tick (100ms) -> shows tenths of a second

  /* -------------------------
     Element references
     ------------------------- */
  const timeEl = document.getElementById("time");
  const countEl = document.getElementById("count");
  const highEl = document.getElementById("high");
  const clickBtn = document.getElementById("clickBtn");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const durationSelect = document.getElementById("durationSelect");
  const messageEl = document.getElementById("message");
  const resultEl = document.getElementById("result");

  /* -------------------------
     State
     ------------------------- */
  let duration = parseInt(durationSelect.value, 10) || 5; // seconds
  let remaining = duration; // seconds (float)
  let clicks = 0;
  let running = false;
  let timerHandle = null;

  /* -------------------------
     Helper: localStorage (high score)
     ------------------------- */
  function loadHighScore() {
    try {
      const v = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      return Number.isFinite(v) ? v : 0;
    } catch (err) {
      // localStorage might be blocked in some environments; fail gracefully
      return 0;
    }
  }

  function saveHighScore(score) {
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
    } catch (err) {
      // ignore write errors
    }
  }

  /* -------------------------
     UI helpers
     ------------------------- */
  function setClickEnabled(enabled) {
    clickBtn.disabled = !enabled;
    clickBtn.setAttribute("aria-pressed", String(enabled));
    // visual focus for keyboard users when enabled
    if (enabled) clickBtn.focus({ preventScroll: true });
  }

  function updateDisplays() {
    // Show time with one decimal (tenths)
    timeEl.textContent = remaining.toFixed(1) + "s";
    countEl.textContent = String(clicks);
    highEl.textContent = String(loadHighScore());
  }

  function setMessage(text) {
    messageEl.textContent = text;
  }

  /* -------------------------
     Game lifecycle
     ------------------------- */

  // Start the game: initialize state and start ticking
  function startGame() {
    if (running) return; // ignore second starts

    // read duration fresh from UI
    duration = parseInt(durationSelect.value, 10) || 5;
    remaining = duration;
    clicks = 0;
    running = true;

    setClickEnabled(true);
    updateDisplays();
    resultEl.textContent = "";
    setMessage("Game running — click as fast as you can!");

    // ensure any previous timer is cleared
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }

    // Tick every TICK_MS (100ms) for smooth tenths display
    timerHandle = setInterval(() => {
      remaining -= TICK_MS / 1000;
      if (remaining <= 0) {
        remaining = 0;
        updateDisplays();
        endGame();
      } else {
        updateDisplays();
      }
    }, TICK_MS);
  }

  // Called when time runs out (or when explicitly ended)
  function endGame() {
    if (!running) return;

    running = false;
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }

    setClickEnabled(false);

    // show results
    resultEl.textContent = `Final score: ${clicks}`;
    let msg = `Time's up! You clicked ${clicks} times.`;

    // high score logic
    const prevHigh = loadHighScore();
    if (clicks > prevHigh) {
      saveHighScore(clicks);
      highEl.textContent = String(clicks);
      msg += " 🎉 New high score!";
    }

    setMessage(msg);
  }

  // Reset the game to initial state (without saving)
  function restartGame() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
    running = false;
    duration = parseInt(durationSelect.value, 10) || 5;
    remaining = duration;
    clicks = 0;
    setClickEnabled(false);
    updateDisplays();
    resultEl.textContent = "";
    setMessage("Press Start to play again.");
  }

  /* -------------------------
     Input handlers
     ------------------------- */

  // What happens when user clicks the big button
  function handleClickButton() {
    if (!running) return;
    clicks += 1;
    countEl.textContent = String(clicks);

    // small visual feedback: scale and quickly return
    clickBtn.style.transform = "scale(0.98)";
    window.setTimeout(() => {
      clickBtn.style.transform = "";
    }, 80);
  }

  // Keyboard support: Space or Enter counts during running
  function handleKeyDown(e) {
    // If user is editing a form control, ignore (so it won't interfere)
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
      return;
    }

    // Only process when the game is running
    if (!running) return;

    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault(); // prevent page scroll (space)
      clickBtn.click();
    }
  }

  // Click or touch on the big button: we attach both to ensure mobile works well
  clickBtn.addEventListener("click", handleClickButton);

  // start and restart
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", restartGame);

  // When duration changes, reset the game so user has fresh time to start
  durationSelect.addEventListener("change", () => {
    restartGame();
    // reflect new duration in the time display
    duration = parseInt(durationSelect.value, 10) || 5;
    remaining = duration;
    updateDisplays();
  });

  // keyboard globally
  window.addEventListener("keydown", handleKeyDown);

  /* -------------------------
     Initialization on load
     ------------------------- */
  function init() {
    // Set initial UI
    duration = parseInt(durationSelect.value, 10) || 5;
    remaining = duration;
    clicks = 0;
    running = false;

    // Load high score (if any) and update UI
    highEl.textContent = String(loadHighScore());
    countEl.textContent = "0";
    timeEl.textContent = duration.toFixed(1) + "s";
    resultEl.textContent = "";
    setMessage("Press Start to begin. Use Space / Enter as a shortcut while playing.");

    // Ensure the click button is not accidentally active
    setClickEnabled(false);
  }

  // Run init once DOM is ready (script is loaded with `defer`, but this is safe)
  if (document.readyState === "complete" || document.readyState === "interactive") {
    // small timeout so styles are applied first
    window.setTimeout(init, 10);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  /* -------------------------
     Expose small debug helpers (optional)
     ------------------------- */
  // If you open the console, you can run:
  // window.__clickGame && window.__clickGame.restart();
  window.__clickGame = {
    start: startGame,
    end: endGame,
    restart: restartGame,
    getState: () => ({ running, clicks, remaining, duration, high: loadHighScore() }),
  };
})();
