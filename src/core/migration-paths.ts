import type { EnvironmentKind } from "./types";

export function projectPathForMigration(
  projectPath: string,
  sourceKind: EnvironmentKind,
  targetKind: EnvironmentKind,
): string {
  const normalized = projectPath.trim();
  if (!normalized) throw new Error("Session has no project path.");
  if (sourceKind === targetKind || sourceKind === "ssh" || targetKind === "ssh") return normalized;
  if (sourceKind === "local" && targetKind === "wsl") return windowsPathToWsl(normalized);
  if (sourceKind === "wsl" && targetKind === "local") return wslPathToWindows(normalized);
  return normalized;
}

function windowsPathToWsl(projectPath: string): string {
  const match = projectPath.replaceAll("\\", "/").match(/^([A-Za-z]):\/(.*)$/);
  if (!match) {
    throw new Error(`Cannot map Windows project path to WSL automatically: ${projectPath}`);
  }
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

function wslPathToWindows(projectPath: string): string {
  const match = projectPath.match(/^\/mnt\/([A-Za-z])(?:\/(.*))?$/);
  if (!match) {
    throw new Error(`Cannot map WSL project path to Windows automatically: ${projectPath}`);
  }
  return `${match[1].toUpperCase()}:\\${(match[2] ?? "").replaceAll("/", "\\")}`;
}
