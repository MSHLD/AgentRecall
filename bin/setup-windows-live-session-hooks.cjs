#!/usr/bin/env node
"use strict";

// Reconciles the small, local-only hooks used to associate Windows Agent
// processes with their session IDs. Existing user hooks are preserved.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HOOK_SCRIPT_BASENAME = "windows-live-session-hook.cjs";
const HOOK_BIN_NAME = "agent-recall-windows-live-session-hook";

function settingsPathsFor(homeDir) {
  return {
    claude: path.join(homeDir, ".claude", "settings.json"),
    codex: path.join(homeDir, ".codex", "hooks.json"),
  };
}

function buildHookCommand(options, agent, event) {
  const nodePath = options.nodePath || "node";
  return `${quote(nodePath)} ${quote(options.hookScriptPath)} --agent ${agent} --event ${event}`;
}

function isOurHookCommand(command) {
  return typeof command === "string" && (command.includes(HOOK_SCRIPT_BASENAME) || command.includes(HOOK_BIN_NAME));
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return { value: {} };
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return { value: {} };
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { error: `${filePath} is not a JSON object.` };
    return { value };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    fs.renameSync(temporaryPath, filePath);
  } finally {
    try { fs.unlinkSync(temporaryPath); } catch { /* already renamed */ }
  }
}

function removeOurHooks(settings) {
  if (!settings.hooks || typeof settings.hooks !== "object" || Array.isArray(settings.hooks)) return false;
  let changed = false;
  for (const event of Object.keys(settings.hooks)) {
    if (!Array.isArray(settings.hooks[event])) continue;
    const kept = [];
    for (const entry of settings.hooks[event]) {
      const hooks = entry && Array.isArray(entry.hooks) ? entry.hooks : [];
      const remaining = hooks.filter((hook) => !(hook && isOurHookCommand(hook.command)));
      if (remaining.length !== hooks.length) changed = true;
      if (remaining.length > 0) kept.push({ ...entry, hooks: remaining });
    }
    if (kept.length > 0) settings.hooks[event] = kept;
    else delete settings.hooks[event];
  }
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  return changed;
}

function hasOurHook(settings) {
  if (!settings.hooks || typeof settings.hooks !== "object" || Array.isArray(settings.hooks)) return false;
  return Object.values(settings.hooks).some((entries) => Array.isArray(entries) && entries.some((entry) => {
    const hooks = entry && Array.isArray(entry.hooks) ? entry.hooks : [];
    return hooks.some((hook) => hook && isOurHookCommand(hook.command));
  }));
}

function addHook(settings, event, command, options = {}) {
  if (!settings.hooks || typeof settings.hooks !== "object" || Array.isArray(settings.hooks)) settings.hooks = {};
  if (!Array.isArray(settings.hooks[event])) settings.hooks[event] = [];
  const hook = { type: "command", command, timeout: options.timeout || 3 };
  if (options.async) hook.async = true;
  const entry = { matcher: options.matcher || "", hooks: [hook] };
  if (options.statusMessage) hook.statusMessage = options.statusMessage;
  settings.hooks[event].push(entry);
}

function reconcileWindowsLiveSessionHooks(options = {}) {
  const opts = {
    homeDir: options.homeDir || process.env.AGENT_RECALL_TEST_HOME || os.homedir(),
    hookScriptPath: options.hookScriptPath || path.join(__dirname, HOOK_SCRIPT_BASENAME),
    nodePath: options.nodePath || "node",
  };
  const paths = settingsPathsFor(opts.homeDir);
  const claude = readJson(paths.claude);
  const codex = readJson(paths.codex);
  if (claude.error || codex.error) return { status: "error", detail: claude.error || codex.error, paths };

  try {
    removeOurHooks(claude.value);
    removeOurHooks(codex.value);
    addHook(claude.value, "SessionStart", buildHookCommand(opts, "claude", "SessionStart"), { async: true });
    addHook(claude.value, "UserPromptSubmit", buildHookCommand(opts, "claude", "UserPromptSubmit"), { async: true });
    addHook(claude.value, "SessionEnd", buildHookCommand(opts, "claude", "SessionEnd"), { async: true });
    addHook(codex.value, "UserPromptSubmit", buildHookCommand(opts, "codex", "UserPromptSubmit"), { matcher: "*", statusMessage: "Updating AgentRecall live session" });
    writeJsonAtomic(paths.claude, claude.value);
    writeJsonAtomic(paths.codex, codex.value);
    return { status: "configured", paths };
  } catch (error) {
    return { status: "error", detail: error instanceof Error ? error.message : String(error), paths };
  }
}

function uninstallWindowsLiveSessionHooks(options = {}) {
  const homeDir = options.homeDir || process.env.AGENT_RECALL_TEST_HOME || os.homedir();
  const paths = settingsPathsFor(homeDir);
  const claude = readJson(paths.claude);
  const codex = readJson(paths.codex);
  if (claude.error || codex.error) return { status: "error", detail: claude.error || codex.error, paths };
  const changed = removeOurHooks(claude.value) || removeOurHooks(codex.value);
  try {
    if (changed || fs.existsSync(paths.claude)) writeJsonAtomic(paths.claude, claude.value);
    if (changed || fs.existsSync(paths.codex)) writeJsonAtomic(paths.codex, codex.value);
    return { status: changed ? "removed" : "absent", paths };
  } catch (error) {
    return { status: "error", detail: error instanceof Error ? error.message : String(error), paths };
  }
}

function windowsLiveSessionHookStatus(options = {}) {
  const homeDir = options.homeDir || process.env.AGENT_RECALL_TEST_HOME || os.homedir();
  const paths = settingsPathsFor(homeDir);
  const claude = readJson(paths.claude);
  const codex = readJson(paths.codex);
  return {
    installed: Boolean(claude.value && hasOurHook(claude.value) && codex.value && hasOurHook(codex.value)),
    claude: Boolean(claude.value && hasOurHook(claude.value)),
    codex: Boolean(codex.value && hasOurHook(codex.value)),
    error: claude.error || codex.error || null,
    paths,
  };
}

function quote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function runCli() {
  const result = process.argv.includes("--uninstall")
    ? uninstallWindowsLiveSessionHooks()
    : process.argv.includes("--status")
      ? windowsLiveSessionHookStatus()
      : reconcileWindowsLiveSessionHooks();
  if (result.status === "error") {
    process.stderr.write(`${result.detail || "Could not configure Windows live session hooks."}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Windows live session hooks ${result.status}.\n`);
}

module.exports = {
  buildHookCommand,
  hasOurHook,
  reconcileWindowsLiveSessionHooks,
  settingsPathsFor,
  uninstallWindowsLiveSessionHooks,
  windowsLiveSessionHookStatus,
};

if (require.main === module) runCli();
