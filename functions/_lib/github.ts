import type { Env } from "./env";
import { HttpError } from "./errors";

function buildContentsUrl(env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_BRANCH">, path: string) {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`;
}

function encodeBase64(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }

  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function parseGitHubJson<T>(response: Response): Promise<T> {
  const rawText = await response.text();
  let payload: (T & { message?: string }) | null = null;

  try {
    payload = JSON.parse(rawText) as T & { message?: string };
  } catch {
    throw new HttpError(
      response.status || 500,
      `GitHub API returned non-JSON response: ${rawText.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    throw new HttpError(response.status, payload.message ?? "GitHub API request failed");
  }

  return payload as T;
}

function createHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "blog-admin/0.1",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function getContentFile(
  env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_BRANCH" | "GITHUB_TOKEN">,
  path: string,
) {
  const response = await fetch(buildContentsUrl(env, path), {
    headers: createHeaders(env.GITHUB_TOKEN),
  });
  const payload = await parseGitHubJson<{
    content: string;
    sha: string;
    path: string;
  }>(response);

  return {
    sha: payload.sha,
    path: payload.path,
    content: decodeBase64(payload.content.replace(/\n/g, "")),
  };
}

export async function listContentDir(
  env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_BRANCH" | "GITHUB_TOKEN">,
  path: string,
) {
  const response = await fetch(buildContentsUrl(env, path), {
    headers: createHeaders(env.GITHUB_TOKEN),
  });

  return parseGitHubJson<
    Array<{
      type: string;
      name: string;
      path: string;
    }>
  >(response);
}

export async function putContentFile(
  env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_BRANCH" | "GITHUB_TOKEN">,
  path: string,
  content: string,
  sha?: string,
) {
  const response = await fetch(buildContentsUrl(env, path), {
    method: "PUT",
    headers: createHeaders(env.GITHUB_TOKEN),
    body: JSON.stringify({
      message: `${sha ? "chore" : "feat"}(post): ${sha ? "update" : "create"} ${path}`,
      content: encodeBase64(content),
      branch: env.GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  const payload = await parseGitHubJson<{
    content: {
      sha: string;
    };
    commit?: {
      sha: string;
    };
  }>(response);

  return {
    sha: payload.content.sha,
    commitSha: payload.commit?.sha,
  };
}

export async function deleteContentFile(
  env: Pick<Env, "GITHUB_OWNER" | "GITHUB_REPO" | "GITHUB_BRANCH" | "GITHUB_TOKEN">,
  path: string,
  sha: string,
) {
  const response = await fetch(buildContentsUrl(env, path), {
    method: "DELETE",
    headers: createHeaders(env.GITHUB_TOKEN),
    body: JSON.stringify({
      message: `feat(post): delete ${path}`,
      sha,
      branch: env.GITHUB_BRANCH,
    }),
  });
  const payload = await parseGitHubJson<{
    commit: {
      sha: string;
    };
  }>(response);

  return {
    commitSha: payload.commit.sha,
  };
}
