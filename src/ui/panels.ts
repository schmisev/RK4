// This is 100% copied from StackOverflow
// https://stackoverflow.com/questions/46931103/making-a-dragbar-to-resize-divs-inside-css-grids
// https://stackoverflow.com/questions/16805684/javascript-disable-text-select

// Panel resizing
const handler = document.getElementById("panel-handler")!;
const wrapper = document.getElementById("panel-row")!;
const panel = document.getElementById("left-panel")!;
let isHandlerDragging = false;

function disableSelect(event: Event) {
    event.preventDefault();
}

document.addEventListener('mousedown', function(e) {
  // If mousedown event is fired from .handler, toggle flag to true
  if (e.target === handler) {
    isHandlerDragging = true;
    window.addEventListener('selectstart', disableSelect);
  }
});

document.addEventListener('mousemove', function(e) {
  // Don't do anything if dragging flag is false
  if (!isHandlerDragging) {
    return false;
  }

  // Get offset
  const containerOffsetLeft = wrapper.getBoundingClientRect().left;

  // Get x-coordinate of pointer relative to container
  const pointerRelativeXpos = e.clientX - containerOffsetLeft;
  
  // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
  const boxAminWidth = 200;

  // Resize box A
  // * 8px is the left/right spacing between .handler and its inner pseudo-element
  // * Set flex-grow to 0 to prevent it from growing
  panel.style.width = (Math.max(boxAminWidth, pointerRelativeXpos - 8)) + 'px';
  panel.style.flexGrow = "0";
});

document.addEventListener('mouseup', function(e) {
    // Turn off dragging flag when user mouse is up
    isHandlerDragging = false;
    window.removeEventListener('selectstart', disableSelect);
});