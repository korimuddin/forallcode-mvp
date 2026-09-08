export const GIT_FUNDAMENTALS_QUESTIONS = [
  {
    id: 1,
    question: "What does git stash do?",
    options: [
      "Permanently deletes uncommitted changes",
      "Saves uncommitted changes temporarily and reverts the working directory",
      "Creates a new branch with your changes",
      "Commits your changes with an automatic message"
    ],
    correct: 1,
    explanation: "git stash shelves uncommitted work so you can switch context and restore it later."
  },
  {
    id: 2,
    question: "Which command creates and immediately switches to a new branch?",
    options: ["git branch my-feature", "git switch my-feature", "git checkout -b my-feature", "git new-branch my-feature"],
    correct: 2,
    explanation: "git checkout -b creates the branch and checks it out in one step."
  },
  {
    id: 3,
    question: "What is the main purpose of a commit?",
    options: ["To save a snapshot of tracked changes", "To upload code to GitHub", "To delete a branch", "To install dependencies"],
    correct: 0,
    explanation: "A commit records a snapshot of tracked changes with a message."
  },
  {
    id: 4,
    question: "What does git status show?",
    options: ["Only remote branches", "The working tree and staging area state", "The size of the repository", "The current GitHub billing plan"],
    correct: 1,
    explanation: "git status tells you what changed, what is staged, and what is untracked."
  },
  {
    id: 5,
    question: "What is the staging area?",
    options: ["A temporary area for choosing changes for the next commit", "A backup of deleted branches", "A remote repository", "A folder for production files"],
    correct: 0,
    explanation: "The staging area lets you choose exactly what goes into the next commit."
  },
  {
    id: 6,
    question: "Which command sends local commits to a remote repository?",
    options: ["git pull", "git push", "git fetch", "git clone"],
    correct: 1,
    explanation: "git push uploads your local commits to a remote branch."
  },
  {
    id: 7,
    question: "Which command downloads remote changes and merges them into your current branch?",
    options: ["git pull", "git add", "git init", "git tag"],
    correct: 0,
    explanation: "git pull fetches remote changes and integrates them into the current branch."
  },
  {
    id: 8,
    question: "What does .gitignore do?",
    options: ["Encrypts repository files", "Lists files Git should not track", "Deletes old commits", "Creates GitHub issues automatically"],
    correct: 1,
    explanation: ".gitignore tells Git which untracked files or patterns to ignore."
  },
  {
    id: 9,
    question: "What is a merge conflict?",
    options: ["A failed login to GitHub", "When Git cannot automatically combine competing changes", "A branch with no commits", "A missing package lock file"],
    correct: 1,
    explanation: "Conflicts happen when Git needs a human to decide how overlapping changes should combine."
  },
  {
    id: 10,
    question: "What does git clone do?",
    options: ["Copies a remote repository to your machine", "Creates a pull request", "Deletes all local commits", "Renames the current branch"],
    correct: 0,
    explanation: "git clone creates a local copy of a remote repository."
  },
  {
    id: 11,
    question: "What does git fetch do?",
    options: ["Downloads remote updates without merging them", "Publishes a release", "Stages all files", "Deletes ignored files"],
    correct: 0,
    explanation: "git fetch updates your remote-tracking references without changing your working files."
  },
  {
    id: 12,
    question: "What is a pull request?",
    options: ["A request to review and merge changes", "A command that formats code", "A private branch on your laptop", "A billing invoice"],
    correct: 0,
    explanation: "A pull request is a collaborative review and merge workflow."
  },
  {
    id: 13,
    question: "What does HEAD usually refer to?",
    options: ["The latest GitHub notification", "The current checked-out commit or branch tip", "The first commit ever made", "The repository owner"],
    correct: 1,
    explanation: "HEAD points to the commit currently checked out in your working tree."
  },
  {
    id: 14,
    question: "Which command shows commit history?",
    options: ["git log", "git map", "git send", "git show-files"],
    correct: 0,
    explanation: "git log displays the commit history."
  },
  {
    id: 15,
    question: "What does git diff show by default?",
    options: ["Differences between unstaged changes and the last commit", "Only branch names", "Only GitHub comments", "The contents of node_modules"],
    correct: 0,
    explanation: "git diff shows unstaged changes compared with the index or last commit depending on arguments."
  },
  {
    id: 16,
    question: "What is a remote named origin?",
    options: ["The default nickname for the repository you cloned from", "A secret branch", "A staging folder", "A commit message template"],
    correct: 0,
    explanation: "origin is the conventional default name for the remote source repository."
  },
  {
    id: 17,
    question: "Which command stages all current changes in the working tree?",
    options: ["git add .", "git commit .", "git push .", "git branch ."],
    correct: 0,
    explanation: "git add . stages changes under the current directory."
  },
  {
    id: 18,
    question: "Why should commit messages be clear?",
    options: ["They help future readers understand why a change happened", "Git refuses vague messages", "They make files smaller", "They replace tests"],
    correct: 0,
    explanation: "Good messages explain intent and make history easier to navigate."
  },
  {
    id: 19,
    question: "What does rebasing usually do?",
    options: ["Replays commits onto a new base commit", "Deletes every branch", "Converts Git to SVN", "Creates a new GitHub account"],
    correct: 0,
    explanation: "Rebase rewrites a series of commits so they appear to start from a different base."
  },
  {
    id: 20,
    question: "What is the safest first step before resolving a confusing Git situation?",
    options: ["Run git status and inspect the current state", "Delete the .git folder", "Force push immediately", "Commit random files"],
    correct: 0,
    explanation: "git status gives you the map before you choose the next move."
  }
];
