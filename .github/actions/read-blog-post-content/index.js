const core = require("@actions/core");
const github = require("@actions/github");
const { Octokit } = require("@octokit/action");

async function run() {
  try {
    const octokit = new Octokit();
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const pull_number = github.context.payload.pull_request.number;

    const filesResponse = await octokit.request(
      "GET /repos/:owner/:repo/pulls/:pull_number/files",
      {
        owner,
        repo,
        pull_number,
      }
    );

    const possiblePostFiles = filesResponse.data.filter((file) =>
      file.filename.match("content/posts/.+/index.md")
    );

    if (possiblePostFiles.length === 0) {
      console.info("No posts found. Skipping");
      return;
    }

    if (possiblePostFiles.length > 1) {
      core.setFailed("You're supposed to send only 1 post per pull request.");
      return;
    }

    const fileResponse = await octokit.request(possiblePostFiles[0].raw_url);
    const content = fileResponse.data;
    console.log("content:\n", content, "\n\n\n");
    const matches = content.match("---[\\w\\W\\s]+---");
    console.log("matches: \n", matches[0]);

    const header = matches[0].replace(/---/g, "").trim();
    console.info("header:\n", header, "\n\n\n");
    const properties = header.split("\n");

    console.log("properties: ", properties);

    const metadata = properties.reduce((acc, property) => {
      console.info("prop: ", property);
      const parts = property.split(":");
      const key = parts[0];
      const value = parts[1];
      acc[key] = value;
    }, {});
    console.info("metadata", metadata);

    const body = content.replace(header, "");

    console.info("Blog post found:", body);

    core.setOutput("title", metadata.title);
    core.setOutput("author", metadata.author);
    core.setOutput("date", metadata.date);
    core.setOutput("body", content);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
