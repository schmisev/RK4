// This is 100% copied from StackOverflow
// https://stackoverflow.com/questions/46931103/making-a-dragbar-to-resize-divs-inside-css-grids
// https://stackoverflow.com/questions/16805684/javascript-disable-text-select

// Panel resizing
const handler = document.getElementById("panel-handler")!;
const wrapper = document.getElementById("panel-row")!;
const panel = document.getElementById("left-panel")!;
const debugPanel = document.getElementById("right-panel")!;
let isHandlerDragging = false;

function startDrag(e: PointerEvent) {
  if (e.target) {
    (e.target as Element).setPointerCapture(e.pointerId);
    isHandlerDragging = true;
  }
}

function dragMove(e: PointerEvent) {
  // Don't do anything if dragging flag is false
  if (!isHandlerDragging) {
    return false;
  }

  // Get offset
  const containerOffsetLeft = wrapper.getBoundingClientRect().left;

  // Get x-coordinate of pointer relative to container
  const posX = e.clientX;
  const pointerRelativeXpos = posX - containerOffsetLeft;
  
  // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
  const boxAminWidth = 200;

  // Resize box A
  // * 8px is the left/right spacing between .handler and its inner pseudo-element
  // * Set flex-grow to 0 to prevent it from growing
  panel.style.width = (Math.max(boxAminWidth, pointerRelativeXpos - 8)) + 'px';
  panel.style.flexGrow = "0";
}

function stopDrag() {
  // Turn off dragging flag when user mouse is up
  isHandlerDragging = false;
}

const foldDebugPanel = document.getElementById("fold-debug")!;
foldDebugPanel.onclick = () => {
  if (debugPanel.getBoundingClientRect().width <= 5) {
    panel.style.width = 'calc(50%)';
  } else {
    panel.style.width = 'calc(100%)';
  }
  panel.style.flexGrow = "0";
}

handler.onpointerdown = startDrag;
handler.onpointermove = dragMove;
handler.onpointerup = stopDrag;
// handler.onpointerleave = stopDrag;
handler.onpointercancel = startDrag;
// document.addEventListener('mousedown', startDrag);
// document.addEventListener('touchstart', startDrag);
// document.addEventListener('mousemove', dragMove);
// document.addEventListener('touchmove', dragMove);
// document.addEventListener('mouseup', stopDrag);
// document.addEventListener('touchend', stopDrag);