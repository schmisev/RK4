import { DIR2SHORTGER, Robot } from "../robot/robot";
import { World } from "../robot/world";

export let robotDiagramIndex = -1

export function addRobotButtons(div: HTMLElement, overlay: HTMLElement, world: World) {
    robotDiagramIndex = -1;

    div.innerHTML = "";

    for (const [i, r] of world.robots.entries()) {
        const el = document.createElement("button");
        el.classList.add("object-button");

        el.onmousedown = () => {robotDiagramIndex = i};
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
        <div class="obj-name"><span class="struct-object">${r.name}</span> : Roboter</div>
        <div class="obj-attributes">
            x = <span class="struct-literal">${r.pos.x}</span><br>
            y = <span class="struct-literal">${r.pos.y}</span><br>
            richtung = <span class="struct-string">"${DIR2SHORTGER[r.dir]}"</span><br>
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