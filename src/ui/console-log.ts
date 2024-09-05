let consoleBuffer: string = ""
const log: HTMLElement = document.querySelector("#console-log")!;

/*
console.log = (function (old_log, log: HTMLElement) {
    return function () {
        log.innerText += Array.prototype.slice.call(arguments).join(' ') + "\n";
        old_log.apply(arguments);
        log.scrollTop = log.scrollHeight;
    };
} (console.log.bind(console), document.querySelector('#console-log')!));
*/

// Console log replacement
console.log = (function (old_log) {
    return function () {
        consoleBuffer += Array.prototype.slice.call(arguments).join(' ') + "\n";
        old_log.apply(arguments);
    };
} (console.log.bind(console)));

export function updateConsoleLog() {
    if (!log || consoleBuffer.length == 0) return;
    log.innerText += consoleBuffer;
    log.scrollTop = log.scrollHeight;
    consoleBuffer = "";
}