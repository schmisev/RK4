import { updateIDE } from "..";

interface Toggle {
    button: HTMLElement;
    active: boolean;
}
function makeDebugToggle(id: string, init: boolean) {
    const button = document.getElementById(id)!;
    const toggle: Toggle = {
        button: button,
        active: init,
    };

    button.classList.toggle("active", init);
    button.onclick = () => {
        button.classList.toggle("active");
        toggle.active = !toggle.active;
        updateIDE();
    };

    return toggle;
}

function makeSimpleToggle(id: string, init: boolean) {
    const button = document.getElementById(id)!;
    const toggle: Toggle = {
        button: button,
        active: init,
    };

    button.classList.toggle("active", init);
    button.onclick = () => {
        button.classList.toggle("active");
        toggle.active = !toggle.active;
    };

    return toggle;
}

export let toggleDefs = makeDebugToggle("debug-show-defs", false);
export let toggleLabels = makeDebugToggle("debug-show-labels", true);
export let toggleFunctions = makeDebugToggle("debug-show-functions", true);
export let toggleMethods = makeDebugToggle("debug-show-methods", true);
export let toggleFlowchart = makeDebugToggle("debug-show-flowchart", false);

export let toggleThoughts = makeSimpleToggle("thought-toggle", true);
export let toggleAnimation = makeSimpleToggle("animation-toggle", true);