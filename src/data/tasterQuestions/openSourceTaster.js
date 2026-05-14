export const OPEN_SOURCE_TASTER = {
  id: "open-source",
  name: "Open Source Contributor",
  slug: "open-source-contributor",
  price: "£20",
  accentColour: "#7aaa72",
  accentTextColour: "#fffdf9",
  upsellBg1: "#c8d8c4",
  upsellBg2: "#fffdf9",
  fullQuestionCount: 40,
  tasterQuestionCount: 6,
  fullSectionCount: 8,
  passPercent: 70,
  tasterDescription: "Contributing to open source proves you can work with real codebases and communicate professionally. This taster covers two of the eight assessed areas - finding the right project, and licences.",
  remainingTopicsDesc: "understanding contribution guidelines, the fork and PR workflow, writing good issues, communicating with maintainers, code quality for external contribution, and community norms",
  sections: [
    {
      title: "Finding the right project",
      intro: "Choosing the right project to contribute to is as important as the contribution itself. Reading project health signals correctly saves you from investing time in abandoned repositories or unwanted contributions.",
      accentColour: "#7aaa72",
      questions: [
        {
          difficulty: "easy",
          text: "You want to make your first open source contribution. Which type of issue is most appropriate to start with?",
          options: [
            "The most critical open issue - demonstrating commitment to important work",
            "Issues labelled \"good first issue\" or \"help wanted\" - explicitly scoped for new contributors",
            "Issues open for 6 months or more - the maintainers clearly need help",
            "Issues in the largest repositories - more visibility means more career benefit"
          ],
          correct: 1,
          explanation: "\"good first issue\" and \"help wanted\" labels exist because maintainers want external help and have scoped the work appropriately. Critical issues mean competing with experienced contributors. Old issues may be deliberately deprioritised. Popular repos give less personal guidance to new contributors."
        },
        {
          difficulty: "medium",
          text: "How do you assess whether an open source project is actively maintained before investing time in a contribution?",
          options: [
            "Check the star count - popular projects are always well maintained",
            "Look at recent commit activity, whether PRs get reviewed, how long issues sit without response, and recent releases",
            "Look for a maintained badge in the README",
            "Check if the repository has more than 100 contributors"
          ],
          correct: 1,
          explanation: "Stars reflect historical popularity, not current maintenance. A project can have millions of stars and be completely abandoned. Real signals: recent commits, PRs being reviewed and merged, issues receiving responses, and recent releases. A project with a good \"good first issue\" but no activity for 18 months will likely never merge your PR."
        },
        {
          difficulty: "hard",
          text: "You want to add a new feature to an open source project. What should you do before writing any code?",
          options: [
            "Write the code and open a PR - maintainers respond better to seeing the actual work",
            "Check if an issue exists for the feature - if not, open one and propose it first, then wait for maintainer feedback",
            "Fork the repo and use the feature yourself - if maintainers see it in use they will merge it",
            "Email the maintainers directly for pre-approval before doing anything"
          ],
          correct: 1,
          explanation: "Unsolicited feature PRs are one of the most common first-contributor mistakes. Maintainers may have already decided against the feature or have a different approach in mind. Opening an issue first takes 10 minutes and can save hours of wasted work. Show, do not tell works for bug fixes - not for new features."
        }
      ]
    },
    {
      title: "Licences & intellectual property",
      intro: "Understanding open source licences is not optional - it has real legal implications. The choice of licence determines what you and others can do with code, including using it commercially or incorporating it into proprietary products.",
      accentColour: "#9b8fd4",
      questions: [
        {
          difficulty: "easy",
          text: "You want to use code from an MIT-licensed library in your commercial product. What are you required to do?",
          options: [
            "You cannot - open source is for non-commercial use only",
            "Include a copy of the MIT licence and the original copyright notice in your product",
            "Pay a licensing fee to the original author",
            "Open-source your entire commercial product under the MIT licence as well"
          ],
          correct: 1,
          explanation: "The MIT licence is one of the most permissive - it allows commercial use, modification, distribution, and sublicensing. The only requirement is to include the original copyright notice and the licence text. No payment required, no open-sourcing required. This is why MIT is so widely used for libraries."
        },
        {
          difficulty: "medium",
          text: "A repository has no licence file. Can you use the code in your project?",
          options: [
            "Yes - no licence means it is in the public domain and can be used freely",
            "No - without an explicit licence all rights are reserved by the author and you technically need permission",
            "Yes - open source code on public platforms is always free to use",
            "Yes - as long as you give attribution in your code comments"
          ],
          correct: 1,
          explanation: "Copyright is automatic - it does not require a licence file or copyright symbol. Without an explicit licence granting you rights, all rights are reserved. The safest approach is to not use unlicensed code in production and to contact the author to request an explicit licence if you want to use the code."
        },
        {
          difficulty: "hard",
          text: "A project uses GPL-3.0. You modify the source code and want to distribute your modified version commercially. What does the GPL require?",
          options: [
            "Pay a royalty to the original authors",
            "Release your modified source code under GPL-3.0 as well - derivative works must also be open source",
            "Nothing additional - the GPL allows commercial distribution without restriction",
            "Get written permission from all original contributors before distributing"
          ],
          correct: 1,
          explanation: "GPL is copyleft - if you distribute a modified GPL program you must also release your modifications under GPL and make source available. This is by design. This is why some companies avoid GPL libraries in commercial products they do not want to open-source. MIT and Apache 2.0 are permissive alternatives that do not require this."
        }
      ]
    }
  ]
};
