export const CLI_TASTER = {
  id: "cli",
  name: "Command Line Essentials",
  slug: "command-line-essentials",
  price: "£20",
  accentColour: "#c8a055",
  accentTextColour: "#fffdf9",
  upsellBg1: "#f5e4c4",
  upsellBg2: "#fffdf9",
  fullQuestionCount: 40,
  tasterQuestionCount: 6,
  fullSectionCount: 8,
  passPercent: 70,
  tasterDescription: "The terminal is the foundation of everything a developer does. This taster covers two of the eight assessed areas - navigation and pipes. Questions use real command-line scenarios with commands rendered in code style.",
  remainingTopicsDesc: "file and directory operations, viewing and editing content, permissions and ownership, processes and system, environment variables, and shell scripting basics",
  sections: [
    {
      title: "Navigation & file system",
      intro: "Moving confidently through the file system is the first skill to master. Understanding absolute versus relative paths and the right tools to find things efficiently are essential for everything else.",
      accentColour: "#c8a055",
      questions: [
        {
          difficulty: "easy",
          text: "You are in /home/user/projects/myapp. Which command navigates to /home/user/documents most efficiently?",
          options: [
            "cd /home/user/documents",
            "cd ../../documents",
            "cd ~/documents",
            "Both A and C are equally efficient - B also works"
          ],
          correct: 3,
          explanation: "All three work. cd /home/user/documents uses the absolute path. cd ../../documents is a relative path, up two levels. cd ~/documents uses the ~ home directory shortcut - the most concise. Knowing all approaches are valid demonstrates depth."
        },
        {
          difficulty: "medium",
          text: "What does `ls -la` display that `ls` alone does not?",
          options: [
            "Files in subdirectories recursively",
            "Hidden files (starting with .) plus detailed permissions, owner, size, and modification date",
            "Files sorted by last access time",
            "Only directories, not regular files"
          ],
          correct: 1,
          explanation: "-l shows long format with permissions, owner, size, and date. -a shows all files including hidden ones starting with a dot like .gitignore or .env. Combined as -la you see full details of every file including hidden ones."
        },
        {
          difficulty: "hard",
          text: "You want to find all .log files anywhere under /var/logs. Which command achieves this?",
          options: [
            "ls /var/logs/*.log",
            "find /var/logs -name \"*.log\"",
            "search /var/logs -type log",
            "grep -r \".log\" /var/logs"
          ],
          correct: 1,
          explanation: "find is the correct tool for recursive file searches. find /var/logs -name \"*.log\" searches all subdirectories. ls only searches the top level and fails if there are no matches at that level. grep searches file content, not filenames. There is no search command."
        }
      ]
    },
    {
      title: "Pipes, redirection & chaining",
      intro: "The Unix philosophy is to combine small tools into powerful pipelines. Understanding pipes, redirection, and command chaining is what separates a developer who can use the terminal from one who can work efficiently in it.",
      accentColour: "#d4848c",
      questions: [
        {
          difficulty: "easy",
          text: "What does `command1 | command2` do?",
          options: [
            "Runs both commands simultaneously in parallel",
            "Runs command2 only if command1 succeeds",
            "Sends the standard output of command1 as the standard input of command2",
            "Runs command2 only if command1 fails"
          ],
          correct: 2,
          explanation: "The pipe (|) connects stdout of the left command to stdin of the right. For example cat file.txt | grep \"error\" feeds the file content directly into grep. This is the Unix philosophy: small tools that do one thing well, combined into powerful pipelines."
        },
        {
          difficulty: "medium",
          text: "What is the difference between `>` and `>>` for output redirection?",
          options: [
            "> writes faster - >> is safer",
            "> overwrites the file if it exists - >> appends to the end of the file",
            "> redirects stdout - >> redirects both stdout and stderr",
            "> is for text files - >> is for binary files"
          ],
          correct: 1,
          explanation: "> redirects stdout to a file, overwriting existing content. >> appends to the file, preserving what is already there. Getting these confused is a common cause of accidental data loss - for example running > on a log file you meant to append to."
        },
        {
          difficulty: "hard",
          text: "You run: `cat /var/log/syslog | grep \"error\" | wc -l`. What does this output?",
          options: [
            "The filtered lines from syslog that contain the word \"error\"",
            "The number of lines in syslog that contain the word \"error\"",
            "A count of all words in the entire syslog file",
            "An error - you cannot pipe more than two commands together"
          ],
          correct: 1,
          explanation: "Three-stage pipeline: cat outputs syslog content, grep filters to lines containing \"error\", then wc -l counts those lines. The final output is a single number. You can chain as many pipes as needed. This filter-then-count pattern is extremely common in log analysis."
        }
      ]
    }
  ]
};
