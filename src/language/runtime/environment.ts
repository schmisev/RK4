import { RuntimeError } from "../../errors";
import { MK_STRING, ObjectVal } from "./values";
import { MK_BOOL, MK_NATIVE_FN, MK_NULL, MK_NUMBER, NumberVal, RuntimeVal } from "./values";

export function declareGlobalEnv() {
    const env = new Environment();
    env.declareVar("wahr", MK_BOOL(true), true);
    env.declareVar("falsch", MK_BOOL(false), true);
    env.declareVar("nix", MK_NULL(), true);
    env.declareVar("gelb", MK_STRING("Y"), true);
    env.declareVar("rot", MK_STRING("R"), true);
    env.declareVar("grün", MK_STRING("G"), true);
    env.declareVar("blau", MK_STRING("B"), true);

    env.declareVar("zufallszahl", MK_NATIVE_FN(
        (args, scope) => {
            let r = 0;
            if (args.length == 0) {
                r =  100;
            } else if (args.length == 1) {
                if (args[0].type != "number")
                    throw new RuntimeError(`Erwarte eine Zahl als Parameter, nicht '${args[0].type}'!`);
                r = (args[0] as NumberVal).value;
            }
            const n = Math.round(Math.random() * r);
            return MK_NUMBER(n);
        }
    ), true);
    return env;
}

export default class Environment {
    private parent?: Environment
    private variables: Map<string, RuntimeVal>;
    private constants: Set<string>;
    private global = false;

    constructor (parentENV?: Environment) {
        this.global = parentENV ? false : true;
        this.parent = parentENV;
        this.variables = new Map();
        this.constants = new Set();
    }

    public isGlobal() {
        return this.global;
    }

    public getVarValues(): IterableIterator<RuntimeVal> {
        return this.variables.values();
    }

    public getVars() {
        return this.variables.entries();
    }

    public declareVar (varname: string, value: RuntimeVal, constant = false): RuntimeVal {
        if (this.variables.has(varname)) {
            throw new RuntimeError(`Kann die Variable '${varname}' nicht erzeugen, weil es sie schon gibt!`);
        }

        this.variables.set(varname, value);
        if (constant) {
            this.constants.add(varname);
        }

        return value;
    }

    public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varname);
        if (env.constants.has(varname)) {
            throw new RuntimeError(`Kann die Konstante '${varname}' nicht verändern!`);
        }
        env.variables.set(varname, value);
        return value;
    }

    public lookupVar(varname: string): RuntimeVal {
        const env = this.resolve(varname);
        return env.variables.get(varname) as RuntimeVal;
    }

    public resolve(varname: string): Environment {
        if (this.variables.has(varname))
            return this;
        if (this.parent == undefined) 
            throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
        return this.parent.resolve(varname);
    }
}