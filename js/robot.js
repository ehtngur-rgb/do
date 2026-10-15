/**
 * Helper Robot (Buddy Bot) - 3D Model, Expressive Face, and Animation State Machine
 */
class HelperRobot {
    constructor(world) {
        this.world = world;
        this.mesh = new THREE.Group();

        // Components
        this.head = null;
        this.body = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftHand = null;
        this.rightHand = null;
        this.antennaLed = null;
        this.faceTexture = null;
        this.faceCanvas = null;
        this.faceCtx = null;

        // Holding object
        this.heldItem = null;

        // Position & Movement
        this.position = new THREE.Vector3(0, 0, 0);
        this.targetPosition = new THREE.Vector3(0, 0, 0);
        this.targetRotation = 0;
        this.moveSpeed = 3.2; // units per sec
        this.rotateSpeed = 5.0;

        // State Machine
        this.state = 'idle'; // idle, moving, picking, placing, waving, dancing, cheering
        this.stateTime = 0;
        this.actionCallback = null;

        // Emotion & Speech
        this.expression = 'happy';
        this.blinkTimer = 0;
        this.isTalking = false;

        this.init();
    }

    init() {
        this.buildRobotMesh();
        this.setExpression('happy');
        this.world.scene.add(this.mesh);
    }

    buildRobotMesh() {
        // Materials
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
        const cyanMat = new THREE.MeshLambertMaterial({ color: 0x0ea5e9 });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });

        // Base / Caterpillar Tracks
        const baseGroup = new THREE.Group();
        const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 16);
        const baseMesh = new THREE.Mesh(baseGeo, darkMat);
        baseMesh.position.y = 0.2;
        baseMesh.castShadow = true;
        baseGroup.add(baseMesh);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        [-0.5, 0.5].forEach(x => {
            const w = new THREE.Mesh(wheelGeo, cyanMat);
            w.position.set(x, 0.18, 0);
            baseGroup.add(w);
        });
        this.mesh.add(baseGroup);

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.9, 16);
        this.body = new THREE.Mesh(bodyGeo, whiteMat);
        this.body.position.y = 0.8;
        this.body.castShadow = true;
        this.mesh.add(this.body);

        // Chest Plate / Heart Screen
        const chestGeo = new THREE.BoxGeometry(0.45, 0.35, 0.1);
        const chestMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
        const chest = new THREE.Mesh(chestGeo, chestMat);
        chest.position.set(0, 0.85, 0.48);
        this.mesh.add(chest);

        // Glowing heart inside chest
        const heartLedGeo = new THREE.SphereGeometry(0.08, 8, 8);
        this.heartLedMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const heartLed = new THREE.Mesh(heartLedGeo, this.heartLedMat);
        heartLed.position.set(0, 0.85, 0.54);
        this.mesh.add(heartLed);

        // Head Group
        this.head = new THREE.Group();
        this.head.position.set(0, 1.5, 0);

        // Head mesh (Rounded cube shape)
        const headGeo = new THREE.BoxGeometry(0.85, 0.65, 0.7);
        const headMesh = new THREE.Mesh(headGeo, whiteMat);
        headMesh.castShadow = true;
        this.head.add(headMesh);

        // Ears / Side Sensors
        const earGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12);
        earGeo.rotateZ(Math.PI / 2);
        const leftEar = new THREE.Mesh(earGeo, cyanMat);
        leftEar.position.set(-0.46, 0, 0);
        const rightEar = new THREE.Mesh(earGeo, cyanMat);
        rightEar.position.set(0.46, 0, 0);
        this.head.add(leftEar, rightEar);

        // Antenna
        const antPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), metalMat);
        antPole.position.set(0, 0.45, 0);
        this.head.add(antPole);

        const antLedGeo = new THREE.SphereGeometry(0.07, 12, 12);
        this.antLedMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // glowing yellow
        this.antennaLed = new THREE.Mesh(antLedGeo, this.antLedMat);
        this.antennaLed.position.set(0, 0.62, 0);
        this.head.add(this.antennaLed);

        // Face Screen with Dynamic Canvas Texture
        this.faceCanvas = document.createElement('canvas');
        this.faceCanvas.width = 256;
        this.faceCanvas.height = 192;
        this.faceCtx = this.faceCanvas.getContext('2d');
        this.faceTexture = new THREE.CanvasTexture(this.faceCanvas);

        const screenGeo = new THREE.PlaneGeometry(0.65, 0.48);
        const screenMat = new THREE.MeshBasicMaterial({ map: this.faceTexture });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 0, 0.355);
        this.head.add(screen);

        this.mesh.add(this.head);

        // Arms & Hands
        // Left Arm
        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-0.62, 1.0, 0);
        const armGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8);
        const lArmMesh = new THREE.Mesh(armGeo, cyanMat);
        lArmMesh.position.y = -0.25;
        this.leftArm.add(lArmMesh);
        // Left Claw
        this.leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), metalMat);
        this.leftHand.position.y = -0.52;
        this.leftArm.add(this.leftHand);
        this.mesh.add(this.leftArm);

        // Right Arm
        this.rightArm = new THREE.Group();
        this.rightArm.position.set(0.62, 1.0, 0);
        const rArmMesh = new THREE.Mesh(armGeo, cyanMat);
        rArmMesh.position.y = -0.25;
        this.rightArm.add(rArmMesh);
        // Right Claw
        this.rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), metalMat);
        this.rightHand.position.y = -0.52;
        this.rightArm.add(this.rightHand);
        this.mesh.add(this.rightArm);
    }

    setExpression(expr) {
        this.expression = expr;
        this.drawFace();
    }

    drawFace() {
        const ctx = this.faceCtx;
        const w = this.faceCanvas.width;
        const h = this.faceCanvas.height;

        // Background: Soft dark digital screen
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#38bdf8'; // Cyan glowing digital eyes
        ctx.fillStyle = '#38bdf8';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const lx = 75;
        const rx = 181;
        const y = 96;

        switch (this.expression) {
            case 'happy':
                // Upward smiling curved eyes ^ ^
                ctx.beginPath();
                ctx.arc(lx, y + 10, 24, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(rx, y + 10, 24, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();

                // Small smiling mouth
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(w / 2, y + 36, 16, 0.2, Math.PI - 0.2);
                ctx.stroke();
                break;

            case 'blink':
                // Horizontal lines - -
                ctx.beginPath();
                ctx.moveTo(lx - 25, y);
                ctx.lineTo(lx + 25, y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(rx - 25, y);
                ctx.lineTo(rx + 25, y);
                ctx.stroke();
                break;

            case 'love':
                // Heart eyes ♥ ♥
                ctx.fillStyle = '#f43f5e';
                this.drawHeart(ctx, lx, y, 32);
                this.drawHeart(ctx, rx, y, 32);

                ctx.strokeStyle = '#f43f5e';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(w / 2, y + 36, 16, 0.2, Math.PI - 0.2);
                ctx.stroke();
                break;

            case 'talking':
                // Round bright eyes + animated mouth
                ctx.beginPath();
                ctx.arc(lx, y - 8, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(rx, y - 8, 16, 0, Math.PI * 2);
                ctx.fill();

                // Open cute oval mouth
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.ellipse(w / 2, y + 36, 18, 14, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'surprised':
                // Big round eyes O O
                ctx.beginPath();
                ctx.arc(lx, y, 26, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(rx, y, 26, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'proud':
                // Wink eye ^ *
                ctx.beginPath();
                ctx.arc(lx, y + 10, 24, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();

                // Star or wide eye
                ctx.beginPath();
                ctx.arc(rx, y, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(w / 2, y + 36, 20, 0.1, Math.PI - 0.1);
                ctx.stroke();
                break;
        }

        this.faceTexture.needsUpdate = true;
    }

    drawHeart(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y - size / 4);
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
        ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, (size + topCurveHeight) / 1.3, 0, size);
        ctx.bezierCurveTo(0, (size + topCurveHeight) / 1.3, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
        ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Command Actions
    moveTo(targetPos, onArrive = null) {
        this.targetPosition.copy(targetPos);
        this.targetPosition.y = 0; // stay on ground
        this.actionCallback = onArrive;
        this.state = 'moving';
        this.stateTime = 0;
        this.setExpression('happy');
    }

    carryItemTo(itemKey, slotKey, onDone = null) {
        const itemObj = this.world.items[itemKey];
        const destSlot = this.world.slots[slotKey];

        if (!itemObj || !destSlot) {
            if (onDone) onDone(false);
            return;
        }

        // 1. Move to item location
        const itemInteract = itemObj.mesh.position.clone();
        itemInteract.z += (itemInteract.z > 0 ? -1.3 : 1.3);
        itemInteract.y = 0;

        this.moveTo(itemInteract, () => {
            // 2. Pick up item
            this.pickUpItem(itemKey, () => {
                // 3. Move to destination slot interact position
                this.moveTo(destSlot.interactPos, () => {
                    // 4. Place down item
                    this.putDownItem(slotKey, () => {
                        // 5. Success cheer!
                        this.cheer(() => {
                            if (onDone) onDone(true);
                        });
                    });
                });
            });
        });
    }

    pickUpItem(itemKey, onComplete = null) {
        this.state = 'picking';
        this.stateTime = 0;
        this.setExpression('surprised');

        const itemObj = this.world.items[itemKey];

        // Turn towards item
        const dir = itemObj.mesh.position.clone().sub(this.mesh.position);
        this.targetRotation = Math.atan2(dir.x, dir.z);

        setTimeout(() => {
            // Attach item to robot
            this.heldItem = itemObj;
            this.world.scene.remove(itemObj.mesh);
            this.mesh.add(itemObj.mesh);

            // Position item in robot's hands / chest
            itemObj.mesh.position.set(0, 0.85, 0.7);
            itemObj.mesh.rotation.set(0, 0, 0);

            // Free previous slot
            if (itemObj.currentSlot && this.world.slots[itemObj.currentSlot]) {
                this.world.slots[itemObj.currentSlot].occupied = false;
            }

            if (window.soundManager) window.soundManager.play('pickup');
            this.setExpression('happy');

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 400);
        }, 500);
    }

    putDownItem(slotKey, onComplete = null) {
        this.state = 'placing';
        this.stateTime = 0;

        const slot = this.world.slots[slotKey];
        if (!this.heldItem || !slot) {
            if (onComplete) onComplete();
            return;
        }

        // Turn towards slot
        const dir = slot.position.clone().sub(this.mesh.position);
        this.targetRotation = Math.atan2(dir.x, dir.z);

        setTimeout(() => {
            const itemObj = this.heldItem;
            this.mesh.remove(itemObj.mesh);
            this.world.scene.add(itemObj.mesh);

            // Move to slot position
            itemObj.mesh.position.copy(slot.position);
            itemObj.mesh.rotation.set(0, slotKey === 'shelf' ? 0.35 : 0, 0);
            itemObj.currentSlot = slotKey;
            slot.occupied = true;

            this.heldItem = null;

            if (window.soundManager) window.soundManager.play('drop');
            this.world.spawnConfetti(slot.position, 20);

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 400);
        }, 500);
    }

    wave(onComplete = null) {
        this.state = 'waving';
        this.stateTime = 0;
        this.setExpression('happy');
        if (window.soundManager) window.soundManager.play('button');

        setTimeout(() => {
            this.state = 'idle';
            if (onComplete) onComplete();
        }, 2200);
    }

    dance(onComplete = null) {
        this.state = 'dancing';
        this.stateTime = 0;
        this.setExpression('love');
        if (window.soundManager) window.soundManager.play('cheer');

        setTimeout(() => {
            this.state = 'idle';
            this.setExpression('happy');
            if (onComplete) onComplete();
        }, 3200);
    }

    cheer(onComplete = null) {
        this.state = 'cheering';
        this.stateTime = 0;
        this.setExpression('proud');
        if (window.soundManager) window.soundManager.play('success');

        setTimeout(() => {
            this.state = 'idle';
            this.setExpression('happy');
            if (onComplete) onComplete();
        }, 1600);
    }

    setTalking(talking) {
        this.isTalking = talking;
        if (talking) {
            this.setExpression('talking');
        } else {
            this.setExpression('happy');
        }
    }

    update(delta) {
        this.stateTime += delta;

        // Periodic eye blink when idle
        if (this.state === 'idle' && !this.isTalking) {
            this.blinkTimer += delta;
            if (this.blinkTimer > 3.5) {
                this.setExpression('blink');
                setTimeout(() => {
                    if (this.state === 'idle' && !this.isTalking) {
                        this.setExpression('happy');
                    }
                }, 180);
                this.blinkTimer = 0;
            }
        }

        // Antenna LED gentle pulsing
        if (this.antennaLed) {
            const glow = (Math.sin(this.stateTime * 4) + 1) * 0.5;
            this.antLedMat.color.setRGB(1.0, 0.7 + glow * 0.3, 0.1);
        }

        // State Machine Animation
        switch (this.state) {
            case 'idle':
                // Gentle breathing bounce
                this.mesh.position.y = Math.sin(this.stateTime * 3) * 0.04;
                this.head.rotation.y = Math.sin(this.stateTime * 1.5) * 0.12; // look around
                // Reset arms
                if (!this.heldItem) {
                    this.leftArm.rotation.set(0, 0, 0.15);
                    this.rightArm.rotation.set(0, 0, -0.15);
                } else {
                    this.leftArm.rotation.set(-0.8, 0.2, 0.3);
                    this.rightArm.rotation.set(-0.8, -0.2, -0.3);
                }
                break;

            case 'moving':
                const toTarget = this.targetPosition.clone().sub(this.mesh.position);
                toTarget.y = 0;
                const dist = toTarget.length();

                // Rotate towards movement direction
                if (dist > 0.05) {
                    this.targetRotation = Math.atan2(toTarget.x, toTarget.z);
                }

                // Smooth rotation
                let diffRot = this.targetRotation - this.mesh.rotation.y;
                while (diffRot < -Math.PI) diffRot += Math.PI * 2;
                while (diffRot > Math.PI) diffRot -= Math.PI * 2;
                this.mesh.rotation.y += diffRot * Math.min(1, delta * this.rotateSpeed);

                // Move forward
                if (dist > 0.1) {
                    const step = Math.min(dist, this.moveSpeed * delta);
                    toTarget.normalize();
                    this.mesh.position.addScaledVector(toTarget, step);

                    // Hover / rolling bounce
                    this.mesh.position.y = Math.abs(Math.sin(this.stateTime * 8)) * 0.08;

                    // Arm swing if not holding
                    if (!this.heldItem) {
                        this.leftArm.rotation.x = Math.sin(this.stateTime * 7) * 0.4;
                        this.rightArm.rotation.x = -Math.sin(this.stateTime * 7) * 0.4;
                    }
                } else {
                    // Reached destination!
                    this.mesh.position.copy(this.targetPosition);
                    this.mesh.position.y = 0;
                    this.state = 'idle';
                    if (this.actionCallback) {
                        const cb = this.actionCallback;
                        this.actionCallback = null;
                        cb();
                    }
                }
                break;

            case 'picking':
            case 'placing':
                // Reach arms forward
                this.leftArm.rotation.set(-1.2, 0.3, 0.1);
                this.rightArm.rotation.set(-1.2, -0.3, -0.1);
                this.head.rotation.x = 0.2; // look down
                break;

            case 'waving':
                // Right arm waving animation
                this.rightArm.rotation.set(0, 0, -2.4 + Math.sin(this.stateTime * 10) * 0.5);
                this.leftArm.rotation.set(0, 0, 0.2);
                this.head.rotation.y = 0;
                this.head.rotation.z = Math.sin(this.stateTime * 6) * 0.1;
                break;

            case 'dancing':
                // Spin & hop
                this.mesh.rotation.y += delta * 6;
                this.mesh.position.y = Math.abs(Math.sin(this.stateTime * 8)) * 0.35;
                this.leftArm.rotation.set(0, 0, 1.8 + Math.sin(this.stateTime * 12) * 0.6);
                this.rightArm.rotation.set(0, 0, -1.8 - Math.sin(this.stateTime * 12) * 0.6);
                this.head.rotation.y = Math.sin(this.stateTime * 12) * 0.3;
                break;

            case 'cheering':
                // Raise both arms high and jump
                this.leftArm.rotation.set(0, 0, 2.6);
                this.rightArm.rotation.set(0, 0, -2.6);
                this.mesh.position.y = Math.abs(Math.sin(this.stateTime * 10)) * 0.4;
                this.head.rotation.x = -0.3; // look up with joy
                break;
        }
    }

    /**
     * Reset robot to center starting posture for next student
     */
    resetPosition() {
        if (this.heldItem) {
            if (this.heldItem.mesh && this.heldItem.mesh.parent === this.mesh) {
                this.mesh.remove(this.heldItem.mesh);
            }
            this.heldItem = null;
        }
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.targetPosition.set(0, 0, 0);
        this.targetRotation = 0;
        this.state = 'idle';
        this.stateTime = 0;
        this.setExpression('happy');
        if (this.leftArm) this.leftArm.rotation.set(0, 0, 0.15);
        if (this.rightArm) this.rightArm.rotation.set(0, 0, -0.15);
        if (this.head) this.head.rotation.set(0, 0, 0);
    }
}

window.HelperRobot = HelperRobot;
