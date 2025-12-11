export const debounce = (func, delay = 200) => {
  let timer;
  return function (...args) {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

export const scrollIntoView = (container, target) => {
  if (!container || !target) return;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const overflowTop = targetRect.top - containerRect.top;
  const overflowBottom = targetRect.bottom - containerRect.bottom;
  if (overflowTop < 0) {
    container.scrollTop += overflowTop;
  } else if (overflowBottom > 0) {
    container.scrollTop += overflowBottom;
  }
};
