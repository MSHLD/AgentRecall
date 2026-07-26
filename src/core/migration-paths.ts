import type { EnvironmentKind } from "./types";

export interface MigrationPathOptions {
  sourceWslDistribution?: string | null;
}

export function projectPathForMigration(
  projectPath: string,
  sourceKind: EnvironmentKind,
  targetKind: EnvironmentKind,
  options: MigrationPathOptions = {},
): string {
  const normalized = projectPath.trim();
  if (!normalized) throw new Error("Session has no project path.");
  if (sourceKind === targetKind || sourceKind === "ssh" || targetKind === "ssh") return normalized;
  if (sourceKind === "local" && targetKind === "wsl") return windowsPathToWsl(normalized);
  if (sourceKind === "wsl" && targetKind === "local") {
    return wslPathToWindows(normalized, options.sourceWslDistribution);
  }
  return normalized;
}

function windowsPathToWsl(projectPath: string): string {
  const match = projectPath.replaceAll("\\", "/").match(/^([A-Za-z]):\/(.*)$/);
  if (!match) {
    throw new Error(`Cannot map Windows project path to WSL automatically: ${projectPath}`);
  }
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

function wslPathToWindows(projectPath: string, distribution?: string | null): string {
  const normalized = projectPath.replaceAll("\\", "/");
  const match = normalized.match(/^\/mnt\/([A-Za-z])(?:\/(.*))?$/);
  if (!match) {
    const wslDistribution = distribution?.trim();
    if (!wslDistribution) {
      throw new Error("WSL distribution is required to map a WSL project path to Windows.");
    }
    if (/[\\/\0]/.test(wslDistribution)) {
      throw new Error("WSL distribution contains invalid path characters.");
    }
    if (!normalized.startsWith("/")) {
      throw new Error(`Cannot map WSL project path to Windows automatically: ${projectPath}`);
    }
    return `\\\\wsl$\\${wslDistribution}${normalized.replaceAll("/", "\\")}`;
  }
  return `${match[1].toUpperCase()}:\\${(match[2] ?? "").replaceAll("/", "\\")}`;
}
