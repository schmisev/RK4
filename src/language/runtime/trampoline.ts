// A trampoline is a way to run a (most tail-)recursive function on a short stack frame.
// A function returning a Trampoline<T> should most immediately return instead of doing
// a recursive call itself. If the result should be computed in a recursive call, it should
// instead `return jump(() => recursiveCall())`.
// To evaluate a Trampoline, use `jumpAround(t)`.
type TrampolineContiuation<T> = () => Trampoline<T>;
export type Trampoline<T> = T | TrampolineContiuation<T>;

type NoFunction<T> = [T] extends [(...args: any[]) => any] ? never : T;

export function land<T>(t: NoFunction<T>): Trampoline<T> {
    return t;
}

export function jump<T>(t: () => Trampoline<T>): Trampoline<T> {
    return t;
}

export function jumpBind<U, T>(u: Trampoline<U>, thenT: (u: U) => Trampoline<T>): Trampoline<T> {
    if (typeof u === "function") {
        const ucont = u as TrampolineContiuation<U>;
        return jump(() => jumpBind(ucont(), thenT));
    }
    return thenT(u);
}

export function jumpAround<T>(t: Trampoline<T>): T {
    let result = t;
    while (typeof result === "function") {
        // This cast is okay, as long as you use the `land` and `jump` combinators.
        const next = result as TrampolineContiuation<T>;
        result = next();
    }
    return result as T;
}

// Example:
// function pow(a: number, exp: number): number {
//     if (exp < 0) throw new Error("expected a whole number, positive exponent");
//     if (exp == 0)
//         return 1;
//     return a * pow(a, exp - 1);
// }
// function pow_trampoline(a: number, exp: number, part: number): Trampoline<number> {
//     if (exp < 0) throw new Error("expected a whole number, positive exponent");
//     if (exp == 0)
//         return land(part);
//     return jump(() => pow_trampoline(a, exp - 1, a * part));
// }
// function pow_iter(a: number, exp: number): number {
//     return jumpAround(pow_trampoline(a, exp, 1));
// }
// assert: pow(a, b) == pow_iter(a, b)
