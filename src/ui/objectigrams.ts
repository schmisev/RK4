import { DIR2SHORTGER, Robot } from "../robot/robot";
import { World } from "../robot/world";

export let robotDiagramIndex = -1

export function addRobotButtons(div: HTMLElement, overlay: HTMLElement, world: World) {
    
    div.innerHTML = "";

    for (const [i, r] of world.robots.entries()) {
        const el = document.createElement("button");
        el.classList.add("object-button");

        el.onclick = (e: MouseEvent) => {
            robotDiagramIndex == i ? robotDiagramIndex = -1 : robotDiagramIndex = i;
            if (robotDiagramIndex >= 0) {
                showRobotDiagram(el, overlay);
            } else {
                hideRobotDiagram(overlay);
            }
        };

        el.innerHTML = `<i class="fa-solid fa-robot"></i>&nbsp;${r.name}`;
        div.appendChild(el);
    }
}

export function updateRobotDiagram(r: Robot, overlay: HTMLElement) {
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
}

export function showRobotDiagram(el: HTMLElement, overlay: HTMLElement) {
    el.appendChild(overlay); // attach overlay to button
    overlay.style.display = "block";
}

export function hideRobotDiagram(overlay: HTMLElement) {
    robotDiagramIndex = -1;
    overlay.style.display = "none";
    overlay.innerHTML = "";
    //console.log("hidden");
}