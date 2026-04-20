export interface Env {
  ADMIN_PASSWORD: string;
  AUTH_SECRET: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  POSTS_DIR: string;
  R2_PUBLIC_BASE_URL: string;
  GITHUB_TOKEN: string;
  MEDIA_BUCKET: R2Bucket;
  CF_ACCOUNT_ID?: string;
  CF_ANALYTICS_TOKEN?: string;
  CF_ANALYTICS_SITE_TAG?: string;
  BLOG_POST_PATH_PREFIX?: string;
}

const REQUIRED_KEYS = [
  "ADMIN_PASSWORD",
  "AUTH_SECRET",
  "GITHUB_OWNER",
  "GITHUB_REPO",
  "GITHUB_BRANCH",
  "POSTS_DIR",
  "R2_PUBLIC_BASE_URL",
  "GITHUB_TOKEN",
] as const;

type RequiredEnvKey = (typeof REQUIRED_KEYS)[number];

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
