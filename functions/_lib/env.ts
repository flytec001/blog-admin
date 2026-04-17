export interface Env {
  ALLOWED_EMAILS: string;
  DEV_ACCESS_EMAIL?: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  POSTS_DIR: string;
  R2_PUBLIC_BASE_URL: string;
  GITHUB_TOKEN: string;
  MEDIA_BUCKET: R2Bucket;
}

const REQUIRED_KEYS = [
  "ALLOWED_EMAILS",
  "GITHUB_OWNER",
  "GITHUB_REPO",
  "GITHUB_BRANCH",
  "POSTS_DIR",
  "R2_PUBLIC_BASE_URL",
  "GITHUB_TOKEN",
] as const;

type RequiredEnvKey = (typeof REQUIRED_KEYS)[number];

export function getAllowedEmails(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getEnv(rawEnv: Partial<Env>): Env {
  for (const key of REQUIRED_KEYS) {
    if (!rawEnv[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return rawEnv as Env;
}

export function requireEnvValue(
  rawEnv: Partial<Env>,
  key: RequiredEnvKey,
): string {
  const value = rawEnv[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
