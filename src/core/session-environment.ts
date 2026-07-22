import type { EnvironmentKind } from "./types";

export interface SessionEnvironmentIdentity {
  environmentKind: EnvironmentKind;
  environmentId: string;
}

export interface SessionStorageIdentity {
  environmentId: string;
  storageEnvironmentId?: string;
}

export function isLocalSessionEnvironment(session: SessionEnvironmentIdentity): boolean {
  return session.environmentKind === "local" && session.environmentId === "local";
}

export function isLocalSessionStorage(session: SessionStorageIdentity): boolean {
  return (session.storageEnvironmentId ?? session.environmentId) === "local";
}
