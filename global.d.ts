import module = require('p5');
export = module;

declare module 'p5' {
    interface p5InstanceExtensions {
        endShape(mode: END_MODE | undefined, count: number): void;
        beginGeometry(): void;
        endGeometry(): Geometry;
    }
}
