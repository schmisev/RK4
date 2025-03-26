export interface Toggle {
    // button: HTMLElement;
    active: boolean;
}

export function makeToggle(init: boolean): Toggle {
    return {
        active: init,
    }
}

export function connectDebugToggle(id: string, init: boolean, callback: () => void): Toggle {
    const button = document.getElementById(id)!;

    const toggle: Toggle = {
        // button: button,
        active: init,
    };

    button.classList.toggle("active", init);
    button.onclick = () => {
        button.classList.toggle("active");
        toggle.active = !toggle.active;
        callback();
    };

    return toggle;
}

export function connectSimpleToggle(id: string, init: boolean): Toggle {
    const button = document.getElementById(id)!;
    const toggle: Toggle = {
        // button: button,
        active: init,
    };

    button.classList.toggle("active", init);
    button.onclick = () => {
        button.classList.toggle("active");
        toggle.active = !toggle.active;
    };

    return toggle;
}