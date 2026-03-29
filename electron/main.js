const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { execSync } = require("child_process");

let dockerProcess;
const DOCKER_PATH = "/usr/local/bin/docker";

const API_TEST_URL = "http://127.0.0.1:8005/test";
const UI_URL = process.env.MD_EDITOR_UI_URL || "http://127.0.0.1:3045";

function getProjectRoot() {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return path.join(__dirname, "..");
}

function getComposeFile() {
  return path.join(getProjectRoot(), "docker-compose.electron.yml");
}

function ensurePackagedEnv(projectRoot) {
  if (!app.isPackaged) return;
  const envPath = path.join(projectRoot, ".env");
  if (fs.existsSync(envPath)) return;
  const example = path.join(projectRoot, "packaged.env.example");
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, envPath);
  }
}

function checkDocker() {
  try {
    execSync(`${DOCKER_PATH} info`);
  } catch {
    console.error("Docker is not running");
    app.quit();
  }
}

/**
 * Run compose and wait until the CLI exits. Without this, health checks run while
 * `up` is still pulling/building — axios can hit an old stack or a half-ready UI (blank window).
 */
function runComposeUpAndWait() {
  const projectRoot = getProjectRoot();
  const composeFile = getComposeFile();
  ensurePackagedEnv(projectRoot);

  const args = ["compose", "-f", composeFile, "-p", "md_editor", "up", "-d"];
  if (app.isPackaged && process.env.MD_EDITOR_PACKAGED_NO_BUILD !== "1") {
    args.push("--build");
  } else if (
    !app.isPackaged &&
    process.env.MD_EDITOR_COMPOSE_NO_BUILD !== "1"
  ) {
    args.push("--build");
  }

  const child = spawn(DOCKER_PATH, args, {
    cwd: projectRoot,
  });

  child.stdout?.on("data", (data) => {
    console.log(`[docker]: ${data}`);
  });

  child.stderr?.on("data", (data) => {
    console.log(`[docker compose]: ${data}`);
  });

  dockerProcess = child;

  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker compose exited with code ${code}`));
    });
  });
}

async function waitForApiReady() {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    try {
      const res = await axios.get(API_TEST_URL, {
        timeout: 8_000,
        validateStatus: (s) => s === 200,
      });
      if (res.data?.status === "ok" && res.data?.database === "connected") {
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(
    "API did not become healthy (/test with database connected).",
  );
}

async function waitForUiReady() {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(UI_URL, { redirect: "follow" });
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 1_000));
        continue;
      }
      if (!ct.includes("text/html")) {
        await new Promise((r) => setTimeout(r, 1_000));
        continue;
      }
      const text = await res.text();
      if (text.length < 200) {
        await new Promise((r) => setTimeout(r, 1_000));
        continue;
      }
      if (
        text.includes("Internal Server Error") ||
        text.includes("502 Bad Gateway") ||
        text.includes("Bad gateway")
      ) {
        await new Promise((r) => setTimeout(r, 1_000));
        continue;
      }
      if (
        text.includes("__NEXT_DATA__") ||
        text.includes("__next") ||
        text.includes("/_next/") ||
        text.includes("<!DOCTYPE html")
      ) {
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`UI did not serve a usable HTML document at ${UI_URL}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: "#0a0a0a",
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.loadURL(UI_URL);
}

app.whenReady().then(async () => {
  try {
    checkDocker();
    await runComposeUpAndWait();
    await waitForApiReady();
    await waitForUiReady();
    createWindow();
  } catch (e) {
    console.error(e);
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "MD Editor",
      e instanceof Error ? e.message : String(e),
    );
    app.quit();
  }
});

app.on("will-quit", () => {
  const composeFile = getComposeFile();
  if (!fs.existsSync(composeFile)) return;
  spawn(
    DOCKER_PATH,
    ["compose", "-f", composeFile, "-p", "md_editor", "down"],
    {
      cwd: getProjectRoot(),
    },
  );
});
