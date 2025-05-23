const windowPresets = {
    "eyespy": {
        title: "Eyespy Antivirus v1.0",
        content: `
            <span style="line-height: 2.5em; vertical-align: text-top;">
                <img src="./textures/eyespy.gif" style="height: 3em;">&nbsp;
                Eyespy Antivirus Shareware v1.0
            </span>
            <hr />
            Welcome! Please select what you would like to do today:
            <br /><br />
            <button onclick="openLevel('./levels/welcome.json')">Tutorial [lvl 1]</button>
            <button onclick="openLevel('./levels/sniffer.json')">Recover my files [???]</button>
            <button onclick="openLevel('./levels/testing.json')">test lvl lmao</button>`
    },
    "iexplore": {
        title: "Net Explorer",
        content: `
            <div style="width: 100%;">
                <input style="width: 100%;" value="HTTPS://www.doogle.kom" disabled />
                <hr />
                Bookmarks: [empty]
            </div>
            <div id="iexplore-content">
                <br /><br /><br /><br />
                <center>
                    <img src="./textures/doogle.png" style="height: 64px;"><br />
                    <form onsubmit="outputDoogleResults(); return false;">
                        <input style="width: 50%;" id="doogle-input" autocomplete="off" /><br /><br />
                        <button>Doogle Search</button>
                        <button>I'm feeling lucky</button>
                    </form>
                </center>
            </div>`
    },
    "editor": {
        title: "Open Editor",
        content: `
            playtest lol<br />
            <input placeholder="Enter level name..." /><br />
            <button>Edit</button>`
    },
    "credits": {
        title: "Credits",
        content: `
            Game Art - Jesse<br />
            Programming - Jesse<br />
            Sound Design - Sean<br />
            Music - Sean<br />
            <hr />
            Made with <a href="https://threejs.org/">Three.JS</a>`
    },
    "loading-window": {
        title: "Loading...",
        content: `
            <center>
                <img src="./textures/loading_bar.gif" class="loading-bar" /><br />
            </center>`
    }
}
const dialog = [
    {
        "text": "Did you do your FRQs? they've been due since last week!",
        "options": ["Yes", "Yep", "Yeah"],
    },
    {
        "text": "Yeah, where is it then?",
        "options": ["I lost them on the way to class"],
    },
    {
        "text": "EXCUSES! You know what happens when you don't do your FRQs. YOU WILL PAY",
        "options": ["..."],
    }
]

function openLevel(filePath) {
    // openWindow("loading-window");
    window.location.href = `./level.html?filePath=${btoa(filePath)}`;
}

function openWindow(id) {
    if (document.getElementById(id)) return;

    let window = `<div class="window" id="${id}">
        <div class="window-header">
            ${windowPresets[id].title}
            <button style="float: right;" onclick="closeWindow('${id}');">X</button>
        </div>
        <div class="window-content">${windowPresets[id].content}</div>
    </div>`;
    document.getElementById("windows").innerHTML += window;
}
function closeWindow(id) {
    document.getElementById(id).remove();
}

function displayDialog(_index) {
    if (_index >= dialog.length) {
        document.querySelector("#cutscene").style.display = "none";
        openLevel("sniffer.json");
        return;
    }

    // ===================================================================

    const dialogText = document.querySelector("#cutscene-text");
    const dialogOptions = document.querySelector("#cutscene-buttons");

    const _dialog = dialog[_index];
    const _dialogText = _dialog.text;

    let timeSeconds = 3;
    let index = 0;

    dialogText.innerHTML = "";
    dialogOptions.innerHTML = "";

    const interval = setInterval(() => {
        if (index < _dialogText.length) {
            dialogText.innerHTML += _dialogText[index];
            index++;
            if (_dialogText[index] == " ") {
                dialogText.innerHTML += _dialogText[index];
            }
        }
        else {
            clearInterval(interval);

            for (let i = 0; i < _dialog.options.length; i++) {
                const option = document.createElement("button");
                option.innerHTML = _dialog.options[i];
                option.onclick = () => {
                    displayDialog(_index + 1);
                };
                dialogOptions.appendChild(option);

                const space = document.createElement("span");
                space.innerHTML = "&nbsp;";
                dialogOptions.appendChild(space);
            }

            return;
        }
    }, timeSeconds * 1000 / _dialogText.length);
}