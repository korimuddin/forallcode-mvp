export const learnTracks = [
  { id: 'beginner', track: 1, title: 'Beginner', subtitle: 'New to Git', color: '#9b8fd4' },
  { id: 'intermediate', track: 2, title: 'Intermediate', subtitle: 'Getting Comfortable', color: '#7aaa72' },
  { id: 'advanced', track: 3, title: 'Advanced', subtitle: 'Going Further', color: '#6aa8d4' }
];

export const learnLessons = [
  {
    "slug": "branching",
    "track": 1,
    "title": "Branching",
    "tag": "beginner",
    "description": "Branches let you try ideas without disturbing your main line of work. They are safe little side roads for experiments, fixes, and features.",
    "steps": [
      {
        "title": "Start from main",
        "body": "Begin from the stable branch so your new work has a clean foundation."
      },
      {
        "title": "Create a new branch",
        "body": "Give the branch a short name that describes the change you are making."
      },
      {
        "title": "Make a focused change",
        "body": "Keep the branch small so it is easier to understand, review, and merge."
      },
      {
        "title": "Compare your work",
        "body": "Before merging, compare your branch against main to see exactly what changed."
      }
    ]
  },
  {
    "slug": "merging",
    "track": 1,
    "title": "Merging",
    "tag": "beginner",
    "description": "Merging brings finished branch work back into the main project history. It is how separate lines of work become one shared story again.",
    "steps": [
      {
        "title": "Review both branches",
        "body": "Check what changed on your branch and what changed on the branch you are merging into."
      },
      {
        "title": "Bring changes together",
        "body": "Run the merge so Git combines both lines of work."
      },
      {
        "title": "Resolve the merge",
        "body": "If Git needs help, choose the final version of any conflicting files."
      },
      {
        "title": "Check the result",
        "body": "Run the project and review the history before sharing the merged work."
      }
    ]
  },
  {
    "slug": "forking",
    "track": 1,
    "title": "Forking",
    "tag": "beginner",
    "description": "A fork is your own copy of someone else’s project. It lets you experiment freely before sending improvements back.",
    "steps": [
      {
        "title": "Find the upstream project",
        "body": "Start with the original repository you want to learn from or contribute to."
      },
      {
        "title": "Create your fork",
        "body": "Copy the project into your own account so you can make changes safely."
      },
      {
        "title": "Clone your copy",
        "body": "Download your fork to your computer and work on a branch."
      },
      {
        "title": "Send improvements back",
        "body": "Open a pull request when your change is ready for review."
      }
    ]
  },
  {
    "slug": "commits",
    "track": 1,
    "title": "Commits",
    "tag": "beginner",
    "description": "Commits are meaningful checkpoints in your project. Each one records what changed and why it matters.",
    "steps": [
      {
        "title": "Stage the right files",
        "body": "Choose exactly which changes belong in this checkpoint."
      },
      {
        "title": "Describe the change",
        "body": "Write a short message that explains the purpose of the commit."
      },
      {
        "title": "Create the checkpoint",
        "body": "Commit the staged changes so Git records them permanently."
      },
      {
        "title": "Review the timeline",
        "body": "Use the history to understand how the project evolved."
      }
    ]
  },
  {
    "slug": "gitignore",
    "track": 1,
    "title": "Gitignore",
    "tag": "beginner",
    "description": "A .gitignore file keeps generated files, secrets, and local clutter out of your repository.",
    "steps": [
      {
        "title": "Spot noisy files",
        "body": "Look for build output, logs, dependencies, and local environment files."
      },
      {
        "title": "Write ignore rules",
        "body": "Add patterns for files Git should leave alone."
      },
      {
        "title": "Check ignored paths",
        "body": "Confirm the right files are ignored before committing."
      },
      {
        "title": "Commit the clean list",
        "body": "Share the ignore rules so everyone gets the same clean workspace."
      }
    ]
  },
  {
    "slug": "commit-messages",
    "track": 1,
    "title": "Writing Good Commit Messages",
    "tag": "beginner",
    "description": "A good commit message leaves a clear trail for future readers. It explains the intent behind the change, not just the files touched.",
    "steps": [
      {
        "title": "Name the intent",
        "body": "Use the first line to say what the commit does."
      },
      {
        "title": "Add useful context",
        "body": "Use the body when the reason needs more explanation."
      },
      {
        "title": "Keep it readable",
        "body": "Prefer simple, direct language over vague notes like update or fixes."
      },
      {
        "title": "Help future readers",
        "body": "Write the message you would want to find when debugging later."
      }
    ]
  },
  {
    "slug": "licences",
    "track": 1,
    "title": "Licences Explained Simply",
    "tag": "beginner",
    "description": "A licence tells others how they can use, share, and modify your work. Adding one removes uncertainty for future contributors.",
    "steps": [
      {
        "title": "Compare permissions",
        "body": "Look at what each common licence allows and requires."
      },
      {
        "title": "Pick a licence",
        "body": "Choose one that matches how open you want the project to be."
      },
      {
        "title": "Add it to the repo",
        "body": "Place the licence text in a LICENSE file at the root."
      },
      {
        "title": "Make terms visible",
        "body": "Mention the licence in your README so visitors understand it quickly."
      }
    ]
  },
  {
    "slug": "branching-strategies",
    "track": 2,
    "title": "Branching Strategies",
    "tag": "intermediate",
    "description": "Most teams follow a branching strategy — a shared agreement about how branches are named, used, and merged. The three most common are Git Flow, GitHub Flow, and trunk-based development. Each makes different tradeoffs between stability and speed.",
    "steps": [
      {
        "title": "Git Flow",
        "body": "Uses long-lived branches: main, develop, feature, release, and hotfix. Suits projects with scheduled releases and multiple versions in production simultaneously."
      },
      {
        "title": "GitHub Flow",
        "body": "Simpler — just main and short-lived feature branches. Merge via pull request, deploy immediately. Suits teams shipping continuously to a single production environment."
      },
      {
        "title": "Trunk-based development",
        "body": "Everyone commits to main (the trunk) frequently, using feature flags to hide unfinished work. Requires strong automated testing. Suits mature teams with high deployment frequency."
      },
      {
        "title": "Choosing the right one",
        "body": "GitHub Flow is the right default for most small teams. Git Flow adds overhead that only pays off when you genuinely need to manage multiple release versions at once."
      }
    ]
  },
  {
    "slug": "merging-vs-rebasing",
    "track": 2,
    "title": "Merging vs Rebasing",
    "tag": "intermediate",
    "description": "Both merging and rebasing combine work from two branches — but they produce different histories. Merging preserves the full truth of what happened. Rebasing rewrites history to make it look linear. Understanding the tradeoff helps you choose the right tool for each situation.",
    "steps": [
      {
        "title": "What merging does",
        "body": "Creates a merge commit that joins two branch tips. The history shows exactly when branches diverged and when they came back together. Safe to use on shared branches."
      },
      {
        "title": "What rebasing does",
        "body": "Replays your commits on top of the target branch, rewriting each commit hash. Produces a clean linear history with no merge commits. Only safe on branches nobody else is working on."
      },
      {
        "title": "The golden rule",
        "body": "Never rebase a branch that has been pushed and shared with others. Rewriting shared history forces everyone else to do complex recovery work."
      },
      {
        "title": "When to use each",
        "body": "Rebase your local feature branch before opening a PR — it keeps the PR diff clean. Merge when closing PRs into main — it preserves the record of when features landed."
      }
    ]
  },
  {
    "slug": "resolving-merge-conflicts",
    "track": 2,
    "title": "Resolving Merge Conflicts",
    "tag": "intermediate",
    "description": "A merge conflict happens when two branches change the same part of the same file in different ways. Git cannot decide which version to keep — so it pauses the merge and asks you to resolve it manually. Conflicts sound scary but follow a clear pattern once you know what to look for.",
    "steps": [
      {
        "title": "How to read a conflict",
        "body": "Git marks the conflicting section with <<<<<<< HEAD (your changes), ======= (the divider), and >>>>>>> branch-name (incoming changes). Everything between these markers needs a human decision."
      },
      {
        "title": "Resolving it",
        "body": "Edit the file to keep what you want — your version, their version, or a combination of both. Delete all the conflict markers (<<<, ===, >>>). Save the file."
      },
      {
        "title": "Complete the merge",
        "body": "Stage the resolved file with git add, then run git commit to complete the merge. Git already knows it was in a conflict state — the commit message will say so automatically."
      },
      {
        "title": "Preventing conflicts",
        "body": "Merge or rebase from main frequently so your branch does not drift far. Small, focused branches with short lifetimes create far fewer conflicts than large long-running ones."
      }
    ]
  },
  {
    "slug": "pull-request-best-practices",
    "track": 2,
    "title": "Pull Request Best Practices",
    "tag": "intermediate",
    "description": "A pull request is not just a code submission — it is a conversation. How you write a PR determines how quickly it gets reviewed, how useful the feedback is, and whether the change lands cleanly. Good PRs are small, focused, and explain themselves.",
    "steps": [
      {
        "title": "Keep it small",
        "body": "A PR that changes 50 lines gets reviewed in minutes. A PR that changes 500 lines gets rubber-stamped or blocked for days. One PR, one purpose."
      },
      {
        "title": "Write a useful description",
        "body": "Explain what changed, why it changed, and how to test it. Link to the issue it solves. Include a screenshot if there is anything visual. The reviewer should not have to ask basic questions."
      },
      {
        "title": "Make it easy to review",
        "body": "Leave your own review comments on confusing sections before asking for a review. Label the PR clearly. If it is not ready, mark it as a draft."
      },
      {
        "title": "Respond and iterate",
        "body": "Treat review feedback as collaboration, not criticism. Respond to every comment — either making the change or explaining why you are not. Push updates to the same branch; they appear in the PR automatically."
      }
    ]
  },
  {
    "slug": "code-review",
    "track": 2,
    "title": "Code Review — Giving and Receiving",
    "tag": "intermediate",
    "description": "Code review is a skill separate from coding. Giving useful reviews and receiving feedback gracefully are both learnable. Done well, review improves the code, spreads knowledge across the team, and catches problems before they reach production.",
    "steps": [
      {
        "title": "Giving a good review",
        "body": "Be specific and kind. Comment on the code, never the person. Ask questions rather than making demands — \"what happens if the list is empty?\" beats \"you forgot to handle empty lists\"."
      },
      {
        "title": "Separating nitpicks from blockers",
        "body": "Not every comment is equal. Prefix nitpicks so the author knows they are optional: \"nit: you could simplify this with map()\". Reserve blocking comments for genuine problems."
      },
      {
        "title": "Receiving feedback",
        "body": "Read every comment charitably — assume good intent. If a comment is unclear, ask for clarification before defending your choice. Disagreements are fine; stay curious rather than defensive."
      },
      {
        "title": "Approving and merging",
        "body": "Only approve work you have actually read and understood. A rubber-stamp approval helps nobody. If you are not sure, say so — asking questions is a valid form of review."
      }
    ]
  },
  {
    "slug": "stashing",
    "track": 2,
    "title": "Stashing Changes",
    "tag": "intermediate",
    "description": "Stash is Git's way of letting you save work in progress without making a commit. It is a temporary shelf for changes you are not ready to commit — useful when you need to switch context quickly.",
    "steps": [
      {
        "title": "git stash",
        "body": "Saves all your uncommitted changes and reverts the working directory to the last commit. You can now switch branches or pull updates without your unfinished work getting in the way."
      },
      {
        "title": "git stash pop",
        "body": "Reapplies the most recent stash and removes it from the stash list. If there is a conflict, Git will flag it just like a merge conflict."
      },
      {
        "title": "Managing multiple stashes",
        "body": "git stash list shows all your stashes. git stash apply stash@{2} applies a specific one without removing it. git stash drop stash@{0} removes one you no longer need."
      },
      {
        "title": "Stash is not a substitute for branches",
        "body": "For anything longer than a few minutes, create a branch instead. Stash is for quick context switches — it is not meant to hold work for days."
      }
    ]
  },
  {
    "slug": "git-history-blame",
    "track": 2,
    "title": "Git History and Blame",
    "tag": "intermediate",
    "description": "Git keeps a complete record of every change ever made to a repository. Knowing how to read that history — and how to find out who changed what and when — is essential for understanding a codebase and debugging problems.",
    "steps": [
      {
        "title": "git log",
        "body": "Shows the commit history. git log --oneline gives a compact view. git log --graph shows branches visually. git log --author=\"name\" filters by author. Add a filename to see only commits that touched that file."
      },
      {
        "title": "git show",
        "body": "Shows the full diff of a specific commit. git show abc1234 reveals exactly what changed, who changed it, and the commit message. Essential for understanding what a specific change actually did."
      },
      {
        "title": "git blame",
        "body": "Shows which commit last modified each line of a file, with the author and date. Despite the name, it is a neutral tool — useful for understanding context, not assigning fault."
      },
      {
        "title": "Reading history as a skill",
        "body": "The commit history is documentation. A well-maintained history with clear messages tells the story of why the code is the way it is. Get comfortable reading it — it is one of the most useful debugging tools available."
      }
    ]
  },
  {
    "slug": "undoing-mistakes",
    "track": 2,
    "title": "Undoing Mistakes",
    "tag": "intermediate",
    "description": "Git gives you multiple ways to undo changes, each with different effects on history. Choosing the right undo tool depends on whether the mistake has been committed, whether it has been pushed, and whether other people have already seen it.",
    "steps": [
      {
        "title": "git restore — undo uncommitted changes",
        "body": "Discards changes in your working directory that have not been staged or committed. git restore filename. Permanent — the changes are gone. Only use when you are sure you do not need them."
      },
      {
        "title": "git reset — move the branch pointer",
        "body": "git reset --soft HEAD~1 undoes the last commit but keeps the changes staged. git reset --hard HEAD~1 undoes the commit and discards the changes entirely. Only use on commits that have not been pushed."
      },
      {
        "title": "git revert — safe undo for shared history",
        "body": "Creates a new commit that undoes the changes from a previous commit. The original commit stays in the history. This is the safe option for commits that have already been pushed — it does not rewrite history."
      },
      {
        "title": "Recovering the unrecoverable",
        "body": "git reflog is your last resort. It records every position HEAD has been — even after a hard reset. If you think you have lost work permanently, check the reflog first."
      }
    ]
  },
  {
    "slug": "tags-and-releases",
    "track": 2,
    "title": "Tags and Releases",
    "tag": "intermediate",
    "description": "Tags mark specific commits as significant — usually a version release. Unlike branches, tags do not move. Once you tag a commit, that tag permanently points to that exact state of the code.",
    "steps": [
      {
        "title": "Creating a tag",
        "body": "git tag v1.0.0 tags the current commit. git tag v1.0.0 abc1234 tags a specific commit. git push origin v1.0.0 pushes the tag to the remote — tags are not pushed automatically."
      },
      {
        "title": "Semantic versioning",
        "body": "Most projects use semver: MAJOR.MINOR.PATCH. Patch for bug fixes (1.0.1). Minor for new features that do not break anything (1.1.0). Major for breaking changes (2.0.0). This tells users what to expect from an update."
      },
      {
        "title": "Annotated vs lightweight tags",
        "body": "Lightweight tags are just a pointer to a commit. Annotated tags (git tag -a v1.0.0 -m \"Release message\") store extra metadata: tagger name, date, and message. Use annotated for official releases."
      },
      {
        "title": "Releases on ForAllCode",
        "body": "A release bundles a tag with release notes — a human-readable changelog of what changed. Good release notes tell users what is new, what is fixed, and what might break."
      }
    ]
  },
  {
    "slug": "working-with-remotes",
    "track": 2,
    "title": "Working with Remotes",
    "tag": "intermediate",
    "description": "A remote is a version of your repository hosted somewhere else — on ForAllCode, GitHub, or another server. Most workflows involve at least one remote (origin) and sometimes two (origin and upstream when working with forks).",
    "steps": [
      {
        "title": "origin and upstream",
        "body": "origin is your own remote copy — the one you push to. upstream is the original repository you forked from. You pull from upstream to get the latest changes, and push to origin to save your work."
      },
      {
        "title": "fetch vs pull",
        "body": "git fetch downloads changes from the remote but does not apply them to your working branch — it just updates your local knowledge of what the remote looks like. git pull fetches and then merges immediately. Fetch first when you want to review before merging."
      },
      {
        "title": "Keeping a fork in sync",
        "body": "git fetch upstream gets the latest from the original repo. git merge upstream/main applies those changes to your local main. git push origin main updates your fork. Do this regularly to avoid large divergence."
      },
      {
        "title": "Tracking branches",
        "body": "When you push a branch with git push -u origin my-branch, Git sets up a tracking relationship. From then on, git push and git pull on that branch know where to go without you specifying the remote and branch name."
      }
    ]
  },
  {
    "slug": "commit-message-craft",
    "track": 2,
    "title": "Commit Message Craft",
    "tag": "intermediate",
    "description": "A commit message is a letter to your future self and your teammates. It is the primary way a reader understands why a change was made. A well-written commit history is one of the most underrated forms of documentation.",
    "steps": [
      {
        "title": "The imperative mood",
        "body": "Write commit messages as instructions: \"Add retry logic\" not \"Added retry logic\" or \"Adding retry logic\". This matches how Git itself phrases automated messages and reads naturally in a log."
      },
      {
        "title": "What goes in the subject line",
        "body": "The first line should be 50 characters or fewer and complete the sentence \"If applied, this commit will...\" — for example: \"Fix null check in user auth flow\". No full stop at the end."
      },
      {
        "title": "Using the body",
        "body": "Leave a blank line after the subject, then write as much as you need to explain why — not what. The diff already shows what changed. The message should explain the context, the motivation, and any alternatives you considered."
      },
      {
        "title": "Conventional commits",
        "body": "Many teams use a structured prefix: feat: (new feature), fix: (bug fix), docs: (documentation), refactor: (no behaviour change), chore: (tooling). This makes changelogs and automated tooling much easier to work with."
      }
    ]
  },
  {
    "slug": "interactive-rebase",
    "track": 3,
    "title": "Interactive Rebase",
    "tag": "advanced",
    "description": "Interactive rebase lets you rewrite your commit history before sharing it. You can squash multiple commits into one, reorder them, edit their messages, or split a commit apart. It is the tool for producing clean, readable history from messy work-in-progress commits.",
    "steps": [
      {
        "title": "Starting interactive rebase",
        "body": "git rebase -i HEAD~4 opens an editor showing your last 4 commits. Each line has a command prefix (pick by default) and the commit hash and message."
      },
      {
        "title": "Squashing",
        "body": "Change pick to squash (or s) on commits you want to combine with the one above them. Git will prompt you to write a single message for the combined commit."
      },
      {
        "title": "Rewording",
        "body": "Change pick to reword (or r) to keep the commit but edit its message. Git pauses at that commit and opens an editor for the new message."
      },
      {
        "title": "The right time to use it",
        "body": "Interactive rebase is for cleaning up before a PR — squashing \"WIP\" and \"fix typo\" commits into meaningful units. Never use it on commits already pushed to a shared branch."
      }
    ]
  },
  {
    "slug": "cherry-picking",
    "track": 3,
    "title": "Cherry Picking",
    "tag": "advanced",
    "description": "Cherry pick applies a specific commit from one branch to another, without merging the whole branch. It is useful when you need a specific fix in a release branch but are not ready to merge everything else that comes with it.",
    "steps": [
      {
        "title": "How it works",
        "body": "git cherry-pick abc1234 takes that specific commit and replays it on top of your current branch. The new commit has the same changes but a different hash."
      },
      {
        "title": "When to use it",
        "body": "A bug fix is on a feature branch, but you need it in the release branch now. Cherry pick the fix commit directly. Ideal for hotfixes and backporting."
      },
      {
        "title": "When not to use it",
        "body": "Cherry picking creates duplicate commits — the same change appears in two branches with different hashes. If those branches ever merge, Git sees them as different changes and may produce conflicts. Use sparingly."
      },
      {
        "title": "Handling conflicts",
        "body": "If the cherry picked commit conflicts with the target branch, Git pauses and asks you to resolve it — just like a merge conflict. Resolve, git add, then git cherry-pick --continue."
      }
    ]
  },
  {
    "slug": "git-bisect",
    "track": 3,
    "title": "Git Bisect",
    "tag": "advanced",
    "description": "Bisect uses binary search to find the exact commit that introduced a bug. Instead of checking commits one by one, you tell Git which commit is good and which is bad, and it systematically narrows down the culprit in logarithmic time.",
    "steps": [
      {
        "title": "Starting a bisect session",
        "body": "git bisect start begins the session. git bisect bad marks the current commit as broken. git bisect good v1.2.0 marks a known-good point. Git checks out the midpoint commit."
      },
      {
        "title": "Marking each commit",
        "body": "Test the code at each commit Git checks out. If it works, run git bisect good. If it is broken, run git bisect bad. Git keeps halving the range until it finds the first bad commit."
      },
      {
        "title": "The result",
        "body": "Git reports the exact commit that introduced the problem — its hash, author, date, and message. You now know exactly where to look."
      },
      {
        "title": "Automating bisect",
        "body": "git bisect run ./test.sh runs a script automatically at each step. If the script exits 0 (pass), Git marks good. Non-zero marks bad. Fully automated bisect on large histories is remarkably fast."
      }
    ]
  },
  {
    "slug": "submodules-monorepos",
    "track": 3,
    "title": "Submodules and Monorepos",
    "tag": "advanced",
    "description": "As projects grow, teams have to decide how to organise multiple related codebases. Submodules and monorepos are two different answers to the same question: how do we manage code that belongs together but has its own lifecycle?",
    "steps": [
      {
        "title": "Git submodules",
        "body": "A submodule is a pointer to a specific commit in another repository, embedded inside your repo. Useful for shared libraries. The downside: submodules add friction — contributors must run git submodule update --init after cloning."
      },
      {
        "title": "Monorepos",
        "body": "A monorepo stores multiple projects (frontend, backend, shared libraries) in a single repository. Everything is versioned together, making cross-project changes atomic. Used by large companies including Google, Meta, and Vercel."
      },
      {
        "title": "Monorepo tradeoffs",
        "body": "Advantages: atomic commits across projects, shared tooling, easier refactoring. Disadvantages: CI builds can become slow, git history grows large, access control is harder."
      },
      {
        "title": "Choosing an approach",
        "body": "For most small teams: a single repo per project. If you find yourself copying code between repos frequently, consider a shared package. Only reach for a monorepo when the coordination overhead of separate repos becomes the bottleneck."
      }
    ]
  },
  {
    "slug": "git-hooks",
    "track": 3,
    "title": "Git Hooks",
    "tag": "advanced",
    "description": "Git hooks are scripts that run automatically at specific points in the Git workflow — before a commit, before a push, after a merge. They let you enforce standards locally without relying on every developer to remember manual checks.",
    "steps": [
      {
        "title": "How hooks work",
        "body": "Hooks live in the .git/hooks folder as executable scripts. Git runs them automatically at the right moment. pre-commit runs before a commit is created. pre-push runs before a push. commit-msg runs after you write a commit message."
      },
      {
        "title": "Common uses",
        "body": "Running a linter before every commit (fail the commit if there are errors). Running tests before a push. Validating that the commit message follows the conventional commits format."
      },
      {
        "title": "Sharing hooks with the team",
        "body": ".git/hooks is not committed to the repository, so hooks do not share automatically. Use a tool like Husky (for JavaScript projects) to define hooks in package.json and install them for every contributor automatically."
      },
      {
        "title": "Keeping hooks fast",
        "body": "Hooks that take more than a few seconds frustrate developers and get bypassed with --no-verify. Run only what is strictly necessary. Leave slow checks (full test suite) to the CI pipeline."
      }
    ]
  },
  {
    "slug": "signing-commits",
    "track": 3,
    "title": "Signing Commits",
    "tag": "advanced",
    "description": "Git commits can be forged — anyone can set their name and email to anything. Commit signing uses cryptographic keys to prove that a commit genuinely came from you. Many organisations require signed commits on protected branches.",
    "steps": [
      {
        "title": "Why signing matters",
        "body": "Without signing, nothing stops someone from committing with your name and email. A signed commit contains a cryptographic signature that can only be produced by someone with your private key."
      },
      {
        "title": "GPG signing",
        "body": "The traditional approach: generate a GPG key pair, add the public key to your ForAllCode account, configure Git with git config --global user.signingkey YOUR_KEY_ID and git config --global commit.gpgsign true."
      },
      {
        "title": "SSH signing (simpler)",
        "body": "Newer Git versions support using your existing SSH key for signing — the same key you already use for pushing. Easier to set up than GPG with no new tooling required."
      },
      {
        "title": "Verified badge",
        "body": "When a signed commit is pushed, ForAllCode shows a Verified badge next to it. This confirms the identity of the committer cryptographically — not just by their display name."
      }
    ]
  },
  {
    "slug": "large-file-storage",
    "track": 3,
    "title": "Large File Storage",
    "tag": "advanced",
    "description": "Git is designed for text files — source code, configuration, documentation. It handles binary files (images, videos, compiled assets, datasets) poorly. Every version of a large file is stored in full, making the repository grow rapidly. Git LFS solves this.",
    "steps": [
      {
        "title": "The problem with large files in Git",
        "body": "When you commit a 50MB video file, every version of it is stored in the repository history forever. Clone times grow, pull times slow down, and the repo becomes unwieldy for every contributor."
      },
      {
        "title": "How Git LFS works",
        "body": "Git LFS replaces large files in the repository with small text pointers. The actual file content is stored on a separate server. Git operations stay fast — the large files are only downloaded when you actually need them."
      },
      {
        "title": "Setting up LFS",
        "body": "Install Git LFS, run git lfs install in your repo, then git lfs track \"*.psd\" (or whatever pattern matches your large files). This creates a .gitattributes file that tells Git which files to handle via LFS."
      },
      {
        "title": "What to store in LFS",
        "body": "Design files, images, compiled binaries, datasets, and audio/video assets are good candidates. Source code, configuration files, and markdown should stay in regular Git — LFS adds overhead that is not worth it for small files."
      }
    ]
  },
  {
    "slug": "open-source-contribution",
    "track": 3,
    "title": "Open Source Contribution",
    "tag": "advanced",
    "description": "Contributing to open source is one of the best ways to grow as a developer — you work with real codebases, get feedback from experienced engineers, and build a public record of your work. The workflow is slightly more formal than working on your own projects.",
    "steps": [
      {
        "title": "Finding the right project",
        "body": "Look for projects labelled \"good first issue\" or \"help wanted\". Start with projects you already use — you understand the problem space. Check how recently the maintainers responded to issues and PRs before investing time."
      },
      {
        "title": "The fork and PR workflow",
        "body": "Fork the repo to your account, clone your fork, create a feature branch, make your change, push to your fork, then open a PR to the original repo. Never push directly to a project you do not maintain."
      },
      {
        "title": "Reading the contribution guide",
        "body": "Almost every serious open source project has a CONTRIBUTING.md. Read it before writing a line of code. It tells you the coding style, how to run tests, how to submit changes, and what the maintainers actually want."
      },
      {
        "title": "Being a good contributor",
        "body": "Start small. A well-crafted fix for one bug is more valuable than a sprawling feature nobody asked for. Respond to feedback promptly. If a maintainer asks for changes, make them or explain why you disagree respectfully."
      }
    ]
  },
  {
    "slug": "what-is-cicd",
    "track": 3,
    "title": "What is CI/CD",
    "tag": "devops",
    "description": "CI/CD stands for Continuous Integration and Continuous Deployment. It is the practice of automatically building, testing, and deploying code every time a change is pushed. The goal is to catch problems early, ship frequently, and reduce the risk of any single deployment.",
    "steps": [
      {
        "title": "Continuous Integration",
        "body": "Every commit triggers an automated build and test run. If the tests pass, the code can be merged. If they fail, the developer is notified immediately — before the broken code reaches anyone else."
      },
      {
        "title": "Continuous Deployment",
        "body": "Every successful merge to main automatically deploys to production. No manual steps, no deployment days. Small changes ship continuously, making each individual deployment low-risk."
      },
      {
        "title": "Why it matters",
        "body": "Without CI/CD, teams batch up changes and deploy infrequently. Large deployments are risky — many things changed at once, and finding the cause of a problem is hard. Small frequent deployments are safer and faster to debug."
      },
      {
        "title": "The pipeline",
        "body": "A typical pipeline: code is pushed → tests run → build is created → staging deployment → smoke tests → production deployment. Each stage is a gate — if it fails, the pipeline stops and alerts the team."
      }
    ]
  },
  {
    "slug": "ci-pipelines",
    "track": 3,
    "title": "CI Pipelines in Practice",
    "tag": "devops",
    "description": "A CI pipeline is a configuration file that tells an automated system what to do when code is pushed. It defines the steps — install dependencies, run tests, build the app, deploy — and the conditions under which each step runs.",
    "steps": [
      {
        "title": "The workflow file",
        "body": "On most platforms (GitHub Actions, GitLab CI, Netlify) the pipeline is a YAML file in the repository. It lives alongside the code, is version-controlled, and changes to it go through the same review process as any other change."
      },
      {
        "title": "Triggers",
        "body": "Pipelines can run on push to any branch, only on PRs to main, on a schedule, or manually. A common pattern: run fast tests on every push, run the full test suite only on PRs to main."
      },
      {
        "title": "Secrets in pipelines",
        "body": "API keys, database passwords, and deploy credentials are stored as encrypted secrets in the CI platform — never in the code. The pipeline accesses them as environment variables at runtime."
      },
      {
        "title": "Reading pipeline output",
        "body": "When a pipeline fails, read the logs from the failed step. The error is almost always there. A red pipeline is not a disaster — it is the system working as intended, catching a problem before it reaches users."
      }
    ]
  },
  {
    "slug": "environments",
    "track": 3,
    "title": "Environments",
    "tag": "devops",
    "description": "Professional software runs in multiple environments — each a separate deployment of the application with different configuration, different data, and a different audience. Understanding environments is fundamental to shipping software safely.",
    "steps": [
      {
        "title": "Development",
        "body": "Runs on your local machine. Uses fake or development data. No risk if something breaks. This is where all active development happens — fast iteration, hot reloading, verbose logging."
      },
      {
        "title": "Staging",
        "body": "A production-like environment that is not public. Used to test changes before they go live. Staging should mirror production as closely as possible — same infrastructure, same configuration, similar data. What passes in staging should work in production."
      },
      {
        "title": "Production",
        "body": "The live environment that real users see. Changes here have real consequences. Deployments to production should always go through staging first. Production logs and error rates are monitored continuously."
      },
      {
        "title": "Environment variables",
        "body": "Each environment has its own configuration — different database URLs, different API keys, different feature flags. These are stored as environment variables, never hardcoded. The same codebase runs in all environments; only the config differs."
      }
    ]
  },
  {
    "slug": "docker-basics",
    "track": 3,
    "title": "Docker Basics for Developers",
    "tag": "devops",
    "description": "Docker packages an application and everything it needs to run — runtime, dependencies, configuration — into a container. The container runs identically on any machine. It solves the \"works on my machine\" problem and is the foundation of modern deployment.",
    "steps": [
      {
        "title": "The problem Docker solves",
        "body": "Code runs differently on different machines because they have different operating systems, different software versions, and different configurations. A container packages the application with its exact environment, so it runs the same everywhere."
      },
      {
        "title": "Images and containers",
        "body": "A Docker image is a blueprint — a read-only snapshot of the application and its environment. A container is a running instance of an image. You can run many containers from the same image simultaneously."
      },
      {
        "title": "The Dockerfile",
        "body": "A Dockerfile is a text file that describes how to build an image: start from a base image (like node:18), copy in the application code, install dependencies, expose a port, define the start command. Docker builds the image from these instructions."
      },
      {
        "title": "Containers in the development workflow",
        "body": "Developers use Docker to run databases and other services locally without installing them directly. docker-compose lets you define a multi-container setup (app + database + cache) and start everything with one command."
      }
    ]
  },
  {
    "slug": "deployment-strategies",
    "track": 3,
    "title": "Deployment Strategies",
    "tag": "devops",
    "description": "Deploying software always carries risk — you are changing something that is live and in use. Deployment strategies are techniques for reducing that risk by controlling how and when new code reaches users.",
    "steps": [
      {
        "title": "Blue-green deployment",
        "body": "Run two identical production environments (blue and green). Deploy the new version to green while blue serves users. Switch traffic to green when ready. If something goes wrong, switch back to blue instantly. Zero downtime, instant rollback."
      },
      {
        "title": "Canary releases",
        "body": "Deploy the new version to a small percentage of users first — say 5%. Monitor error rates and performance. If everything looks good, gradually roll out to more users. If something is wrong, only 5% of users were affected."
      },
      {
        "title": "Feature flags",
        "body": "Deploy code to production but control who sees it with a flag. The code is live but the feature is off. Turn it on for internal testers, then specific user groups, then everyone. Decouple deployment from release."
      },
      {
        "title": "Rolling back",
        "body": "A rollback is deploying the previous version to fix a problem in production. Good deployment systems make rollbacks as fast and safe as deployments. The ability to roll back quickly is as important as the ability to deploy."
      }
    ]
  },
  {
    "slug": "monitoring-observability",
    "track": 3,
    "title": "Monitoring and Observability",
    "tag": "devops",
    "description": "Shipping code is not the end of the story. Once something is in production, you need to know whether it is working — and when it breaks, you need to find out why quickly. Monitoring and observability are the tools that give you that visibility.",
    "steps": [
      {
        "title": "Logs",
        "body": "Log files record what the application is doing over time. Good logging captures key events, errors, and context. Bad logging is either too sparse to be useful or so verbose it is impossible to find the signal in the noise."
      },
      {
        "title": "Error tracking",
        "body": "Tools like Sentry capture exceptions automatically, with the full stack trace, the user context, and the frequency. Instead of finding out about errors from user reports, you are notified the moment they first occur."
      },
      {
        "title": "Metrics and alerts",
        "body": "Track key numbers over time: request rate, error rate, response time, database query duration. Set alerts when metrics cross thresholds — error rate over 1%, response time over 500ms. This tells you something is wrong before users complain."
      },
      {
        "title": "The three pillars",
        "body": "Logs (what happened), metrics (how much/how often), and traces (what path did a request take through the system). Together these give you observability — the ability to understand what is happening inside your system from the outside."
      }
    ]
  },
  {
    "slug": "security-fundamentals",
    "track": 3,
    "title": "Security Fundamentals for Developers",
    "tag": "devops",
    "description": "Security is not a separate discipline — it is part of the development workflow. Most security incidents are caused by well-known, preventable mistakes. Understanding the basics puts you ahead of the vast majority of developers.",
    "steps": [
      {
        "title": "Never commit secrets",
        "body": "API keys, passwords, private keys, and tokens should never appear in source code. Use environment variables and secret management tools. If you accidentally commit a secret, rotate it immediately — assume it is compromised even if the commit is private."
      },
      {
        "title": "Dependency vulnerabilities",
        "body": "Your dependencies have their own vulnerabilities. npm audit and similar tools scan your dependency tree against known vulnerability databases. Run them regularly and update dependencies when vulnerabilities are found. Outdated dependencies are one of the most common attack vectors."
      },
      {
        "title": "Branch protection rules",
        "body": "Protect your main branch: require pull requests before merging, require passing CI checks, require code review approval, prevent force pushes. These rules stop accidental or malicious changes from reaching production without oversight."
      },
      {
        "title": "Least privilege access",
        "body": "Grant people and systems only the access they actually need. A deployment pipeline does not need write access to your database. A contractor does not need access to production logs. Limiting access limits the blast radius when something goes wrong."
      }
    ]
  }
];
