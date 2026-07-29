import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const hook = require(path.resolve("bin", "windows-live-session-hook.cjs")) as {
  buildLiveSessionRecord(input: Record<string, unknown>, agent: string, now?: () => Date): Record<string, unknown> | null;
  updateRegistry(record: Record<string, unknown> | null, filePath: string, event?: string): unknown[];
};
const setup = require(path.resolve("bin", "setup-windows-live-session-hooks.cjs")) as {
  reconcileWindowsLiveSessionHooks(options: { homeDir: string; hookScriptPath: string; nodePath?: string }): { status: string };
  uninstallWindowsLiveSessionHooks(options: { homeDir: string }): { status: string };
};

function freshHome(): string {
  const homeDir = path.join(tmpdir(), `windows-live-hooks-${process.pid}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(path.join(homeDir, ".claude"), { recursive: true });
  mkdirSync(path.join(homeDir, ".codex"), { recursive: true });
  return homeDir;
}

describe("Windows live session hooks", () => {
  it("writes a bounded session record and removes it on SessionEnd", () => {
    const homeDir = freshHome();
    const registryPath = path.join(homeDir, "registry.json");
    try {
      const record = hook.buildLiveSessionRecord(
        { session_id: "claude-1", cwd: "C:\\work\\agent-recall" },
        "claude",
        () => new Date("2026-07-29T00:00:00.000Z"),
      );
      expect(record).toMatchObject({
        agent: "claude",
        sessionId: "claude-1",
        cwd: "C:\\work\\agent-recall",
        updatedAt: "2026-07-29T00:00:00.000Z",
      });
      expect(hook.updateRegistry(record, registryPath)).toHaveLength(1);
      expect(JSON.parse(readFileSync(registryPath, "utf8")).sessions).toHaveLength(1);
      expect(hook.updateRegistry(record, registryPath, "SessionEnd")).toHaveLength(0);
    } finally {
      rmSync(homeDir, { recursive: true, force: true });
    }
  });

  it("reconciles Claude and Codex hooks without replacing unrelated hooks", () => {
    const homeDir = freshHome();
    const claudePath = path.join(homeDir, ".claude", "settings.json");
    const codexPath = path.join(homeDir, ".codex", "hooks.json");
    writeFileSync(claudePath, JSON.stringify({ theme: "dark", hooks: { Stop: [{ hooks: [{ command: "keep-claude" }] }] } }));
    writeFileSync(codexPath, JSON.stringify({ version: 1, hooks: { Stop: [{ hooks: [{ command: "keep-codex" }] }] } }));
    try {
      expect(setup.reconcileWindowsLiveSessionHooks({
        homeDir,
        hookScriptPath: "C:\\AgentRecall\\windows-live-session-hook.cjs",
        nodePath: "C:\\Program Files\\nodejs\\node.exe",
      }).status).toBe("configured");

      const claude = JSON.parse(readFileSync(claudePath, "utf8"));
      const codex = JSON.parse(readFileSync(codexPath, "utf8"));
      expect(claude.theme).toBe("dark");
      expect(claude.hooks.Stop[0].hooks[0].command).toBe("keep-claude");
      expect(claude.hooks.SessionStart[0].hooks[0].command).toContain("--agent claude --event SessionStart");
      expect(claude.hooks.UserPromptSubmit[0].hooks[0].command).toContain("--agent claude --event UserPromptSubmit");
      expect(claude.hooks.SessionEnd[0].hooks[0].command).toContain("--agent claude --event SessionEnd");
      expect(codex.hooks.Stop[0].hooks[0].command).toBe("keep-codex");
      expect(codex.hooks.UserPromptSubmit[0].hooks[0].command).toContain("--agent codex --event UserPromptSubmit");

      expect(setup.uninstallWindowsLiveSessionHooks({ homeDir }).status).toBe("removed");
      expect(JSON.parse(readFileSync(claudePath, "utf8")).hooks.Stop[0].hooks[0].command).toBe("keep-claude");
      expect(JSON.parse(readFileSync(codexPath, "utf8")).hooks.Stop[0].hooks[0].command).toBe("keep-codex");
    } finally {
      rmSync(homeDir, { recursive: true, force: true });
    }
  });
});
