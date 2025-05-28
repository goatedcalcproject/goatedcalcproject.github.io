import * as THREE from 'three';
import * as util from './util.mjs';
import * as particles from './particles.mjs';

// const TRANSPARENT_TILES = true;
const TRANSPARENT_TILES = false;
const PATH_INDICATORS = false;

const TILE_SIZE = 4;

const shineMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("shine.png") });
const bobDormantMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("bob_dormant.png") });
const bobHappyMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("bob_happy.png") });
const exitMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("exit.png") });
const martinMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("martin.png") });
const martinInactiveMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("martin_inactive.png") });
const snifferSmokeMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("smoke.png"), opacity: 0.5 });
const snifferWalkingMaterial = new THREE.SpriteMaterial({ map: util.loadTexture("smoke.png") });

const windTurbineMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

const audioLoader = new THREE.AudioLoader();

function inCylinderCollider(position, objectPosition, objectRadius, radius) {
    return ((position.x - objectPosition.x) ** 2 + (position.z - objectPosition.z) ** 2) <= (objectRadius + radius) ** 2;
}
function inSquareCollider(position, objectPosition, objectHalfLength, radius) {
    return Math.abs(position.x - objectPosition.x) <= objectHalfLength + radius
        && Math.abs(position.z - objectPosition.z) <= objectHalfLength + radius;
}


function Tile(collision = false, trigger = false, requiresUpdate = false, enemy = false, traversable = false) {
    const object = new THREE.Object3D();

    function colliding(position, radius = 0) {
        return false;
    }
    function inTrigger(position, radius = 0, player) {
        return false;
    }

    function awake() {}
    function update(delta) {}

    Object.assign(object, {
        collision, trigger, requiresUpdate, enemy, traversable,
        colliding, inTrigger, awake, update
    });
    return object;
}

function WallBlock(texture) {
    const object = new Tile(true); object.name = "TILE_WB";

    function colliding(position, radius = 0) {
        return inSquareCollider(position, object.position, 2, radius);
    }

    function awake() {
        if (TRANSPARENT_TILES) {
            const tilePlane = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE), 
                new THREE.MeshBasicMaterial());
            object.add(tilePlane);
            tilePlane.rotation.x = -Math.PI / 2;
            tilePlane.position.y = -1.98;

            // object.add(
            //     new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE - 0.01, TILE_SIZE), 
            //     new THREE.MeshBasicMaterial({ wireframe: true, wireframeLinewidth: 2 })));
        }
        else {
            object.add(
                new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE), 
                new THREE.MeshPhongMaterial({ map: texture })));
        }
    }

    object.colliding = colliding;
    object.awake = awake;
    awake();
    
    return object;
}
function RandomizedWallBlock(textures) {
    return new WallBlock(textures[Math.floor(Math.random() * textures.length)]);
}
function NormalWallBlock() {
    const object = new Tile(true); object.name = "TILE_NWB";

    function colliding(position, radius = 0) {
        return inSquareCollider(position, object.position, 2, radius);
    }

    function awake() {
        object.add(new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE), new THREE.MeshNormalMaterial));
    }

    object.colliding = colliding;
    object.awake = awake;
    awake();
    
    return object;
}
function Bob() {
    const object = new Tile(true, true, true, false, true); object.name = "ENTITY_BOB";
    let opened = false;
    let sprite;

    function colliding(position, radius = 0) {
        return !opened && inSquareCollider(position, object.position, 2, radius);
    }

    function inTrigger(position, radius = 0, player) {
        if (!opened && inSquareCollider(position, object.position, 2.2, radius) && "icecream" in player.userData && player.userData.icecream > 0) {
            opened = true;
            sprite.material = bobHappyMaterial;
            player.userData.icecream--;
            return true;
        }
        return false;
    }

    function awake() {
        sprite = new THREE.Sprite(bobDormantMaterial);
        object.add(sprite);
        object.scale.set(2, 2, 2);
    }
    function update(delta) {
        if (opened) {
            sprite.position.y -= 2.1 * delta;
            if (sprite.position.y <= -4) object.remove(sprite);
        }
    }
    
    object.colliding = colliding;
    object.inTrigger = inTrigger;
    object.awake = awake;
    object.update = update;
    awake();
    // object.clone = () => {
    //     const cloned = Object.create(Object.getPrototypeOf(object), Object.getOwnPropertyDescriptors(object));
    //     return cloned;
    // }
    return object;
}
function Martin(player) {
    const object = new Tile(true, true, true, false, false); object.name = "ENTITY_MRTN";

    // let damageTimer = 0;
    const damageCooldown = 9999999999999999999999;

    let previouslyHidden = false;
    let sprite;

    let cooldownTimer = 0;
    let cooldown = 6.5;

    let hiddenInSelf = false;

    function colliding(position, radius = 0) {
        // return !opened && inSquareCollider(position, object.position, 0.3, radius);
        return false;
    }

    function inTrigger(position, radius = 0, player) {
        if (inSquareCollider(position, object.position, 0.5, radius)) {
            hiddenInSelf = true;

            if (cooldownTimer > 0) return false;

            cooldownTimer = cooldown;
            player.userData.hiding = true;
            player.position.copy(object.position);
            player.position.y = 0;
            return true;
        }
        return false;
    }

    function awake() {
        sprite = new THREE.Sprite(martinMaterial);
        object.add(sprite);
        object.scale.set(4, 4, 4);
    }
    function update(delta) {
        sprite.material = (cooldownTimer > 0) ? martinInactiveMaterial : martinMaterial;

        sprite.visible = !(player.userData.hiding
            && inSquareCollider(player.position, object.position, 0.5, 0));

        // IMPORTANT NOTE: assume trigger checking runs before level update
        // if (player.userData.hiding && hiddenInSelf) {
        //     if (!previouslyHidden) player.userData.martinDamageTimer = damageCooldown * 1.5;

        //     if (player.userData.martinDamageTimer <= 0) {
        //         // console.log("aergyuerwuguygergugyeiuog")
        //         player.userData.health -= 1;
        //         player.userData.martinDamageTimer = damageCooldown;
        //     }
        //     else {
        //         player.userData.martinDamageTimer -= delta;
        //         console.log("minus")
        //     }
        // }

        cooldownTimer -= delta;
        previouslyHidden = player.userData.hiding;
        hiddenInSelf = false;
    }
    
    object.colliding = colliding;
    object.inTrigger = inTrigger;
    object.awake = awake;
    object.update = update;
    awake();
    // object.clone = () => {
    //     const cloned = Object.create(Object.getPrototypeOf(object), Object.getOwnPropertyDescriptors(object));
    //     return cloned;
    // }
    return object;
}
function BlockDoor(texture, listener) {
    const object = new Tile(true, true, true); object.name = "TILE_BLKD";
    let opened = false;
    let sprite;
    let doorSound;

    function colliding(position, radius = 0) {
        return sprite.position.y > -2 && inSquareCollider(position, object.position, 2, radius);
    }

    function inTrigger(position, radius = 0, player) {
        if (!opened && inSquareCollider(position, object.position, 2.2, radius)) {
            opened = true;
            doorSound.play();
            return true;
        }
        return false;
    }

    function awake() {
        sprite = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE), new THREE.MeshPhongMaterial({
            map: texture}));
        doorSound = new THREE.PositionalAudio(listener);
        audioLoader.load("./audio/door.wav", (buffer) => {
            doorSound.setBuffer(buffer);
            doorSound.setRefDistance(10);
            doorSound.setMaxDistance(289);
            doorSound.setVolume(0.725);
            object.add(doorSound);
        });
        object.add(sprite);
    }
    function update(delta) {
        if (opened) {
            sprite.position.y -= 3.75 * delta;
            if (sprite.position.y <= -4) object.remove(sprite);
        }
    }
    
    object.colliding = colliding;
    object.inTrigger = inTrigger;
    object.awake = awake;
    object.update = update;
    awake();
    // object.clone = () => {
    //     const cloned = Object.create(Object.getPrototypeOf(object), Object.getOwnPropertyDescriptors(object));
    //     return cloned;
    // }
    return object;
}

function Exit(level) {
    const object = new Tile(false, true, true); object.name = "ENTITY_EXIT";
    let opened = false;
    let sprite;

    function inTrigger(position, radius = 0, player) {
        if (!opened && inSquareCollider(position, object.position, 2.2, radius)) {
            level.exit();
            return true;
        }
        return false;
    }

    function awake() {
        sprite = new THREE.Sprite(exitMaterial);
        object.add(sprite);
        object.scale.set(2, 2, 2);
    }
    function update(delta) {
        // if (opened) {
        //     sprite.position.y -= 2.1 * delta;
        //     if (sprite.position.y <= -4) object.remove(sprite);
        // }
    }
    
    object.inTrigger = inTrigger;
    object.awake = awake;
    object.update = update;
    awake();
    // object.clone = () => {
    //     const cloned = Object.create(Object.getPrototypeOf(object), Object.getOwnPropertyDescriptors(object));
    //     return cloned;
    // }
    return object;
}

function ItemPedestal(listener, id) {
    const object = new Tile(false, true, true, false, true); object.name = "TILE_PDSTL";
    let item;
    let timeElapsed = 0;
    let collected = false;

    let sound = undefined;

    function colliding(position, radius = 0) {
        return inCylinderCollider(position, object.position, 0.5, radius);
    }
    function inTrigger(position, radius = 0, player) {
        if (!collected && inCylinderCollider(position, object.position, 0.7, radius)) {
            collected = true;
            object.remove(item);
            if (id in player.userData) {
                player.userData[id]++;
            }
            else {
                player.userData[id] = 1;
            }
            sound.play();
            return true;
        }
        return false;
    }

    function awake() {
        // const shine = new THREE.Sprite(shineMaterial);
        // object.add(shine);
        // shine.scale.set(3, 3, 3);

        item = new THREE.Sprite(new THREE.SpriteMaterial({ map: util.loadTexture(`collectibles/${id}.png`) }));
        object.add(item);
        
        // const pedestal = new THREE.Sprite(new THREE.SpriteMaterial({ map: util.loadTexture("pillar.png") }));
        // object.add(pedestal);
        // pedestal.scale.set(4, 4, 4);

        sound = new THREE.Audio(listener);
        audioLoader.load("./audio/collect.wav", (buffer) => {
            sound.setBuffer(buffer);
            sound.setVolume(0.5);
        });
    }
    function update(delta) {
        timeElapsed += delta;
        item.position.y = 0.07 * Math.sin(timeElapsed * 7) - 0.85;
    }
    
    object.colliding = colliding;
    object.inTrigger = inTrigger;
    object.awake = awake;
    object.collectibleId = id;
    object.update = update;
    awake();

    return object;
}

function PlantPot() {
    const object = new Tile(true, false, false); object.name = "TILE_PDSTL";
    let item;
    let timeElapsed = 0;
    let collected = false;

    function colliding(position, radius = 0) {
        return inCylinderCollider(position, object.position, 0.5, radius);
    }

    function awake() {        
        const pedestal = new THREE.Sprite(new THREE.SpriteMaterial({ map: util.loadTexture("plant.png") }));
        object.add(pedestal);
        pedestal.scale.set(4, 4, 4);
    }
    
    object.colliding = colliding;
    object.awake = awake;
    awake();

    return object;
}

function WindTurbine() {
    const object = new Tile(true, false, true); object.name = "TILE_PDSTL";

    const turbines = [new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D()];
    const initialChange = Math.random() * Math.PI / 2;

    function colliding(position, radius = 0) {
        return inCylinderCollider(position, object.position, 2, radius);
    }

    function awake() {
        object.add(new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 8), windTurbineMaterial));
        object.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.75, 70, 8), windTurbineMaterial));

        const nacelleCylinder = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 5, 6), windTurbineMaterial);
        object.add(nacelleCylinder);
        nacelleCylinder.position.y = 35;
        nacelleCylinder.rotation.z = Math.PI / 2;

        for (let i = 0; i < 3; i++) {
            const cur = turbines[i];
            const rotation = 2 * i * Math.PI / 3;
            cur.position.y = 35;
            cur.position.x = 1.5;

            const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1, 15, 4), windTurbineMaterial);
            cur.add(blade);
            blade.position.y = 7.5;
            cur.rotation.x = rotation + initialChange;

            object.add(cur);
        }
    }
    function update(delta) {
        for (let i = 0; i < 3; i++) turbines[i].rotation.x += delta * 1.5;
    }
    
    object.colliding = colliding;
    object.awake = awake;
    object.update = update;
    awake();

    return object;
}

function SecretTrigger(main) {
    const object = new Tile(false, true); object.name = "TILE_STRIGG";
    let alreadyFound = false;

    function inTrigger(position, radius = 0, player) {
        if (!alreadyFound && inSquareCollider(position, object.position, 2, radius)) {
            alreadyFound = true;
            main.secretFound();
            return true;
        }
        return false;
    }

    object.inTrigger = inTrigger;
    return object;
}

function RusherEnemy(level, listener, textures, deathTexture, speed, damage, player, fps = 8, scale = 2, maxHealth = 2, cooldown = 0.75, detectionRadius = 30, attackRadius = 2, _radius = 1) {
    const object = new Tile(true, true, true, true);
    let sprite;
    const animationStartTime = Math.random() * 10;
    let timeElapsed = 0;
    let dead = false;
    let health = maxHealth;
    let deathVelocity = 0;

    let knockbackMultiplier = 1;

    const spf = 1 / fps;
    let timeSinceLastAttack = 999;
    let sprites = [];

    function colliding(position, radius = 0, _player) {
        return !dead && inCylinderCollider(position, object.position, _radius, radius);
    }

    function canAttack() {
        return !player.userData.hiding;
    }

    function inTrigger(position, radius = 0, _player) {
        if (!object.canAttack()) return;
        
        const _inTrigger = !dead && inCylinderCollider(position, object.position, attackRadius, radius);
        if (_player && _inTrigger && timeSinceLastAttack >= cooldown) {
            // _player.userData.health -= damage;
            // timeSinceLastAttack = 0;
            // knockbackMultiplier = -1.5;

            _player.userData.beingTormented = true;
        }
        return _inTrigger;
    }

    function awake() {
        for (let i = 0; i < textures.length; i++) {
            sprites.push(new THREE.SpriteMaterial({ map: textures[i] }));
        }
        sprite = new THREE.Sprite(sprites[0]);
        object.add(sprite);
        sprite.scale.set(scale, scale, scale);
    }

    function inSight() {
        const distance = player.position.distanceTo(object.position);
        
        return !player.userData.hiding && !dead &&
            distance >= 0.5 && distance <= detectionRadius && 
            level.raycast(object.position, player.position) == null;
    }

    function updateTime(delta) {
        timeElapsed += delta;
        timeSinceLastAttack += delta;
    }
    function animate(delta) {
        if (dead) {
            deathVelocity += 37.5 * delta;
            object.position.y -= deathVelocity * delta;
            return;
        }
        sprite.material = sprites[Math.floor((animationStartTime + timeElapsed) / spf) % sprites.length];
    }
    function move(moveVector) {
        if (dead) return;
        const moveX = moveVector.clone(); moveX.z = 0;
        const moveZ = moveVector.clone(); moveZ.x = 0;

        object.position.add(moveX);
        if (level.checkIntersection(object.position, _radius)) {
            object.position.sub(moveX);
        }
        object.position.add(moveZ);
        if (level.checkIntersection(object.position, _radius)) {
            object.position.sub(moveZ);
        }
    }

    function update(delta) {
        updateTime(delta);
        animate(delta);

        knockbackMultiplier = util.lerp(knockbackMultiplier, 1, 0.025);
    
        if (inSight()) {
            onSightUpdate(delta);
        } else {
            outOfSightUpdate(delta);
        }
    }

    function onSightUpdate(delta) {
        let moveVector = player.position.clone().sub(object.position);
        moveVector.y = 0;
        moveVector = moveVector.normalize().multiplyScalar(speed * delta * knockbackMultiplier);
        move(moveVector);
    }
    function outOfSightUpdate(delta) {
        // nothing lmao
    }

    function _damage(amount) {
        if (dead) return;
        health -= amount;
        if (health <= 0) {
            deathVelocity = -12.5;
            sprite.material = new THREE.SpriteMaterial({ map: deathTexture });
            dead = true;
        }
    }
    
    object.colliding = colliding;
    object.awake = awake;
    object.update = update;
    object.inTrigger = inTrigger;
    object.damage = _damage;

    object.move = move;
    object.updateTime = updateTime;
    object.animate = animate;

    object.canAttack = canAttack;
    object.inSight = inSight;
    object.onSightUpdate = onSightUpdate;
    object.outOfSightUpdate = outOfSightUpdate;
    awake();

    return object;
}


function Sniffer(level, player, listener, scene) {
    const multiplierThing = 0.5;

    const sniffingRadius = 25; // * 2
    const sniffingSpeed = 6.5; // * 8
    const chargingSpeed = 6.85; // * 0.75
    const object = new RusherEnemy(level, listener, 
        [util.loadTexture("entities/hahn/hahn1.png"), util.loadTexture("entities/hahn/hahn2.png")], 
        util.loadTexture("entities/hahn/hahn2.png"), chargingSpeed, 100, player, 8, 4, 1e5,
    0.1, 32, 2, 0.6);

    let pathUpdateTimer = 0;
    let pathUpdateCooldown = 0.5;
    let path = [];

    let smokeParticles = null;
    let walkingParticles = null;

    let snifferTraversableNodesSet = new Set([]);
    let snifferTraversableNodes = [];

    let pathIndicators = [];

    let sniffingSound = undefined;
    let timeElapsed = 0;

    let previouslyTormented = false;
    
    let tilePlane = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE), 
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }));

    const stunnedCooldown = 5;
    let stunnedTimer = 0;

    function getSpeedMultiplier() {
        let documentsCollected = 0;
        if (player.userData["document"]) {
            documentsCollected = player.userData["document"];
        }

        return (1 - multiplierThing / 2) + multiplierThing / (1 + Math.E ** (-0.5 * documentsCollected));
    }
    
    const defaultVolume = 1.1;

    function awake() {
        object.awake();

        if (PATH_INDICATORS) level.add(tilePlane);

        smokeParticles = particles.ParticleSystem(
            null, snifferSmokeMaterial, 1.25, 0.01, 1, 
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 2, particles.DeathTypes.SHRINK,
            true, true);
        scene.add(smokeParticles);

        const pointLight = new THREE.PointLight(0xff0000, 50, 16);
        object.add(pointLight);

        let timeElapsed = 0;

        sniffingSound = new THREE.PositionalAudio(listener);
        audioLoader.load("./audio/voices/chase.mp3", (buffer) => {
            sniffingSound.setBuffer(buffer);
            sniffingSound.setRefDistance(15);
            sniffingSound.setMaxDistance(sniffingRadius * 1.3);
            sniffingSound.setVolume(defaultVolume);
            sniffingSound.setLoop(true);
            sniffingSound.play();
            object.add(sniffingSound);
        });
    }

    function updatePathIndicators() {
        if (!PATH_INDICATORS) return;
        pathIndicators.forEach((indicator) => {
            level.remove(indicator);
        });
        pathIndicators = [];

        let previous = null;

        path.forEach((node) => {
            const indicator = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5), 
                new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            indicator.position.copy(node);
            indicator.position.y = 0;
            level.add(indicator);
            pathIndicators.push(indicator);

            if (previous) {
                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.3, previous.distanceTo(node)),
                    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
                line.position.copy(previous).add(node).divideScalar(2);
                line.position.y = 0;
                line.lookAt(node);
                level.add(line);
                pathIndicators.push(line);
            }
            previous = node;
        });
    }
    function updateNodeIndicator() {
        if (!PATH_INDICATORS) return;

        tilePlane.position.copy(level.tileToWorldCenter(level.worldToTile(object.position)));
        tilePlane.rotation.x = -Math.PI / 2;
        tilePlane.position.y = 0.02;
    }

    function canAttack() {
        // return false;
        return !player.userData.hiding && stunnedTimer <= 0 && !player.userData.beingTormented;
    }

    function update(delta) {
        document.getElementById("sniffer-overlay").style.opacity = 
            Math.max(0.5 - (0.5 / (sniffingRadius * 0.75)) * player.position.distanceTo(object.position), 0);
        
        if (player.userData.beingTormented) {
            stunnedTimer = stunnedCooldown;
            sniffingSound.setVolume(0);
            return;
        }
        else {
            sniffingSound.setVolume(defaultVolume);
        }
        previouslyTormented = player.userData.beingTormented;

        if (stunnedTimer > 0) {
            stunnedTimer -= delta;
            // do funny particles idk lmao
        }

        // console.log(getSpeedMultiplier())
        updateNodeIndicator();

        // smokeParticles.position.copy(object.position);
        // smokeParticles.update(delta);

        timeElapsed += delta;

        if (snifferTraversableNodes.length == 0) {
            function getTraversableNodes(floodStart) {
                snifferTraversableNodesSet.add(level.vector2ToTileKey(floodStart));
    
                level.getAdjacentTiles(floodStart).forEach((node) => {
                    const nodeKey = level.vector2ToTileKey(node);
                    // alert(nodeKey)
                    if (snifferTraversableNodesSet.has(nodeKey)) return;
                    getTraversableNodes(node);
                });
            }
            getTraversableNodes(level.worldToTile(object.position));
            snifferTraversableNodes = Array.from(
                snifferTraversableNodesSet).map((key) => level.keyToVector2(key));
            // alert(JSON.stringify(snifferTraversableNodes));
        }

        object.updateTime(delta);
        object.animate(delta);
    
        if (object.inSight() && !player.userData.hiding) {
            onSightUpdate(delta);
        } else {
            outOfSightUpdate(delta);
        }
    }

    function onSightUpdate(delta) {
        if (stunnedTimer > 0) return;

        let moveVector = player.position.clone().sub(object.position);
        let strafeVector = new THREE.Vector3(-moveVector.z, 0, moveVector.x).normalize();
        moveVector.y = 0;
        moveVector = moveVector.normalize().multiplyScalar(chargingSpeed * delta * getSpeedMultiplier());
        strafeVector = strafeVector.multiplyScalar(0.5 * Math.sin(timeElapsed) * delta * getSpeedMultiplier());
        object.move(moveVector);
        object.move(strafeVector);
    }

    // If in direct line of sight, rush
    // If not but in sniffing radius, slowly pathfind to player
    function outOfSightUpdate(delta) {
        // console.log("hiii")
        const distance = player.position.distanceTo(object.position);
        if (distance <= sniffingRadius && !player.userData.hiding) {
            sniffedUpdate(delta);
        }
        else {
            unsniffedUpdate(delta);
        }
    }

    // function inTrigger(position, radius = 0, _player) {
    //     try {
    //         if (!object.canAttack()) return;
            
    //         const _inTrigger = !object.dead && inCylinderCollider(position, object.position, object.attackRadius, radius);
    //         if (_player && _inTrigger && timeSinceLastAttack >= cooldown) {
    //             _player.userData.beingTormented = true;
    //         }
    //         return _inTrigger;
    //     }
    //     catch (e) {
    //         alert(e);
    //         return false;
    //     }
    // }
    
    function updatePath() {
        path = level.aStar(level.worldToTile(object.position), 
            level.worldToTile(player.position));
        updatePathIndicators();
    }
    function moveAlongPath(delta) {
        if (path.length == 0) return;
        let moveVector = path[0].clone().sub(object.position);
        moveVector.y = 0;
        moveVector = moveVector.normalize().multiplyScalar(sniffingSpeed * delta * getSpeedMultiplier());
        object.move(moveVector);

        let flattenedPosition = object.position.clone(); flattenedPosition.y = 0;
        let flattenedPathPosition = path[0].clone(); flattenedPathPosition.y = 0;

        if (flattenedPosition.distanceTo(flattenedPathPosition) <= 2) {
            path.shift();
        }
    }

    function sniffedUpdate(delta) {
        // console.log("i smell you :)");
        if (pathUpdateTimer >= pathUpdateCooldown) {
            pathUpdateTimer = 0;
            updatePath();
        }
        else {
            pathUpdateTimer += delta;
        }

        moveAlongPath(delta);
    }
    function unsniffedUpdate(delta) {
        if (path.length == 0) {
            const randomNode = 
                snifferTraversableNodes[Math.floor(Math.random() * snifferTraversableNodes.length)];
            // alert(JSON.stringify(randomNode));
            path = level.aStar(level.worldToTile(object.position), randomNode);
            updatePathIndicators();
        }
        moveAlongPath(delta);
    }

    object.canAttack = canAttack;
    // object.update = (delta) => { console.log("pee")}
    object.update = update;
    // object.onSightUpdate = onSightUpdate;
    object.outOfSightUpdate = outOfSightUpdate;
    // object.inTrigger = inTrigger;
    awake();

    return object;
}

export {
    WallBlock, RandomizedWallBlock, Bob, ItemPedestal, NormalWallBlock, BlockDoor, SecretTrigger, Exit, PlantPot, WindTurbine, 
    RusherEnemy, Sniffer, Martin
}