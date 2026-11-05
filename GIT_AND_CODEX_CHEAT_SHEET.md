# Git and Codex cheat sheet

## Where things stand

This project folder already has a local Git repository on branch `main`, but it has no commits, project files, or GitHub remote yet. Git can track changes on this computer now; GitHub will provide an off-device copy once you create an account and connect a repository.

## One-time setup

1. Create a free account at [github.com](https://github.com/) and verify your email.
2. In GitHub, choose **New repository**. Name it something like `puzzle-game`. Choose **Private** if you want it visible only to you. Leave the options to add a README, `.gitignore`, or license unchecked because this local folder is already initialized.
3. On the new repository page, copy its HTTPS address. It looks like `https://github.com/YOUR-USERNAME/puzzle-game.git`.
4. In Codex, open this project folder. In its terminal, connect the address (replace the example with your copied address):

   ```sh
   git remote add origin https://github.com/YOUR-USERNAME/puzzle-game.git
   git remote -v
   ```

5. When Git asks you to sign in, follow the browser/credential-manager prompt. GitHub does not accept your account password as a Git HTTPS password. If prompted for a token, use GitHub's browser sign-in or GitHub Desktop's sign-in flow rather than sharing a token in chat.
6. After you have at least one commit, send it to GitHub with:

   ```sh
   git push -u origin main
   ```

If you prefer buttons to terminal commands, install **GitHub Desktop**, sign in, use **File → Add Local Repository**, select this project folder, then **Publish repository**. You can choose private there too. The same local Git history is used either way.

## The regular save routine

Git commits are named checkpoints on this computer. `push` copies those checkpoints to GitHub as an off-device backup. Do both regularly:

```sh
git status
git add .
git commit -m "Describe the change"
git push
```

Use a specific message, for example `Add Sudoku difficulty selection`. Run `git status` first so you can see what will be included. `git add .` stages all changed and new files in this project; review the list before committing, and avoid adding passwords, API keys, or private files.

## Commands to keep handy

| Command | What it does |
|---|---|
| `git status` | Shows changed files and current branch. |
| `git diff` | Shows edits not yet staged. |
| `git diff --staged` | Shows exactly what the next commit will contain. |
| `git add path/to/file` | Stages one file. |
| `git add .` | Stages all project changes. |
| `git commit -m "Message"` | Saves a local checkpoint. |
| `git push` | Uploads committed checkpoints to GitHub. |
| `git pull` | Downloads and combines updates from GitHub. Do this before work if you edited the project elsewhere. |
| `git log --oneline` | Lists recent checkpoints. |
| `git remote -v` | Shows connected GitHub addresses. |
| `git switch -c feature/name` | Starts a separate branch for a larger feature. |
| `git switch main` | Returns to the main branch. |

## A safe Codex routine

1. Start with `git status` and, if you work across devices, `git pull`.
2. Ask Codex for one clear change at a time. For example: “Add Sudoku difficulty selection. Keep the current visual style and explain the files you changed.”
3. Review the changes in Codex's diff view. Ask Codex to explain anything unclear or revise it before saving.
4. Run the app and try the changed flow yourself. Ask Codex to run checks when you want automated verification.
5. Save a checkpoint with the regular save routine above. Push to GitHub so a copy is stored online.

For risky or larger changes, create a branch first with `git switch -c feature/short-name`. When it is ready, review it, then merge it into `main` using GitHub's pull request flow or Git commands. Keep `main` as the known-good version.

## If something goes wrong

- `git status` is the first diagnostic; it shows your current branch and uncommitted work.
- If a push is rejected because GitHub has newer changes, run `git pull`, resolve any conflicts with Codex's help, then commit and push again.
- Avoid `git reset --hard`, `git clean`, and deleting `.git`: they can permanently discard work or history.
- A GitHub push is a useful off-device copy, but it is not a substitute for keeping important private assets backed up securely.
