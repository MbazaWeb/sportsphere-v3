import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type AuthType = "none" | "header" | "query";

export interface CustomApiProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  authType: AuthType;
  /** e.g. x-rapidapi-key or Authorization */
  authHeaderName?: string;
  /** e.g. api_token */
  authQueryParam?: string;
  apiKey?: string;
  /** Extra static headers */
  extraHeaders?: Record<string, string>;
  supportedSports: string[];
  enabled: boolean;
  /** Relative paths under baseUrl */
  competitionsPath?: string;
  fixturesPath?: string;
  teamsPath?: string;
  playersPath?: string;
  /** Query param names */
  dateParam?: string;
  searchParam?: string;
  /** Dot-path to list in JSON response e.g. response.matches */
  competitionsListPath?: string;
  fixturesListPath?: string;
  teamsListPath?: string;
  playersListPath?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "api-providers.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function listCustomProviders(): Promise<CustomApiProviderConfig[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getCustomProvider(
  id: string
): Promise<CustomApiProviderConfig | null> {
  const all = await listCustomProviders();
  return all.find((p) => p.id === id) || null;
}

export async function saveCustomProvider(
  input: Omit<CustomApiProviderConfig, "createdAt" | "updatedAt"> & {
    createdAt?: string;
  }
): Promise<CustomApiProviderConfig> {
  await ensureFile();
  const all = await listCustomProviders();
  const now = new Date().toISOString();
  const idx = all.findIndex((p) => p.id === input.id);
  const row: CustomApiProviderConfig = {
    ...input,
    createdAt: input.createdAt || (idx >= 0 ? all[idx].createdAt : now),
    updatedAt: now,
  };
  if (idx >= 0) all[idx] = row;
  else all.push(row);
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
  return row;
}

export async function deleteCustomProvider(id: string): Promise<boolean> {
  await ensureFile();
  const all = await listCustomProviders();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return true;
}

export function slugifyId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || randomUUID().slice(0, 8)
  );
}
