console.log("herro")

import * as THREE from 'three';
import * as util from './util.mjs';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Level } from './levels.mjs';
import { Projectile } from './projectile.mjs';

console.log("libraries loaded")

THREE.Cache.clear();

const renderer = new THREE.WebGLRenderer();
const audioLoader = new THREE.AudioLoader();
renderer.setPixelRatio(1.5);
renderer.setSize(window.innerWidth - 120, window.innerHeight - 120);
// renderer.sortObjects = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// sky: 0x86bde3
scene.fog = new THREE.FogExp2(0xffaaaa, 0.1);
scene.background = new THREE.Color(0x86bde3);
let camera = undefined;
let listener = undefined;

let player = undefined;
let playerVelocity = 0;
const MAX_HEALTH = 4;
let dead = false;
let locked = false;

let combatCooldown = 0.15;
let timeSinceLastShot = 999;

let theta = 0;

let hidingOverlay;
const hidingGradient = "radial-gradient(circle, transparent 0%, #000 100%)";
let hiddenWhenHiding = [];

let footstepSound;

let winScreenDisplayed = false;

const NOCLIP = false;

// GUI STUFF

function secretFound() {
    document.getElementById("secret").style.display = "block";
    setTimeout(() => {
        document.getElementById("secret").style.display = "none";
    }, 1500);
}


// OTEHR STUFF IDK

function setupSky() {
    const skyGeometry = new THREE.SphereGeometry(1000);
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: util.loadTexture("sky.png"),
        side: THREE.BackSide,
        fog: false
    })
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyMesh);
    skyMesh.position.set(0, 0, 0);
}
function setupCamera() {
    camera = new THREE.PerspectiveCamera(75, 
        (window.innerWidth - 120) / (window.innerHeight - 120), 
        0.1, 7500);
    camera.rotation.order = 'YXZ';
    listener = new THREE.AudioListener();
    camera.add(listener);
}
let controls = null;
let previouslyTormented = false;
let previouslyHiding = false;

function setupPlayer() {
    setupCamera();
    setupSky();
    player = new THREE.Object3D();
    player.position.set(0, 0, 0);
    scene.add(player);
    player.add(camera);
    player.userData.hiding = false;
    player.userData.martinDamageTimer = 0;
    player.userData.health = 4;
    player.userData.beingTormented = false;
    controls = new PointerLockControls(camera, document.body);
    controls.pointerSpeed = 0.6;
    controls.minPolarAngle = Math.PI/2;
    controls.maxPolarAngle = Math.PI/2;

    const pointLight = new THREE.PointLight(0xe4da96, 2.5, 10, 0.5);
    player.add(pointLight);
    pointLight.position.y = 2;

    footstepSound = new THREE.Audio(listener);

    audioLoader.load("./audio/footsteps.wav", (buffer) => {
        footstepSound.setBuffer(buffer);
        footstepSound.setVolume(0);
        footstepSound.setLoop(true);
        footstepSound.play();
    });
    
    controls.addEventListener("lock", () => {
        // menu.style.display = "none";
        locked = true;
    });
    controls.addEventListener("unlock", () => {
        // menu.style.display = "block";
        locked = false;
    });
    document.body.addEventListener("click", () => {
        if (dead) return;
        controls.lock();
    });

    // controls.lock();
    player.name = "PLAYER";

    hidingOverlay = document.getElementById("hiding-overlay");
    hiddenWhenHiding = document.querySelectorAll(".viewmodel, .viewmodel-orb, #crosshair, #dataviewer");
}
let level = undefined;
let projectiles = [];
let attackPressed = false;

function setupScene() {
    // ======================================
    console.log(main);
    const urlParams = new URLSearchParams(window.location.search);

    let filePath = "";

    if (urlParams.has("filePath")) {
        filePath = atob(urlParams.get("filePath"));
    }
    else {
        const contents = localStorage.getItem(atob(urlParams.get("saveName")));
        filePath = `data:text/plain;base64,${btoa(contents)}`;
    }
    // alert(filePath)
    level = new Level(main, scene, player, listener, filePath);
    level.name = "LEVEL";
    scene.add(level);
}
var pressedKeys = {};
window.onkeyup = function(event) { pressedKeys[event.key] = false; }
window.onkeydown = function(event) {
    if ((dead || level.levelCleared) && event.key == " ") {
        location.reload();
        return;
    }
    // if (event.key == "e") {
    //     window.onmousedown();
    // }
    if (event.key == " ") {
        player.userData.hiding = false;
    }
    pressedKeys[event.key] = true;
}
window.onmousedown = function(event) {
    attackPressed = true;
    listener.context.resume();
}

function problemWrong() {
    player.userData.health -= 1;
    const fard = new Audio("./audio/fard.wav");
    fard.play();
}
function closeProblemOverlay() {
    document.getElementById("answers").reset();
    document.getElementById("apclassroom-overlay").classList.add("hidden");
    player.userData.beingTormented = false;
}

// start() update runs once before the first frame
function start() {
    setupPlayer(); console.log("player setup")
    setupScene(); console.log("scene setup")
    healthIcons = document.querySelectorAll("#health .icon");
    previousHealth = player.userData.health;

    // setTimeout(() => {
    //     document.getElementById("loading-overlay").remove();
    // }, 300);
    document.getElementById("loading-overlay").remove();

    document.getElementById("answers").onsubmit = (event) => {
        // alert("hiiiii")
        event.preventDefault();
        const answer = parseInt(document.querySelector("#answers input").value);
        if (answer == problemAnswers[problemIndex]) {
            const ding = new Audio("./audio/collect.wav");
            ding.play();
        }
        else {
            problemWrong();
        }

        closeProblemOverlay();
    }
}

const WALK_SPEED = 7;
const PLAYER_RADIUS = 0.5;
function updatePlayer(delta) {
    let walkMovement = 0;
    let strafeMovement = 0;
    if (pressedKeys.w || pressedKeys.W) walkMovement++;
    if (pressedKeys.s || pressedKeys.S) walkMovement--;
    if (pressedKeys.a || pressedKeys.A) strafeMovement--;
    if (pressedKeys.d || pressedKeys.D) strafeMovement++;

    if (player.userData.hiding || player.userData.beingTormented) {
        walkMovement = 0;
        strafeMovement = 0;
        if (player.userData.beingTormented) controls.unlock();
    }

    if (player.userData.beingTormented && !previouslyTormented) {
        // show ap classroom overlay
        generateNewProblem();
        document.getElementById("apclassroom-overlay").classList.toggle("hidden");

        const vineBoom = new Audio("./audio/vine_boom.wav");
        vineBoom.play();
        //
        //
        //
        // very important lol akgfga87wisyt08owisrjtf;;;;
        //
        //
        //
        //
        timesEscaped++;
    }
    previouslyTormented = player.userData.beingTormented;

    theta = camera.rotation.y;
    const walkVector = new THREE.Vector3(
        Math.sin(theta), 0, Math.cos(theta)); walkVector.multiplyScalar(WALK_SPEED * delta * -walkMovement);
    const strafeVector = new THREE.Vector3(
        Math.sin(theta + Math.PI / 2), 0, Math.cos(theta + Math.PI / 2)); strafeVector.multiplyScalar(WALK_SPEED * delta * strafeMovement);
    
    const moveVector = walkVector.clone().add(strafeVector).clampLength(0, WALK_SPEED * delta);
    // player.position.add(moveVector);
    camera.position.y = 2 + (Math.sin(timeElapsed * 12.5) * Math.max(Math.abs(walkMovement), Math.abs(strafeMovement)) * 0.07);

    footstepSound.setVolume(1.0 * Math.max(Math.abs(walkMovement), Math.abs(strafeMovement)));

    // console.log(level.checkIntersection(player.position))
    const moveX = moveVector.clone(); moveX.z = 0;
    const moveZ = moveVector.clone(); moveZ.x = 0;

    level.checkTriggerIntersection(player.position, PLAYER_RADIUS, player);
    player.position.add(moveX);
    
    if (level.checkIntersection(player.position, PLAYER_RADIUS) && !NOCLIP) {
        player.position.sub(moveX);
    }
    player.position.add(moveZ);
    if (level.checkIntersection(player.position, PLAYER_RADIUS) && !NOCLIP) {
        player.position.sub(moveZ);
    }
}

function updateAttacking(delta) {
    if ((attackPressed || pressedKeys.e) && timeSinceLastShot >= combatCooldown) {
        const newProjectile = new Projectile(level, theta);
        newProjectile.position.copy(player.position);
        newProjectile.position.y = 1.85;
        projectiles.push(newProjectile);
        scene.add(newProjectile);
        timeSinceLastShot = 0;
        attackPressed = false;
    }
    else {
        timeSinceLastShot += delta;
    }
}

function updateHiding(delta) {
    hiddenWhenHiding.forEach((element) => {
        if (player.userData.hiding) {
            element.classList.add("hidden");
        }
        else {
            element.classList.remove("hidden");
        }
    });
    if (player.userData.hiding) {
        hidingOverlay.classList.remove("hidden");
        // if (player.userData.martinDamageTimer < 0.5) {
        //     hidingOverlay.classList.remove("hiding-1");
        //     hidingOverlay.classList.add("hiding-2");
        // }
        // else if (player.userData.martinDamageTimer < 1.75) {
        //     hidingOverlay.classList.remove("hiding-2");
        //     hidingOverlay.classList.add("hiding-1");
        // }
        // else {
        //     hidingOverlay.classList.remove("hiding-1");
        //     hidingOverlay.classList.remove("hiding-2");
        // }
        if (!previouslyHiding) {
            const fard = new Audio("./audio/locker.wav");
            fard.play();
        }
    }
    else {
        hidingOverlay.classList.add("hidden");
    }

    previouslyHiding = player.userData.hiding;
}

const clock = new THREE.Clock();
let timeElapsed = 0;
// update() runs every frame
function updateProjectiles(delta, theta) {
    if (projectiles.length > 0 && projectiles[0].awaitingDeletion()) {
        scene.remove(projectiles[0]);
        projectiles.shift();
    }
    projectiles.forEach(projectile => {
        projectile.update(delta);
        // console.log(projectile.position)
    });
}
let healthIcons = null;
let previousHealth = 0;
let damageOverlayTransparency = 0;
let healOverlayTransparency = 0;

function update() {
    requestAnimationFrame(update);

    if (level.levelCleared && !winScreenDisplayed) {
        document.getElementById("win-screen").classList.remove("hidden");
        controls.unlock();
        winScreenDisplayed = true;
        listener.setMasterVolume(0);
        document.querySelector("canvas").remove();

        const win = new Audio("./audio/win.mp3");
        win.play();
        return;
    }

    if (!level || !level.finished || dead || level.levelCleared) {
        return;
    }

    if (!locked) pressedKeys = {};

    const delta = clock.getDelta();
    timeElapsed += delta;
    if (!player.userData.beingTormented) problemTimer = 3;
    if (problemTimer <= 0 && player.userData.beingTormented) {
        //
        //
        //
        //
        //
        //
        //
        //
        problemWrong();
        closeProblemOverlay();
        controls.lock();
    }
    else {
        let funny = Math.ceil(problemTimer).toString();
        if (funny.length == 1) funny = "0" + funny;
        document.getElementById("problem-timer").innerText = `0:${funny} Remaining`;
        problemTimer -= delta;
    }

    document.getElementById("user-data").innerHTML = JSON.stringify(player.userData)
        .replace("icecream", "<span id='ice-cream'>icecream</span>")
        .replace("document", "<span id='document'>document</span>");

    let iconIndex = 0;
    healthIcons.forEach((element) => {
        if (player.userData.health <= iconIndex) {
            element.classList.add("blacked-icon");
        }
        else {
            element.classList.remove("blacked-icon");
        }
        iconIndex++;
    })
    
    if (timeSinceLastShot <= 0.12) {
        document.getElementById("right-hand").src = "textures/right_hand_fire.png";
    }
    else {
        document.getElementById("right-hand").src = "textures/right_hand.png";
    }

    player.userData.health = util.clamp(player.userData.health, 0, MAX_HEALTH);
    damageOverlayTransparency = util.lerp(damageOverlayTransparency, (1 - player.userData.health / MAX_HEALTH) * 0.6, 0.075);
    healOverlayTransparency *= 0.8;
    if (player.userData.health <= 0) {
        document.getElementById("death-screen").classList.remove("hidden");
        dead = true;
        controls.unlock();
        listener.setMasterVolume(0);
        document.querySelector("canvas").remove();
        return;
    }
    else if (player.userData.health != previousHealth) {
        if (player.userData.health < previousHealth) {
            damageOverlayTransparency = 1;
        }
        else {
            healOverlayTransparency = 1;
        }
    }

    previousHealth = player.userData.health;
    document.getElementById("damage-overlay").style.opacity = damageOverlayTransparency;
    document.getElementById("heal-overlay").style.opacity = healOverlayTransparency;

    // update stuff
    updatePlayer(delta);
    updateHiding(delta);
    // updateAttacking(delta);
    level.update(delta);
    updateProjectiles(delta, theta);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    // composer.render();
}

const problemAnswers = [20, 0, 2, 6, 0, 0, 5, 2];
let problemIndex = 0;
let timesEscaped = 0;
let problemTimer = 0;

function timeRemaining() {
    return Math.floor(20 * (timesEscaped + 1) ** -0.3);
}

function generateNewProblem() {
    problemIndex = Math.floor(Math.random() * 7);
    try {
        document.getElementById("problem-image").src = `./problems/${problemIndex}.png`;
        // alert(problemAnswers[problemIndex]);
        // alert(timeRemaining());
        problemTimer = timeRemaining();
    }
    catch (e) {
        alert(e);
    }
}


let main = {
    secretFound
};

document.body.onload = () => {
    start();
    update();
}