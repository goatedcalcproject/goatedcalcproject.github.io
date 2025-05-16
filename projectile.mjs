import * as THREE from 'three';
import * as util from './util.mjs';

const projectileMaterials = [
    new THREE.SpriteMaterial({ map: util.loadTexture("projectiles/alert1.png") }),
    new THREE.SpriteMaterial({ map: util.loadTexture("projectiles/alert2.png") }),
    new THREE.SpriteMaterial({ map: util.loadTexture("projectiles/alert3.png") })
];
let projectileNumber = 0;

export function Projectile(level, theta, speed = 45) {
    // const object = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), new THREE.MeshNormalMaterial);
    const object = new THREE.Object3D();
    let sprite = null;
    const spawnTime = Date.now();
    let hit = false;

    function awake() {
        sprite = new THREE.Sprite(projectileMaterials[projectileNumber % 3]);
        projectileNumber++;
        object.add(sprite);
        object.scale.set(0.75 * 0.5, 0.75 * 0.5, 0.75 * 0.5);
    }
    function update(delta) {
        if (!hit) {
            const newDirectionVector = new THREE.Vector3(-Math.sin(theta) * speed * delta, 0, -Math.cos(theta) * speed * delta);
            object.position.add(newDirectionVector);

            const enemyIntersection = level.checkIntersection(object.position, 0.1, true);
            if (level.checkIntersection(object.position, 0.1)) {
                hitEffect(false);
            }
            else if (enemyIntersection) {
                hitEffect(true);
                enemyIntersection.damage(1);
            }
        }
    }
    function awaitingDeletion() {
        return Math.abs(spawnTime - Date.now()) / 1000 >= 10;
    }
    function hitEffect(enemyHit) {
        hit = true;
        object.remove(sprite);
    }

    awake();

    Object.assign(object, {
        awake, update, awaitingDeletion
    });
    return object;
}