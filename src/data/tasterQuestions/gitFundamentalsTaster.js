export const GIT_FUNDAMENTALS_TASTER = {
  id: "git-fundamentals",
  name: "Git Fundamentals",
  slug: "git-fundamentals",
  title: "Try the Git Fundamentals taster",
  certificationName: "Git Fundamentals Certificate",
  price: "£20",
  accentColour: "#9b8fd4",
  accentTextColour: "#fffdf9",
  upsellBg1: "#ddd5f0",
  upsellBg2: "#fffdf9",
  tasterQuestionCount: 6,
  fullQuestionCount: 20,
  fullSectionCount: 8,
  passPercent: 70,
  tasterDescription: "The foundation certification. This taster covers two of the eight assessed topics - branching and commits, and undoing mistakes. Questions rise from easy to hard.",
  remainingTopicsDesc: "merging, remotes, collaboration patterns, tags, commit message craft, and working with history",
  sections: [
    {
      title: "Branching & commits",
      intro: "Branches let you try ideas without disturbing your main line of work. Understanding how branches and commits relate is fundamental to everything else in Git.",
      accentColour: "#9b8fd4",
      questions: [
        {
          id: "gf-branching-easy",
          difficulty: "easy",
          text: "What does git checkout -b my-feature do?",
          options: [
            "Switches to an existing branch called my-feature",
            "Creates a new branch and immediately switches to it",
            "Copies all files from my-feature into the current branch",
            "Deletes the my-feature branch"
          ],
          correct: 1,
          explanation: "The -b flag creates a new branch pointing to the same commit as the current branch and immediately switches to it. It is shorthand for git branch my-feature followed by git checkout my-feature."
        },
        {
          id: "gf-branching-medium",
          difficulty: "medium",
          text: "You have uncommitted changes and need to switch branches urgently. What should you do?",
          options: [
            "Switch branches - Git saves your changes automatically",
            "git stash to save changes temporarily, switch branches, then git stash pop to restore them",
            "Commit the changes with a WIP message before switching",
            "Both B and C are valid approaches depending on the situation"
          ],
          correct: 3,
          explanation: "Both are valid. git stash is ideal for truly temporary context switches. A WIP commit is reasonable if you want the work visible in history and plan to amend it later. The choice depends on how temporary the switch is and your team conventions."
        },
        {
          id: "gf-branching-hard",
          difficulty: "hard",
          text: "What is the difference between git merge and git rebase when integrating changes from main into a feature branch?",
          options: [
            "They produce identical results",
            "Merge creates a merge commit preserving full branch history - rebase replays commits on top of main producing a linear history",
            "Rebase is always safer than merge for team workflows",
            "Merge is only for feature branches - rebase is for main"
          ],
          correct: 1,
          explanation: "Merge creates a merge commit that joins the two branch tips - history shows when they diverged and reunited. Rebase replays your feature commits on top of current main - producing clean linear history. The golden rule: never rebase commits that have been pushed and shared with others."
        }
      ]
    },
    {
      title: "Undoing mistakes",
      intro: "Git gives you multiple ways to undo changes, each with different effects on history. Choosing the right tool depends on whether the mistake has been committed and whether others have seen it.",
      accentColour: "#d4848c",
      questions: [
        {
          id: "gf-undo-easy",
          difficulty: "easy",
          text: "You want to undo a commit that has already been pushed to a shared branch. Which command is safest?",
          options: [
            "git reset --hard HEAD~1",
            "git revert HEAD",
            "git commit --amend",
            "git push --force"
          ],
          correct: 1,
          explanation: "git revert creates a new commit that undoes the changes from a previous commit - the original stays in history. This is safe for shared branches because it does not rewrite history. git reset rewrites history and must never be used on shared branches."
        },
        {
          id: "gf-undo-medium",
          difficulty: "medium",
          text: "You accidentally committed a file with sensitive credentials. You have not pushed yet. What is the correct fix?",
          options: [
            "Delete the file and make a new commit",
            "git reset --soft HEAD~1 to uncommit but keep the changes staged, remove the credentials, then recommit",
            "git commit --amend to add a note about the error",
            "It does not matter since it is not pushed yet"
          ],
          correct: 1,
          explanation: "git reset --soft HEAD~1 moves HEAD back one commit but keeps your changes staged. You can then remove the credentials, stage the corrected file, and make a clean commit. Deleting the file in a new commit leaves the credentials in the previous commit in history."
        },
        {
          id: "gf-undo-hard",
          difficulty: "hard",
          text: "You ran git reset --hard HEAD~3 and lost three commits you needed. Is recovery possible?",
          options: [
            "No - hard reset is permanent and the commits are gone forever",
            "Yes - git reflog records every position HEAD has been, including before the reset",
            "Only if you have a remote backup of the branch",
            "Only if you committed within the last 24 hours"
          ],
          correct: 1,
          explanation: "git reflog is your last resort. It records every position HEAD has been - even after a hard reset. Find the hash of the commit you want, then git checkout -b recovery-branch [hash] to recover it. This is why permanent data loss in Git is rare if you act quickly."
        }
      ]
    }
  ]
};
