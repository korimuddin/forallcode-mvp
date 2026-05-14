export const GIT_TEAMS_TASTER = {
  id: "git-teams",
  name: "Git for Teams",
  slug: "git-for-teams",
  price: "£25",
  accentColour: "#7aaa72",
  accentTextColour: "#fffdf9",
  upsellBg1: "#c8d8c4",
  upsellBg2: "#fffdf9",
  fullQuestionCount: 40,
  tasterQuestionCount: 6,
  fullSectionCount: 8,
  passPercent: 75,
  tasterDescription: "Most developers learn Git alone. Working in a team is a different skill entirely. This taster covers two of the eight assessed topics - branching strategies and pull request workflows.",
  remainingTopicsDesc: "merge conflict resolution, protected branches, code review best practices, release management, team history hygiene, and collaboration patterns",
  sections: [
    {
      title: "Branching strategies",
      intro: "Teams need a shared agreement on how branches are created, used, and merged. The three most common strategies are Git Flow, GitHub Flow, and trunk-based development - each making different tradeoffs between stability and release cadence.",
      accentColour: "#7aaa72",
      questions: [
        {
          difficulty: "easy",
          text: "Your team ships to production multiple times per day from a single environment. Which branching strategy fits best?",
          options: [
            "Git Flow - it provides the most structure and safety",
            "GitHub Flow - short-lived branches merged to main and deployed immediately",
            "Release branching - create a branch per deployment",
            "Long-lived feature branches to reduce conflicts"
          ],
          correct: 1,
          explanation: "GitHub Flow is designed for continuous deployment: short feature branches, PR review, merge to main, deploy immediately. Git Flow adds overhead only justified when maintaining multiple production versions simultaneously."
        },
        {
          difficulty: "medium",
          text: "A feature branch has been open for three weeks and is significantly behind main. What is the primary risk?",
          options: [
            "The branch expires automatically after 30 days",
            "Large divergence from main creates complex merges with high conflict probability",
            "Other team members cannot see the work until it is merged",
            "GitHub will flag it as stale and close the associated pull request"
          ],
          correct: 1,
          explanation: "Long-lived branches accumulate divergence. The longer a branch lives, the more commits appear on main that it does not have - making the eventual merge large, conflict-prone, and hard to review. This is why trunk-based development advocates for branches that live hours, not weeks."
        },
        {
          difficulty: "hard",
          text: "Your team uses Git Flow. A critical bug is found in production. What is the correct Git Flow workflow?",
          options: [
            "Fix on the develop branch and wait for the next planned release",
            "Create a hotfix branch from main, fix the bug, merge back to both main and develop, tag the release",
            "Create a feature branch from develop and go through the normal release process",
            "Commit directly to main to minimise downtime"
          ],
          correct: 1,
          explanation: "Git Flow defines a specific hotfix workflow: branch from main, not develop, fix the bug, merge back to both main and develop so the fix is not lost in the next release, then tag the new production release. Branching from develop would delay the fix through the normal release cycle."
        }
      ]
    },
    {
      title: "Pull request workflows",
      intro: "A pull request is not just a code submission - it is a conversation. How you write and review PRs determines how quickly changes get merged and how much value the review process actually provides.",
      accentColour: "#6aa8d4",
      questions: [
        {
          difficulty: "easy",
          text: "A reviewer has left 20 comments: 17 prefixed \"nit:\" and 3 marked \"blocking\". What should you do first?",
          options: [
            "Address all 20 comments before requesting re-review",
            "Address only the 3 blocking comments, then request re-review",
            "Close and reopen the PR to clear the comment thread",
            "Ask the reviewer to resubmit with only blocking comments"
          ],
          correct: 1,
          explanation: "Blocking comments must be addressed - they represent genuine issues. Nits are optional suggestions. Fix the blockers, request re-review, and let the reviewer decide whether the nits matter enough to delay merge."
        },
        {
          difficulty: "medium",
          text: "You push a new commit after a reviewer has approved your PR but before it is merged. What should you do?",
          options: [
            "Nothing - the approval still stands since you pushed to your own branch",
            "Notify the reviewer and ask them to re-confirm, especially if the change is non-trivial",
            "Dismiss the existing approval and request a full re-review",
            "Merge immediately before they notice the new commit"
          ],
          correct: 1,
          explanation: "An approval covers the code at a specific point in time. New commits after approval have not been approved. For trivial changes a notification suffices; for non-trivial changes, request re-review. Merging unseen changes is a serious breach of review etiquette."
        },
        {
          difficulty: "hard",
          text: "Your team uses squash-and-merge for all PRs. A new team member asks why. What is the most accurate explanation?",
          options: [
            "It is faster because it skips conflict detection",
            "It collapses all branch commits into one on main, keeping history clean and each merged PR a single meaningful unit",
            "It prevents merge conflicts by automatically resolving them",
            "It is required for branch protection rules to work correctly"
          ],
          correct: 1,
          explanation: "Squash-and-merge takes all commits from a feature branch - including WIP and fix-typo commits - and combines them into a single commit on main. This keeps the main branch history clean and readable without noise from in-progress commits. It has no effect on conflict detection or branch protection."
        }
      ]
    }
  ]
};
