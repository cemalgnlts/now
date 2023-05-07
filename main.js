import Now from "./now.js";

const termTheme = {
  foreground: "#eff0eb",
  background: "#282a36",
  selection: "#97979b33",
  black: "#282a36",
  brightBlack: "#686868",
  red: "#ff5c57",
  brightRed: "#ff5c57",
  green: "#5af78e",
  brightGreen: "#5af78e",
  yellow: "#f3f99d",
  brightYellow: "#f3f99d",
  blue: "#57c7ff",
  brightBlue: "#57c7ff",
  magenta: "#ff6ac1",
  brightMagenta: "#ff6ac1",
  cyan: "#9aedfe",
  brightCyan: "#9aedfe",
  white: "#f1f1f0",
  brightWhite: "#eff0eb",
};

const REQUIRED_FILE_COUNT = 26;
const MAX_PROGRESS = 10;

let downloadedFileCount = 0;
let progress = 0;

(async function () {
  const term = new Terminal({
    theme: termTheme,
    cursorBlink: true,
  });
  term.open(document.getElementById("terminal"));

  const now = new Now();
  now.on("updateDownloading", updateProgress);
  now.on("data", (data) => term.write(data));

  term.onData((data) => now.stdin.write(data));

  now.boot().then(() => console.log("%cNode Ready", "font-weight: bold"));

  function updateProgress(isDloading) {
    if (!isDloading) downloadedFileCount++;
    progress = Math.floor((downloadedFileCount / REQUIRED_FILE_COUNT) * MAX_PROGRESS);

    const progressAscii = "=".repeat(progress).padEnd(MAX_PROGRESS, " ");

    let msg = "Shell downloading...";
    if(progress === 4) msg = "Node downloading..."
    else if(progress > 4) msg = "Node initializing...";

    term.write(`\r\x1b[32;1m[${progressAscii}]\x1b[0m ${progress}/${MAX_PROGRESS} ${msg}`);

    if(progress === MAX_PROGRESS) term.write("\n");
  }
})();
