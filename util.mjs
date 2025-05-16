import * as THREE from 'three';

function lerp(a, b, i) {
    return a + i * (b - a);
}
function clamp(v, a, b) {
    return Math.max(a, Math.min(v, b));
}
let loader = new THREE.TextureLoader();
loader.crossOrigin = "";

function loadTexture(path, tilingX = 1, tilingY = 1, offsetU = 0, offsetV = 0) {
    let texture = loader.load("textures/" + path, () => {
        console.log("texture loaded")
        texture.needsUpdate = true;
    });
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(tilingX, tilingY);
    texture.offset.set(offsetU, offsetV);
    texture.matrixAutoUpdate = true;
    return texture;
}

export {
    lerp, clamp, loadTexture
}