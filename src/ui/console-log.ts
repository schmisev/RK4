
// Console log replacement
console.log = (function (old_log, log: HTMLElement) {
    return function () {
        log.innerText += Array.prototype.slice.call(arguments).join(' ') + "\n";
        old_log.apply(console, arguments);
        log.scrollTop = log.scrollHeight;
    };
} (console.log.bind(console), document.querySelector('#console-log')!));
