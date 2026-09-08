export const GIT_TEAMS_QUESTIONS = [

  // ── SECTION 1: BRANCHING STRATEGIES (5 questions) ────────────────────────

  {
    id: 1,
    section: 'Branching strategies',
    question: 'Your team ships to production multiple times per day and has a single production environment. Which branching strategy is most appropriate?',
    options: [
      'Git Flow — it provides the most structure and safety for frequent releases',
      'GitHub Flow — short-lived feature branches merged directly to main with immediate deployment',
      'Release branching — create a release branch for each deployment',
      'Trunk-based development with long-lived feature branches to reduce merge conflicts'
    ],
    correct: 1,
    explanation: 'GitHub Flow is designed for continuous deployment: short-lived branches, PR review, merge to main, deploy immediately. Git Flow adds unnecessary overhead (develop, release, hotfix branches) when you are shipping continuously to a single environment. Trunk-based development with long-lived branches contradicts the core principle of trunk-based development.'
  },

  {
    id: 2,
    section: 'Branching strategies',
    question: 'Your team maintains three versions of a product simultaneously — v1, v2, and v3 — each receiving bug fixes. Which branching strategy handles this most cleanly?',
    options: [
      'GitHub Flow with tags to mark each version',
      'Trunk-based development with feature flags per version',
      'Git Flow with separate long-lived branches per major version',
      'A single main branch with cherry-picked fixes applied to each version'
    ],
    correct: 2,
    explanation: 'Maintaining multiple concurrent versions is exactly the use case Git Flow was designed for. Long-lived version branches (v1, v2, v3) receive hotfixes that are cherry-picked or merged forward. GitHub Flow and trunk-based development assume a single production target. Cherry-picking alone is fragile at scale.'
  },

  {
    id: 3,
    section: 'Branching strategies',
    question: 'A team member argues that everyone should commit directly to main and use feature flags to hide unfinished work. Another argues for feature branches. Which statement about this disagreement is most accurate?',
    options: [
      'Feature branches are always safer — direct commits to main should never be allowed',
      'Both are valid approaches; trunk-based development with feature flags works well for experienced teams with strong CI, while feature branches suit teams with slower review cycles',
      'Direct commits to main only work for solo developers, never for teams',
      'Feature flags are too complex for most teams and should be avoided'
    ],
    correct: 1,
    explanation: 'Both approaches are legitimate. Trunk-based development requires strong automated testing, feature flag infrastructure, and disciplined developers — it works extremely well at companies like Google. Feature branches are more forgiving and suit teams with slower or asynchronous review processes. The right choice depends on team maturity and tooling.'
  },

  {
    id: 4,
    section: 'Branching strategies',
    question: 'Your team uses Git Flow. A critical bug is discovered in production. What is the correct Git Flow process for fixing it?',
    options: [
      'Fix it on the develop branch and wait for the next release',
      'Create a hotfix branch from main, fix the bug, merge back to both main and develop, tag the release',
      'Create a feature branch from develop, fix the bug, merge to develop, then create a release branch',
      'Commit directly to main to minimise the time the bug is live'
    ],
    correct: 1,
    explanation: 'Git Flow defines a specific hotfix workflow: branch from main (production), apply the fix, merge back to main (and tag it as a new release), then merge back to develop so the fix is not lost in the next release. Branching from develop would delay the fix through a normal release cycle. Committing directly to main bypasses all safety checks.'
  },

  {
    id: 5,
    section: 'Branching strategies',
    question: 'What is the primary risk of a feature branch that lives for three weeks before being merged?',
    options: [
      'The branch will automatically expire and the work will be lost',
      'It will diverge significantly from main, creating a large and complex merge with higher conflict probability',
      'GitHub will flag it as stale and close any associated pull requests',
      'Other team members cannot see the work until it is merged'
    ],
    correct: 1,
    explanation: 'Long-lived branches accumulate divergence — the longer a branch lives, the more commits appear on main that your branch does not have. When you eventually merge, the diff is large, conflicts are more likely, and reviewing the PR becomes difficult. This is why trunk-based development advocates for branches that live hours, not weeks.'
  },

  // ── SECTION 2: PULL REQUEST WORKFLOWS (6 questions) ──────────────────────

  {
    id: 6,
    section: 'Pull request workflows',
    question: 'You open a PR with 800 lines of changes across 15 files. Your reviewer responds: "This is too large to review properly." What should you do?',
    options: [
      'Ask for a different reviewer who has more time',
      'Break the PR into smaller, focused PRs — each doing one thing — and update the branch incrementally',
      'Add detailed comments to every file to help the reviewer understand the changes',
      'Schedule a synchronous code review session to walk through the changes together'
    ],
    correct: 1,
    explanation: 'Large PRs are a structural problem, not a reviewer problem. The correct solution is to decompose the work into smaller PRs — each with a single purpose. A reviewer cannot give meaningful feedback on 800 lines of interrelated changes. Scheduling a synchronous review is a workaround, not a fix — the next PR will have the same problem.'
  },

  {
    id: 7,
    section: 'Pull request workflows',
    question: 'Your PR has been approved by one reviewer but the team has a policy requiring two approvals. The second reviewer is on holiday for a week. What is the most appropriate action?',
    options: [
      'Merge with one approval since the work is approved in principle',
      'Ask the first reviewer to approve twice',
      'Wait for the second reviewer to return, or ask a third qualified team member to review',
      'Bypass the branch protection rule since the delay is unreasonable'
    ],
    correct: 2,
    explanation: 'Branch protection rules exist for good reasons — two reviews catches more issues than one. The correct action is to wait or find another qualified reviewer. Bypassing protection rules or gaming the system (approving twice) defeats the purpose. If one week feels unreasonable for your team, the policy should be formally updated — not circumvented on a case-by-case basis.'
  },

  {
    id: 8,
    section: 'Pull request workflows',
    question: 'A reviewer leaves 23 comments on your PR. Most are small style suggestions prefixed with "nit:". Three are marked "blocking". What should you do first?',
    options: [
      'Address all 23 comments before requesting a re-review',
      'Address only the three blocking comments, then request re-review — the reviewer can decide whether nits matter enough to block merge',
      'Close the PR and reopen it with the blocking issues fixed to avoid the comment thread becoming unwieldy',
      'Ask the reviewer to re-submit with only blocking comments since nits are subjective'
    ],
    correct: 1,
    explanation: 'Blocking comments must be addressed before merge — they represent genuine issues. Nit comments are optional suggestions; the author can choose whether to address them. Requesting re-review after fixing blocking issues is correct — the reviewer can then confirm the nits do not matter enough to delay merge. Re-opening PRs loses context and history.'
  },

  {
    id: 9,
    section: 'Pull request workflows',
    question: 'You push a commit to your feature branch after a reviewer has approved your PR but before it is merged. What should you do?',
    options: [
      'Nothing — the approval still stands since you pushed to your branch, not main',
      'Notify the reviewer about the new commit and ask them to re-confirm their approval, especially if the change is non-trivial',
      'Dismiss the existing approval and request a full re-review',
      'Merge immediately before the reviewer sees the new commit'
    ],
    correct: 1,
    explanation: 'An approval is for the code at a specific point in time. If you push new commits after approval, the reviewer has not approved those changes. For trivial fixes (typos, formatting) a notification is sufficient. For non-trivial changes, request re-review. Merging immediately after adding unseen changes is a serious breach of review etiquette.'
  },

  {
    id: 10,
    section: 'Pull request workflows',
    question: 'Your team uses squash-and-merge for all PRs. A new team member asks why. What is the most accurate explanation?',
    options: [
      'Squash merge is faster than regular merge because it skips conflict detection',
      'It collapses all commits from the feature branch into a single commit on main, keeping main history clean and making each merged PR a single meaningful unit in the log',
      'It prevents merge conflicts by automatically resolving them',
      'It is required for branch protection rules to work correctly'
    ],
    correct: 1,
    explanation: 'Squash-and-merge takes all commits from a feature branch — including "WIP", "fix typo", "add test" commits — and combines them into one commit on main. This keeps the main branch history clean and readable: each commit represents a completed feature or fix. It has no effect on conflict detection or branch protection.'
  },

  {
    id: 11,
    section: 'Pull request workflows',
    question: 'What should a good PR description always include?',
    options: [
      'A list of every file changed and why',
      'The full git diff pasted as text for reviewers who do not use the web interface',
      'What changed and why, how to test it, any relevant issue numbers, and screenshots for visual changes',
      'Only the issue number it closes — the code speaks for itself'
    ],
    correct: 2,
    explanation: 'A good PR description answers: what did I change, why did I change it, how do I know it works, and what should the reviewer pay attention to. Issue numbers provide context. Screenshots help for UI changes. "The code speaks for itself" is a bad practice — context about intent and testing is not visible from a diff.'
  },

  // ── SECTION 3: MERGE CONFLICT RESOLUTION (5 questions) ───────────────────

  {
    id: 12,
    section: 'Merge conflict resolution',
    question: 'You are resolving a merge conflict in a file where both you and a colleague changed the same function. Your version adds new functionality; their version fixes a bug. What is the correct approach?',
    options: [
      'Keep your version since your changes are more recent',
      'Keep their version since bug fixes take priority over new features',
      'Combine both changes — incorporate the bug fix into your version of the function',
      'Discard both versions and rewrite the function from scratch'
    ],
    correct: 2,
    explanation: 'A merge conflict does not mean one side wins — it means you need to produce a result that incorporates both sets of changes correctly. In this case, you need a version of the function that includes the bug fix and the new functionality. Choosing one side unconditionally will either lose the bug fix or lose the feature.'
  },

  {
    id: 13,
    section: 'Merge conflict resolution',
    question: 'After resolving a merge conflict, which sequence of commands completes the merge correctly?',
    options: [
      'git commit -m "resolved conflict" → git push',
      'git add [resolved files] → git commit → git push',
      'git resolve → git merge --continue → git push',
      'git merge --abort → git merge --force → git push'
    ],
    correct: 1,
    explanation: 'After manually resolving conflicts in files, you must stage the resolved files with git add to tell Git the conflicts are resolved, then create the merge commit with git commit (Git will suggest a merge commit message), then push. There is no "git resolve" command. git merge --abort cancels the merge entirely.'
  },

  {
    id: 14,
    section: 'Merge conflict resolution',
    question: 'Your team has frequent merge conflicts in a shared configuration file. What is the most effective long-term solution?',
    options: [
      'Designate one person as the configuration owner who makes all changes',
      'Lock the file using git lock so only one person can edit it at a time',
      'Restructure the configuration so different team members own different sections, or split it into multiple files by concern',
      'Accept the conflicts as unavoidable and develop a faster conflict resolution process'
    ],
    correct: 2,
    explanation: 'Frequent conflicts in the same file are a design problem — the file is a bottleneck. The solution is to eliminate the bottleneck: split the file by concern so different teams own different files, reducing overlap. There is no "git lock" command. Designating one owner creates a human bottleneck. Optimising the conflict resolution process treats the symptom, not the cause.'
  },

  {
    id: 15,
    section: 'Merge conflict resolution',
    question: 'You run git merge and see "CONFLICT (content): Merge conflict in auth.js". You open the file and see the conflict markers. What do the markers mean?',
    options: [
      '<<<<<<< HEAD contains your changes, ======= is the divider, >>>>>>> branch-name contains the incoming changes',
      '<<<<<<< HEAD contains the incoming changes, ======= is the divider, >>>>>>> branch-name contains your changes',
      '<<<<<<< HEAD marks the start of the file, >>>>>>> marks the end of the conflicting section',
      'The markers show which lines were deleted and which were added in each branch'
    ],
    correct: 0,
    explanation: 'HEAD refers to your current branch — so <<<<<<< HEAD contains YOUR version of the conflicting section. The ======= divides the two versions. >>>>>>> branch-name contains the INCOMING changes from the branch you are merging in. Understanding this correctly is essential — getting it backwards will resolve the conflict in the wrong direction.'
  },

  {
    id: 16,
    section: 'Merge conflict resolution',
    question: 'You are in the middle of resolving a complex merge conflict when you realise you need to start over. What command aborts the merge and returns to the pre-merge state?',
    options: [
      'git reset --hard HEAD',
      'git merge --abort',
      'git checkout -- .',
      'git revert HEAD'
    ],
    correct: 1,
    explanation: 'git merge --abort stops the merge in progress and restores the repository to the state it was in before you started the merge. git reset --hard HEAD would also work but is more aggressive and less semantically clear. git checkout -- . only discards working directory changes. git revert creates a new commit that undoes a previous commit — not relevant to an in-progress merge.'
  },

  // ── SECTION 4: PROTECTED BRANCHES AND PERMISSIONS (5 questions) ──────────

  {
    id: 17,
    section: 'Protected branches and permissions',
    question: 'Your team wants to ensure no code reaches main without at least one approved review and passing CI checks. Which combination of branch protection rules achieves this?',
    options: [
      'Require pull requests + require status checks to pass + require at least 1 approving review',
      'Require pull requests + restrict who can push to main',
      'Require signed commits + require linear history',
      'Prevent force pushes + require status checks to pass'
    ],
    correct: 0,
    explanation: 'You need all three: requiring pull requests prevents direct pushes to main, requiring status checks ensures CI passes before merge, and requiring at least 1 approving review ensures human review. Restricting push access alone does not require CI. Signed commits and linear history are useful but do not enforce review or CI checks.'
  },

  {
    id: 18,
    section: 'Protected branches and permissions',
    question: 'A critical production incident requires an immediate fix. The main branch requires 2 approving reviews and passing CI, but CI is taking 20 minutes and only one reviewer is available. What is the most appropriate action?',
    options: [
      'Bypass branch protection by force pushing the fix directly to main',
      'Use the branch protection bypass feature if enabled for admins, document the bypass, and ensure the fix is retroactively reviewed',
      'Wait for CI and the second reviewer — bypassing protection sets a dangerous precedent',
      'Deploy from a feature branch directly without merging to main'
    ],
    correct: 1,
    explanation: 'Most platforms allow repository administrators to bypass branch protection in genuine emergencies. The correct approach is: use the bypass intentionally, document that it was used and why, ensure the bypass is reviewed after the incident, and add the incident to a post-mortem. Waiting 20 minutes may be acceptable depending on severity. Force pushing without documentation or intent is dangerous. The key principle is that bypasses should be deliberate, documented, and rare — not routine.'
  },

  {
    id: 19,
    section: 'Protected branches and permissions',
    question: 'What does "Require linear history" as a branch protection rule enforce?',
    options: [
      'All commits must have linear (sequential) commit numbers',
      'Merges must use squash or rebase strategy, preventing merge commits on the protected branch',
      'Commits must be made in chronological order with no backdating',
      'All branches must be created from the same base commit'
    ],
    correct: 1,
    explanation: 'Require linear history prevents merge commits on the protected branch — all PRs must be merged via squash-and-merge or rebase-and-merge. This produces a straight-line history without the branching structure that regular merge commits create. It makes git log cleaner and git bisect more reliable.'
  },

  {
    id: 20,
    section: 'Protected branches and permissions',
    question: 'A new developer accidentally pushes sensitive credentials to a public repository. The credentials are now in the commit history. What is the correct response?',
    options: [
      'Delete the file containing the credentials and push a new commit',
      'Immediately rotate the credentials, then use git filter-branch or BFG Repo Cleaner to remove the credentials from history, then force push — and accept that the exposure has already occurred',
      'Make the repository private temporarily until the history is cleaned',
      'Revert the commit using git revert and inform the team'
    ],
    correct: 1,
    explanation: 'The most urgent step is rotating (invalidating and replacing) the credentials — assume they have been compromised the moment they were pushed publicly. Then remove them from history using git filter-branch or BFG Repo Cleaner and force push. Deleting the file leaves the credentials in history. Making the repo private is not enough — the exposure has occurred. Reverting leaves the credentials in the history of the revert commit.'
  },

  {
    id: 21,
    section: 'Protected branches and permissions',
    question: 'Your team has Contributors who can push to feature branches and Maintainers who can merge to main. A contributor opens a PR and wants to merge it themselves. What is the most appropriate response?',
    options: [
      'Allow it — once a PR is approved, the contributor has earned the right to merge',
      'Explain that the permission model exists for a reason — only maintainers merge to main — and ask them to request a merge from a maintainer',
      'Temporarily elevate their permissions to allow this merge, then revert',
      'Merge it yourself without involving them further'
    ],
    correct: 1,
    explanation: 'Permission models exist to ensure appropriate oversight. The contributor opened the PR and received review — the maintainer role exists specifically to control what reaches the protected branch. Temporarily elevating permissions creates unnecessary complexity and undermines the permission model. A clear explanation respects the contributor while maintaining the team structure.'
  },

  // ── SECTION 5: CODE REVIEW BEST PRACTICES (5 questions) ──────────────────

  {
    id: 22,
    section: 'Code review best practices',
    question: 'You disagree strongly with an architectural decision in a PR you are reviewing, but the code works and passes all tests. What is the correct approach?',
    options: [
      'Approve it — if it works and passes tests, your architectural opinion is irrelevant',
      'Request changes, clearly explaining your concern, and suggest an alternative approach — but frame it as a discussion, not a demand',
      'Block the PR indefinitely until the author adopts your preferred architecture',
      'Approve it but add a comment saying you disagree, so the record shows your objection'
    ],
    correct: 1,
    explanation: 'Architectural disagreements are legitimate review feedback. The correct approach is to request changes and explain your concern clearly — but as a collaborative discussion, not an ultimatum. If the author has good reasons for their choice that you had not considered, you should update your view. If the disagreement cannot be resolved, escalate to a team decision rather than blocking indefinitely. Approving silently with a note that you disagree is passive and does not serve the team.'
  },

  {
    id: 23,
    section: 'Code review best practices',
    question: 'Which of these code review comments is most useful to the author?',
    options: [
      '"This is wrong."',
      '"I would not have done it this way."',
      '"This function will throw a TypeError if userList is undefined — add a null check before the .map() call on line 47."',
      '"The variable names here are confusing. Please improve them."'
    ],
    correct: 2,
    explanation: 'Useful code review comments are specific, actionable, and explain the problem. Option C identifies the exact issue (TypeError), the condition that triggers it (undefined userList), the specific location (line 47), and the solution (null check before .map()). The other options are vague, subjective, or personal — they do not give the author enough information to make a decision.'
  },

  {
    id: 24,
    section: 'Code review best practices',
    question: 'How long should a reasonable first review of a 200-line PR typically take?',
    options: [
      '5 minutes — experienced developers can skim code quickly',
      '20–45 minutes — understanding context, checking logic, considering edge cases, and writing useful comments takes time',
      '2+ hours — every line should be carefully analysed',
      'It depends entirely on the reviewer — there is no reasonable expectation'
    ],
    correct: 1,
    explanation: 'A 200-line PR deserves genuine attention. A reviewer needs to understand the context, follow the logic, consider what could go wrong, check for edge cases, and write comments that are useful rather than superficial. 5 minutes is a rubber stamp. 2+ hours for 200 lines is probably excessive unless it is particularly complex. 20–45 minutes is a reasonable benchmark for a thoughtful review of a moderately complex change.'
  },

  {
    id: 25,
    section: 'Code review best practices',
    question: 'A team member consistently receives reviews with many critical comments and never asks questions before submitting. What is the most constructive intervention?',
    options: [
      'Stop reviewing their PRs so they learn from their mistakes',
      'Have a private conversation to understand if they know the team standards, offer to pair on a PR, and establish whether they need support or clearer documentation',
      'Leave increasingly detailed comments until they improve',
      'Escalate to management immediately'
    ],
    correct: 1,
    explanation: 'Consistently problematic PRs are usually a communication or clarity problem, not a competence problem. The correct intervention is a private, supportive conversation: do they know the standards, do they understand the feedback, would pairing help? The goal is to understand and address the root cause. Stopping reviews abandons the team member. Escalating to management immediately skips necessary human steps.'
  },

  {
    id: 26,
    section: 'Code review best practices',
    question: 'You are reviewing a PR that contains a clever but highly complex solution to a problem that has a simpler, more readable alternative. The clever solution is not wrong. What should you do?',
    options: [
      'Approve it — the reviewer should not second-guess working solutions',
      'Request changes, suggest the simpler alternative, and explain that maintainability and readability are valid engineering concerns',
      'Approve it but add a comment noting the simpler alternative for the author\'s information',
      'Reject it outright — clever code is always bad code'
    ],
    correct: 1,
    explanation: 'Readability and maintainability are legitimate engineering concerns, not personal preferences. A simpler solution is easier to understand, debug, and modify by the next developer (including the original author six months later). Requesting changes with a clear explanation and a specific alternative is the right call. Approving with a comment leaves the decision to the author, which may be appropriate for minor style issues but not for a significant readability concern.'
  },

  // ── SECTION 6: RELEASE MANAGEMENT (5 questions) ──────────────────────────

  {
    id: 27,
    section: 'Release management',
    question: 'Your library is at version 2.4.1. You add a new function that developers can optionally use but that does not change any existing behaviour. What is the correct next version number?',
    options: [
      '3.0.0 — any new functionality warrants a major version bump',
      '2.5.0 — a new feature that does not break existing code is a minor version increment',
      '2.4.2 — any change increments the patch version',
      '2.4.1-beta — new features should be released as beta first'
    ],
    correct: 1,
    explanation: 'Semantic versioning (semver) defines: MAJOR for breaking changes, MINOR for backwards-compatible new functionality, PATCH for backwards-compatible bug fixes. A new optional function that does not affect existing behaviour is a backwards-compatible addition — minor version increment, making it 2.5.0. Major would only apply if existing APIs changed or were removed.'
  },

  {
    id: 28,
    section: 'Release management',
    question: 'What should a good changelog entry for a version release include?',
    options: [
      'A complete list of every commit since the last release',
      'Only the version number and release date — developers can read the diff',
      'A human-readable summary grouped by type (Added, Changed, Fixed, Deprecated, Removed, Security) with enough context for a user to understand what changed and why it matters',
      'Only breaking changes — minor changes and bug fixes clutter the changelog'
    ],
    correct: 2,
    explanation: 'A changelog is for humans, not machines. It should be grouped by impact type, written in plain language, and focused on what users of the library or product need to know. A raw commit list is noise. Only listing breaking changes omits valuable information. The Keep a Changelog format (keepachangelog.com) is the widely accepted standard.'
  },

  {
    id: 29,
    section: 'Release management',
    question: 'You discover a security vulnerability in version 2.3.0 of your library. Versions 2.0.0 through 2.3.0 are all affected. 3.0.0 is also affected. What is the correct release response?',
    options: [
      'Release a fix in 3.1.0 only — users on older versions should upgrade',
      'Release patched versions for each affected minor version (2.0.1, 2.1.1, 2.2.1, 2.3.1, 3.0.1) with a security advisory',
      'Release 2.3.1 only since it is the latest 2.x and users of older versions are not supported',
      'Immediately deprecate all affected versions and force users to upgrade to 3.1.0'
    ],
    correct: 1,
    explanation: 'Security vulnerabilities require patching all affected versions that users might reasonably still be running — you cannot assume all users can upgrade to the latest major version. Release patched versions for each affected minor version, publish a security advisory (CVE if warranted) with the severity, affected versions, and upgrade instructions. Users on older major versions may have migration blockers and deserve a patch.'
  },

  {
    id: 30,
    section: 'Release management',
    question: 'Your team creates a release branch from main when preparing a release. A bug is found in the release branch during testing. Where should the fix be applied?',
    options: [
      'Fix it on main and re-create the release branch',
      'Fix it directly on the release branch, then merge the fix back to main so it is not lost',
      'Fix it on main, then cherry-pick the fix onto the release branch',
      'Both B and C are acceptable approaches depending on the team workflow'
    ],
    correct: 3,
    explanation: 'Both approaches are valid. Fixing directly on the release branch and merging back to main is simpler and keeps the fix in the release branch context. Cherry-picking from main is also valid — fix where it is easiest and port across. What matters is that the fix ends up in both the release and in main. The only wrong answer is fixing on main and re-creating the release branch, which would lose any other release-specific changes.'
  },

  {
    id: 31,
    section: 'Release management',
    question: 'What is the purpose of a "release candidate" version (e.g. 2.5.0-rc.1)?',
    options: [
      'To indicate the version is not yet ready and should not be used',
      'A version intended for broad testing before the final release — functionally complete but potentially containing final bugs to be discovered',
      'A version automatically created by CI when tests pass',
      'A version released only to paying customers before the public release'
    ],
    correct: 1,
    explanation: 'A release candidate is a version that is feature-complete and intended for broader testing — it is "this is what we plan to release unless something is found". It gives power users, integration partners, and QA teams a chance to test against the final feature set before the official release. rc.1, rc.2 etc. track subsequent candidates if issues are found.'
  },

  // ── SECTION 7: TEAM HISTORY HYGIENE (5 questions) ────────────────────────

  {
    id: 32,
    section: 'Team history hygiene',
    question: 'Your team requires all commit messages to follow the format: "type(scope): description". A new member pushes a commit with the message "stuff". What is the most appropriate team response?',
    options: [
      'Accept it — commit message standards are suggestions, not requirements',
      'Reject the commit and ask the member to amend the message and force push their branch',
      'Silently fix the commit message yourself before the PR is merged',
      'Add a git hook to the repository that validates commit messages and rejects non-conforming commits at push time'
    ],
    correct: 3,
    explanation: 'The most sustainable solution is enforcement via automation — a commit-msg hook that validates format and a CI check that rejects PRs with non-conforming messages. This removes the burden of manual policing and gives developers immediate feedback. Rejecting the commit manually works but does not scale. Silently fixing it yourself removes the learning opportunity and is not maintainable.'
  },

  {
    id: 33,
    section: 'Team history hygiene',
    question: 'A developer has been working on a feature branch for two weeks. Their branch has 47 commits including "WIP", "fix", "fix again", "final fix", "actually final fix". Before opening a PR, what should they do?',
    options: [
      'Open the PR as is — the commit history on a feature branch does not matter',
      'Use interactive rebase to squash and rewrite the commits into a small number of meaningful commits before opening the PR',
      'Delete all commits and re-commit all changes as a single commit',
      'Rename the commits to remove the embarrassing messages using git commit --amend for each one'
    ],
    correct: 1,
    explanation: 'Interactive rebase (git rebase -i) is the right tool for cleaning up a messy commit history before sharing it. You can squash, reword, reorder, and split commits. The goal is to present a clean, logical narrative of the changes rather than a diary of the development process. Deleting all commits and re-committing loses the granular history entirely. Renaming 47 commits with git commit --amend would be extremely tedious.'
  },

  {
    id: 34,
    section: 'Team history hygiene',
    question: 'When should you NOT rebase a branch?',
    options: [
      'When the branch has more than 10 commits',
      'When the branch has already been pushed and other team members have based work on it',
      'When the branch contains merge commits',
      'When the branch is more than a week old'
    ],
    correct: 1,
    explanation: 'The golden rule of rebasing: never rebase commits that have been pushed to a shared branch that others have based work on. Rebasing rewrites commit hashes — if others have commits that reference the old hashes, their history will diverge from yours, creating a complex reconciliation problem. Age and number of commits are irrelevant. Rebasing a private branch you have not shared is always safe.'
  },

  {
    id: 35,
    section: 'Team history hygiene',
    question: 'Your team wants to enforce a linear history on main. Which merge strategy achieves this?',
    options: [
      'Regular merge commits — they keep the branch history visible',
      'Squash-and-merge or rebase-and-merge — both produce a linear history on main',
      'Fast-forward only merges — but only when the feature branch is directly ahead of main',
      'Both B and C are correct approaches to linear history'
    ],
    correct: 3,
    explanation: 'Linear history on main can be achieved through squash-and-merge (all branch commits become one), rebase-and-merge (branch commits are replayed on top of main), or fast-forward (which requires the branch to be up to date with main — often combined with rebasing the feature branch first). Regular merge commits explicitly create non-linear history with the branching structure preserved.'
  },

  {
    id: 36,
    section: 'Team history hygiene',
    question: 'What is the output of `git log --oneline -5` and what does it tell you?',
    options: [
      'The last 5 files changed in the repository, one per line',
      'The last 5 commits on the current branch, showing abbreviated hash and commit message — one line per commit',
      'The last 5 branches created, in creation order',
      'The 5 most recent commits across all branches of the repository'
    ],
    correct: 1,
    explanation: '--oneline compresses each commit to a single line showing the abbreviated hash and subject line. -5 limits to the last 5 commits on the current branch. This is the quickest way to see recent history without the full commit details. It shows the current branch history, not all branches.'
  },

  // ── SECTION 8: COLLABORATION PATTERNS (4 questions) ──────────────────────

  {
    id: 37,
    section: 'Collaboration patterns',
    question: 'Your team works across three time zones. Code review regularly takes 24+ hours because reviewers are asleep when PRs are opened. What is the most effective structural solution?',
    options: [
      'Require reviewers to respond within 4 hours regardless of time zone',
      'Use async review tools, establish clear SLAs for review response time, and rotate review responsibilities across time zones so there is always a reviewer available',
      'Move all team members to the same time zone or same working hours',
      'Reduce the review requirement to 0 approvals to remove the bottleneck'
    ],
    correct: 1,
    explanation: 'Distributed teams need systems designed for async work. Clear review SLAs (e.g. "respond within one business day"), rotating ownership across time zones, and async-friendly PR descriptions reduce the bottleneck. Requiring 4-hour response ignores the reality of time zones. Moving everyone to the same hours is impractical and may be legally complex. Removing review requirements eliminates an important quality gate.'
  },

  {
    id: 38,
    section: 'Collaboration patterns',
    question: 'Two developers are pair programming and want to share the commit history to reflect both contributors. What is the correct Git approach?',
    options: [
      'One developer commits everything and the other is credited in the commit message',
      'Use the "Co-authored-by" trailer in the commit message: "Co-authored-by: Name <email>"',
      'Alternate commits so each developer has an equal number in the log',
      'Create a shared Git user account that both developers use'
    ],
    correct: 1,
    explanation: 'The "Co-authored-by" trailer in the commit message body is the standard way to credit multiple authors on a single commit. ForAllCode and GitHub recognise this convention and attribute the commit to both users. Alternating commits splits the work artificially. A shared account loses individual attribution. Mentioning the other person in the message text (not as a trailer) does not trigger automatic attribution.'
  },

  {
    id: 39,
    section: 'Collaboration patterns',
    question: 'A feature branch has been open for 3 weeks and is significantly behind main. The developer working on it asks whether to merge main into the feature branch or rebase the feature branch onto main. Which answer is most accurate?',
    options: [
      'Always merge main into the feature branch — rebasing shared branches is dangerous',
      'Always rebase onto main — merge commits on feature branches are always bad',
      'Both are valid; rebasing produces a cleaner history and makes the eventual PR diff cleaner, but only if no other team members have based work on the feature branch. Merging is safer if the branch is shared.',
      'It does not matter — the result is the same either way'
    ],
    correct: 2,
    explanation: 'Both approaches update the feature branch with changes from main, but they work differently. Rebasing replays the feature commits on top of current main — producing a cleaner PR diff and linear history. Merging creates a merge commit from main into the feature branch — safer if others have work based on the feature branch. The result is NOT the same — they produce different histories. The right choice depends on whether the branch is private or shared.'
  },

  {
    id: 40,
    section: 'Collaboration patterns',
    question: 'Your team has accumulated 34 stale branches in the repository — branches from merged or abandoned PRs that were never deleted. What is the correct approach?',
    options: [
      'Leave them — branches are lightweight and do not affect performance',
      'Delete them all immediately to clean up the repository',
      'Review each branch: delete branches from merged PRs, archive or discuss branches from abandoned work to confirm they are safe to delete, and establish a team practice of deleting branches after merge',
      'Rename them with an "archived/" prefix so they are clearly marked as inactive'
    ],
    correct: 2,
    explanation: 'Stale branches accumulate because teams do not establish a cleanup practice. The correct response is: delete branches from already-merged PRs (safe — the work is in main), review abandoned branches before deleting (the work may be worth continuing), and crucially, establish a team norm of deleting branches after merge to prevent recurrence. Leaving them is sloppy housekeeping. Deleting all without review risks losing unmerged work.'
  },

];
