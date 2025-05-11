import type * as p5 from "p5";
import { BuiltinClassVal, ObjectVal, ValueAlias } from "../../language/runtime/values";
import { ClassPrototype, GlobalEnvironment } from "../../language/runtime/environment";

export class Body {
  x: number;
  y: number;
  color: string;
  strokeColor: string;
  xRot: number;
  yRot: number;
  zRot: number;

  constructor(x: number, y: number, color: string, strokeColor: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.strokeColor = strokeColor;
    this.xRot = 0;
    this.yRot = 0;
    this.zRot = 0;
  }

  setColor(color: string) {
    this.color = color;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  draw(p5: p5) {
    p5.translate(this.x, this.y);
    p5.rotateX(this.xRot);
    p5.rotateY(this.yRot);
    p5.rotateZ(this.zRot);
    p5.fill(this.color);
  }
}

export class Box extends Body {
  length: number;
  width: number;
  height: number;


  constructor(x: number, y:number, color: string, strokeColor: string, length: number, width: number, height: number) {
    super(x, y, color, strokeColor);
    this.length = length;
    this.width = width;
    this.height = height;
  }

  setSize(length: number, width: number, height: number) {
    this.length = length;
    this.height = height;
    this.width = width;
  }

  draw(p5: p5): void {
    p5.push();
    super.draw(p5);
    p5.box(this.length, this.width, this.height);
    p5.pop();
  }
}

export class Sphere extends Body {
  radius: number;

  constructor(x: number, y: number, color: string, strokeColor: string, radius: number) {
    super(x, y, color, strokeColor);
    this.radius = radius;
  }

  setRadius(radius: number) {
    this.radius = radius;
  }

  draw(p5: p5): void {
    p5.push();
    super.draw(p5);
    p5.sphere(this.radius);
    p5.pop();
  }
}