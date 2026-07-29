#!/usr/bin/env node
"use strict";

// Records the session identity supplied by Claude Code / Codex hooks so the
// desktop app can associate a Windows process with its session. The hook is
// deliberately dependency-free and must never block the host Agent.

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MAX_STDIN_BYTES = 1024 * 1024;
const MAX_TEXT_LENGTH = 32_768;
const REGISTRY_VERSION = 1;

function registryPath(homeDir = os.homedir()) {
  return process.env.AGENT_RECALL_LIVE_SESSION_REGISTRY
    || path.join(homeDir, ".agent-recall", "windows-live-sessions.json");
}

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeAgent(value) {
  return value === "claude" || value === "codex" ? value : null;
}

function buildLiveSessionRecord(input, agent, now = () => new Date()) {
  if (!input || typeof input !== "object") return null;
  const normalizedAgent = normalizeAgent(agent);
  const sessionId = cleanText(input.session_id, 512);
  if (!normalizedAgent || !sessionId) return null;
  const pid = Number.isInteger(Number(process.ppid)) && Number(process.ppid) > 0 ? Number(process.ppid) : null;
  if (!pid) return null;
  return {
    version: REGISTRY_VERSION,
    agent: normalizedAgent,
    sessionId,
    pid,
    cwd: cleanText(input.cwd),
    updatedAt: now().toISOString(),
  };
}

function readRegistry(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!parsed || parsed.version !== REGISTRY_VERSION || !Array.isArray(parsed.sessions)) return [];
    return parsed.sessions.filter((item) => item && typeof item === "object");
  } catch {
    return [];
  }
}

function writeRegistry(filePath, sessions) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify({ version: REGISTRY_VERSION, sessions }, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    fs.renameSync(temporaryPath, filePath);
  } finally {
    try { fs.unlinkSync(temporaryPath); } catch { /* already renamed */ }
  }
}

function updateRegistry(record, filePath = registryPath(), event = "UserPromptSubmit") {
  const sessions = readRegistry(filePath).filter((item) => {
    return !(item.agent === record?.agent && item.sessionId === record?.sessionId);
  });
  if (record && event !== "SessionEnd") sessions.push(record);
  writeRegistry(filePath, sessions);
  return sessions;
}

function agentFromArgs(argv) {
  const index = argv.indexOf("--agent");
  return index >= 0 ? argv[index + 1] : "";
}

function eventFromArgs(argv) {
  const index = argv.indexOf("--event");
  return index >= 0 ? argv[index + 1] : "UserPromptSubmit";
}

function runHook(argv = process.argv.slice(2), options = {}) {
  const chunks = [];
  let size = 0;
  process.stdin.on("data", (chunk) => {
    size += chunk.length;
    if (size <= MAX_STDIN_BYTES) chunks.push(chunk);
  });
  process.stdin.on("end", () => {
    try {
      const input = size <= MAX_STDIN_BYTES
        ? JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")
        : {};
      const record = buildLiveSessionRecord(input, agentFromArgs(argv), options.now);
      updateRegistry(record, options.filePath || registryPath(options.homeDir), eventFromArgs(argv));
    } catch {
      // A live-state hook must never prevent the Agent from continuing.
    }
  });
  process.stdin.resume();
}

module.exports = {
  REGISTRY_VERSION,
  buildLiveSessionRecord,
  readRegistry,
  registryPath,
  updateRegistry,
};

if (require.main === module) runHook();
