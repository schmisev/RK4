import * as p5 from 'p5';

import { isRunning, queueInterrupt, world, objOverlay, taskCheck, updateLagSum, resetLagSum } from '..';
import { Robot } from '../robot/robot';
import { CR, CY, CG, CB, BlockType, MarkerType, World, CBOT, CBOT2, Field } from '../robot/world';
import { robotDiagramIndex, showRobotDiagram, hideRobotDiagram, updateRobotDiagram } from './objectigrams';


// Setup robot sketch
export function robotSketch(p5: p5) {
    let bg = 0; // Background color
    const canvasDiv = document.getElementById('robot-canvas')!;
    let canvasW = 0, canvasH = 0;
    let cam: p5.Camera;
    let pan = 0.0;
    let tilt = 0.0;
    let worldGoalReached = false;

    const CPS = 100; // Compass size
    const TSZ = 50; // Tilesize
    const BLH = 30; // Block height
    const MRH = 1; // Marker height
    const MSZ = 50; // Marker size
    const WLH = TSZ; // Wall height
    const FLH = 10; // Floor height
    const RBH = 60; // Robot body height
    const RBW = 35;

    const HUDF: number = 100; // HUD-factor
    const SQHUDF: number = p5.sqrt(HUDF);

    const createXTexture = (col: string) => {
        const xt = p5.createGraphics(TSZ, TSZ);
        xt.background(col);
        xt.strokeWeight(3);
        xt.line(TSZ * 0.25, TSZ * 0.25, TSZ * 0.75, TSZ * 0.75);
        xt.line(TSZ * 0.75, TSZ * 0.25, TSZ * 0.25, TSZ * 0.75);
        return xt;
    };

    const createCompassTexture = () => {
        const ct = p5.createGraphics(CPS, CPS);
        ct.strokeWeight(3);
        ct.stroke(255);

        ct.line(0.5 * CPS, 0, 0.5 * CPS, CPS);
        ct.line(0, 0.5 * CPS, CPS, 0.5 * CPS);
        ct.line(0.75 * CPS, 0.25 * CPS, 0.25 * CPS, 0.75 * CPS);
        ct.line(0.25 * CPS, 0.25 * CPS, 0.75 * CPS, 0.75 * CPS);

        ct.textAlign(p5.CENTER);
        ct.text("N", 0.5 * CPS, 0.1 * CPS);

        return ct;
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

    const CMP = createCompassTexture();

    const NT = createTextTexture("N");
    const WT = createTextTexture("W");
    const ET = createTextTexture("O");
    const ST = createTextTexture("S");

    const BLOCK2COLOR: Record<BlockType, string> = {
        [BlockType.r]: CR,
        [BlockType.g]: CG,
        [BlockType.b]: CB,
        [BlockType.y]: CY,
    };

    const BLOCK2XTEXTURE: Record<BlockType, p5.Graphics> = {
        [BlockType.r]: XR,
        [BlockType.g]: XG,
        [BlockType.b]: XB,
        [BlockType.y]: XY,
    };

    const MARKER2COLOR: Record<MarkerType, string> = {
        [MarkerType.None]: "#000000",
        [MarkerType.R]: CR,
        [MarkerType.G]: CG,
        [MarkerType.B]: CB,
        [MarkerType.Y]: CY,
    };

    const MARKER2XTEXTURE: Record<MarkerType, p5.Graphics> = {
        [MarkerType.None]: XNone,
        [MarkerType.R]: XR,
        [MarkerType.G]: XG,
        [MarkerType.B]: XB,
        [MarkerType.Y]: XY,
    };

    const numberPlates: Record<number, p5.Graphics> = {};

    const resizeToParent = () => {
        const width = canvasDiv.offsetWidth;
        const height = canvasDiv.offsetHeight;
        if (canvasH != height || canvasW != width) {
            canvasH = height;
            canvasW = width;
            p5.resizeCanvas(width, height);
        }
    };

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
        cvs.parent("robot-canvas");
    };

    p5.draw = () => {
        // update sum of frame lag
        if (isRunning) {
            updateLagSum(p5.deltaTime);
        } else {
            resetLagSum();
        }

        // update task status
        if (!world.isGoalReached()) {
            taskCheck.style.backgroundColor = "whitesmoke";
            taskCheck.innerHTML = "❌<br>" + `${world.getStageIndex()} / ${world.getStageCount()}`;
        } else {
            taskCheck.style.backgroundColor = "lightgreen";
            taskCheck.innerHTML = "✔️<br>" + `${world.getStageIndex() + 1} / ${world.getStageCount()}`;
        }

        const worldInst = world

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
        if (robotDiagramIndex >= world.robots.length) {
            hideRobotDiagram(objOverlay);
        }

        if (robotDiagramIndex >= 0) {
            updateRobotDiagram(worldInst.robots[robotDiagramIndex], objOverlay);
        }

        // draw compass
        drawCompass(worldInst);

        p5.pop();

        // draw heads up display
        drawHUD();
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
        p5.push();
        p5.translate((1 - w.L) * 0.5 * TSZ, (1 - w.W) * 0.5 * TSZ);
        for (const [y, line] of w.fields.entries()) {
            for (const [x, field] of line.entries()) {
                p5.push();
                p5.translate(x * TSZ, y * TSZ, 0);
                // debug
                //drawFieldBoundary(field);
                drawField(field);
                p5.pop();
            }
        }
        p5.pop();
    };

    const drawField = (f: Field) => {
        p5.push();
        p5.translate(0, 0, (1 - f.H) * 0.5 * BLH);

        // field goal
        drawGoalStatus(f);

        // draw floor
        if (!f.isEmpty) {
            p5.push();
            p5.fill(250);
            p5.stroke(200);
            p5.translate(0, 0, (-BLH - FLH) * 0.5);
            p5.box(TSZ, TSZ, FLH);
            p5.pop();
        }

        // draw wall
        if (f.isWall) {
            p5.push();
            p5.fill(200);
            p5.stroke(0);
            p5.translate(0, 0, (-BLH + WLH) * 0.5);
            p5.box(TSZ, TSZ, WLH);
            p5.pop();
        }


        for (const [z, block] of f.blocks.entries()) {
            p5.push();
            p5.translate(0, 0, z * BLH);
            p5.fill(BLOCK2COLOR[block]);
            p5.stroke(0, 0, 0);
            //p5.texture(BLOCK2XTEXTURE[block]);
            if (f.goalBlocks != null) {
                if (f.goalBlocks.length <= z || f.goalBlocks[z] != block) {
                    p5.texture(BLOCK2XTEXTURE[block]);
                }
            }
            p5.box(TSZ, TSZ, BLH);
            p5.pop();
        }

        const goalReached = f.isGoalReached();
        
        // goal blocks
        if (f.goalBlocks != null && !goalReached) {
            for (const [z, block] of f.goalBlocks.entries()) {
                p5.push();
                p5.translate(0, 0, z * BLH);
                p5.rotateZ(p5.frameCount * 0.02 + z);
                p5.translate(
                    0,
                    0,
                    p5.sin(p5.frameCount * 0.05 + z) * BLH * 0.2
                );
                p5.scale(0.5);
                p5.fill(BLOCK2COLOR[block]);
                p5.stroke(0, 0, 0);
                p5.box(TSZ, TSZ, BLH);
                p5.pop();
            }
        }

        // markers
        if (f.marker != MarkerType.None) {
            p5.push();
            p5.translate(0, 0, (-BLH + MRH) * 0.5);
            const h = f.blocks.length;
            p5.translate(0, 0, h * BLH);
            p5.fill(MARKER2COLOR[f.marker]);
            if (f.goalMarker != null && f.goalMarker != f.marker) p5.texture(MARKER2XTEXTURE[f.marker]);
            p5.stroke(0);
            p5.box(MSZ, MSZ, MRH);
            p5.pop();
        }

        // goal markers
        if (f.goalMarker != null && !goalReached) {
            if (f.goalMarker != MarkerType.None) {
                p5.push();
                p5.translate(0, 0, (-BLH + MRH) * 0.5);
                const h = f.blocks.length;
                p5.translate(0, 0, h * BLH);
                p5.scale(0.5);
                p5.rotateZ(p5.frameCount * 0.02 + h);
                p5.translate(
                    0,
                    0,
                    p5.sin(p5.frameCount * 0.05) * BLH * 0.4 + BLH * 0.5
                );
                p5.fill(MARKER2COLOR[f.goalMarker]);
                p5.stroke(0);
                p5.box(MSZ, MSZ, MRH);
                p5.pop();
            }
        }

        p5.pop();
    };

    const drawFieldBoundary = (f: Field) => {
        p5.push();
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
        if (f.isEmpty) return;
        p5.push();
        p5.translate(0, 0, (-FLH));
        p5.translate(0, 0, -2 * FLH);
        p5.rotateX(p5.PI * 0.5);
        p5.noStroke();

        if (f.isGoalReached()) {
            p5.fill(0, 255, 0);
        } else {
            p5.fill(255, 0, 0);
        }
        p5.box(TSZ * 0.4, FLH, TSZ * 0.4);
        p5.pop();
    };

}

const robotView = new p5(robotSketch, document.body);