# n8n-nodes-msfrog

Use MSFrog inside n8n to create and manage workflow entries, steps, comments, and tasks.

This package provides an n8n community node for teams that want to automate support and operational workflows against the MSFrog API.

## What You Can Do

- Create and update workflow entries
- Fetch and update workflow steps
- Complete or un-complete steps and tasks
- Create, update, and delete comments
- Get current user context

## Installation

### Option 1: Install from npm (recommended)

Inside your n8n environment, install:

```bash
npm install n8n-nodes-msfrog
```

Then restart n8n.

### Option 2: Install as a community node from n8n UI

1. Open n8n.
2. Go to **Settings -> Community Nodes**.
3. Click **Install**.
4. Enter package name: `n8n-nodes-msfrog`.
5. Confirm installation.

## Credentials Setup

Create a new credential in n8n:

1. Go to **Credentials -> New**.
2. Search for **MSFrog API**.
3. Fill in:
   - **Base URL**: your MSFrog backend URL (no trailing slash), for example `https://api.your-domain.com`
   - **Access Token**: a valid MSFrog bearer token (raw token only, no `Bearer ` prefix)
4. Save the credential.

If n8n runs in Docker and your MSFrog backend runs on your host machine, use `host.docker.internal` instead of `localhost`.

## Available Resources

- Workflow
- Workflow Entry
- Task
- User
- Company

## Quick Start

1. Add an **MSFrog** node to your workflow.
2. Select your saved **MSFrog API** credential.
3. (Optional) Set **Base URL Override** on the node only if you need this node to call a different MSFrog host than the credential.
4. Choose the resource and operation you need.
5. Execute the node to confirm connectivity.

A good first test is:

- Resource: **User**
- Operation: **Get Self**

If that returns your authenticated user, your credentials are working.

## Example Workflows

Sample workflows are available in the `examples/` folder:

- `client-email-triage-sample.workflow.json`
- `client-email-triage-gmail-inbox.workflow.json`

Import one into n8n and replace credentials with your own.

## Compatibility

- Node.js: `>=20`
- n8n: community-node compatible versions

## Support

- Report issues: https://github.com/LukeDes003/n8n-nodes-msfrog/issues
- Repository: https://github.com/LukeDes003/n8n-nodes-msfrog

## Developer Documentation

Developer and local Docker extension setup notes are in `dev-readme.md`.
