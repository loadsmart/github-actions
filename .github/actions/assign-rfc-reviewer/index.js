const core = require("@actions/core");
const fs = require("fs");
const github = require("@actions/github");
const yaml = require("js-yaml");

const { Octokit } = require("@octokit/action");

function getKeywords() {
  const keywordsFileName = core.getInput("keywords-file");
  return yaml.load(fs.readFileSync(keywordsFileName, "utf8"));
}

async function getRFCFile() {
  const octokit = new Octokit();
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
  return rstFile.patch.toLowerCase();
}

async function lookForKeywords(keywords, rfcFileContent) {
  const octokit = new Octokit();
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const pull_number = github.context.payload.pull_request.number;

  keywords.teams.forEach(async (team) => {
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
    const keywords = getKeywords();
    const rfcFileContent = await getRFCFile();
    await lookForKeywords(keywords, rfcFileContent);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
