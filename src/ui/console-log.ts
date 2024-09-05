const maxLogChars = 2000;
const log: HTMLElement = document.querySelector("#console-log")!;

console.log = (function (old_log, log: HTMLElement) {
    return function () {
        let overhang = log.textContent!.length - maxLogChars;
        if (overhang > 0) log.textContent = log.innerText.slice(overhang)
        log.textContent += Array.prototype.slice.call(arguments).join(' ') + "\r\n";
        old_log.apply(arguments);
        log.scrollTop = log.scrollHeight;
    };
} (console.log.bind(console), log));