import { describe, expect, it } from "vitest";
import { projectPathForMigration } from "./migration-paths";

describe("projectPathForMigration", () => {
  it("maps Windows drive paths into WSL mount paths", () => {
    expect(projectPathForMigration("E:\\project\\demo", "local", "wsl")).toBe("/mnt/e/project/demo");
  });

  it("maps WSL mount paths into Windows drive paths", () => {
    expect(projectPathForMigration("/mnt/e/project/demo", "wsl", "local")).toBe("E:\\project\\demo");
  });

  it("preserves paths between WSL distributions", () => {
    expect(projectPathForMigration("/home/alice/project", "wsl", "wsl")).toBe("/home/alice/project");
  });

  it("rejects non-mounted WSL paths when targeting Windows", () => {
    expect(() => projectPathForMigration("/home/alice/project", "wsl", "local")).toThrow("Cannot map WSL project path");
  });
});
