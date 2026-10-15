/**
 * 3D World Environment (Room, Furniture, Objects) using Three.js
 */
class WorldManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Lights
        this.ambientLight = null;
        this.sunLight = null;
        this.lampLight = null;
        this.isLampOn = true;

        // Interactive Objects
        this.items = {}; // { box, bear, book }
        this.slots = {}; // { desk, bed, shelf, floor, basket, box }

        // Particles
        this.particles = [];

        this.init();
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xdbeafe); // Soft sky blue background

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 11, 14);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Orbit Controls (child-friendly angle limits)
        if (THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2.15; // Don't go below floor
            this.controls.minDistance = 6;
            this.controls.maxDistance = 22;
            this.controls.target.set(0, 1.5, 0);
        }

        // 5. Lights
        this.setupLights();

        // 6. Build Room
        this.buildRoom();

        // 7. Build Furniture & Slots
        this.buildFurniture();

        // 8. Build Interactive Items
        this.buildItems();

        // Handle Window Resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLights() {
        // Soft Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xfff7ed, 0.7);
        this.scene.add(this.ambientLight);

        // Warm Sunlight through window
        this.sunLight = new THREE.DirectionalLight(0xffedd5, 0.85);
        this.sunLight.position.set(8, 15, 8);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 35;
        const d = 10;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.001;
        this.scene.add(this.sunLight);

        // Desk / Floor Lamp Light
        this.lampLight = new THREE.PointLight(0xffd166, 1.2, 12, 1.5);
        this.lampLight.position.set(-4, 3.8, -4);
        this.lampLight.castShadow = true;
        this.scene.add(this.lampLight);
    }

    buildRoom() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(12, 12);
        const floorMat = new THREE.MeshLambertMaterial({ color: 0xf3e8d2 }); // Light warm wood
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Floor border / baseboard
        const baseGeo = new THREE.BoxGeometry(12.2, 0.2, 12.2);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0xdec19b });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = -0.1;
        this.scene.add(base);

        // Back Wall
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xe0f2fe }); // Gentle soft pastel blue
        const backWallGeo = new THREE.PlaneGeometry(12, 7);
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(0, 3.5, -6);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Left Wall
        const leftWallGeo = new THREE.PlaneGeometry(12, 7);
        const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
        leftWall.position.set(-6, 3.5, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Round Fluffy Rug in center
        const rugGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.04, 32);
        const rugMat = new THREE.MeshLambertMaterial({ color: 0xfef08a }); // Light creamy yellow
        const rug = new THREE.Mesh(rugGeo, rugMat);
        rug.position.set(0, 0.02, 0.5);
        rug.receiveShadow = true;
        this.scene.add(rug);

        // Window on Back Wall
        this.buildWindow(0, 4.2, -5.92);

        // Wall Frame / Picture on Left Wall
        this.buildPictureFrame(-5.92, 4.2, 0);

        // Wall Clock
        this.buildClock(3.5, 5.2, -5.92);
    }

    buildWindow(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Frame
        const frameGeo = new THREE.BoxGeometry(3.2, 2.4, 0.1);
        const frameMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);

        // Glass / Outdoor sky
        const glassGeo = new THREE.PlaneGeometry(2.8, 2.0);
        const glassMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.z = 0.06;
        group.add(glass);

        // Sun / Cloud decoration on window
        const sunGeo = new THREE.CircleGeometry(0.35, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.position.set(0.8, 0.45, 0.07);
        group.add(sun);

        // Crossbars
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.12), frameMat);
        const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.0, 0.12), frameMat);
        group.add(hBar);
        group.add(vBar);

        this.scene.add(group);
    }

    buildPictureFrame(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        group.rotation.y = Math.PI / 2;

        const frameGeo = new THREE.BoxGeometry(2.0, 1.6, 0.08);
        const frameMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);

        const canvasGeo = new THREE.PlaneGeometry(1.7, 1.3);
        const canvasMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
        const canvas = new THREE.Mesh(canvasGeo, canvasMat);
        canvas.position.z = 0.05;
        group.add(canvas);

        // Rainbow arc decoration inside frame
        const rainbowGeo = new THREE.RingGeometry(0.3, 0.55, 16, 1, 0, Math.PI);
        const rainbowMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide });
        const rainbow = new THREE.Mesh(rainbowGeo, rainbowMat);
        rainbow.position.set(0, -0.2, 0.06);
        group.add(rainbow);

        this.scene.add(group);
    }

    buildClock(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        const clockGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 24);
        const clockMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const clock = new THREE.Mesh(clockGeo, clockMat);
        clock.rotation.x = Math.PI / 2;
        group.add(clock);

        const rimGeo = new THREE.TorusGeometry(0.5, 0.04, 8, 24);
        const rimMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        group.add(rim);

        // Hands
        const handGeo = new THREE.BoxGeometry(0.03, 0.3, 0.02);
        const handMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 });
        const hand = new THREE.Mesh(handGeo, handMat);
        hand.position.set(0, 0.1, 0.05);
        hand.rotation.z = -0.5;
        group.add(hand);

        this.scene.add(group);
    }

    buildFurniture() {
        // ==========================================
        // 1. DESK (Study Table)
        // ==========================================
        const deskGroup = new THREE.Group();
        deskGroup.position.set(3.6, 0, -3.2);

        // Table Top
        const topGeo = new THREE.BoxGeometry(3.0, 0.15, 1.8);
        const woodMat = new THREE.MeshLambertMaterial({ color: 0xb45309 }); // Rich warm wood
        const tableTop = new THREE.Mesh(topGeo, woodMat);
        tableTop.position.y = 1.9;
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        deskGroup.add(tableTop);

        // 4 Legs
        const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.9, 12);
        const legPositions = [
            [-1.3, 0.95, -0.7],
            [1.3, 0.95, -0.7],
            [-1.3, 0.95, 0.7],
            [1.3, 0.95, 0.7]
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, woodMat);
            leg.position.set(...pos);
            leg.castShadow = true;
            deskGroup.add(leg);
        });

        // Computer / Laptop monitor on desk
        const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), new THREE.MeshLambertMaterial({ color: 0x9ca3af }));
        lapBase.position.set(-0.8, 2.0, 0.2);
        deskGroup.add(lapBase);

        const lapScreen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.03), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
        lapScreen.position.set(-0.8, 2.25, -0.05);
        lapScreen.rotation.x = -0.2;
        deskGroup.add(lapScreen);

        // Pencil holder with colored pencils
        const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), new THREE.MeshLambertMaterial({ color: 0xec4899 }));
        holder.position.set(1.1, 2.1, -0.4);
        deskGroup.add(holder);

        this.scene.add(deskGroup);

        // Slot on Desk
        this.slots.desk = {
            name: '책상',
            position: new THREE.Vector3(3.8, 2.05, -3.0),
            occupied: false,
            interactPos: new THREE.Vector3(3.8, 0, -1.8) // where robot stands to place
        };

        // ==========================================
        // 2. BED (Cozy Bed)
        // ==========================================
        const bedGroup = new THREE.Group();
        bedGroup.position.set(-3.5, 0, -3.2);

        // Frame
        const bedFrameGeo = new THREE.BoxGeometry(2.4, 0.5, 3.8);
        const bedFrameMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
        const bedFrame = new THREE.Mesh(bedFrameGeo, bedFrameMat);
        bedFrame.position.y = 0.25;
        bedFrame.castShadow = true;
        bedGroup.add(bedFrame);

        // Headboard
        const headGeo = new THREE.BoxGeometry(2.4, 1.4, 0.2);
        const headboard = new THREE.Mesh(headGeo, bedFrameMat);
        headboard.position.set(0, 0.9, -1.8);
        headboard.castShadow = true;
        bedGroup.add(headboard);

        // Mattress & Comforter
        const matGeo = new THREE.BoxGeometry(2.2, 0.4, 3.6);
        const matMat = new THREE.MeshLambertMaterial({ color: 0xfbcfe8 }); // Soft pastel pink comforter
        const mattress = new THREE.Mesh(matGeo, matMat);
        mattress.position.set(0, 0.65, 0);
        mattress.castShadow = true;
        mattress.receiveShadow = true;
        bedGroup.add(mattress);

        // Pillow
        const pillowGeo = new THREE.BoxGeometry(1.6, 0.25, 0.8);
        const pillowMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const pillow = new THREE.Mesh(pillowGeo, pillowMat);
        pillow.position.set(0, 0.95, -1.2);
        pillow.castShadow = true;
        bedGroup.add(pillow);

        this.scene.add(bedGroup);

        // Slot on Bed
        this.slots.bed = {
            name: '침대',
            position: new THREE.Vector3(-3.5, 1.0, -3.0),
            occupied: false,
            interactPos: new THREE.Vector3(-1.8, 0, -3.0)
        };

        // ==========================================
        // 3. SHELF (Storage Shelf)
        // ==========================================
        const shelfGroup = new THREE.Group();
        shelfGroup.position.set(-4.8, 0, 1.8);

        const shelfMat = new THREE.MeshLambertMaterial({ color: 0x059669 }); // Emerald green wood
        // Vertical planks
        const vPlank1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 1.2), shelfMat);
        vPlank1.position.set(-0.7, 1.5, 0);
        const vPlank2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 1.2), shelfMat);
        vPlank2.position.set(0.7, 1.5, 0);
        shelfGroup.add(vPlank1, vPlank2);

        // Horizontal shelves: Generous vertical clearance so objects never penetrate upper planks
        [0.2, 1.1, 2.9].forEach(y => {
            const hPlank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.2), shelfMat);
            hPlank.position.set(0, y, 0);
            hPlank.castShadow = true;
            shelfGroup.add(hPlank);
        });

        this.scene.add(shelfGroup);

        // Slot on Shelf (Middle tier: Plank at Y=1.1, top surface is Y=1.15)
        this.slots.shelf = {
            name: '선반',
            position: new THREE.Vector3(-4.8, 1.16, 1.85),
            occupied: false,
            interactPos: new THREE.Vector3(-3.2, 0, 1.85)
        };

        // ==========================================
        // 4. TOY BASKET (Round Storage Bin)
        // ==========================================
        const basketGroup = new THREE.Group();
        basketGroup.position.set(4.0, 0, 2.5);

        const basketGeo = new THREE.CylinderGeometry(0.8, 0.65, 0.9, 18, 1, true);
        const basketMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
        const basketMesh = new THREE.Mesh(basketGeo, basketMat);
        basketMesh.position.y = 0.45;
        basketMesh.castShadow = true;
        basketGroup.add(basketMesh);

        // Bottom
        const bBottom = new THREE.Mesh(new THREE.CircleGeometry(0.65, 18), basketMat);
        bBottom.rotation.x = -Math.PI / 2;
        bBottom.position.y = 0.02;
        basketGroup.add(bBottom);

        this.scene.add(basketGroup);

        // Slot inside basket
        this.slots.basket = {
            name: '바구니',
            position: new THREE.Vector3(4.0, 0.5, 2.5),
            occupied: false,
            interactPos: new THREE.Vector3(2.8, 0, 2.5)
        };

        // ==========================================
        // 5. FLOOR SLOT (Center Room)
        // ==========================================
        this.slots.floor = {
            name: '바닥',
            position: new THREE.Vector3(0.5, 0.45, 1.2),
            occupied: false,
            interactPos: new THREE.Vector3(0.5, 0, -0.2)
        };

        // ==========================================
        // 6. FLOOR LAMP (Stand Light)
        // ==========================================
        const lampGroup = new THREE.Group();
        lampGroup.position.set(-4.8, 0, -4.8);

        // Base
        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), new THREE.MeshLambertMaterial({ color: 0x475569 }));
        lampBase.position.y = 0.05;
        lampGroup.add(lampBase);

        // Pole
        const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.0, 8), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
        lampPole.position.y = 2.05;
        lampGroup.add(lampPole);

        // Shade
        const shadeGeo = new THREE.ConeGeometry(0.65, 0.8, 16, 1, true);
        this.lampShadeMat = new THREE.MeshLambertMaterial({
            color: 0xfef08a,
            emissive: 0xfde047,
            emissiveIntensity: 0.6,
            side: THREE.DoubleSide
        });
        const shade = new THREE.Mesh(shadeGeo, this.lampShadeMat);
        shade.position.y = 4.0;
        shade.rotation.x = Math.PI;
        lampGroup.add(shade);

        this.scene.add(lampGroup);
    }

    buildItems() {
        // 1. CARDBOARD BOX
        const box = this.createBoxMesh();
        this.items.box = {
            name: '상자',
            mesh: box,
            currentSlot: 'floor',
            defaultSlot: 'floor'
        };
        box.position.copy(this.slots.floor.position);
        this.scene.add(box);
        this.slots.floor.occupied = true;

        // Box as a slot too (place items on top of the box!)
        this.slots.box = {
            name: '상자 위',
            get position() {
                const p = box.position.clone();
                p.y += 0.55;
                return p;
            },
            get interactPos() {
                const p = box.position.clone();
                p.z -= 1.2;
                p.y = 0;
                return p;
            },
            occupied: false
        };

        // 2. TEDDY BEAR
        const bear = this.createBearMesh();
        this.items.bear = {
            name: '곰인형',
            mesh: bear,
            currentSlot: 'shelf',
            defaultSlot: 'shelf'
        };
        bear.position.copy(this.slots.shelf.position);
        bear.rotation.y = 0.35; // Angle warmly towards camera & room center
        this.scene.add(bear);
        this.slots.shelf.occupied = true;

        // 3. BOOK
        const book = this.createBookMesh();
        this.items.book = {
            name: '책',
            mesh: book,
            currentSlot: 'desk',
            defaultSlot: 'desk'
        };
        book.position.copy(this.slots.desk.position);
        this.scene.add(book);
        this.slots.desk.occupied = true;

        // 4. TOY BALL
        const ball = this.createBallMesh();
        this.items.ball = {
            name: '공',
            mesh: ball,
            currentSlot: 'basket',
            defaultSlot: 'basket'
        };
        ball.position.copy(this.slots.basket.position);
        this.scene.add(ball);
        this.slots.basket.occupied = true;
    }

    createBoxMesh() {
        const group = new THREE.Group();

        // Main Box Body
        const boxGeo = new THREE.BoxGeometry(1.0, 0.8, 1.0);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0xd97706 }); // Warm Kraft cardboard
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        group.add(boxMesh);

        // Sealing Tape on Top
        const tapeGeo = new THREE.BoxGeometry(0.18, 0.02, 1.02);
        const tapeMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
        const tape = new THREE.Mesh(tapeGeo, tapeMat);
        tape.position.y = 0.41;
        group.add(tape);

        // Label on Front
        const labelGeo = new THREE.PlaneGeometry(0.45, 0.3);
        const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(0, 0.1, 0.51);
        group.add(label);

        // Smile mark on label
        const smileGeo = new THREE.RingGeometry(0.08, 0.12, 16, 1, Math.PI, Math.PI);
        const smileMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
        const smile = new THREE.Mesh(smileGeo, smileMat);
        smile.position.set(0, 0.1, 0.52);
        group.add(smile);

        return group;
    }

    createBearMesh() {
        const group = new THREE.Group();
        const brownMat = new THREE.MeshLambertMaterial({ color: 0x935116 }); // Rich bear brown
        const muzzleMat = new THREE.MeshLambertMaterial({ color: 0xfed7aa }); // Light cream muzzle
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
        const redMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });

        // Body (bottom of sphere lands precisely at y=0.0)
        const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
        bodyGeo.scale(1, 1.2, 0.9);
        const body = new THREE.Mesh(bodyGeo, brownMat);
        body.position.y = 0.42;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const head = new THREE.Mesh(headGeo, brownMat);
        head.position.y = 0.85;
        head.castShadow = true;
        group.add(head);

        // Ears
        const earGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const leftEar = new THREE.Mesh(earGeo, brownMat);
        leftEar.position.set(-0.25, 1.07, 0.05);
        const rightEar = new THREE.Mesh(earGeo, brownMat);
        rightEar.position.set(0.25, 1.07, 0.05);
        group.add(leftEar, rightEar);

        // Muzzle
        const muzzleGeo = new THREE.SphereGeometry(0.14, 12, 12);
        muzzleGeo.scale(1.2, 0.8, 1);
        const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
        muzzle.position.set(0, 0.81, 0.24);
        group.add(muzzle);

        // Nose
        const noseGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const nose = new THREE.Mesh(noseGeo, blackMat);
        nose.position.set(0, 0.85, 0.35);
        group.add(nose);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const leftEye = new THREE.Mesh(eyeGeo, blackMat);
        leftEye.position.set(-0.12, 0.91, 0.26);
        const rightEye = new THREE.Mesh(eyeGeo, blackMat);
        rightEye.position.set(0.12, 0.91, 0.26);
        group.add(leftEye, rightEye);

        // Bowtie
        const bowtieGeo = new THREE.ConeGeometry(0.09, 0.16, 4);
        bowtieGeo.rotateZ(Math.PI / 2);
        const bowLeft = new THREE.Mesh(bowtieGeo, redMat);
        bowLeft.position.set(-0.07, 0.69, 0.3);
        const bowRight = new THREE.Mesh(bowtieGeo, redMat);
        bowRight.position.set(0.07, 0.69, 0.3);
        bowRight.rotation.z = Math.PI;
        group.add(bowLeft, bowRight);

        // Arms & Legs
        const limbGeo = new THREE.SphereGeometry(0.12, 12, 12);
        limbGeo.scale(0.8, 1.5, 0.8);
        // Arms
        const leftArm = new THREE.Mesh(limbGeo, brownMat);
        leftArm.position.set(-0.35, 0.52, 0.08);
        leftArm.rotation.z = 0.4;
        const rightArm = new THREE.Mesh(limbGeo, brownMat);
        rightArm.position.set(0.35, 0.52, 0.08);
        rightArm.rotation.z = -0.4;

        // Feet - naturally seated, pointing forward onto the surface
        const leftFoot = new THREE.Mesh(limbGeo, brownMat);
        leftFoot.position.set(-0.2, 0.14, 0.28);
        leftFoot.rotation.x = 1.3;
        const rightFoot = new THREE.Mesh(limbGeo, brownMat);
        rightFoot.position.set(0.2, 0.14, 0.28);
        rightFoot.rotation.x = 1.3;

        group.add(leftArm, rightArm, leftFoot, rightFoot);

        // Cozy cuddly plush proportions
        group.scale.set(0.85, 0.85, 0.85);

        return group;
    }

    createBookMesh() {
        const group = new THREE.Group();

        // Cover
        const coverGeo = new THREE.BoxGeometry(0.7, 0.12, 0.95);
        const coverMat = new THREE.MeshLambertMaterial({ color: 0x4f46e5 }); // Indigo book
        const cover = new THREE.Mesh(coverGeo, coverMat);
        cover.castShadow = true;
        group.add(cover);

        // Pages inside
        const pageGeo = new THREE.BoxGeometry(0.66, 0.09, 0.9);
        const pageMat = new THREE.MeshLambertMaterial({ color: 0xfef9c3 });
        const pages = new THREE.Mesh(pageGeo, pageMat);
        pages.position.x = 0.01;
        group.add(pages);

        // Bookmark ribbon
        const ribbonGeo = new THREE.BoxGeometry(0.06, 0.13, 0.3);
        const ribbonMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.position.set(0, 0, 0.45);
        group.add(ribbon);

        return group;
    }

    createBallMesh() {
        const group = new THREE.Group();

        // Base sphere (bright cheerful soccer/toy ball)
        const radius = 0.32;
        const ballGeo = new THREE.SphereGeometry(radius, 24, 24);
        const ballMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const ballMesh = new THREE.Mesh(ballGeo, ballMat);
        ballMesh.castShadow = true;
        group.add(ballMesh);

        // Colorful sport patches/stripes (vibrant sky blue & amber gold stripes)
        const ringGeo1 = new THREE.TorusGeometry(radius * 0.96, 0.045, 8, 24);
        const ringMat1 = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
        const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
        group.add(ring1);

        const ring2 = new THREE.Mesh(ringGeo1, ringMat1);
        ring2.rotation.x = Math.PI / 2;
        group.add(ring2);

        // Center gold star badge on ball
        const patchGeo = new THREE.CircleGeometry(0.12, 5);
        const patchMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
        const patch1 = new THREE.Mesh(patchGeo, patchMat);
        patch1.position.z = radius + 0.005;
        group.add(patch1);

        const patch2 = new THREE.Mesh(patchGeo, patchMat);
        patch2.position.z = -(radius + 0.005);
        patch2.rotation.y = Math.PI;
        group.add(patch2);

        return group;
    }

    setLamp(isOn) {
        this.isLampOn = isOn;
        if (isOn) {
            this.lampLight.intensity = 1.2;
            this.ambientLight.intensity = 0.7;
            this.lampShadeMat.emissiveIntensity = 0.6;
            this.scene.background.set(0xdbeafe);
        } else {
            this.lampLight.intensity = 0.05;
            this.ambientLight.intensity = 0.25; // cozy night mode
            this.lampShadeMat.emissiveIntensity = 0.0;
            this.scene.background.set(0x0f172a); // Dark night sky outside
        }
    }

    spawnConfetti(centerPos, count = 25) {
        const colors = [0xf43f5e, 0x3b82f6, 0x10b981, 0xfbbf24, 0xa855f7, 0xec4899];
        for (let i = 0; i < count; i++) {
            const geo = new THREE.PlaneGeometry(0.12, 0.12);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                side: THREE.DoubleSide
            });
            const p = new THREE.Mesh(geo, mat);

            p.position.copy(centerPos);
            p.position.y += 0.5 + Math.random() * 0.5;

            // Random initial velocity
            p.userData = {
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    2.5 + Math.random() * 3.5,
                    (Math.random() - 0.5) * 4
                ),
                rotSpeed: new THREE.Vector3(
                    Math.random() * 10,
                    Math.random() * 10,
                    Math.random() * 10
                ),
                life: 1.0
            };

            this.scene.add(p);
            this.particles.push(p);
        }
    }

    update(delta) {
        // Controls
        if (this.controls) this.controls.update();

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const data = p.userData;

            data.vel.y -= 9.8 * delta; // gravity
            p.position.addScaledVector(data.vel, delta);

            p.rotation.x += data.rotSpeed.x * delta;
            p.rotation.y += data.rotSpeed.y * delta;

            data.life -= delta * 0.65;
            p.scale.setScalar(Math.max(0.01, data.life));

            if (data.life <= 0 || p.position.y <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Camera preset transitions
    setCameraPreset(name) {
        if (!this.controls) return;
        const duration = 1000;
        let targetPos = new THREE.Vector3(0, 11, 14);
        let lookTarget = new THREE.Vector3(0, 1.5, 0);

        if (name === 'robot') {
            targetPos.set(0, 5, 8);
            lookTarget.set(0, 1.2, 0);
        } else if (name === 'desk') {
            targetPos.set(4, 5, 2);
            lookTarget.set(3.6, 2, -3.2);
        } else if (name === 'bed') {
            targetPos.set(-4, 5, 2);
            lookTarget.set(-3.5, 1.5, -3.2);
        }

        this.animateCamera(targetPos, lookTarget, duration);
    }

    animateCamera(toPos, toTarget, duration = 800) {
        const fromPos = this.camera.position.clone();
        const fromTarget = this.controls.target.clone();
        const startTime = performance.now();

        const updateStep = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            this.camera.position.lerpVectors(fromPos, toPos, ease);
            this.controls.target.lerpVectors(fromTarget, toTarget, ease);

            if (progress < 1) {
                requestAnimationFrame(updateStep);
            }
        };

        requestAnimationFrame(updateStep);
    }

    /**
     * Complete room reset for next student
     */
    resetToDefaults() {
        // Clear all slot occupation states
        Object.keys(this.slots).forEach(k => {
            this.slots[k].occupied = false;
        });

        // Reset Box
        if (this.items.box) {
            const box = this.items.box.mesh;
            if (box.parent) box.parent.remove(box);
            this.scene.add(box);
            box.position.copy(this.slots.floor.position);
            box.rotation.set(0, 0, 0);
            this.items.box.currentSlot = 'floor';
            this.slots.floor.occupied = true;
        }

        // Reset Bear
        if (this.items.bear) {
            const bear = this.items.bear.mesh;
            if (bear.parent) bear.parent.remove(bear);
            this.scene.add(bear);
            bear.position.copy(this.slots.shelf.position);
            bear.rotation.set(0, 0.35, 0);
            this.items.bear.currentSlot = 'shelf';
            this.slots.shelf.occupied = true;
        }

        // Reset Book
        if (this.items.book) {
            const book = this.items.book.mesh;
            if (book.parent) book.parent.remove(book);
            this.scene.add(book);
            book.position.copy(this.slots.desk.position);
            book.rotation.set(0, 0, 0);
            this.items.book.currentSlot = 'desk';
            this.slots.desk.occupied = true;
        }

        // Reset Ball
        if (this.items.ball) {
            const ball = this.items.ball.mesh;
            if (ball.parent) ball.parent.remove(ball);
            this.scene.add(ball);
            ball.position.copy(this.slots.basket.position);
            ball.rotation.set(0, 0, 0);
            this.items.ball.currentSlot = 'basket';
            this.slots.basket.occupied = true;
        }

        // Reset lights to day mode
        this.setLamp(true);

        // Reset camera to default view
        this.setCameraPreset('default');
    }
}

window.WorldManager = WorldManager;
