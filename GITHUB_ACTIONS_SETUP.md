# GitHub Actions Setup Guide

## 🚨 Issue: Private Repository Access

The build workflow needs to access the **private** `docusafely_core` repository. GitHub Actions requires authentication to clone private repositories.

---

## ✅ Solution: Personal Access Token (PAT)

### Step 1: Create a Personal Access Token

1. Go to **GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Direct link: https://github.com/settings/tokens

2. Click **"Generate new token"** → **"Generate new token (classic)"**

3. Configure the token:
   - **Note:** `GitHub Actions - DocuSafely Build`
   - **Expiration:** `90 days` (or choose custom)
   - **Select scopes:**
     - ✅ `repo` (Full control of private repositories)
       - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events

4. Click **"Generate token"**

5. **⚠️ IMPORTANT:** Copy the token immediately (you won't see it again)
   - Token format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### Step 2: Add Token to Repository Secrets

1. Go to your **docusafely_desktop** repository on GitHub

2. Click **Settings** → **Secrets and variables** → **Actions**
   - Direct link: https://github.com/hielf/docusafely_desktop/settings/secrets/actions

3. Click **"New repository secret"**

4. Add the secret:
   - **Name:** `PAT_TOKEN`
   - **Secret:** Paste the token you copied
   - Click **"Add secret"**

---

### Step 3: Verify Workflow

1. Push any change to trigger the workflow:
   ```bash
   git commit --allow-empty -m "Test workflow with PAT"
   git push origin master
   ```

2. Check Actions tab:
   - https://github.com/hielf/docusafely_desktop/actions

3. The workflow should now successfully checkout `docusafely_core`!

---

## 🔒 Alternative Solution: Make Repository Public

If you're okay with the backend code being public:

1. Go to https://github.com/hielf/docusafely_core/settings

2. Scroll to **"Danger Zone"**

3. Click **"Change repository visibility"** → **"Make public"**

4. **No PAT token needed** - workflow will work automatically

---

## 🔄 Current Workflow Behavior

The workflow is configured to:

```yaml
token: ${{ secrets.PAT_TOKEN || github.token }}
```

This means:
1. **If `PAT_TOKEN` exists** → Uses your PAT (works for private repos)
2. **If `PAT_TOKEN` doesn't exist** → Falls back to default `github.token` (only works for public repos)

---

## 🎯 Token Permissions Required

Your PAT needs these permissions to work:

| Permission | Required | Why |
|------------|----------|-----|
| **repo** | ✅ Yes | Clone private repository |
| repo:status | ✅ Included | Check commit status |
| repo_deployment | ⚠️ Optional | Deploy workflows |
| public_repo | ✅ Included | Access public repos |
| security_events | ⚠️ Optional | Security scanning |

---

## ⏰ Token Expiration

PATs expire! When your token expires:

1. You'll see the same "Not Found" error in Actions
2. Generate a new token (same steps as above)
3. Update the `PAT_TOKEN` secret with the new value

**Tip:** Set a calendar reminder before expiration!

---

## 🔐 Security Best Practices

### ✅ DO:
- Use tokens with minimal required permissions
- Set reasonable expiration dates (90 days recommended)
- Rotate tokens regularly
- Use repository secrets (never commit tokens to code)
- Delete old tokens you're not using

### ❌ DON'T:
- Share your token with anyone
- Commit tokens to repository
- Use tokens with broader permissions than needed
- Create tokens that never expire
- Reuse the same token for multiple purposes

---

## 🐛 Troubleshooting

### Error: "Not Found - https://docs.github.com/rest/repos/repos#get-a-repository"

**Cause:** Workflow can't access private `docusafely_core` repository

**Solutions:**
1. ✅ Add `PAT_TOKEN` secret (recommended)
2. ✅ Make `docusafely_core` public
3. ✅ Use git submodules instead

---

### Error: "Resource not accessible by integration"

**Cause:** Token doesn't have `repo` permission

**Solution:** Regenerate token with full `repo` scope

---

### Error: "Bad credentials"

**Cause:** Token is invalid or expired

**Solution:**
1. Check token hasn't expired
2. Regenerate and update secret
3. Verify token is correctly copied (no extra spaces)

---

### Workflow still fails after adding token

**Checklist:**
- ✅ Secret name is exactly `PAT_TOKEN` (case-sensitive)
- ✅ Token has `repo` permission
- ✅ Token hasn't expired
- ✅ You pushed changes after adding secret
- ✅ Repository names are correct in workflow

---

## 📖 Related Documentation

- **GitHub: Creating a PAT**
  https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

- **GitHub: Using secrets in Actions**
  https://docs.github.com/en/actions/security-guides/encrypted-secrets

- **Workflow file:**
  `.github/workflows/build-all-platforms.yml`

---

## 🚀 Quick Setup (Copy-Paste Commands)

```bash
# 1. Generate PAT at:
# https://github.com/settings/tokens

# 2. Add secret at:
# https://github.com/hielf/docusafely_desktop/settings/secrets/actions
# Name: PAT_TOKEN
# Value: ghp_your_token_here

# 3. Test workflow:
cd docusafely_desktop
git commit --allow-empty -m "Test Actions with PAT"
git push origin master

# 4. Check status:
# https://github.com/hielf/docusafely_desktop/actions
```

---

## ✨ After Setup

Once configured, the workflow will:

1. ✅ Build Windows backend (`processor.exe`)
2. ✅ Build macOS backend (`processor`)
3. ✅ Build Linux backend (`processor`)
4. ✅ Package desktop apps for all platforms
5. ✅ Upload artifacts for download

All automatically on every push! 🎉

---

## 📞 Need Help?

If you're still having issues:

1. Check the Actions logs for specific errors
2. Verify all secrets are set correctly
3. Try the test commands above
4. Consider using git submodules as alternative

**The workflow file is already configured - you just need to add the `PAT_TOKEN` secret!**

