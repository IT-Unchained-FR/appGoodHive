# Fork Sync Automation Setup

This workflow automatically syncs the main branch to the forked repository at `IT-Unchained-FR/appGoodHive` whenever changes are pushed to the main branch.

## Setup Instructions

### 1. Create a GitHub Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Fork Sync Token"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### 2. Add Token as Repository Secret

1. Go to your repository: `https://github.com/GoodHive/app`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FORK_SYNC_TOKEN`
5. Value: Paste your PAT token
6. Click **Add secret**

### 3. Verify Workflow

The workflow will automatically run on every push to the `main` branch. You can:

- Check workflow runs: **Actions** tab → **Sync Fork Repository**
- Verify sync: Check `https://github.com/IT-Unchained-FR/appGoodHive/tree/main`

## How It Works

1. When code is pushed to `main` branch, the workflow triggers
2. It checks out the latest code
3. Adds the forked repository as a remote
4. Pushes the changes to `IT-Unchained-FR/appGoodHive` main branch
5. Uses `force-with-lease` for safety (prevents overwriting uncommitted changes)

## Troubleshooting

- **Permission denied**: Make sure the PAT has `repo` scope and access to `IT-Unchained-FR/appGoodHive`
- **Workflow not running**: Check that the secret `FORK_SYNC_TOKEN` is set correctly
- **Sync failed**: Check the Actions tab for error details

## Security Note

The PAT token should have minimal required permissions. If you have access to create a GitHub App with specific repository access, that would be more secure than a PAT.

