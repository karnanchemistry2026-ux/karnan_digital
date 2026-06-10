// js/utils/timer.js — ExamForge countdown timers

export function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].join(':');
}

export function createCountdownTimer(totalSeconds, onTick, onComplete) {
  let remaining = totalSeconds;
  let intervalId = null;
  let running = false;

  function tick() {
    if (remaining <= 0) {
      stop();
      if (onComplete) onComplete();
      return;
    }
    remaining--;
    if (onTick) onTick(remaining, formatTime(remaining));
    if (remaining <= 0) {
      stop();
      if (onComplete) onComplete();
    }
  }

  function start() {
    if (running) return;
    running = true;
    // Fire initial tick immediately
    if (onTick) onTick(remaining, formatTime(remaining));
    intervalId = setInterval(tick, 1000);
  }

  function pause() {
    if (!running) return;
    running = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function resume() {
    if (running) return;
    running = true;
    intervalId = setInterval(tick, 1000);
  }

  function stop() {
    running = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function getRemaining() {
    return remaining;
  }

  return { start, pause, resume, stop, getRemaining };
}

export function createMidnightTimer(onTick, onComplete) {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

  return createCountdownTimer(secondsUntilMidnight, (rem, formatted) => {
    if (onTick) onTick(formatted);
  }, onComplete);
}
