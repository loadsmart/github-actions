const core = require("@actions/core");
const fs = require("fs");
const github = require("@actions/github");
const yaml = require("js-yaml");

const { Octokit } = require("@octokit/action");
const { createAppAuth } = require("@octokit/auth-app");

function createOctokit() {
  const privateKeyBase64 = core.getInput("git-hub-app-private-key");
  const buff = Buffer.from(privateKeyBase64, "base64");
  const privateKey = buff.toString("utf-8");

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: core.getInput("git-hub-app-id"),
      privateKey,
      installationId: core.getInput("git-hub-app-installation-id"),
    },
  });
}

function getKeywords() {
  const keywordsFileName = core.getInput("keywords-file");
  return yaml.load(fs.readFileSync(keywordsFileName, "utf8"));
}

async function getRFCFile(octokit) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const pull_number = github.context.payload.pull_request.number;

  const filesResponse = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    {
      owner,
      repo,
      pull_number,
    }
  );

  const rstFile = filesResponse.data.find((file) =>
    file.filename.endsWith(".rst")
  );
  return rstFile && rstFile.patch.toLowerCase();
}

async function lookForKeywords(octokit, keywords, rfcFileContent) {
  if (!rfcFileContent) return;

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const pull_number = github.context.payload.pull_request.number;

  const currentReviewersResponse = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
    {
      owner,
      repo,
      pull_number,
    }
  );
  const currentTeamReviewerSlugs = currentReviewersResponse.data.teams.map((t) => t.slug)

  keywords.teams.forEach(async (team) => {
    if (currentTeamReviewerSlugs.includes(team.slug)) return;

    const keywordFound = team.keywords.some(
      (keyword) => rfcFileContent.indexOf(keyword) > -1
    );

    if (!keywordFound) return;

    await octokit.request(
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
      {
        owner,
        repo,
        pull_number,
        team_reviewers: [team.github_slug],
      }
    );
  });
}

async function run() {
  try {
    const octokit = createOctokit();
    const keywords = getKeywords();
    const rfcFileContent = await getRFCFile(octokit);
    await lookForKeywords(octokit, keywords, rfcFileContent);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
