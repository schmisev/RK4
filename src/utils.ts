import { toPng } from "html-to-image";
import { ParserError } from "./errors";
import { Stmt, StmtKind } from "./language/frontend/ast";
import { RuntimeVal, ValueAlias } from "./language/runtime/values";
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
export const toZero = (x: number, rate: number) => clamp(x - rate, 0, x);
export const invlerp = (x: number, y: number, a: number) => clamp((a - x) / (y - x));
export const range = (x1: number, y1: number, x2: number, y2: number, a: number) => lerp(x2, y2, invlerp(x1, y1, a));
export const easeInQuad = (x: number) => x * x;
export const easeOutQuad = (x: number) => 1 - x * x;
export const easeJump = (x: number) => 1 - (2*x - 1) * (2*x - 1)
export const easeInOutQuad = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
export const easeOutInQuad = (x: number) => 1.0 - easeInOutQuad(x);
export const easeBump = (x: number) => x < 0.5 ? easeInOutQuad(x * 2) : easeOutInQuad(x * 2 - 1);
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

export function translateOperator(op: string) {
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
}

export function formatValue(value: RuntimeVal): string {
    // side effect
    if (value.type == ValueAlias.Number) {
        return value.value.toString();
    } else if (value.type == ValueAlias.Boolean) {
        const boolVal = value.value;
        if (boolVal) {
            return "wahr";
        } else {
            return "falsch";
        }
    } else if (value.type == ValueAlias.Null) {
        return "nix";
    } else if (value.type == ValueAlias.String) {
        return value.value;
    } else if (value.type == ValueAlias.List) {
        return `[${value.elements.map(formatValue).join(", ")}]`;
    } else if (value.type == ValueAlias.Object) {
        return `[Objekt der Klasse ${value.cls.name}]`;
    } else if (value.type == ValueAlias.Class) {
        return `<Klasse ${value.name}>`;
    } else if (value.type == ValueAlias.Function || value.type == ValueAlias.NativeFunction) {
        return `(Funktion ${value.name})`;
    }
    return value satisfies never;
}
export function screenshotDiv(elem: HTMLElement, filename: string) {
    toPng(elem, {})
        .then(function (dataUrl) {
            var link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
            link.remove();
        });
}
