import { RuntimeVal } from "../values";

export class Break extends Error {}
export class Continue extends Error {}
export class Return extends Error {
    value: RuntimeVal;
    constructor(value: RuntimeVal) {
        super();
        this.value = value;
    }
}