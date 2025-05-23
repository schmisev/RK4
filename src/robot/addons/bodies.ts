// TODO: Work in progress
import type * as p5 from "p5";
import { Environment } from "../../language/runtime/environment";
import { createInternalClass } from "../../language/runtime/environment";
import { NativeObjectVal } from "../../language/runtime/environment";
import {
    BooleanVal,
    isLikeNumber,
    MK_FLOAT,
    MK_NULL,
    NumberLikeVal,
    NumberVal,
    RuntimeVal,
    ValueAlias,
} from "../../language/runtime/values";
import { RuntimeError } from "../../errors";
import { numberLikeArg, tooManyArgs } from "../../utils";

export class Body {
    x: number;
    y: number;
    z: number;
    color: string;
    strokeColor: string;
    xRot: number;
    yRot: number;
    zRot: number;

    constructor(x: number, y: number, z: number, color: string, strokeColor: string) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.color = color;
        this.strokeColor = strokeColor;
        this.xRot = 0;
        this.yRot = 0;
        this.zRot = 0;
    }

    draw(p5: p5) {
        p5.translate(this.x, this.y, this.z);
        p5.rotateX(this.xRot);
        p5.rotateY(this.yRot);
        p5.rotateZ(this.zRot);
        p5.fill(this.color);
    }
}

/**
 * Box
 */
export class Box extends Body {
    length: number;
    width: number;
    height: number;

    constructor(
        x: number,
        y: number,
        z: number,
        color: string,
        strokeColor: string,
        length: number,
        width: number,
        height: number
    ) {
        super(x, y, z, color, strokeColor);
        this.length = length;
        this.width = width;
        this.height = height;
    }

    draw(p5: p5): void {
        p5.push();
        super.draw(p5);
        p5.box(this.length, this.width, this.height);
        p5.pop();
    }
}

/**
 * Sphere
 */
export class Sphere extends Body {
    radius: number;

    constructor(
        x: number,
        y: number,
        z: number,
        color: string,
        strokeColor: string,
        radius: number
    ) {
        super(x, y, z, color, strokeColor);
        this.radius = radius;
    }

    draw(p5: p5): void {
        p5.push();
        super.draw(p5);
        p5.sphere(this.radius);
        p5.pop();
    }
}

export function createSphereClass() {
    return createInternalClass<Sphere>({
        clsName: "Kugel",
        clsConstructor: (args) => {
            tooManyArgs(args, 4);
            let x = numberLikeArg(args[0]);
            let y = numberLikeArg(args[1]);
            let z = numberLikeArg(args[2]);
            let r = numberLikeArg(args[3]);
            return new Sphere(x.value, y.value, z.value, "white", "black", r.value);
        },
        clsMethods: {
            setzeRadius: (o, args) => {
                if (args.length !== 1)
                    throw new RuntimeError(`Unpassende Parameteranzahl!`);
                if (
                    args[0].type !== ValueAlias.Number &&
                    args[0].type !== ValueAlias.Float
                )
                    throw new RuntimeError(`Erwartete eine (Komma-)Zahl!`);
                o.radius = args[0].value;
                return MK_NULL();
            },
        },
        clsAttributes: {
            radius: (o) => {
                return MK_FLOAT(o.radius);
            },
        },
    });
}

export function instanceSphereObject(
    args: RuntimeVal[],
    env: Environment
): NativeObjectVal<Sphere> {
    return env.instanceNativeObject("Kugel", args);
}
