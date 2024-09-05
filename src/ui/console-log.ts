
// Console log replacement
console.log = (function (old_log, log: HTMLElement) {
    return function () {
        log.innerText += Array.prototype.slice.call(arguments).join(' ') + "\n";
        // See: https://github.com/microsoft/TypeScript/issues/57164
        old_log.apply(undefined, arguments as any);
        log.scrollTop = log.scrollHeight;
    };
} (console.log.bind(console), document.querySelector('#console-log')!));
