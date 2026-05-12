import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { homedir } from "node:os";
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

export async function installSkillsNative(options: NativeInstallOptions = {}) {
  const bundledSkillsDir = resolveBundledSkillsDir();

  if (!bundledSkillsDir) {
    throw new Error(
      "No bundled Bounty skills directory found in this CLI package."
    );
  }

  installFromSkillsDir(bundledSkillsDir, options);
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

function resolveBundledSkillsDir() {
  const entrypointDir = process.argv[1]
    ? path.dirname(path.resolve(process.argv[1]))
    : process.cwd();
  const candidates = [
    path.resolve(entrypointDir, "..", "skills"),
    path.resolve(entrypointDir, "skills"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
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
