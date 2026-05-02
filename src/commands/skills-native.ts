import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

type AgentConfig = {
  name: string;
  aliases: string[];
  detectDir: string;
  skillsDir: string;
};

type SkillEntry = {
  name: string;
  sourceDir: string;
};

export type NativeInstallOptions = {
  agent?: string;
  all?: boolean;
  global?: boolean;
};

const SKILLS_SUBDIR = "skills";

const AGENTS: AgentConfig[] = [
  {
    name: "claude-code",
    aliases: ["claude", "claude-code"],
    detectDir: ".claude",
    skillsDir: ".claude/skills",
  },
  {
    name: "codex",
    aliases: ["codex"],
    detectDir: ".codex",
    skillsDir: ".codex/skills",
  },
  {
    name: "cursor",
    aliases: ["cursor"],
    detectDir: ".cursor",
    skillsDir: ".cursor/skills",
  },
  {
    name: "windsurf",
    aliases: ["windsurf"],
    detectDir: ".windsurf",
    skillsDir: ".windsurf/skills",
  },
  {
    name: "opencode",
    aliases: ["opencode", "open-code"],
    detectDir: ".config/opencode",
    skillsDir: ".config/opencode/skills",
  },
  {
    name: "gemini-cli",
    aliases: ["gemini", "gemini-cli"],
    detectDir: ".gemini",
    skillsDir: ".gemini/skills",
  },
];

export async function installSkillsNative(
  repo: string,
  options: NativeInstallOptions = {}
) {
  const bundledSkillsDir = isBundledSkillsRepo(repo)
    ? resolveBundledSkillsDir()
    : null;

  if (bundledSkillsDir) {
    installFromSkillsDir(bundledSkillsDir, options);
    return;
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "bounty-skills-"));

  try {
    cloneRepo(repo, tempDir);
    const skillsDir = path.join(tempDir, SKILLS_SUBDIR);

    installFromSkillsDir(skillsDir, options, repo);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function installFromSkillsDir(
  skillsDir: string,
  options: NativeInstallOptions,
  sourceLabel = skillsDir
) {
  if (!existsSync(skillsDir)) {
    throw new Error(`No ${SKILLS_SUBDIR}/ directory found in ${sourceLabel}.`);
  }

  const skills = discoverSkills(skillsDir);
  if (skills.length === 0) {
    throw new Error(`No SKILL.md files found in ${sourceLabel}.`);
  }

  const agents = resolveTargetAgents(options);
  for (const agent of agents) {
    installForAgent(agent, skills, options);
  }
}

function isBundledSkillsRepo(repo: string) {
  return repo === "bounty-growth/cli";
}

function resolveBundledSkillsDir() {
  const entrypointDir = process.argv[1]
    ? path.dirname(path.resolve(process.argv[1]))
    : process.cwd();
  const candidates = [
    path.resolve(entrypointDir, "..", "skills"),
    path.resolve(entrypointDir, "skills"),
    path.resolve(process.cwd(), "skills"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function cloneRepo(repo: string, destination: string) {
  const repoUrl = normalizeRepoUrl(repo);

  try {
    execFileSync("git", ["clone", "--depth", "1", repoUrl, destination], {
      stdio: "ignore",
    });
    return;
  } catch {
    // Keep going to downloader fallback.
  }

  const tarball = path.join(destination, "repo.tar.gz");
  const tarballUrl = `https://api.github.com/repos/${repo}/tarball`;

  try {
    execFileSync("curl", ["-fsSL", "-o", tarball, "-L", tarballUrl], {
      stdio: "ignore",
    });
  } catch {
    throw new Error(
      "Unable to download Bounty skills. Install git or curl, or use the bundled Bounty CLI package."
    );
  }

  execFileSync(
    "tar",
    ["-xzf", tarball, "-C", destination, "--strip-components=1"],
    {
      stdio: "ignore",
    }
  );
}

function normalizeRepoUrl(repo: string) {
  if (
    repo.startsWith("https://") ||
    repo.startsWith("git@") ||
    repo.startsWith("ssh://")
  ) {
    return repo;
  }

  return `https://github.com/${repo}.git`;
}

function discoverSkills(baseDir: string): SkillEntry[] {
  const skills: SkillEntry[] = [];

  for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    const sourceDir = path.join(baseDir, entry.name);
    const skillPath = path.join(sourceDir, "SKILL.md");

    if (!existsSync(skillPath)) {
      continue;
    }

    const frontmatter = parseFrontmatter(readFileSync(skillPath, "utf8"));
    if (!frontmatter.name || !frontmatter.description) {
      continue;
    }

    skills.push({
      name: sanitizeName(frontmatter.name),
      sourceDir,
    });
  }

  return skills;
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const values: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.+)$/);
    if (!kv) {
      continue;
    }

    values[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }

  return values;
}

function resolveTargetAgents(options: NativeInstallOptions) {
  if (options.agent) {
    const agent = AGENTS.find(
      (candidate) =>
        candidate.name === options.agent ||
        candidate.aliases.includes(options.agent!)
    );

    if (!agent) {
      throw new Error(`Unsupported agent "${options.agent}".`);
    }

    return [agent];
  }

  const detected = AGENTS.filter((agent) =>
    existsSync(path.join(getInstallRoot(options), agent.detectDir))
  );

  if (detected.length === 0) {
    throw new Error(
      `No supported AI agent config directories were detected ${options.global ? "globally" : "in this project"}. Re-run with \`--agent codex\`, \`--agent claude-code\`, or another supported agent.`
    );
  }

  if (options.all) {
    return detected;
  }

  if (detected.length === 1) {
    return detected;
  }

  throw new Error(
    `Multiple supported AI agents were detected ${options.global ? "globally" : "in this project"}. Re-run with \`--agent <agent>\` to choose one, or pass \`--all\` explicitly.`
  );
}

function installForAgent(
  agent: AgentConfig,
  skills: SkillEntry[],
  options: NativeInstallOptions
) {
  const skillsDir = path.join(getInstallRoot(options), agent.skillsDir);
  mkdirSync(skillsDir, { recursive: true });

  for (const skill of skills) {
    cpSync(skill.sourceDir, path.join(skillsDir, skill.name), {
      recursive: true,
      force: true,
      filter: (source) => !path.basename(source).startsWith("."),
    });
  }
}

function getInstallRoot(options: NativeInstallOptions) {
  return options.global ? homedir() : process.cwd();
}

function sanitizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}
