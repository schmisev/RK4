import { toPng } from "html-to-image";
import { RuntimeVal, ValueAlias } from "./language/runtime/values";

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

export function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function partition<T>(arr: T[], condition: (v: T) => boolean): [T[], T[]] {
    const trueArr: T[] = [];
    const falseArr: T[] = [];
    for (const v of arr) {
        if (condition(v)) {
            trueArr.push(v);
        } else {
            falseArr.push(v);
        }
    }
    return [trueArr, falseArr];
}

export function unique<T>(arr: T[]) {
    return arr.filter((v, i, a) => a.indexOf(v) == i);
}

export function getKeys(obj: Object) {
    return Object.keys(obj);
}

export function getVals(obj: Object) {
    return Object.values(obj);
}

export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;
export const clamp = (a: number, min = 0, max = 1) => Math.min(max, Math.max(min, a));
export const toZero = (x: number, rate: number) => clamp(x - rate, 0, x);
export const invlerp = (x: number, y: number, a: number) => clamp((a - x) / (y - x));
export const range = (x1: number, y1: number, x2: number, y2: number, a: number) => lerp(x2, y2, invlerp(x1, y1, a));
export const easeInQuad = (x: number) => x * x;
export const easeOutQuad = (x: number) => 1 - x * x;
export const easeInCubic = (x: number) => x * x * x;
export const easeOutCubic = (x: number) => 1 - x * x * x;
export const easeJump = (x: number) => 1 - (2*x - 1) * (2*x - 1)
export const easeInOutQuad = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
export const easeOutInQuad = (x: number) => 1.0 - easeInOutQuad(x);
export const easeBump = (x: number) => x < 0.5 ? easeInOutQuad(x * 2) : easeOutInQuad(x * 2 - 1);
export const rndi = (min_incl: number, max_non_incl: number) => Math.floor(Math.random() * (max_non_incl - min_incl) + min_incl);
export const easeOutElastic = (x: number) => {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
        ? 0
        : x === 1
        ? 1
        : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}
export const easeInOutBack = (x: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;

    return x < 0.5
        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}
export const easeInQuint = (x: number): number => {
    return x * x * x * x * x;
}

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
            /*
        case "und":
            return "∧";
        case "oder":
            return "∨";
        case "nicht":
            return "¬";
            */
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

export function downloadTextFile(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function destructureKey(key: string, containsTitle = false) {
    const keyParts = key.split("_");
    let title = containsTitle ? (keyParts.pop() || "unbenannt") : "ex. Titel";
    let name = keyParts.pop() || "unbenannt";
    let category = keyParts.pop() || "Standard";
    let author = keyParts.pop() || "unbekannt";

    return {
        name: name,
        category: category,
        author: author,
        title: title,
        sortStr: author + category + name + title,
    };
}