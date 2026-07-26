import { describe, expect, it } from "vitest";
import { projectPathForMigration } from "./migration-paths";

describe("projectPathForMigration", () => {
  it("maps Windows drive paths into WSL mount paths", () => {
    expect(projectPathForMigration("E:\\project\\demo", "local", "wsl")).toBe("/mnt/e/project/demo");
  });

  it("maps WSL mount paths into Windows drive paths", () => {
    expect(projectPathForMigration("/mnt/e/project/demo", "wsl", "local")).toBe("E:\\project\\demo");
  });

  it("maps WSL home paths through the distribution UNC path", () => {
    expect(projectPathForMigration("/home/alice/project", "wsl", "local", {
      sourceWslDistribution: "Ubuntu",
    })).toBe("\\\\wsl$\\Ubuntu\\home\\alice\\project");
  });

  it("preserves paths between WSL distributions", () => {
    expect(projectPathForMigration("/home/alice/project", "wsl", "wsl")).toBe("/home/alice/project");
  });

  it("requires the source distribution for WSL-only paths", () => {
    expect(() => projectPathForMigration("/home/alice/project", "wsl", "local")).toThrow("WSL distribution is required");
  });
});
