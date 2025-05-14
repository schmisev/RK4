import { RuntimeError } from "../../errors";
import { createSphereClass } from "../../robot/addons/bodies";
import { createRobotClass, declareRobot } from "../../robot/robot";
import { createWorldClass } from "../../robot/world";
import { ENV } from "../../spec";
import { formatValue } from "../../utils";
import { Environment } from "./environment";
import {
    MK_FLOAT,
    MK_STRING,
    ValueAlias,
    isLikeNumber,
    MK_BOOL,
    MK_NATIVE_FN,
    MK_NULL,
    MK_NUMBER,
} from "./values";

export interface GlobalEnvironment extends Environment {
    // global env holds some special values that we don't want to lookup by name
}

export function declareGlobalEnv(): GlobalEnvironment {
    class GlobalEnvironment extends Environment {
    }
    const env = new GlobalEnvironment();
    env.declareVar(ENV.global.const.TRUE, MK_BOOL(true), true);
    env.declareVar(ENV.global.const.FALSE, MK_BOOL(false), true);
    env.declareVar(ENV.global.const.NULL, MK_NULL(), true);
    env.declareVar(ENV.global.const.YELLOW, MK_STRING("Y"), true);
    env.declareVar(ENV.global.const.RED, MK_STRING("R"), true);
    env.declareVar(ENV.global.const.GREEN, MK_STRING("G"), true);
    env.declareVar(ENV.global.const.BLUE, MK_STRING("B"), true);

    env.declareVar(
        ENV.global.fn.RANDOM_NUMBER,
        MK_NATIVE_FN(ENV.global.fn.RANDOM_NUMBER, (args) => {
            let r = 0;
            let b = 0;
            if (args.length == 0) {
                r = 1;
            } else if (args.length <= 2) {
                let v1 = args[0];
                if (v1.type !== ValueAlias.Number)
                    throw new RuntimeError(
                        `Erwarte mindestens Zahl als Parameter, nicht '${args[0].type}'!`
                    );
                r = v1.value;

                if (args.length == 2) {
                    let v2 = args[1];
                    if (v2.type !== ValueAlias.Number)
                        throw new RuntimeError(
                            `Erwarte zwei (Komma-)zahlen als Parameter, nicht '${args[0].type}' und '${args[1].type}'!`
                        );
                    r = v2.value - v1.value;
                    b = v1.value;
                }
            } else throw new RuntimeError(`Zu viele Parameter!`);

            const n = b + Math.floor(Math.random() * r);
            return MK_NUMBER(n);
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.RANDOM_FLOAT,
        MK_NATIVE_FN(ENV.global.fn.RANDOM_FLOAT, (args) => {
            let r = 0;
            let b = 0;
            if (args.length == 0) {
                r = 1;
            } else if (args.length <= 2) {
                let v1 = args[0];
                if (!isLikeNumber(v1))
                    throw new RuntimeError(
                        `Erwarte mindestens (Komma-)zahl als Parameter, nicht '${args[0].type}'!`
                    );
                r = v1.value;

                if (args.length == 2) {
                    let v2 = args[1];
                    if (!isLikeNumber(v2))
                        throw new RuntimeError(
                            `Erwarte zwei (Komma-)zahlen als Parameter, nicht '${args[0].type}' und '${args[1].type}'!`
                        );
                    r = v2.value - v1.value;
                    b = v1.value;
                }
            } else throw new RuntimeError(`Zu viele Parameter!`);

            const n = b + Math.random() * r;
            return MK_FLOAT(n);
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.LENGTH,
        MK_NATIVE_FN(ENV.global.fn.LENGTH, (args) => {
            if (args.length != 1)
                throw new RuntimeError(`Erwarte genau eine Liste als Eingabe!`);
            if (args[0].type != ValueAlias.List)
                throw new RuntimeError(`Erwarte eine Liste als Eingabe!`);
            return MK_NUMBER(args[0].elements.length);
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.TO_TEXT,
        MK_NATIVE_FN(ENV.global.fn.TO_TEXT, (args) => {
            if (args.length != 1)
                throw new RuntimeError(`Erwarte genau einen Eingabewert!`);
            return MK_STRING(formatValue(args[0]));
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.JOIN,
        MK_NATIVE_FN(ENV.global.fn.JOIN, (args) => {
            if (args.length == 0) return MK_STRING("");
            if (args[0].type != ValueAlias.String)
                throw new RuntimeError("Erwarte einen Text als erste Eingabe!");
            const [sep, ...rest] = args;
            return MK_STRING(rest.map((v) => formatValue(v)).join(sep.value));
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.TO_INT,
        MK_NATIVE_FN(ENV.global.fn.TO_INT, (args) => {
            if (
                args.length === 0 ||
                args.length > 1 ||
                (args[0].type != ValueAlias.Number &&
                    args[0].type != ValueAlias.Float)
            )
                throw new RuntimeError(
                    "Erwarte eine (Komma-)zahl als Eingabe!"
                );
            return MK_NUMBER(Math.trunc(args[0].value));
        })
    );

    env.declareVar(
        ENV.global.fn.TO_FLOAT,
        MK_NATIVE_FN(ENV.global.fn.TO_FLOAT, (args) => {
            if (
                args.length === 0 ||
                args.length > 1 ||
                (args[0].type != ValueAlias.Number &&
                    args[0].type != ValueAlias.Float)
            )
                throw new RuntimeError(
                    "Erwarte eine (Komma-)zahl als Eingabe!"
                );
            return MK_FLOAT(args[0].value);
        })
    );

    env.declareVar(
        ENV.global.fn.TRUNC,
        MK_NATIVE_FN(ENV.global.fn.TRUNC, (args) => {
            if (
                args.length === 0 ||
                args.length > 1 ||
                args[0].type != ValueAlias.Float
            )
                throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let { value, type } = args[0];
            value = Math.trunc(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.CEIL,
        MK_NATIVE_FN(ENV.global.fn.CEIL, (args) => {
            if (
                args.length === 0 ||
                args.length > 1 ||
                args[0].type != ValueAlias.Float
            )
                throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let { value, type } = args[0];
            value = Math.ceil(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.FLOOR,
        MK_NATIVE_FN(ENV.global.fn.FLOOR, (args) => {
            if (
                args.length === 0 ||
                args.length > 1 ||
                args[0].type != ValueAlias.Float
            )
                throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let { value, type } = args[0];
            value = Math.floor(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.ROUND,
        MK_NATIVE_FN(ENV.global.fn.ROUND, (args) => {
            if (
                args.length === 0 ||
                args.length > 1 ||
                args[0].type != ValueAlias.Float
            )
                throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let { value, type } = args[0];
            value = Math.round(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.SIN,
        MK_NATIVE_FN(ENV.global.fn.SIN, (args) => {
            if (args.length === 0 || args.length > 1 || !isLikeNumber(args[0]))
                throw new RuntimeError(
                    "Erwarte eine (Komma-)zahl als Eingabe!"
                );
            let { value, type } = args[0];
            value = Math.sin(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.COS,
        MK_NATIVE_FN(ENV.global.fn.COS, (args) => {
            if (args.length === 0 || args.length > 1 || !isLikeNumber(args[0]))
                throw new RuntimeError(
                    "Erwarte eine (Komma-)zahl als Eingabe!"
                );
            let { value, type } = args[0];
            value = Math.cos(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.TAN,
        MK_NATIVE_FN(ENV.global.fn.TAN, (args) => {
            if (args.length === 0 || args.length > 1 || !isLikeNumber(args[0]))
                throw new RuntimeError(
                    "Erwarte eine (Komma-)zahl als Eingabe!"
                );
            let { value, type } = args[0];
            value = Math.tan(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.ABS,
        MK_NATIVE_FN(ENV.global.fn.ABS, (args) => {
            if (args.length === 0 || args.length > 1)
                throw new RuntimeError(
                    "Erwarte eine (Komma-)zahl als Eingabe!"
                );
            let val = args[0];
            if (val.type === ValueAlias.Number)
                return MK_NUMBER(Math.abs(val.value));
            else if (val.type === ValueAlias.Float)
                return MK_FLOAT(Math.abs(val.value));
            else
                throw new RuntimeError(
                    "Erwarte eine (Komma-)zahl als Eingabe!"
                );
        })
    );

    env.declareVar(ENV.robot.cls, createRobotClass(env), true);
    env.declareVar(ENV.world.cls, createWorldClass(env), true);

    env.declareVar("Kugel", createSphereClass(), true);

    return env;
}


