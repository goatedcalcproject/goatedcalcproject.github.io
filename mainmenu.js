const times = [ "12:99 PM", "5:57 PM", "10:05 AM", "1:32 AM" ]

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

function startTimeUpdates() {
    setInterval(() => {
        document.getElementById("time").innerText = times[Math.floor(Math.random() * times.length)]
    }, 1000);
}
function openLevel(filePath) {
    openWindow("loading-window");
    setTimeout(() => {
        window.location.href = `./level.html?filePath=${btoa(filePath)}`;
    }, 500 + Math.random() * 500);
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

function outputDoogleResults() {
    const corrections = [
        "how does nuclear winter affect the trout population?", "can i eat plutonium?", 
        "are pickles the same as fingers?", "john", "can i eat uranium?"]

    const enteredInput = document.getElementById("doogle-input").value;
    const sanitizedValue = enteredInput.replace("\"", "\\\"");
    const content = `
        <br /><br />
        <form onsubmit="outputDoogleResults(); return false;" style="line-height: 2em; margin-left: 10px;">
            <input style="width: 50%;" id="doogle-input" value="${sanitizedValue}" autocomplete="off" />&nbsp;
            <button>Search</button>
        </form>
        <hr />
        <div style="padding: 10px; line-height: 1.25em;">
            No results were found...<br /><br />
            <i>Did you mean</i>: ${corrections[Math.floor(Math.random() * corrections.length)]}
        </div>
    `;
    document.getElementById("iexplore-content").innerHTML = content;
}

function doStartupSequence() {
    setTimeout(() => { document.getElementById("minitrends-1").classList.remove("hidden"); }, 100);
    setTimeout(() => { document.getElementById("minitrends-2").classList.remove("hidden"); }, 300);
    setTimeout(() => { document.getElementById("minitrends-3").classList.remove("hidden"); }, 500);
    setTimeout(() => {
        document.getElementById("startup-overlay-2").classList.remove("hidden");
    }, 1100);

    setTimeout(() => {
        document.getElementById("startup-overlay-1").classList.add("hidden");
        document.getElementById("startup-overlay-2").classList.add("hidden");
    }, 2950);
}