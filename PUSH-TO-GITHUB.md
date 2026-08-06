# Pushing this to GitHub

The repo is committed and ready. I could not push it myself — the GitHub
connector is not authorized in my session, and I cannot run the sign-in flow.

## One-time setup

Authorize GitHub first (claude.ai connector settings, or `gh auth login`
in your terminal), then from this folder:

```bash
cd ~/greenhollow
gh repo create greenhollow --public --source=. --push
```

## To play it online

A GitHub repo shows source, not a running game. Enable Pages:

Repo → Settings → Pages → Source: "Deploy from a branch" → `main` / `root`

Your play URL then becomes:

```
https://<your-github-username>.github.io/greenhollow/greenhollow-homestead.html
```

Pages serves it from a normal origin, so browser storage works and your
farm survives a refresh.

## Later updates

```bash
cd ~/greenhollow && git add -A && git commit -m "..." && git push
```
