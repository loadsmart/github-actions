const core = require("@actions/core");
const github = require("@actions/github");

const { IncomingWebhook } = require("@slack/webhook");

const buildNotification = ({ title, date, author, body, pr }) => ({
  blocks: [
    {
      type: "section",
      text: {
        type: "plain_text",
        emoji: true,
        text:
          "Hello, everyone! :wave:\n There's a new post for you to review. Would you help us out? :tada:",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Platform:* Blog :pencil:",
        },
        {
          type: "mrkdwn",
          text: `*Date:* ${date}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Author:* ${author}`,
        },
        {
          type: "mrkdwn",
          text: `*Title:* ${title}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: body.slice(0, 150) + "...",
      },
    },
    {
      type: "divider",
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `*PR:* ${pr.html_url}`,
        },
      ],
    },
  ],
});

async function run() {
  try {
    const title = core.getInput("title");
    const author = core.getInput("author");
    const date = core.getInput("date");
    const body = core.getInput("body");

    if (title === "" || title === undefined || title === null) {
      console.info("No blog posts found in this PR. Skipping.");
      return;
    }

    const url = process.env.SLACK_WEBHOOK_URL;
    const webhook = new IncomingWebhook(url);

    console.info("Sending notification to Slack...");

    const args = {
      title,
      author,
      date,
      body,
      pr: github.context.payload.pull_request,
    };
    const notification = buildNotification(args);
    console.info(
      "Notification args:",
      JSON.stringify(notification, undefined, 2)
    );

    await webhook.send(notification);
    console.info("Notification sent!");
  } catch (error) {
    console.info("Error sending notification:");
    core.setFailed(error.message);
  }
}

run();
