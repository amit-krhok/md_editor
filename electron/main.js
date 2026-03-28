const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");
const { execSync } = require("child_process");

let dockerProcess;
const DOCKER_PATH = "/usr/local/bin/docker";

const PROJECT_ROOT = path.join(__dirname, "..");

function checkDocker() {
  try {
    execSync(`${DOCKER_PATH} info`);
  } catch {
    console.error("Docker is not running");
    app.quit();
  }
}

function startDocker() {
  dockerProcess = spawn(
    DOCKER_PATH,
    [
      "compose",
      "-f",
      "docker-compose.electron.yml",
      "-p",
      "md_editor",
      "up",
      "-d",
    ],
    {
      cwd: PROJECT_ROOT,
    },
  );

  dockerProcess.stdout?.on("data", (data) => {
    console.log(`[docker]: ${data}`);
  });

  dockerProcess.stderr?.on("data", (data) => {
    console.error(`[docker error]: ${data}`);
  });
}

async function waitForService(url) {
  while (true) {
    try {
      await axios.get(url);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  // Next.js is built as standalone (no static index.html); compose publishes UI on 3045.
  win.loadURL(process.env.MD_EDITOR_UI_URL || "http://127.0.0.1:3045");
}

app.whenReady().then(async () => {
  checkDocker();
  startDocker();
  await waitForService("http://127.0.0.1:8005/test"); // backend
  await waitForService("http://127.0.0.1:3045"); // frontend
  createWindow();
});

app.on("will-quit", () => {
  spawn(
    DOCKER_PATH,
    ["compose", "-f", "docker-compose.electron.yml", "-p", "md_editor", "down"],
    {
      cwd: PROJECT_ROOT,
    },
  );
});
