# Assign RFC Reviewer

This GitHub Action looks for keywords in the RFC's and, based on them, assigns squads as reviewers of the pull request. It aims to reduce the gap between the RFC writer and the code owners.

The keywords should be defined in a file in the following format. This action expects the file path as an input.

```yaml
teams:
  - github_slug: top-gear
    keywords:
      - tracking
      - tasks
      - driver
  
  - github_slug: financial-operations
    keywords:
      - invoice
      - line of credit
      - payment

```

This GitHub Action used this [GitHub App](https://github.com/organizations/loadsmart/settings/apps/rfc-reviewers) for authentication purposes.