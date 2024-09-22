import { DEFAULT_TASK } from "./robot/tasks";

export class Vec2 {
  x: number = 0;
  y: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }
}


export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;
export const clamp = (a: number, min = 0, max = 1) => Math.min(max, Math.max(min, a));
export const invlerp = (x: number, y: number, a: number) => clamp((a - x) / (y - x));
export const range = (x1: number, y1: number, x2: number, y2: number, a: number) => lerp(x2, y2, invlerp(x1, y1, a));

export const rndi = (min_incl: number, max_non_incl: number) => Math.floor(Math.random() * (max_non_incl - min_incl) + min_incl);

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Create new Option
export function createOption(key: string, innerHTML: string, disabled = false, selected = false): HTMLOptionElement {
    const newOption = document.createElement("option");
    newOption.disabled = disabled;
    newOption.value = key;
    newOption.innerHTML = innerHTML;
    newOption.selected = selected;
    return newOption;
}
export const translateOperator = (op: string) => {
    switch (op) {
        case "*":
            return "⋅";
        case ":":
        case "/":
            return "∶";
        case "+":
            return "+";
        case "-":
            return "-";
        case "und":
            return "∧";
        case "oder":
            return "∨";
        case "nicht":
            return "¬";
        case "%":
            return "mod";
        default:
            return op;
    }
};
