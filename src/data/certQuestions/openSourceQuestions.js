export const OPEN_SOURCE_QUESTIONS = [

  // ── SECTION 1: FINDING THE RIGHT PROJECT (5 questions) ───────────────────

  {
    id: 1,
    section: 'Finding the right project',
    question: 'You want to make your first open source contribution. Which type of issue is most appropriate to start with?',
    options: [
      'The most critical open issue — making a big impact demonstrates commitment',
      'Issues labelled "good first issue" or "help wanted" — they are explicitly set aside for new contributors and scope the work appropriately',
      'Any issue that has been open for more than 6 months — the maintainers clearly need help',
      'Issues in the largest and most popular repositories — more visibility means more career benefit'
    ],
    correct: 1,
    explanation: '"Good first issue" and "help wanted" labels exist specifically because maintainers want external help with them and have scoped the work to be approachable. Starting with the most critical issue means competing with experienced contributors and likely failing. Old issues may be open for a reason — the maintainer may be undecided. Popular repositories receive hundreds of PRs; your contribution will receive less personal attention and guidance.'
  },

  {
    id: 2,
    section: 'Finding the right project',
    question: 'How do you assess whether an open source project is actively maintained before investing time in a contribution?',
    options: [
      'Check the star count — popular projects are always well maintained',
      'Look at recent commit activity, whether open PRs get reviewed and responded to, how long issues sit without response, and whether releases have happened recently',
      'Look for a "maintained" badge in the README',
      'Check if the repository has more than 100 contributors'
    ],
    correct: 1,
    explanation: 'Stars reflect historical popularity, not current maintenance. A project can have millions of stars and be completely abandoned. Real signals of active maintenance: recent commits (within weeks, not years), PRs being reviewed and merged, issues receiving responses, and recent releases. A project with your ideal "good first issue" but no activity for 18 months will likely never merge your PR.'
  },

  {
    id: 3,
    section: 'Finding the right project',
    question: 'You find a project you use daily and want to contribute. You have intermediate JavaScript skills. The project\'s codebase is primarily TypeScript and you are unfamiliar with it. What is the best approach?',
    options: [
      'Skip the project — only contribute when you know the technology stack perfectly',
      'Look for issues labelled "good first issue" that involve documentation, tests, or small bug fixes where the TypeScript requirement is minimal — use the contribution as an opportunity to learn',
      'Immediately open a large PR to demonstrate your commitment and learn from the review feedback',
      'Ask the maintainers to convert the project to JavaScript so you can contribute more easily'
    ],
    correct: 1,
    explanation: 'Familiarity with the exact tech stack is not a prerequisite for contributing. Documentation fixes, improving error messages, adding tests, and small bug fixes often require minimal knowledge of the specific technology. Contributing while learning is entirely legitimate and commonly done. Opening a large PR in unfamiliar territory is likely to produce poor-quality work that creates work for maintainers. Asking maintainers to change their tech stack is inappropriate.'
  },

  {
    id: 4,
    section: 'Finding the right project',
    question: 'Before spending time writing code for a new feature you want to add to an open source project, what should you do first?',
    options: [
      'Write the code, then open a PR — maintainers respond better to seeing the work',
      'Check if an issue or discussion already exists for the feature; if not, open one and propose the feature before writing code — wait for maintainer feedback',
      'Fork the repository and add the feature to your fork — if the maintainers see it in use they will want to merge it',
      'Email the maintainers directly to get pre-approval'
    ],
    correct: 1,
    explanation: 'Unsolicited PRs for new features are one of the most common mistakes new open source contributors make. Maintainers may have already decided not to implement the feature, may have a different architectural approach in mind, or may simply not want the scope to grow. Opening an issue to discuss first takes 10 minutes and can save hours of wasted work. "Show, don\'t tell" works for bug fixes — not for new features.'
  },

  {
    id: 5,
    section: 'Finding the right project',
    question: 'You look at a project\'s open issues and see one that matches your skills. The issue was opened 14 months ago and has no comments or activity. What does this most likely indicate?',
    options: [
      'The maintainers have forgotten about it — this is a great opportunity since you will be the first to work on it',
      'The issue may be deprioritised, invalid, or the project may have low activity — comment on the issue to ask if it is still relevant and confirm the maintainers want it addressed before spending time on it',
      'The issue is too complex for the maintainers — your fresh perspective will solve it quickly',
      'The project is no longer maintained — do not contribute to it'
    ],
    correct: 1,
    explanation: 'A 14-month-old issue with no activity is a yellow flag. It may be valid and the project is just understaffed, it may have been silently resolved elsewhere, or it may have been deprioritised as not worth the effort. Always confirm before investing time. Comment on the issue: "Is this still relevant? I would like to work on it if so." A maintainer response confirms the work is wanted. No response after a week suggests low activity and you should decide whether to proceed.'
  },

  // ── SECTION 2: UNDERSTANDING CONTRIBUTION GUIDELINES (5 questions) ────────

  {
    id: 6,
    section: 'Understanding contribution guidelines',
    question: 'You clone a repository and find a CONTRIBUTING.md file. When should you read it?',
    options: [
      'After you have already written your code — to check if there is anything to adjust',
      'Before writing a single line of code — contribution guidelines define what the maintainers expect and save you from wasted work',
      'Only if your PR is rejected — to understand what went wrong',
      'It is optional — most CONTRIBUTING.md files are outdated anyway'
    ],
    correct: 1,
    explanation: 'CONTRIBUTING.md is one of the first things you should read — before forking, before writing code, before opening an issue. It defines the development setup, coding standards, commit message format, testing requirements, how to run the test suite, and what kinds of contributions are welcome. Ignoring it and then fixing issues after the fact creates work for both you and the maintainer.'
  },

  {
    id: 7,
    section: 'Understanding contribution guidelines',
    question: 'A project\'s CONTRIBUTING.md requires all commits to use the conventional commits format (feat:, fix:, docs: etc.). You submit a PR with the commit message "Updated the docs". What will likely happen?',
    options: [
      'The PR will be auto-merged since the content is valid even if the message format is wrong',
      'The CI pipeline will likely fail on a commit message lint check, and/or the maintainer will ask you to rebase and fix the commit message',
      'Nothing — commit message format is a suggestion, not a requirement',
      'The maintainer will fix the commit message themselves before merging'
    ],
    correct: 1,
    explanation: 'Projects that require conventional commits typically enforce them via a CI check (commitlint). Your PR will fail CI and the maintainer will ask you to fix the commit message before they will review. They will not fix it for you — that is your responsibility. This is why reading CONTRIBUTING.md before writing code matters: you learn these requirements upfront rather than discovering them after your PR is open.'
  },

  {
    id: 8,
    section: 'Understanding contribution guidelines',
    question: 'A project has a Contributor Licence Agreement (CLA) that you must sign before your PR can be merged. You disagree with one clause. What should you do?',
    options: [
      'Sign it anyway — CLAs are just formalities and the clause probably does not matter',
      'Refuse to contribute to that project — CLAs are always unreasonable',
      'Read the CLA carefully, understand what you are agreeing to, and if you cannot accept the terms, do not contribute — look for projects with more acceptable terms or no CLA',
      'Sign it and then later challenge the clause you disagree with legally'
    ],
    correct: 2,
    explanation: 'A CLA is a legal document. You should read it before signing — it typically grants the project the right to use your contribution (often including re-licensing it). If you cannot accept a clause, you genuinely should not sign and should not contribute to that project. This is a real decision that affects your intellectual property rights. There are many excellent projects with permissive or no CLAs — you have options.'
  },

  {
    id: 9,
    section: 'Understanding contribution guidelines',
    question: 'A project\'s code of conduct says contributors must use inclusive language and treat others with respect. You see a comment thread where a maintainer is being rude to a contributor. What is the appropriate response?',
    options: [
      'Respond in kind — the code of conduct applies to everyone including maintainers',
      'Report the behaviour to the project\'s conduct committee or the platform if available, and document the interaction in case escalation is needed',
      'Withdraw your contribution — projects with rude maintainers are not worth working with',
      'Ignore it — you are just a contributor and it is not your responsibility'
    ],
    correct: 1,
    explanation: 'Most codes of conduct include a reporting mechanism for exactly this situation. The appropriate response is to use it. Retaliating escalates the situation. Withdrawing without reporting means the behaviour continues for others. Ignoring it normalises the behaviour. If the project has no enforcement mechanism or the report is dismissed, withdrawal is a reasonable personal decision — but reporting first gives the community a chance to address it.'
  },

  {
    id: 10,
    section: 'Understanding contribution guidelines',
    question: 'You want to contribute but the project has no CONTRIBUTING.md. What should you do?',
    options: [
      'Assume any approach is acceptable since there are no guidelines',
      'Look at recent merged PRs to understand the patterns the maintainers have accepted — commit style, test coverage, code structure — and follow those patterns',
      'Open an issue asking the maintainers to write a CONTRIBUTING.md before you will contribute',
      'Only contribute documentation since there is no way to know the code standards'
    ],
    correct: 1,
    explanation: 'When there is no CONTRIBUTING.md, the merged PR history is your guide. Look at recent PRs that were accepted: what do the commit messages look like, are tests included, how is code documented, what does the PR description include? The maintainers\' past behaviour reveals their preferences. You can also open a small, low-risk PR first (a documentation fix) to establish a relationship before tackling larger changes.'
  },

  // ── SECTION 3: THE FORK AND PR WORKFLOW (5 questions) ────────────────────

  {
    id: 11,
    section: 'The fork and PR workflow',
    question: 'Three months after forking a repository, you are ready to open a PR. The upstream project has had 47 commits since you forked. What should you do before opening the PR?',
    options: [
      'Open the PR immediately — the maintainers will handle any conflicts',
      'Sync your fork with upstream (git fetch upstream, git merge upstream/main or git rebase upstream/main), resolve any conflicts, then open the PR',
      'Close your fork and start again from a fresh fork',
      'Ask the maintainers to pause development while you finish your PR'
    ],
    correct: 1,
    explanation: 'A PR that is significantly behind upstream is harder to review, more likely to conflict with recent changes, and signals that you have not been keeping up with the project. Always sync your fork before opening a PR: fetch the latest from upstream, merge or rebase onto the current main, resolve conflicts, then open the PR against a branch that is current with upstream. Maintainers should not have to resolve conflicts that are your responsibility.'
  },

  {
    id: 12,
    section: 'The fork and PR workflow',
    question: 'What is the correct Git workflow for adding a remote to track the original repository after forking?',
    options: [
      'git remote add fork https://github.com/original/repo',
      'git remote add upstream https://github.com/original/repo',
      'git fork https://github.com/original/repo',
      'git clone --upstream https://github.com/original/repo'
    ],
    correct: 1,
    explanation: 'By convention, the original repository you forked from is added as a remote named "upstream". Your fork (which you cloned) is "origin". git remote add upstream [url] adds this tracking. You then use git fetch upstream to get changes from the original repo. Using any name works technically, but "upstream" is the universal convention and other contributors will expect it.'
  },

  {
    id: 13,
    section: 'The fork and PR workflow',
    question: 'You want to make two unrelated contributions to the same project — a bug fix and a documentation improvement. How should you structure your work?',
    options: [
      'Put both changes in one branch and one PR — it is more efficient for the maintainer to review everything at once',
      'Create two separate branches and two separate PRs — one for the bug fix, one for the documentation',
      'Submit the bug fix first, and only submit the documentation after the bug fix is merged',
      'Combine them in one PR but clearly label which commits are the bug fix and which are documentation'
    ],
    correct: 1,
    explanation: 'Separate PRs for separate concerns is always better. The bug fix might be urgent and mergeable immediately; the documentation change might require discussion. Bundling them means both wait for the slower of the two. Reviewers can focus on each change in isolation. If one needs rework, the other is not blocked. Separate PRs also produce a cleaner commit history on main — each commit has one clear purpose.'
  },

  {
    id: 14,
    section: 'The fork and PR workflow',
    question: 'A maintainer asks you to rebase your PR onto the latest main. What does this mean and how do you do it?',
    options: [
      'Create a new branch and manually re-apply your changes',
      'git checkout your-branch && git fetch upstream && git rebase upstream/main — then force push your branch',
      'git merge upstream/main into your branch',
      'Close the PR and open a new one from a fresh fork'
    ],
    correct: 1,
    explanation: 'Rebasing onto main replays your commits on top of the current tip of upstream/main, producing a linear history without merge commits. The sequence is: fetch the latest upstream, rebase your branch onto it, then force push (required because rebasing rewrites commit hashes). A force push to your own feature branch is safe — it does not affect anyone else since your branch is unique to you. Do not merge instead of rebasing when the maintainer specifically asks for a rebase.'
  },

  {
    id: 15,
    section: 'The fork and PR workflow',
    question: 'Your PR has been open for three weeks with no response from maintainers. What is the appropriate action?',
    options: [
      'Close it and reopen it to move it to the top of the queue',
      'Leave a polite single follow-up comment after 2–3 weeks asking if the maintainers have had a chance to look at it — then wait',
      'Directly message the maintainer on social media to escalate',
      'Open duplicate PRs from different accounts to increase visibility'
    ],
    correct: 1,
    explanation: 'Maintainers are often volunteers with limited time. Three weeks without a response is not unusual. One polite follow-up is entirely acceptable — maintainers appreciate being reminded, not pestered. Closing and reopening resets the timeline but may frustrate maintainers. Direct social media contact is inappropriate for most projects. Duplicate PRs are explicitly against most codes of conduct and will get all your PRs closed.'
  },

  // ── SECTION 4: WRITING GOOD ISSUES (5 questions) ──────────────────────────

  {
    id: 16,
    section: 'Writing good issues',
    question: 'You find a bug in an open source library. Which bug report gives the maintainer the most useful information?',
    options: [
      '"The library is broken. Please fix."',
      '"It doesn\'t work on my machine."',
      '"When calling library.process(null), I receive a TypeError: Cannot read property \'length\' of null at line 47. Expected: graceful handling of null input. Actual: unhandled exception. Node.js 18.0.0, library version 2.3.1, macOS 13.2. Reproducible with the attached minimal example."',
      '"I found a bug in version 2.3.1. Can you fix it?"'
    ],
    correct: 2,
    explanation: 'A useful bug report includes: what you did (the exact input or action), what you expected to happen, what actually happened (with the full error message), your environment (OS, runtime version, library version), and ideally a minimal reproducible example. Options A, B, and D give a maintainer nothing actionable. Option C gives them everything they need to reproduce and fix the bug without further questions.'
  },

  {
    id: 17,
    section: 'Writing good issues',
    question: 'What is a minimal reproducible example and why do maintainers request them?',
    options: [
      'A small version of your project that demonstrates the bug — it removes all code not related to the bug, making it easier for the maintainer to isolate and fix the issue',
      'A screenshot of the error message',
      'The full source code of your project so the maintainer can run it and see the bug',
      'A description of the minimum steps required to reproduce the bug without any code'
    ],
    correct: 0,
    explanation: 'A minimal reproducible example (MRE or MRE) is the smallest possible piece of code that demonstrates the bug with all irrelevant code removed. It saves the maintainer from having to read your entire codebase, eliminates the possibility that the bug is in your code rather than the library, and makes the bug obvious. Many bugs are resolved by the reporter themselves in the process of creating the MRE — which also saves maintainer time.'
  },

  {
    id: 18,
    section: 'Writing good issues',
    question: 'You open a feature request issue. The maintainer closes it with: "This is out of scope for this project." How should you respond?',
    options: [
      'Argue your case — the feature would clearly benefit many users',
      'Re-open the issue — the maintainer is wrong and should reconsider',
      'Thank them for responding, accept their decision, and consider building the feature as a separate plugin or fork if you still need it',
      'Open a duplicate issue with more detail to change their mind'
    ],
    correct: 2,
    explanation: 'Maintainers have the final say on what belongs in their project — it is their project. "Out of scope" is a legitimate and complete answer. Arguing, reopening, or filing duplicates damages your relationship with the project and the community. The correct response is graceful acceptance. If you genuinely need the feature, fork the project or build a plugin. Some of the best open source projects started as someone\'s fork of a project that would not add a feature they needed.'
  },

  {
    id: 19,
    section: 'Writing good issues',
    question: 'Before opening a bug report, what steps should you take?',
    options: [
      'Open the issue immediately — speed is important for bug reports',
      'Search existing open and closed issues for the same bug, check if the latest version fixes it, read the documentation to confirm it is actually a bug and not expected behaviour, then open the issue if it is new',
      'Search only open issues — closed issues are resolved and irrelevant',
      'Ask on Stack Overflow first to confirm it is a bug before bothering the maintainers'
    ],
    correct: 1,
    explanation: 'Duplicate issues waste maintainer time. Always search open AND closed issues — closed issues often contain the fix or explanation. Check the latest version — your bug may already be fixed in a release you have not updated to. Read the documentation — what you think is a bug may be documented behaviour. Only open a new issue if it is genuinely new and confirmed. Stack Overflow is a separate community and routing there first is unnecessary.'
  },

  {
    id: 20,
    section: 'Writing good issues',
    question: 'You want to suggest an improvement to a project\'s documentation. What is the best way to do this?',
    options: [
      'Open an issue describing the unclear section — then wait for a maintainer to fix it',
      'Fork the repo, improve the documentation, and open a PR — documentation PRs are low risk and often merged quickly without needing prior discussion',
      'Open an issue and assign it to yourself before writing anything',
      'Post in the project\'s community forum since documentation feedback is not appropriate for issues'
    ],
    correct: 1,
    explanation: 'Documentation improvements are the lowest-risk category of open source contribution — they do not change code behaviour, they rarely conflict with other work, and maintainers almost always appreciate them. You do not need to open an issue first for an obvious documentation fix. Just make the improvement and open a PR with a clear description of what you fixed and why. This is a great first contribution precisely because the barrier is so low.'
  },

  // ── SECTION 5: COMMUNICATION WITH MAINTAINERS (5 questions) ──────────────

  {
    id: 21,
    section: 'Communication with maintainers',
    question: 'A maintainer reviews your PR and requests several significant changes. You believe your original approach is better. What is the most appropriate response?',
    options: [
      'Implement all changes without comment — the maintainer always knows best',
      'Explain your reasoning respectfully for each point of disagreement, acknowledge their perspective, and find a solution collaboratively — be willing to update your view if they make good points',
      'Close the PR and submit it to a competing project that will appreciate your approach',
      'Implement their changes but add a comment in the code explaining that you disagreed'
    ],
    correct: 1,
    explanation: 'Maintainers are not infallible. Respectful disagreement with clear reasoning is part of healthy collaboration. Explain why you made your choice, acknowledge what you might have missed, and be genuinely open to their perspective — they often know the codebase better than you. But if your reasoning is sound and they cannot articulate why it is wrong, that is worth discussing. The goal is the best outcome for the project, not "winning". Adding passive-aggressive code comments is unprofessional.'
  },

  {
    id: 22,
    section: 'Communication with maintainers',
    question: 'How should you address a maintainer when opening your first contribution to their project?',
    options: [
      'Do not add a greeting — it wastes everyone\'s time',
      'A brief, friendly greeting is appropriate — acknowledge this is your first contribution and express genuine interest in the project',
      'Address them by first name only — open source is informal',
      'Begin with a long personal introduction explaining your background and why you are qualified to contribute'
    ],
    correct: 1,
    explanation: 'A brief greeting and context is appropriate for a first contribution — it sets a human tone and helps the maintainer understand who you are. "This is my first contribution to this project — I\'ve been using it for X and wanted to fix Y" gives useful context. No greeting is fine for subsequent contributions once you have established a relationship. Long personal introductions are unnecessary and delay getting to the actual contribution.'
  },

  {
    id: 23,
    section: 'Communication with maintainers',
    question: 'A maintainer has been non-responsive to your PR for six weeks. You are frustrated and feel your work is being wasted. Which response best demonstrates open source community values?',
    options: [
      'Post a frustrated public message about the maintainer\'s negligence',
      'Leave a polite final comment on the PR explaining that if it cannot be merged you will close it and maintain the change in your fork — then follow through calmly',
      'Spam the issue tracker with related issues to get attention',
      'Demand that other contributors pressure the maintainer to respond'
    ],
    correct: 1,
    explanation: 'Maintainers are often volunteers managing many PRs alongside jobs and personal lives. Six weeks of silence is frustrating but common. The appropriate response: one final polite comment, offer to help in any way, explain what you will do if there is no response (close and fork), then follow through without public shaming. Maintaining a fork of the change for your own use is perfectly legitimate. Public complaints damage your reputation in the community.'
  },

  {
    id: 24,
    section: 'Communication with maintainers',
    question: 'You are assigned an issue but realise after two weeks that it is more complex than you expected and you cannot complete it. What should you do?',
    options: [
      'Continue working on it indefinitely — abandoning assigned issues is irresponsible',
      'Comment on the issue explaining you are unable to complete it and ask to unassign yourself so others can pick it up',
      'Silently abandon the issue — someone else will take it eventually',
      'Submit a partial solution as a PR and ask the maintainers to finish it'
    ],
    correct: 1,
    explanation: 'Communicating that you cannot complete something you committed to is the responsible thing to do. Leaving an issue "assigned" but inactive for weeks or months blocks other contributors who might want to work on it. A simple "this is more complex than I expected — I am unable to complete it, please unassign me" is professional and considerate. Submitting partial, broken work as a PR creates more work for the maintainer.'
  },

  {
    id: 25,
    section: 'Communication with maintainers',
    question: 'A project you contribute to receives funding and the maintainer offers to pay for your next contribution. What should you clarify before accepting?',
    options: [
      'Nothing — paid work means the maintainer has all rights to your contribution regardless of the project licence',
      'The terms of the arrangement: what the payment covers, what the expectations are, whether a CLA or work-for-hire agreement applies, and how it affects ownership of your contribution',
      'Whether the payment will affect your ability to list the contribution on your CV',
      'Whether other contributors are being paid the same amount'
    ],
    correct: 1,
    explanation: 'Moving from volunteer to paid contribution changes the legal relationship. Paid contributions may involve a work-for-hire arrangement where the maintainer owns the work rather than you licencing it. Clarify: what is being paid for, what the deliverable is, what happens to the intellectual property, and whether there is a written agreement. These are professional questions that any contractor asks and that any reputable maintainer will answer clearly.'
  },

  // ── SECTION 6: LICENCES AND INTELLECTUAL PROPERTY (5 questions) ──────────

  {
    id: 26,
    section: 'Licences and intellectual property',
    question: 'You want to use code from an MIT-licensed open source library in your commercial product. What are you required to do?',
    options: [
      'You cannot use MIT-licensed code commercially — open source is for non-commercial use only',
      'Include a copy of the MIT licence and the original copyright notice in your product or its documentation',
      'Pay a licensing fee to the original author',
      'Open-source your entire commercial product under the MIT licence as well'
    ],
    correct: 1,
    explanation: 'The MIT licence is one of the most permissive — it allows commercial use, modification, distribution, and sublicensing with minimal obligations. The only requirement is to include the original copyright notice and the licence text. You do not need to pay, you do not need to open-source your product. This is why MIT is widely used for libraries — developers can use them in commercial products without restriction.'
  },

  {
    id: 27,
    section: 'Licences and intellectual property',
    question: 'A project uses the GPL-3.0 licence. You modify the source code and want to distribute your modified version commercially. What does the GPL require you to do?',
    options: [
      'Pay a royalty to the original authors',
      'Release your modified source code under the GPL-3.0 licence as well — the GPL is "copyleft", meaning derivative works must also be open source under the same terms',
      'Nothing additional — the GPL allows modification and distribution without restriction',
      'Get written permission from all original contributors before distributing'
    ],
    correct: 1,
    explanation: 'The GPL is a "copyleft" or "share-alike" licence. If you distribute a modified GPL-licensed program, you must also release your modifications under the GPL and make the source code available. This is by design — the GPL ensures that improvements remain open source. This is why some companies avoid GPL libraries in commercial products that they do not want to open-source. MIT and Apache are "permissive" alternatives that do not require this.'
  },

  {
    id: 28,
    section: 'Licences and intellectual property',
    question: 'You find useful code in a repository with no licence file. Can you use it in your project?',
    options: [
      'Yes — no licence means it is public domain and can be used freely',
      'No — without an explicit licence, all rights are reserved by the author by default, and you do not have permission to use, modify, or distribute the code',
      'Yes — open source code on public platforms is always free to use',
      'Yes — as long as you give attribution in your code comments'
    ],
    correct: 1,
    explanation: 'Copyright is automatic — it does not require a licence file or a copyright symbol. Without an explicit licence granting you rights, all rights are reserved by the author and you technically need permission to use, copy, modify, or distribute the code. In practice, many developers contact the author and ask for an explicit licence. The safest approach is to not use unlicensed code in production. If you want your code to be usable, add a licence file.'
  },

  {
    id: 29,
    section: 'Licences and intellectual property',
    question: 'What is the Apache 2.0 licence\'s key advantage over the MIT licence for enterprise users?',
    options: [
      'Apache 2.0 allows commercial use; MIT does not',
      'Apache 2.0 includes an explicit patent grant — contributors cannot later sue users of the software for patent infringement based on their contributions',
      'Apache 2.0 is more permissive and has fewer requirements',
      'Apache 2.0 is approved by more open source foundations than MIT'
    ],
    correct: 1,
    explanation: 'Both MIT and Apache 2.0 are permissive licences that allow commercial use. The key difference is that Apache 2.0 includes an explicit patent licence — each contributor grants users a royalty-free licence to any patents they hold that are necessary to use the software. This is important for enterprises that worry about patent liability. MIT has no explicit patent clause. This is why companies like Google and Microsoft often prefer Apache 2.0 for their open source projects.'
  },

  {
    id: 30,
    section: 'Licences and intellectual property',
    question: 'You contribute to a project that later relicences from MIT to GPL-3.0. Your past contributions are already in the codebase. Can the project relicence your contributions without your permission?',
    options: [
      'Yes — once contributed, the project owns your code',
      'It depends on whether you signed a CLA or copyright assignment agreement. Without one, the project needs your permission to relicence your contributions.',
      'No — contributions are always irrevocably MIT licenced once submitted',
      'Yes — the project maintainer\'s licence choice supersedes contributor rights'
    ],
    correct: 1,
    explanation: 'Copyright in a contribution remains with the contributor unless they signed a CLA or copyright assignment transferring ownership. Without such an agreement, relicencing requires consent from all contributors — which is why large projects sometimes struggle to relicence (tracking down every contributor is extremely difficult). This is also why some projects require CLAs upfront: to give themselves flexibility to change licences without needing retrospective permission.'
  },

  // ── SECTION 7: CODE QUALITY FOR EXTERNAL CONTRIBUTION (5 questions) ───────

  {
    id: 31,
    section: 'Code quality for external contribution',
    question: 'Why is the quality bar typically higher for open source contributions than for internal code at your company?',
    options: [
      'It is not — internal code is held to a higher standard because it affects the business directly',
      'Open source code is read, used, and maintained by a global community of developers — clarity, documentation, and correctness matter more because there is no shared context between the author and all future readers',
      'Open source maintainers have more time to enforce standards',
      'There is no difference — code quality standards should be the same everywhere'
    ],
    correct: 1,
    explanation: 'Internal code benefits from shared context — your colleagues know the codebase, can ask you questions, and understand the business domain. Open source code is read by developers worldwide who have none of that context. A function that is obvious to you may be opaque to someone from a different background. This is why open source code demands clearer naming, more comprehensive documentation, more thorough tests, and more careful consideration of edge cases.'
  },

  {
    id: 32,
    section: 'Code quality for external contribution',
    question: 'A project\'s test suite has 94% coverage. Your bug fix adds 15 lines of code. What should your PR include?',
    options: [
      'Just the bug fix — tests are the maintainer\'s responsibility',
      'The bug fix and tests that cover the new code and demonstrate that the bug is fixed',
      'The bug fix and a comment explaining why tests are not needed for this change',
      'The bug fix and a request for the maintainer to write the tests'
    ],
    correct: 1,
    explanation: 'If a project has tests (especially high coverage), your contribution should include tests. Specifically: a test that fails before your fix and passes after (proving your fix works), and tests for the new code paths you added. PRs without tests in tested projects are routinely rejected or returned with "please add tests". Understanding what to test is part of what this certification verifies.'
  },

  {
    id: 33,
    section: 'Code quality for external contribution',
    question: 'You refactor some code in a project to use a more modern pattern while fixing a bug. The refactoring is unrelated to the bug. Should you include it in the same PR?',
    options: [
      'Yes — if you\'re touching the code anyway, it\'s more efficient to clean it up at the same time',
      'No — keep the PR focused on the bug fix only. Open a separate PR or issue for the refactoring so each change can be reviewed and discussed independently',
      'Yes — but only if the refactoring makes the bug fix easier to understand',
      'It depends on how large the refactoring is'
    ],
    correct: 1,
    explanation: 'Mixing bug fixes and refactoring in one PR makes both harder to review and harder to revert if something goes wrong. If the maintainer wants the bug fix but not the refactoring, they cannot merge your PR as-is. Separate PRs: the bug fix can be merged immediately, and the refactoring can be discussed and potentially rejected without affecting the fix. This is sometimes called "one logical change per PR".'
  },

  {
    id: 34,
    section: 'Code quality for external contribution',
    question: 'The project you are contributing to has no documentation for the function you are adding. What should you include in your PR?',
    options: [
      'Nothing — documentation is a separate concern and adding it may be overstepping',
      'Documentation for your new function in whatever format the project uses (JSDoc, docstrings, markdown) — undocumented public APIs are a quality problem',
      'A note in the PR description that documentation should be added later',
      'A separate issue for adding documentation after the PR is merged'
    ],
    correct: 1,
    explanation: 'Adding a public function without documentation is adding technical debt. If the project uses JSDoc, add JSDoc. If it uses Python docstrings, add docstrings. If it has a docs folder, add an entry. Undocumented APIs force users to read the source code to understand how to use the function. A PR that includes tests and documentation is significantly more likely to be merged without changes.'
  },

  {
    id: 35,
    section: 'Code quality for external contribution',
    question: 'You notice that the project\'s code style is inconsistent — some files use single quotes, others use double quotes. Your contribution uses single quotes to match the majority. What should you do?',
    options: [
      'Fix all inconsistencies across the entire codebase in your PR',
      'Follow the majority style in your contribution only. If the project has a linter config, follow that. Mention the inconsistency in your PR description if relevant.',
      'Use whichever style you personally prefer',
      'Open a separate issue about the inconsistency but do not mention it in your PR'
    ],
    correct: 1,
    explanation: 'Fixing an entire codebase\'s style inconsistency in a bug fix PR would create a massive, hard-to-review PR that touches hundreds of files. Your contribution should follow the project\'s intended style (check for .eslintrc, .prettierrc etc.) or the majority pattern if no config exists. Mention the inconsistency in your PR if it is relevant context. If the maintainer wants a style cleanup, that is a separate conversation and a separate PR.'
  },

  // ── SECTION 8: COMMUNITY NORMS AND ETIQUETTE (5 questions) ───────────────

  {
    id: 36,
    section: 'Community norms and etiquette',
    question: 'You believe an open source project is making the wrong technical decisions. You have commented on several issues expressing strong disagreement. The maintainer has politely explained their reasoning twice. What is the appropriate next step?',
    options: [
      'Continue arguing until the maintainer changes their mind',
      'Accept that the maintainer has heard your view and disagrees — it is their project. If you genuinely believe your approach is better, fork the project.',
      'Rally other users to pressure the maintainer publicly',
      'Write a blog post criticising the project\'s technical decisions'
    ],
    correct: 1,
    explanation: 'Maintainers are not obligated to implement your technical preferences. If they have heard your reasoning, considered it, and decided otherwise, that is their right — it is their project. Continuing to argue is harassment. The correct response is to accept the decision (you may still be wrong) or fork the project if you genuinely need a different approach. Forking is a feature of open source, not a failure — many excellent projects started as forks.'
  },

  {
    id: 37,
    section: 'Community norms and etiquette',
    question: 'You are reviewing another contributor\'s open source PR (not your project — you are a contributor too). You find a security vulnerability in their code. How should you handle it?',
    options: [
      'Comment publicly on the PR explaining the vulnerability in detail',
      'Contact the maintainer privately and report the vulnerability through the project\'s security reporting process before any public disclosure',
      'Fix the vulnerability yourself in a separate PR without mentioning it',
      'Tell the contributor privately so they can fix it without involving the maintainer'
    ],
    correct: 1,
    explanation: 'Security vulnerabilities must never be disclosed publicly before the maintainer has a chance to fix them — this is called responsible disclosure. Commenting on a public PR gives bad actors the vulnerability before a fix exists. Contact the maintainer privately through their security reporting process (often SECURITY.md or a private email). The maintainer then coordinates the fix and disclosure timeline. This is a fundamental open source security norm.'
  },

  {
    id: 38,
    section: 'Community norms and etiquette',
    question: 'What does "assuming good faith" mean in open source communication and why does it matter?',
    options: [
      'Assuming that all contributors have good intentions unless proven otherwise — it creates a more welcoming environment and reduces unnecessary conflict',
      'Assuming that all code contributions are correct until they are proven to have bugs',
      'Giving maintainers the benefit of the doubt when they make poor technical decisions',
      'Accepting all PRs without review to encourage participation'
    ],
    correct: 0,
    explanation: 'Text-based communication removes tone, facial expressions, and body language. A blunt code review comment can easily be read as hostile even when it was written with helpful intent. Assuming good faith means interpreting ambiguous messages charitably — the reviewer who wrote "this is wrong" probably meant "this has an issue" not "you are incompetent". This creates a more welcoming environment, reduces conflict, and leads to better outcomes. It is a skill worth developing.'
  },

  {
    id: 39,
    section: 'Community norms and etiquette',
    question: 'You are a newer contributor and a more experienced contributor in the project dismisses your idea without explanation. What is the most constructive response?',
    options: [
      'Accept the dismissal — more experienced contributors always know better',
      'Politely ask for clarification: "Could you help me understand why this approach would not work? I want to make sure I\'m understanding the constraints correctly."',
      'Immediately escalate to the maintainer to resolve the disagreement',
      'Stop contributing to the project — the community is unwelcoming'
    ],
    correct: 1,
    explanation: 'Asking for clarification is both the most constructive and the most educational response. The experienced contributor may have a very good reason that you are missing — understanding it makes you a better contributor. They may also be wrong, and your question gives them the chance to reconsider. Either way, asking respectfully for the reasoning is the right move. Blind acceptance, immediate escalation, and withdrawal are all less constructive.'
  },

  {
    id: 40,
    section: 'Community norms and etiquette',
    question: 'What is the most important thing you can contribute to an open source project beyond code?',
    options: [
      'Stars — they increase visibility and attract more contributors',
      'Money — financial support keeps projects alive',
      'Thoughtful participation: quality bug reports, helpful comments on issues and PRs, welcoming new contributors, improving documentation, and spreading the word about the project',
      'Technical expertise — only senior developers make meaningful contributions'
    ],
    correct: 2,
    explanation: 'Open source is a community effort. Some of the highest-value contributions are not code: a well-written bug report saves hours of debugging, a welcoming comment on a first-timer\'s PR brings a new long-term contributor into the community, and improved documentation helps thousands of users. Stars and money have value but are passive. Technical expertise matters but is not a prerequisite for meaningful participation. The most valuable open source contributors combine technical contributions with active, positive community engagement.'
  },

];
