// const textureMap = {
//     "BOB_TUTORIAL_TEXT" X
        
//     "PURPLE_TILED_WALL" X
//     "PURPLE_TILED_WALL_PAINTING" X
//     "EXIT"
//     "NORMAL_WALL" X
//     "METAL_WALL" X
//     "WALLPAPER_WALL" X
//     "WALLPAPER_WALL_DECORATED" X

//     "METAL_DOOR"
//     "PURPLE_TILED_WALL_PAINTING_DOOR"
//     "BOB_ENTITY"
//     "MARTIN_ENTITY"
//     "DOCUMENT_PEDESTAL"
//     "ICECREAM_PEDESTAL"
//     "PLANT_POT"
//     "SECRET_TRIGGER"
//     "GOB_ENTITY"
//     "SNIFFER_ENTITY"
// }

let loadedLevel = {};

function importSelectedFile() {
    var reader = new FileReader();
    reader.readAsText(document.getElementById("file").files[0], "UTF-8");
    reader.onload = function(event) {
        loadedLevel = JSON.parse(event.target.result);
        updateEditor();
    }
    reader.onerror = function(event) { alert("Unable to load file :("); }
}
function replaceTile(x, z) {
    const tileId = document.getElementById("tile-select").value;
    loadedLevel.content[z][x] = tileId;
    updateEditor();
}
function exportMap() {
    let contents = JSON.stringify(loadedLevel);
    contents = contents.substring(0, contents.length - 1)
    const blob = new Blob([contents], { type: "text/plain" });
    const link = document.querySelector("#export-link");
    link.download = "untitled_level.json";
    link.href = URL.createObjectURL(blob);
    link.click();
}
function updateEditor() {
    document.getElementById("editor").innerHTML = "";
    let rows = loadedLevel["content"];
    let x = 0; let z = 0;
    rows.forEach(row => {
        x = 0;
        let rowInnerHTML = "";
        row.forEach(char => {
            char = char.replace("\r", "")
            const id = btoa(`${x}:${z}`)
            rowInnerHTML += `<button id="${id}" 
                class="tile ${(char == 'EMPTY') ? '' : 'occupied-tile'}" 
                style="background-image: url('./tile_thumbnails/${char}.png'); background-size: cover;"
                onclick="replaceTile(${x}, ${z})">&nbsp;</button>`;
            x++;
        });
        document.getElementById("editor").innerHTML += `<div>${rowInnerHTML}</div>`;
        z++;
    });
}
function saveMap() {
    let name = prompt("put in the name you wanna save as :)");
    localStorage.setItem(name, JSON.stringify(loadedLevel));
    alert("k done lol");
}
function playMap() {
    let contents = JSON.stringify(loadedLevel);
    contents = contents.substring(0, contents.length - 1)
    const link = document.querySelector("#export-link");
    // link.href = `./level.html?filePath=${btoa(URL.createObjectURL(new Blob([contents], { type: "application/json" })))}`
    const uri = btoa("data:text/plain;base64," + btoa(contents));
    alert(uri)
    link.href = `./level.html?filePath=${uri}`;
    link.click();
}