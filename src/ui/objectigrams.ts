import { sleep } from "../language/runtime/utils";
import { DIR2GER, DIR2SHORTGER, Robot } from "../robot/robot";
import { World } from "../robot/world";

export let robotDiagramIndex = -1

export function addRobotButtons(div: HTMLElement, overlay: HTMLElement, world: World) {
    div.innerHTML = "";

    for (const [i, r] of world.robots.entries()) {
        const el = document.createElement("button");
        el.classList.add("object-button");

        el.onmouseover = () => {robotDiagramIndex = i};
        el.onmouseleave = () => {robotDiagramIndex = -1};

        el.innerHTML = `🤖 ${r.name}`;
        div.appendChild(el);
    }
}

export function showRobotDiagram(r: Robot, overlay: HTMLElement, mx: number, my: number) {
    overlay.style.display = "block";
    overlay.style.transform = `translateX(${mx}px)`
    overlay.style.transform += `translateY(${my}px)`

    overlay.innerHTML = 
    `<div>
        <div class="obj-name">${r.name} : Roboter</div>
        <div class="obj-attributes">
            x = ${r.pos.x}<br>
            y = ${r.pos.y}<br>
            richtung = ${DIR2SHORTGER[r.dir]}<br>
        </div>
        <div class="obj-methods">...</div>
    </div>`;
    //console.log(r.name);
}

export function hideRobotDiagram(overlay: HTMLElement) {
    robotDiagramIndex = -1;
    overlay.style.display = "none";
    overlay.innerHTML = "";
    //console.log("hidden");
}