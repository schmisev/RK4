import * as p5 from 'p5';

import { isRunning, queueInterrupt, world, objOverlay, taskCheck, updateLagSum, resetLagSum } from '..';
import { Robot } from '../robot/robot';
import { CR, CY, CG, CB, BlockType, MarkerType, World, CBOT, CBOT2, Field } from '../robot/world';
import { robotDiagramIndex, showRobotDiagram, hideRobotDiagram } from './objectigrams';

let isTabVisible = document.visibilityState == "visible";
document.addEventListener('visibilitychange', () => {
    switch (document.visibilityState) {
        case "hidden": {
            isTabVisible = false;
            break;
        }
        case "visible": {
            isTabVisible = true;
            break;
        }
    }
  });

// Setup robot sketch
export function robotSketch(p5: p5) {
    let bg = 0; // Background color
    const canvasDiv = document.getElementById('robot-canvas')!;
    let cam: p5.Camera;
    let pan = 0.0;
    let tilt = 0.0;
    let worldGoalReached = false;
    let worldGeoms: Model[] = [];
    let worldGeneriation: number = -1;
    
    const TSZ = 50; // Tilesize
    const BLH = 30; // Block height
    const MRH = 1; // Marker height
    const MSZ = 50; // Marker size
    const WLH = TSZ; // Wall height
    const FLH = 10; // Floor height
    const RBH = 60; // Robot body height
    const RBW = 35;

    const HUDF: number = 100; // HUD-factor

    const createXTexture = (col: string) => {
        const xt = p5.createGraphics(TSZ, TSZ);
        xt.background(col);
        xt.strokeWeight(3);
        xt.line(TSZ * 0.25, TSZ * 0.25, TSZ * 0.75, TSZ * 0.75);
        xt.line(TSZ * 0.75, TSZ * 0.25, TSZ * 0.25, TSZ * 0.75);
        return xt;
    };

    const createTextTexture = (str: string) => {
        const ct = p5.createGraphics(TSZ, TSZ);
        ct.fill(255);
        ct.textAlign(p5.CENTER);
        ct.textSize(TSZ);
        ct.text(str, 0.5 * TSZ, 1 * TSZ);
        return ct;
    };

    const XNone = createXTexture("#000000");
    const XR = createXTexture(CR);
    const XY = createXTexture(CY);
    const XG = createXTexture(CG);
    const XB = createXTexture(CB);

    const NT = createTextTexture("N");
    const WT = createTextTexture("W");
    const ET = createTextTexture("O");
    const ST = createTextTexture("S");

    const BLOCK2COLOR: Record<BlockType, string> = {
        "0": CR,
        "1": CG,
        "2": CB,
        "3": CY,
    };

    const BLOCK2XTEXTURE: Record<BlockType, p5.Graphics> = {
        "0": XR,
        "1": XG,
        "2": XB,
        "3": XY,
    };

    const MARKER2COLOR: Record<MarkerType, string> = {
        "0": "#000000",
        "1": CR,
        "2": CG,
        "3": CB,
        "4": CY,
    };

    const MARKER2XTEXTURE: Record<MarkerType, p5.Graphics> = {
        "0": XNone,
        "1": XR,
        "2": XG,
        "3": XB,
        "4": XY,
    };

    const numberPlates: Record<number, p5.Graphics> = {};

    type CoordMap<Key extends PropertyKey, Coords> = Partial<Record<Key, Coords[]>>;
    interface Model {
        setup(p5: p5): void;
        readonly geom: p5.Geometry;
    }
    
    class BatchedBoxes {
        length: number = 0;
        width: number = 0;
        height: number = 0;
    
        hasFloor: boolean[] = [];
        goalReached: boolean[] = [];
        walls: [number, number][] = []; // (x, y) coordinates of wall blocks
    
        blocks: CoordMap<BlockType, [number, number, number]> = {};
        mismatchedBlocks: CoordMap<BlockType, [number, number, number]> = {};
        goalBlocks: CoordMap<BlockType, [number, number, number]> = {};
    
        markers: CoordMap<MarkerType, [number, number]> = {};
        mismatchedMarkers: CoordMap<MarkerType, [number, number]> = {};
        goalMarkers: CoordMap<MarkerType, [number, number]> = {};
    
        init(length: number, width: number, height: number) {
            this.length = length;
            this.width = width;
            this.height = height;
            this.hasFloor = new Array(width * length);
            this.goalReached = new Array(width * length);
        }
        floor(x: number, y: number, isF: boolean) {
            this.hasFloor[x * this.width + y] = isF;
        }
        goal(x: number, y: number, reached: boolean) {
            this.goalReached[x * this.width + y] = reached;
        }
        wall(x: number, y: number) {
            this.walls.push([x, y]);
        }
        static _add<B extends PropertyKey, C>(map: CoordMap<B, C>, typ: B, coord: C) {
            let list = map[typ];
            if (!list)
                list = (map[typ] = []);
            list.push(coord);
        }
        block(x: number, y: number, z: number, type: BlockType) {
            BatchedBoxes._add(this.blocks, type, [x, y, z]);
        }
        badBlock(x: number, y: number, z: number, type: BlockType) {
            BatchedBoxes._add(this.mismatchedBlocks, type, [x, y, z]);
        }
        goalBlock(x: number, y: number, z: number, type: BlockType) {
            BatchedBoxes._add(this.goalBlocks, type, [x, y, z]);
        }
        marker(x: number, y: number, type: MarkerType) {
            BatchedBoxes._add(this.markers, type, [x, y]);
        }
        badMarker(x: number, y: number, type: MarkerType) {
            BatchedBoxes._add(this.mismatchedMarkers, type, [x, y]);
        }
        goalMarker(x: number, y: number, type: MarkerType) {
            BatchedBoxes._add(this.mismatchedMarkers, type, [x, y]);
        }
        static iBox(p5: p5, x: number, y: number, z: number, w: number, l: number, h: number) {
            p5.push();
            p5.translate(x, y, z);
            p5.box(w, l, h);
            p5.pop();
        }
        draw(p5: p5): Model[] {
            const offX = (1 - this.length) * 0.5 * TSZ,
                offY = (1 - this.width) * 0.5 * TSZ,
                offZ = (1 - this.height) * 0.5 * BLH;
            const geoms: Model[] = [];
            // floor
            p5.beginGeometry();
            p5.noStroke();
            for (let x = 0; x < this.length; x++) {
                for (let y = 0; y < this.width; y++) {
                    if (!this.hasFloor[x * this.width + y])
                        continue;
                    BatchedBoxes.iBox(p5, offX + x * TSZ, offY + y * TSZ, offZ + (-BLH - FLH) * 0.5, TSZ, TSZ, FLH);
                }
            }
            geoms.push({
                setup: p5 => {
                    p5.fill(250);
                    p5.stroke(200);
                },
                geom: p5.endGeometry(),
            });

            // goal reached
            p5.beginGeometry();
            p5.noStroke();
            for (let x = 0; x < this.length; x++) {
                for (let y = 0; y < this.width; y++) {
                    if (!this.hasFloor[x * this.width + y])
                        continue;
                    const goalDone = this.goalReached[x * this.width + y];
                    if (goalDone) {
                        p5.fill(0, 255, 0);
                    } else {
                        p5.fill(255, 0, 0);
                    }
                    BatchedBoxes.iBox(p5, offX + x * TSZ, offY + y * TSZ, offZ - 3 * FLH, TSZ * 0.4, TSZ * 0.4, FLH);
                }
            }
            geoms.push({
                setup: p5 => {
                    p5.noStroke();
                },
                geom: p5.endGeometry()
            });

            // walls
            if (this.walls.length > 0) {
                p5.beginGeometry();
                p5.noStroke();
                for (const [x, y] of this.walls) {
                    BatchedBoxes.iBox(p5, offX + x * TSZ, offY + y * TSZ, offZ + (-BLH + WLH) * 0.5, TSZ, TSZ, WLH);
                }
                geoms.push({
                    setup: p5 => {
                        p5.fill(200);
                        p5.stroke(0);
                    },
                    geom: p5.endGeometry(),
                });
            }
            // blocks
            for (const [type, coords] of Object.entries(this.blocks)) {
                if (coords.length == 0) continue;
                p5.beginGeometry();
                p5.noStroke();
                for (const [x, y, z] of coords) {
                    BatchedBoxes.iBox(p5, offX + x * TSZ, offY + y * TSZ, offZ + z * BLH, TSZ, TSZ, BLH);
                }
                geoms.push({
                    setup: p5 => {
                        p5.fill(BLOCK2COLOR[type as any as BlockType]);
                        p5.stroke(0, 0, 0);
                    },
                    geom: p5.endGeometry()
                });
            }
            // mismatched blocks
            for (const [type, coords] of Object.entries(this.mismatchedBlocks)) {
                if (coords.length == 0) continue;
                p5.beginGeometry();
                p5.noStroke();
                for (const [x, y, z] of coords) {
                    BatchedBoxes.iBox(p5, offX + x * TSZ, offY + y * TSZ, offZ + z * BLH, TSZ, TSZ, BLH);
                }
                geoms.push({
                    setup: p5 => {
                        p5.texture(BLOCK2XTEXTURE[type as any as BlockType]);
                        p5.stroke(0, 0, 0);
                    },
                    geom: p5.endGeometry()
                });
            }
            // TODO: goal blocks, markers
            for (const g of geoms) {
                (g.geom as any).edges = [[0, 0]];
            }
            return geoms;
        }
    }

    p5.setup = () => {
        const width = canvasDiv.offsetWidth;
        const height = canvasDiv.offsetHeight;
        const cvs = p5.createCanvas(width, height, p5.WEBGL);
        let canvasW = 0, canvasH = 0;
        const observer = new ResizeObserver((entries) => {
            const {width, height} = entries[0].contentRect;
            if (canvasH != height || canvasW != width)
                p5.resizeCanvas(width, height);
            canvasH = height;
            canvasW = width;
        });
        observer.observe(canvasDiv, { box: 'content-box' });
        cam = p5.createCamera();
        cvs.parent(canvasDiv);
    };

    p5.draw = () => {
        if (!isTabVisible) return;
        window.performance.mark('draw-start');
        // update sum of frame lag
        if (isRunning) {
            updateLagSum(p5.deltaTime);
        } else {
            resetLagSum();
        }
        // update task status
        const goalReachedNow = world.isGoalReached();
        if (worldGoalReached != goalReachedNow) {
            worldGoalReached = goalReachedNow;
            if (!worldGoalReached) {
                taskCheck.style.backgroundColor = "whitesmoke";
                taskCheck.innerHTML = "❌<br>" + `${world.getStageIndex()} / ${world.getStageCount()}`;
            } else {
                taskCheck.style.backgroundColor = "lightgreen";
                taskCheck.innerHTML = "✔️<br>" + `${world.getStageIndex() + 1} / ${world.getStageCount()}`;
            }
        }

        const worldInst = world;

        // bg color ramping
        if (isRunning && bg == 0) {
            bg = 255;
        }
        if (bg > 0) bg = p5.lerp(0, bg, 0.9);
        if (!isRunning || queueInterrupt) bg = 0;

        p5.background(bg);

        p5.orbitControl();
        pan = p5.atan2(cam.eyeZ - cam.centerZ, cam.eyeX - cam.centerX);
        tilt = p5.atan2(cam.eyeY - cam.centerY, p5.dist(cam.centerX, cam.centerZ, cam.eyeX, cam.eyeZ));

        p5.push();

        // tilt and zoom out
        //cam.tilt(p5.PI * 0.4);
        p5.rotateX(p5.PI * 0.5);
        p5.scale(0.8);

        drawWorld(worldInst);

        // draw object diagrams
        if (robotDiagramIndex >= 0) {
            //console.log("show");
            showRobotDiagram(worldInst.robots[robotDiagramIndex], objOverlay, p5.winMouseX, p5.winMouseY);
        } else {
            hideRobotDiagram(objOverlay);
        }

        // draw compass
        drawCompass(worldInst);

        p5.pop();

        // draw heads up display
        drawHUD();

        window.performance.mark('draw-end');
        window.performance.measure('draw', { start: 'draw-start', end: 'draw-end' });
    };

    const drawHUD = () => {
        p5.push();
        p5.translate(cam.eyeX, cam.eyeY, cam.eyeZ);
        p5.rotateY(-pan);
        p5.rotateZ(tilt + p5.PI);
        p5.translate(HUDF, 0, 0);
        p5.rotateY(-p5.PI / 2);
        p5.rotateZ(p5.PI);

        // draw UI here
        p5.pop();
    };

    const drawCompass = (w: World) => {
        p5.push();
        p5.noStroke();
        p5.translate(0, 0, -w.H * BLH * 0.5 - FLH);

        // draw compass letters
        p5.push();
        p5.translate((-w.L * 0.5 - 1) * TSZ, 0, 0);
        p5.texture(WT);
        p5.plane();
        p5.pop();

        p5.push();
        p5.translate(-(-w.L * 0.5 - 1) * TSZ, 0, 0);
        p5.texture(ET);
        p5.plane();
        p5.pop();

        p5.push();
        p5.translate(0, (-w.W * 0.5 - 1) * TSZ, 0);
        p5.texture(NT);
        p5.plane();
        p5.pop();

        p5.push();
        p5.translate(0, -(-w.W * 0.5 - 1) * TSZ, 0);
        p5.texture(ST);
        p5.plane();
        p5.pop();

        p5.pop();
    };

    const drawWorld = (w: World) => {
        p5.push();
        drawWorldOutline(w);
        drawWorldFields(w);
        drawRobots(w);
        p5.pop();
    };

    const drawRobots = (w: World) => {
        p5.push();
        p5.translate((1 - w.L) * 0.5 * TSZ, (1 - w.W) * 0.5 * TSZ, (1 - w.H) * 0.5 * BLH);
        for (const [i, r] of w.robots.entries()) {
            // do the drawing
            p5.push();
            p5.translate(0, 0, 5 * p5.abs(p5.sin(i + p5.frameCount * 0.1)));
            const f = w.getField(r.pos.x, r.pos.y)!;
            p5.translate(
                r.pos.x * TSZ,
                r.pos.y * TSZ,
                (f.blocks.length - 0.5) * BLH
            );
            p5.rotateZ(2 * p5.PI * r.dir2Angle() / 360);

            drawSingleRobot(r);

            p5.pop();
        }
        p5.pop();
    };

    const drawSingleRobot = (r: Robot) => {
        p5.push();
        p5.translate(0, 0, RBH * 0.5);
        p5.fill(CBOT);

        p5.push();
        p5.box(RBW, RBW, RBH);
        p5.pop();

        p5.push();
        let numberPlate = numberPlates[r.index];
        if (!numberPlate) {
            numberPlate = p5.createGraphics(RBW, RBH);
            numberPlate.textFont("Consolas");
            numberPlate.textSize(20);
            numberPlate.textAlign(p5.CENTER, p5.CENTER);
            numberPlate.text(r.index.toString(), 0, 0, RBW, RBH);
            numberPlates[r.index] = numberPlate;
        }

        p5.noStroke();
        p5.translate(RBW * 0.51, 0, 0);
        p5.texture(numberPlate);
        p5.rotateX(-p5.PI * 0.5);
        p5.rotateY(p5.PI * 0.5);
        p5.plane(RBW, RBH);

        p5.translate(0, 0, -RBW * 1.02);
        p5.rotateY(p5.PI);
        p5.plane(RBW, RBH);

        p5.pop();

        // eye
        p5.translate(0, 0, RBH * 0.1);

        p5.push();
        p5.noStroke();
        p5.fill(255);
        p5.translate(0, RBW * 0.3, 0);
        p5.sphere(RBW * 0.4);
        p5.pop();

        p5.push();
        p5.noStroke();
        p5.fill(0);
        p5.translate(0, RBW * 0.42, 0);
        p5.sphere(RBW * 0.3);
        p5.pop();

        // arms
        p5.fill(CBOT2);
        p5.push();
        p5.noStroke();
        p5.translate(-RBW * 0.4, RBW * 0.6, -RBW * 0.4);
        p5.sphere(RBW * 0.2);
        p5.pop();

        p5.push();
        p5.noStroke();
        p5.translate(RBW * 0.4, RBW * 0.6, -RBW * 0.4);
        p5.sphere(RBW * 0.2);
        p5.pop();

        // backplate
        p5.push();
        p5.noStroke();
        p5.fill(0);
        p5.translate(0, -RBW * 0.5, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.translate(-RBW * 0.2, 0, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.translate(RBW * 0.4, 0, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.pop();

        // name
        p5.pop();

    };

    const drawWorldOutline = (w: World) => {
        p5.push();
        p5.translate(0, 0, -FLH * 0.5);
        p5.noFill();
        p5.stroke(255);
        p5.box(w.L * TSZ + 2, w.W * TSZ + 2, w.H * BLH + FLH + 2);

        p5.pop();
    };

    const drawWorldFields = (w: World) => {
        if (worldGeneriation != w.generation) {
            worldGeneriation = w.generation;
            const boxes = new BatchedBoxes();
            boxes.init(w.L, w.W, w.H);
            for (const [y, line] of w.fields.entries()) {
                for (const [x, field] of line.entries()) {
                    // debug
                    //drawFieldBoundary(x, y, field);
                    drawField(boxes, x, y, field);
                }
            }
            worldGeoms = boxes.draw(p5);
        }
        for (const model of worldGeoms) {
            model.setup(p5);
            p5.model(model.geom);
        }

    };

    const drawField = (boxes: BatchedBoxes, x: number, y: number, f: Field) => {
        // field goal
        const goalReached = drawGoalStatus(f);
        boxes.goal(x, y, goalReached);

        // draw floor
        boxes.floor(x, y, !f.isEmpty);

        // draw wall
        if (f.isWall) {
            boxes.wall(x, y);
        }


        for (const [z, block] of f.blocks.entries()) {
            let mismatchToGoal = false;
            if (f.goalBlocks != null) {
                // either goal wants no block here, or block is wrong
                mismatchToGoal = f.goalBlocks.length <= z || f.goalBlocks[z] != block;
            }
            if (mismatchToGoal) {
                boxes.badBlock(x, y, z, block);
            } else {
                boxes.block(x, y, z, block);
            }
        }
        
        // goal blocks
        if (f.goalBlocks != null && !goalReached) {
            for (const [z, block] of f.goalBlocks.slice(f.blocks.length).entries()) {
                boxes.goalBlock(x, y, z, block);
            }
        }

        // markers
        if (f.marker != MarkerType.None) {
            const mismatchToGoal = f.goalMarker != null && f.goalMarker != f.marker;
            if (mismatchToGoal) {
                boxes.badMarker(x, y, f.marker);
            } else {
                boxes.marker(x, y, f.marker);
            }
        }

        // goal markers
        if (f.goalMarker != null && !goalReached && f.goalMarker != MarkerType.None) {
            boxes.goalMarker(x, y, f.marker);
        }
    };

    const drawFieldBoundary = (x: number, y: number, f: Field) => {
        p5.push();
        p5.translate(x * TSZ, y * TSZ, 0);
        p5.noFill();
        p5.scale(0.98);
        if (f.isGoalReached()) {
            p5.stroke(0, 255, 0);
        } else {
            p5.stroke(255, 0, 0);
        }
        p5.box(TSZ, TSZ, f.H * BLH);
        p5.pop();
    };

    const drawGoalStatus = (f: Field) => {
        if (f.isEmpty) return true;
        const goalDone = f.isGoalReached();
        return goalDone;
    };

}

const robotView = new p5(robotSketch, document.body);