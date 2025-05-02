import * as p5 from "p5";
import { WorldViewEnv } from "../app";
import { OutfitType, Robot, ThoughtType } from "../robot/robot";
import {
    CR,
    CY,
    CG,
    CB,
    BlockType,
    MarkerType,
    World,
    CBOT,
    CBOT2,
    Field,
} from "../robot/world";
import {
    robotDiagramIndex,
    hideRobotDiagram,
    updateRobotDiagram,
} from "./objectigrams";
import {
    clamp,
    easeBump,
    easeInCubic,
    easeInOutQuad,
    easeOutCubic,
    easeOutQuad,
    lerp,
} from "../utils";

let ENV: WorldViewEnv;
// Setup robot sketch
function robotSketch(p5: p5) {
    let bg = 0; // Background color
    const canvasDiv = document.getElementById("robot-canvas")!;
    let cam: p5.Camera;
    let animStrength = 0;
    let timer = 0;
    let taskCheckReloadTime = 200;
    let isOrtho = false;
    let loadStage = 0;
    let wasRunning = false;
    let lastSession = -1;

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

    const createFramebuffer = (graphic: p5.Graphics) => {
        const xt = p5.createFramebuffer();
        xt.resize(graphic.width, graphic.height);
        xt.begin();
        p5.image(graphic, -graphic.width/2, -graphic.height/2);
        xt.end();
        return xt;
    };

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

    const createTextTexture = (
        str: string,
        color: string = "#FFF",
        border = false
    ) => {
        const ct = p5.createGraphics(TSZ, TSZ);
        ct.fill(color);
        ct.textAlign(p5.CENTER);
        ct.textSize(TSZ * 0.7);
        ct.text(str, 0.5 * TSZ, 0.75 * TSZ);
        if (border) {
            ct.noFill();
            ct.strokeWeight(3);
            ct.stroke(color);
            ct.strokeJoin(p5.ROUND);
            ct.rect(0.15 * TSZ, 0.15 * TSZ, TSZ * 0.7, TSZ * 0.7);
        }
        return ct;
    };

    const XNone = createXTexture("#000000");
    const XR = createXTexture(CR);
    const XY = createXTexture(CY);
    const XG = createXTexture(CG);
    const XB = createXTexture(CB);

    const CMP = createCompassTexture();

    let NT: p5.Graphics | p5.Framebuffer = createTextTexture("N");
    let WT: p5.Graphics | p5.Framebuffer = createTextTexture("W");
    let ET: p5.Graphics | p5.Framebuffer = createTextTexture("O");
    let ST: p5.Graphics | p5.Framebuffer = createTextTexture("S");

    const THOUGHT2TEXTURE: Record<ThoughtType, p5.Graphics | p5.Framebuffer> = {
        [ThoughtType.Wall]: createTextTexture("🚧"),
        [ThoughtType.Void]: createTextTexture("🕳️"),
        [ThoughtType.Block]: createTextTexture("🧱"),
        [ThoughtType.Place]: createTextTexture("🧱"),
        [ThoughtType.Pickup]: createTextTexture("⛏️"),
        [ThoughtType.Mark]: createTextTexture("✏️"),
        [ThoughtType.Remove]: createTextTexture("🧽"),
        [ThoughtType.YellowBlock]: createTextTexture("🟨"),
        [ThoughtType.RedBlock]: createTextTexture("🟥"),
        [ThoughtType.GreenBlock]: createTextTexture("🟩"),
        [ThoughtType.BlueBlock]: createTextTexture("🟦"),
        [ThoughtType.YellowMarker]: createTextTexture("🟡"),
        [ThoughtType.RedMarker]: createTextTexture("🔴"),
        [ThoughtType.GreenMarker]: createTextTexture("🟢"),
        [ThoughtType.BlueMarker]: createTextTexture("🔵"),
        [ThoughtType.Robot]: createTextTexture("🤖"),
        [ThoughtType.Sees]: createTextTexture("👁️"),
        [ThoughtType.Yes]: createTextTexture("✔️"),
        [ThoughtType.No]: createTextTexture("❌"),
        [ThoughtType.Nothing]: createTextTexture(""),
    }
    

    const RGIDX: (p5.Graphics | p5.Framebuffer)[] = [
        createTextTexture("0", "#CCC", true),
        createTextTexture("1", "#CCC", true),
        createTextTexture("2", "#CCC", true),
        createTextTexture("3", "#CCC", true),
        createTextTexture("4", "#CCC", true),
        createTextTexture("5", "#CCC", true),
        createTextTexture("6", "#CCC", true),
        createTextTexture("7", "#CCC", true),
        createTextTexture("8", "#CCC", true),
        createTextTexture("9", "#CCC", true),
    ];

    const BLOCK2COLOR: Record<BlockType, string> = {
        [BlockType.r]: CR,
        [BlockType.g]: CG,
        [BlockType.b]: CB,
        [BlockType.y]: CY,
    };

    const BLOCK2XTEXTURE: Record<BlockType, p5.Graphics | p5.Framebuffer> = {
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

    const MARKER2XTEXTURE: Record<MarkerType, p5.Graphics | p5.Framebuffer> = {
        [MarkerType.None]: XNone,
        [MarkerType.R]: XR,
        [MarkerType.G]: XG,
        [MarkerType.B]: XB,
        [MarkerType.Y]: XY,
    };

    const numberPlates: Record<number, p5.Graphics | p5.Framebuffer> = {};

    const resetCamera = () => {
        let angle = (3 * Math.PI) / 4;
        let rotation = Math.PI * 0.15;
        let diagonal = Math.sqrt(ENV.world.W ** 2 + ENV.world.H ** 2 + ENV.world.L ** 2);
        let distance = Math.sqrt(diagonal) * 230; // try to show it all
        cam.setPosition(
            distance * Math.sin(rotation),
            distance * Math.cos(angle),
            distance * Math.sin(angle) * Math.cos(rotation)
        );
        cam.lookAt(0, 0, 0);
    };

    const setPerspective = () => {
        if (isOrtho) {
            p5.ortho(
                -p5.width / 2,
                p5.width / 2,
                -p5.height / 2,
                p5.height / 2,
                1,
                10000
            );
        } else {
            p5.perspective();
        }
    };

    p5.setup = () => {
        const width = canvasDiv.offsetWidth;
        const height = canvasDiv.offsetHeight;
        const cvs = p5.createCanvas(width, height, p5.WEBGL);
        cvs.style("border-radius:5px;"); // probably not necessary
        let canvasW = 0,
            canvasH = 0;

        // setup resizing
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (canvasH != height || canvasW != width)
                p5.resizeCanvas(width, height);
            canvasH = height;
            canvasW = width;
            setPerspective();
        });
        observer.observe(canvasDiv, { box: "content-box" });

        // setup camera
        cam = p5.createCamera();
        resetCamera();
        canvasDiv.ondblclick = resetCamera;

        // attach p5 to canvas div
        cvs.parent("robot-canvas");
    };
    
    p5.draw = () => {
        // replacing graphics w/ framebuffers
        if (loadStage >= 0) {
            if (loadStage === 0)
                for (let [key, img] of Object.entries(BLOCK2XTEXTURE)) {
                    BLOCK2XTEXTURE[key as BlockType] = createFramebuffer(img as p5.Graphics);
                }
            
            if (loadStage === 1)
                for (let [key, img] of Object.entries(MARKER2XTEXTURE)) {
                    MARKER2XTEXTURE[key as BlockType] = createFramebuffer(img as p5.Graphics);
                }
            
            if (loadStage === 3)
                for (let [key, img] of Object.entries(MARKER2XTEXTURE)) {
                    MARKER2XTEXTURE[key as BlockType] = createFramebuffer(img as p5.Graphics);
                }
            
            if (loadStage === 4)
                for (let [key, img] of RGIDX.entries()) {
                    RGIDX[key] = createFramebuffer(img as p5.Graphics);
                }

            if (loadStage === 5) {
                NT = createFramebuffer(NT as p5.Graphics);
                WT = createFramebuffer(WT as p5.Graphics);
                ST = createFramebuffer(ST as p5.Graphics);
                ET = createFramebuffer(ET as p5.Graphics);
            }

            if (loadStage === 6)
                for (let [key, img] of Object.entries(THOUGHT2TEXTURE)) {
                    THOUGHT2TEXTURE[parseInt(key) as ThoughtType] = createFramebuffer(img as p5.Graphics);
                }

            if (loadStage < 6) loadStage += 1;
            else loadStage = -1;
        }

        // update sum of frame lag
        const {
            isRunning,
            queueInterrupt,
            world,
            taskCheck,
            manualMode,
            playState,
            dt,
            maxDt,
        } = ENV;
        if (isRunning && !manualMode) {
            ENV.updateLagSum(p5.deltaTime);
        } else {
            ENV.resetLagSum();
        }

        // ortho
        if (ENV.toggleOrtho.active !== isOrtho) {
            isOrtho = ENV.toggleOrtho.active;
            setPerspective();
        }

        // update task status (only updating if not current)
        timer = timer + p5.deltaTime;
        if (timer > taskCheckReloadTime) {
            timer = 0;
            let isGoalReached = world.isGoalReached();
            taskCheck.style.backgroundColor = isGoalReached
                ? "lightgreen"
                : "whitesmoke";
            let emoji = isGoalReached ? "✔️" : "❌";
            taskCheck.innerHTML = `${emoji}<br>${
                world.getStageIndex() + 1
            } / ${world.getStageCount()}`;

            playState.innerHTML = queueInterrupt
            ? "report"
            : !isRunning
            ? "stop"
            : manualMode
            ? "pause"
            : "play_arrow";
        }
        
        // do stuff when execution starts/ends
        if (isRunning && !wasRunning) {
            wasRunning = true;
        }
        if (!isRunning || queueInterrupt) {
            wasRunning = false;
        }

        // do stuff on world load
        if (lastSession !== world.session) {
            lastSession = world.session;
            resetCamera();
        }

        p5.background(0, 0);
        p5.orbitControl();

        p5.push();

        // tilt and zoom out
        p5.rotateX(p5.PI * 0.5);
        p5.scale(0.8);

        // anim strength
        animStrength = ENV.toggleAnimation.active
            ? easeOutCubic(1 - dt / maxDt)
            : 0;

        // drawing the world
        drawWorld(world);

        p5.pop();

        // draw object diagrams
        if (robotDiagramIndex >= world.robots.length) {
            hideRobotDiagram(ENV.objOverlay);
        }

        if (robotDiagramIndex >= 0) {
            updateRobotDiagram(world.robots[robotDiagramIndex], ENV.objOverlay);
        }

        // draw heads up display
        drawHUD();
    };

    const drawBillboard = (drawCall: () => void) => {
        const pan = p5.atan2(cam.eyeZ - cam.centerZ, cam.eyeX - cam.centerX);
        const tilt = p5.atan2(
            cam.eyeY - cam.centerY,
            p5.dist(cam.centerX, cam.centerZ, cam.eyeX, cam.eyeZ)
        );

        p5.push();
        p5.rotateZ(pan);
        p5.rotateY(tilt);

        // draw Billboard here
        drawCall();

        p5.pop();
    };

    const drawHUD = () => {
        const pan = p5.atan2(cam.eyeZ - cam.centerZ, cam.eyeX - cam.centerX);
        const tilt = p5.atan2(
            cam.eyeY - cam.centerY,
            p5.dist(cam.centerX, cam.centerZ, cam.eyeX, cam.eyeZ)
        );

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
        drawCompass(w);
        drawRobotThoughts(w);
        p5.pop();
    };

    const drawRobots = (w: World) => {
        p5.push();
        p5.translate(
            (1 - w.L) * 0.5 * TSZ,
            (1 - w.W) * 0.5 * TSZ,
            (1 - w.H) * 0.5 * BLH
        );
        for (const [i, r] of w.robots.entries()) {
            const f = w.getField(r.pos.x, r.pos.y)!;
            const fieldHeight = f.blocks.length;

            r.prepare(fieldHeight); // this passes info to the robot object
            r.animate(p5.deltaTime / ENV.dt, p5.deltaTime); // this does the timing calculation

            // do the drawing
            drawSingleRobot(r);
        }

        p5.pop();
    };

    const drawRobotThoughts = (w: World) => {
        if (!ENV.toggleThoughts.active) return;

        p5.push();
        p5.translate(
            (1 - w.L) * 0.5 * TSZ,
            (1 - w.W) * 0.5 * TSZ,
            (1 - w.H) * 0.5 * BLH
        );

        for (const [i, r] of w.robots.entries()) {
            // do the post fx
            drawSingleRobotThoughts(r);
        }

        p5.pop();
    };

    const translateSingleRobot = (r: Robot) => {
        p5.translate(0, 0, -0.5 * BLH);
        p5.translate(
            0,
            0,
            animStrength *
                0.1 *
                BLH *
                p5.abs(p5.sin(r.index + p5.frameCount * 0.1))
        ); // bobbing
        p5.translate(0, 0, animStrength * BLH * easeBump(1 - r.animHopProg)); // hop
        p5.translate(
            0,
            0,
            animStrength * 0.2 * BLH * easeBump(1 - r.animMarkerProg)
        ); // marker hop
        // sliding
        if (ENV.toggleAnimation.active) {
            p5.translate(
                lerp(r.animLastPos.x, r.pos.x, r.interpHop) * TSZ,
                lerp(r.animLastPos.y, r.pos.y, r.interpHop) * TSZ,
                lerp(r.animLastHeight, r.animCurrHeight, r.interpFall) * BLH
            );
        } else {
            p5.translate(r.pos.x * TSZ, r.pos.y * TSZ, r.animCurrHeight * BLH);
        }
    };

    const rotateSingleRobot = (r: Robot) => {
        // facing direction
        if (ENV.toggleAnimation.active)
            p5.rotateZ(
                (2 *
                    p5.PI *
                    lerp(
                        r.animLastRot + r.animRotRnd * animStrength,
                        r.animCurrRot + r.animRotRnd * animStrength,
                        r.interpRot
                    )) /
                    360
            );
        else p5.rotateZ((2 * p5.PI * r.animCurrRot) / 360);
        // doing the little hop
        p5.rotateX(animStrength * p5.PI * 0.05 * easeBump(1 - r.animHopProg));
        // doing the little hop on marker
        p5.rotateX(
            animStrength * p5.PI * 0.05 * easeBump(1 - r.animMarkerProg)
        );
        // doing wait tilt
        p5.rotateY(
            animStrength *
                r.animWaitDir *
                p5.PI *
                0.02 *
                easeBump(1 - r.animWaitProg)
        );

        // placing nod
        p5.rotateX(
            animStrength *
                r.animPlaceDir *
                p5.PI *
                0.02 *
                easeBump(1 - r.animPlaceProg)
        );
    };

    const drawSingleRobotThoughts = (r: Robot) => {
        p5.push(); // bot

        translateSingleRobot(r);

        // status indicators
        p5.translate(0, 0, 1.4 * RBH);

        // draw "thought"
        drawBillboard(() => {
            p5.push(); // thought
            p5.noStroke();
            p5.fill(255);
            p5.rotateY(p5.HALF_PI);
            p5.rotateZ(-p5.HALF_PI);

            if (r.animThoughtType != ThoughtType.Nothing) {
                // main
                p5.texture(THOUGHT2TEXTURE[r.animThoughtType]);
                
                // popping
                p5.scale(easeOutCubic(1 - r.animThoughtProg));
                p5.translate(
                    0,
                    0,
                    animStrength *
                        0.7 *
                        TSZ *
                        easeBump(clamp((1 - r.animThoughtProg) * 2, 0, 1))
                );
                // main
                p5.plane(TSZ * 1);
                // cond
                p5.translate(0, 0, 0.2);
                if (!r.animThoughtCond) {
                    p5.texture(THOUGHT2TEXTURE[ThoughtType.No]);
                    p5.plane(TSZ * 1);
                }
            }
            p5.pop(); // end thought
        });

        p5.pop(); // end bot
    };

    const drawRobotOutfit = (r: Robot) => {
        p5.push();
        // on top of head
        p5.translate(0, 0, RBH);

        switch (r.outfit) {
            case OutfitType.None:
                // no outfit
                break;
            case OutfitType.TopHat:
                let brimHeight = 2;
                let brimRadius = RBW / 3 + 1;
                let hatRadius = RBW / 5 + 1;
                let hatHeight = hatRadius * 2 - 2;
                let hatColor = "#6F4E37";
                let hatColor2 = "#8f674c";
                let hatColor3 = "black";
                // position on the head
                let x = lerp(r.animLastPos.x, r.pos.x, r.interpHop);
                let y = lerp(r.animLastPos.y, r.pos.y, r.interpHop);
                // random-ish poistion on the head
                p5.translate(
                    p5.sin(x + y) * RBW * 0.25,
                    p5.sin(x - y) * RBW * 0.25,
                    0
                );
                p5.rotateZ(x + y); // random-ish rotation
                p5.scale(1 - r.animOutfitProg); // popping up
                // animation
                p5.translate(0, 0, easeInOutQuad(r.animHopProg) * 5);
                let hatBounce = animStrength * (p5.sin(r.index + p5.frameCount * 0.1 + 0.2));
                let hatBounce2 = animStrength * (p5.sin(r.index + p5.frameCount * 0.1 + 0.7));
                p5.rotateX((hatBounce + 1) * 0.05);
                p5.rotateY(-(hatBounce2 + 1) * 0.05);
                // drawing the hat
                p5.noStroke();
                p5.rotateX(Math.PI / 2);
                p5.translate(0, brimHeight / 2 + 1, 0);
                p5.fill(hatColor);
                p5.cylinder(brimRadius, brimHeight);
                p5.translate(0, -brimHeight / 2 + hatHeight / 2, 0);
                p5.rotateX(0.1);
                p5.rotateY(0.1);
                p5.fill(hatColor2);
                p5.cylinder(hatRadius, hatHeight);
                p5.translate(0, -hatHeight * 0.25, 0);
                p5.fill(hatColor3);
                p5.cylinder(hatRadius + 1, hatHeight * 0.2);
                break;
            case OutfitType.BaseballCap:
                break;
            default:
                const _UNREACHABLE: never = r.outfit;
        }
        p5.pop();
    }

    const drawSingleRobot = (r: Robot) => {
        p5.push(); // bot

        translateSingleRobot(r);

        p5.push(); // rotations

        rotateSingleRobot(r);

        p5.push(); // body
        p5.translate(0, 0, RBH * 0.5);
        p5.fill(CBOT);
        p5.box(RBW, RBW, RBH);

        p5.push(); // numbers plates
        let numberPlate = numberPlates[r.index];
        if (!numberPlate) {
            numberPlate = p5.createGraphics(RBW, RBH);
            numberPlate.textFont("Consolas");
            numberPlate.textSize(20);
            numberPlate.textAlign(p5.CENTER, p5.CENTER);
            numberPlate.text(r.index.toString(), 0, 0, RBW, RBH);
            numberPlates[r.index] = createFramebuffer(numberPlate);
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

        p5.pop(); // end number plates

        // eye
        p5.translate(0, 0, RBH * 0.1);

        p5.push(); // eye
        p5.noStroke();
        p5.fill(255);
        p5.translate(0, RBW * 0.3, 0);
        p5.sphere(RBW * 0.4);

        // do blink
        if (r.animBlinkProg > 0) {
            p5.fill(CBOT2);
            p5.sphere(RBW * 0.43);
        }

        p5.pop(); // end eye

        p5.push(); // pupil
        p5.noStroke();
        // animate eye color
        const interp = easeOutQuad(1 - r.animWatchProg);
        if (r.animWatchCond) p5.fill(0, 255 * interp, 0); // blink green
        else p5.fill(255 * interp, 0, 0); // blink red

        p5.translate(0, RBW * 0.42, 0);
        p5.sphere(RBW * 0.3);

        p5.pop(); // end pupil

        p5.push(); // arms

        const interpPlace = easeBump(1 - r.animPlaceProg);
        if (r.animPlaceDir > 0)
            p5.translate(
                0,
                0,
                animStrength * lerp(0, r.animPlaceDir * BLH * 0.7, interpPlace)
            );
        else
            p5.translate(
                0,
                0,
                lerp(0, animStrength * r.animPlaceDir * BLH * 0.5, interpPlace)
            );

        p5.translate(0, animStrength * -lerp(0, -BLH * 0.1, interpPlace), 0);

        p5.fill(CBOT2);
        p5.push(); // left arm
        p5.noStroke();
        p5.translate(-RBW * 0.4, RBW * 0.6, -RBW * 0.4);
        p5.sphere(RBW * 0.2);
        p5.pop(); // end left arm

        p5.push(); // right arm
        p5.noStroke();
        p5.translate(RBW * 0.4, RBW * 0.6, -RBW * 0.4);
        p5.sphere(RBW * 0.2);
        p5.pop(); // end right arm

        p5.pop(); // end arms

        p5.push(); // backplate
        p5.noStroke();
        p5.fill(0);
        p5.translate(0, -RBW * 0.5, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.translate(-RBW * 0.2, 0, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.translate(RBW * 0.4, 0, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.pop(); // end backplate

        p5.pop(); // end body

        drawRobotOutfit(r);

        p5.pop(); // end rotations

        // status indicators
        p5.translate(0, 0, 1.4 * RBH);

        p5.pop(); // end bot
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
            if (f.canCullBlock(z)) continue; // don't draw box if fully covered
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
            // p5.scale(0.9); // for debug
            p5.box(TSZ, TSZ, BLH);
            p5.pop();
        }

        // markers
        if (f.marker != MarkerType.None) {
            p5.push();
            p5.translate(0, 0, (-BLH + MRH) * 0.5);
            const h = f.blocks.length;
            p5.translate(0, 0, h * BLH);
            p5.fill(MARKER2COLOR[f.marker]);
            if (f.goalMarker != null && f.goalMarker != f.marker)
                p5.texture(MARKER2XTEXTURE[f.marker]);
            p5.stroke(0);
            p5.box(MSZ, MSZ, MRH);
            p5.pop();
        }

        const goalReached = f.isGoalReached();

        // goal blocks
        if (f.goalBlocks != null && !goalReached) {
            for (const [z, block] of f.goalBlocks.entries()) {
                let h = f.blocks.length;
                if (z < h) continue;
                let dz = z - h;
                let animH = p5.sin(p5.frameCount * 0.05 + dz) * BLH * 0.2;
                p5.push();
                p5.translate(0, 0, z * BLH);
                p5.rotateZ(
                    Math.sin(p5.frameCount * 0.06 + dz + f.x * 7 + f.y * 13) *
                        0.2
                );

                // shadow
                if (dz === 0) {
                    p5.push();
                    p5.translate(0, 0, -0.5 * BLH + 1);
                    if (f.marker !== MarkerType.None) {
                        p5.translate(0, 0, 1);
                    }
                    p5.scale(0.5);
                    p5.scale(1 / (1 + animH * 0.005));
                    p5.fill(0, 100);
                    p5.noStroke();
                    p5.plane(TSZ, TSZ);
                    p5.pop();
                }

                // floaty bits
                p5.push();
                p5.translate(0, 0, animH);
                p5.scale(0.5);
                p5.fill(BLOCK2COLOR[block]);
                p5.stroke(0, 0, 0);
                p5.scale(1 / (1 + dz * 0.5));
                p5.box(TSZ, TSZ, BLH);
                p5.pop();

                p5.pop();
            }
        }

        // goal markers
        if (f.goalMarker !== null && !goalReached) {
            if (f.goalMarker != MarkerType.None && f.goalMarker !== f.marker) {
                const groundH = f.blocks.length;
                const h = Math.max(
                    groundH,
                    f.goalBlocks ? f.goalBlocks.length : 0
                );
                const animH =
                    p5.sin(p5.frameCount * 0.05) * BLH * 0.4 + BLH * 0.5;

                p5.push();
                p5.translate(0, 0, (-BLH + MRH) * 0.5);
                p5.rotateZ(p5.frameCount * 0.02 + h);

                // "shadow"
                p5.push();
                p5.translate(0, 0, groundH * BLH);
                if (f.marker !== MarkerType.None) {
                    p5.translate(0, 0, 1);
                }
                p5.fill(0, 100); // should be fine, since its always drawn on top
                p5.noStroke();
                p5.scale(0.5);
                p5.scale(1 / (1 + animH * 0.005));
                p5.plane(MSZ, MSZ);
                p5.pop();

                // "floaty bit"
                p5.push();
                p5.translate(0, 0, h * BLH);
                p5.translate(0, 0, animH);
                p5.fill(MARKER2COLOR[f.goalMarker]);
                p5.stroke(0);
                p5.scale(0.5);
                p5.box(MSZ, MSZ, MRH);
                p5.pop();

                p5.pop();
            }
        }

        // goal robots
        if (f.goalRobotIdx != null) {
            if (f.goalRobotIdx >= 0 && f.goalRobotIdx < 10) {
                p5.push();
                p5.translate(0, 0, -BLH / 2 + 1);
                p5.noStroke();
                p5.texture(RGIDX[f.goalRobotIdx]);
                p5.plane();
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
        p5.translate(0, 0, -FLH);
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

export function setup(env: typeof ENV) {
    ENV = env;
    return new p5(robotSketch, document.body);
}
