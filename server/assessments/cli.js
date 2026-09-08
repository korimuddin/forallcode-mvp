export const CLI_QUESTIONS = [

  // ── SECTION 1: NAVIGATION AND FILE SYSTEM (5 questions) ──────────────────

  {
    id: 1,
    section: 'Navigation and file system',
    question: 'You are in /home/user/projects/myapp and want to navigate to /home/user/documents. Which command is most efficient?',
    options: [
      'cd /home/user/documents',
      'cd ../../documents',
      'cd ~/documents',
      'Both A and C are equally efficient — B is also correct but less readable'
    ],
    correct: 3,
    explanation: 'All three work. cd /home/user/documents uses the absolute path. cd ../../documents uses a relative path (up two levels then into documents). cd ~/documents uses the tilde shortcut for the home directory — the most concise. Options A and C are equivalent in effect. Option B works but requires knowing the directory structure depth. The question tests whether you know all approaches are valid.'
  },

  {
    id: 2,
    section: 'Navigation and file system',
    question: 'What does the command `ls -la` display that `ls` alone does not?',
    options: [
      'Files in subdirectories recursively',
      'Hidden files (starting with .) and detailed information including permissions, owner, size, and modification date',
      'Files sorted by last access time',
      'Only directories, not files'
    ],
    correct: 1,
    explanation: '-l shows the long format (permissions, owner, group, size, date, name). -a shows all files including hidden ones (those starting with a dot, like .gitignore or .env). Combined as -la, you see the full details of every file including hidden ones. ls alone shows only non-hidden files without metadata.'
  },

  {
    id: 3,
    section: 'Navigation and file system',
    question: 'What does `pwd` output?',
    options: [
      'A list of previously visited directories',
      'The full absolute path of the current working directory',
      'The contents of the current directory',
      'The current user\'s home directory'
    ],
    correct: 1,
    explanation: 'pwd stands for "print working directory". It outputs the full absolute path of the directory you are currently in — for example /home/user/projects/myapp. It is useful when you are deep in a directory structure and need to confirm exactly where you are.'
  },

  {
    id: 4,
    section: 'Navigation and file system',
    question: 'You want to find all .log files anywhere under /var/logs. Which command achieves this?',
    options: [
      'ls /var/logs/*.log',
      'find /var/logs -name "*.log"',
      'search /var/logs -type log',
      'grep -r ".log" /var/logs'
    ],
    correct: 1,
    explanation: 'find is the correct tool for recursive file searches. find /var/logs -name "*.log" searches the /var/logs directory and all subdirectories for files matching *.log. ls /var/logs/*.log only searches the top level of /var/logs and fails if there are no matches. There is no "search" command. grep searches file content, not filenames.'
  },

  {
    id: 5,
    section: 'Navigation and file system',
    question: 'What is the difference between an absolute path and a relative path?',
    options: [
      'Absolute paths are shorter; relative paths are longer',
      'Absolute paths start from the root (/) and work from any location; relative paths are relative to the current directory and change meaning depending on where you are',
      'Absolute paths only work on Linux; relative paths work on all operating systems',
      'There is no practical difference — they both describe the same location'
    ],
    correct: 1,
    explanation: 'An absolute path always starts with / and describes the full path from the root of the filesystem — it works the same regardless of your current directory. A relative path describes a location relative to wherever you currently are — ../config means "go up one level then into config", which refers to a different place depending on your current directory. Understanding this distinction prevents many navigation errors.'
  },

  // ── SECTION 2: FILE AND DIRECTORY OPERATIONS (6 questions) ───────────────

  {
    id: 6,
    section: 'File and directory operations',
    question: 'You run `rm -rf /` by mistake. What happens?',
    options: [
      'Nothing — / is a protected directory that cannot be deleted',
      'It attempts to recursively delete the entire filesystem starting from the root — a catastrophic and largely irreversible operation',
      'It deletes all files but preserves directory structure',
      'It prompts for confirmation before deleting each file'
    ],
    correct: 1,
    explanation: 'rm -rf / is one of the most dangerous commands in existence. -r means recursive (delete directories and their contents), -f means force (no confirmation prompts). Starting at / (root) means the entire filesystem. Modern systems often have protections against this specific command, but variations (rm -rf /*) bypass them. This question exists to ensure you understand that rm -rf is irreversible and that you must always double-check the path.'
  },

  {
    id: 7,
    section: 'File and directory operations',
    question: 'What is the difference between `cp file.txt backup/` and `mv file.txt backup/`?',
    options: [
      'cp moves the file; mv copies it',
      'cp creates a copy in backup/ while leaving the original; mv moves the original to backup/ and removes it from the current location',
      'They are identical — cp and mv do the same thing',
      'cp works on files only; mv works on files and directories'
    ],
    correct: 1,
    explanation: 'cp (copy) duplicates the file — the original remains in the current location and a copy appears in backup/. mv (move) relocates the file — it appears in backup/ and is removed from the current location. This is a fundamental distinction. After cp you have two copies; after mv you have one.'
  },

  {
    id: 8,
    section: 'File and directory operations',
    question: 'You want to create the directory structure /projects/forallcode/src/components in one command. Which command works?',
    options: [
      'mkdir /projects/forallcode/src/components',
      'mkdir -p /projects/forallcode/src/components',
      'mkdirs /projects/forallcode/src/components',
      'mkdir /projects && mkdir /projects/forallcode && mkdir /projects/forallcode/src && mkdir /projects/forallcode/src/components'
    ],
    correct: 1,
    explanation: 'mkdir alone fails if any parent directory does not exist. mkdir -p (parents) creates all missing intermediate directories in one command. Option D works but is unnecessarily verbose. There is no mkdirs command.'
  },

  {
    id: 9,
    section: 'File and directory operations',
    question: 'You want to rename a file from old-name.js to new-name.js. Which command do you use?',
    options: [
      'rename old-name.js new-name.js',
      'mv old-name.js new-name.js',
      'cp old-name.js new-name.js && rm old-name.js',
      'Both B and C work — B is simpler'
    ],
    correct: 3,
    explanation: 'mv is the standard way to rename files — moving a file to a new name in the same directory is functionally a rename. cp then rm also works but is two commands and leaves a window where both files exist simultaneously. rename exists on some systems but is not universally available. Both B and C achieve the result, but B is the standard approach.'
  },

  {
    id: 10,
    section: 'File and directory operations',
    question: 'You delete a file with `rm file.txt`. Where does it go?',
    options: [
      'To the Trash or Recycle Bin, from which it can be recovered',
      'Nowhere — it is immediately and permanently removed from the filesystem with no system-level recovery mechanism',
      'To a hidden .deleted folder in the current directory',
      'To /tmp where it stays until the system is restarted'
    ],
    correct: 1,
    explanation: 'Unlike graphical file managers, rm in the terminal does not use a Trash or Recycle Bin — the file is immediately unlinked from the filesystem. Recovery is theoretically possible with forensic tools if the disk space has not been overwritten, but there is no standard recovery mechanism. This is why you must always double-check before running rm, especially with -rf.'
  },

  {
    id: 11,
    section: 'File and directory operations',
    question: 'What does `touch newfile.txt` do if newfile.txt does not exist?',
    options: [
      'It fails with an error since the file does not exist',
      'It creates an empty file named newfile.txt',
      'It opens newfile.txt in the default text editor',
      'It creates a temporary file that is deleted when the terminal session ends'
    ],
    correct: 1,
    explanation: 'touch has two functions: if the file does not exist, it creates an empty file. If the file does exist, it updates the file\'s last-modified timestamp without changing its content. It is commonly used to create placeholder files or to trigger build systems that watch modification times.'
  },

  // ── SECTION 3: VIEWING AND EDITING FILE CONTENT (5 questions) ────────────

  {
    id: 12,
    section: 'Viewing and editing file content',
    question: 'You want to view a large log file page by page without loading it all into memory. Which command is best?',
    options: [
      'cat logfile.log — it streams the file line by line',
      'less logfile.log — it displays one page at a time and allows scrolling',
      'open logfile.log — it opens the file in a viewer',
      'read logfile.log — it reads the file into memory efficiently'
    ],
    correct: 1,
    explanation: 'less is designed for paging through large files — it only loads what fits on screen, allows forward and backward navigation (unlike more which only goes forward), and supports searching with /. cat outputs the entire file at once — fine for small files, impractical for large ones. open launches a GUI application on macOS but does not exist universally. read is a shell built-in for reading input, not for viewing files.'
  },

  {
    id: 13,
    section: 'Viewing and editing file content',
    question: 'What does `grep "error" application.log` do?',
    options: [
      'Counts the number of times "error" appears in application.log',
      'Displays only the lines in application.log that contain the text "error"',
      'Replaces all occurrences of "error" in application.log with an empty string',
      'Checks whether application.log contains any errors and exits with a status code'
    ],
    correct: 1,
    explanation: 'grep searches file content and prints lines that match the pattern. grep "error" application.log prints every line in application.log that contains the word "error". It does not count (use grep -c for that), replace (use sed for that), or modify the file in any way.'
  },

  {
    id: 14,
    section: 'Viewing and editing file content',
    question: 'You want to see only the last 20 lines of a log file that is currently being written to, updating in real time. Which command achieves this?',
    options: [
      'tail -f -n 20 logfile.log',
      'cat -last 20 logfile.log',
      'less +F logfile.log',
      'Both A and C work — A is more common'
    ],
    correct: 3,
    explanation: 'tail -f -n 20 outputs the last 20 lines and then follows the file, printing new lines as they are added. less +F also follows a file in real time (press F to start following, Ctrl+C to stop and browse). Both are valid. cat has no -last flag. tail -f is more universally known and commonly used for log monitoring.'
  },

  {
    id: 15,
    section: 'Viewing and editing file content',
    question: 'What is the output of `cat file1.txt file2.txt`?',
    options: [
      'The contents of file1.txt with file2.txt appended to it, saved to a new file',
      'The combined contents of both files printed to standard output, one after the other',
      'A comparison of the two files showing differences',
      'An error — cat only accepts one file argument'
    ],
    correct: 1,
    explanation: 'cat (concatenate) accepts multiple files and prints their contents to standard output in order — file1.txt\'s content followed immediately by file2.txt\'s content. It does not save to a file (use cat file1.txt file2.txt > combined.txt for that), does not compare files (use diff for that), and accepts any number of file arguments.'
  },

  {
    id: 16,
    section: 'Viewing and editing file content',
    question: 'You want to count the number of lines in a file. Which command gives you this information?',
    options: [
      'count lines.txt',
      'wc -l lines.txt',
      'grep -c "" lines.txt',
      'Both B and C return the line count — B is more common'
    ],
    correct: 3,
    explanation: 'wc -l (word count, lines flag) is the standard command for counting lines. grep -c "" counts lines that match the empty pattern — which is all lines — also returning the line count. Both are correct. There is no "count" command. Knowing multiple approaches demonstrates depth of understanding.'
  },

  // ── SECTION 4: PERMISSIONS AND OWNERSHIP (5 questions) ───────────────────

  {
    id: 17,
    section: 'Permissions and ownership',
    question: 'A file has permissions -rwxr-xr--. What can the group do with this file?',
    options: [
      'Read, write, and execute',
      'Read and execute only',
      'Read only',
      'Nothing — the group has no permissions'
    ],
    correct: 1,
    explanation: 'Permission strings are read as: [type][owner][group][others]. -rwxr-xr-- breaks down as: type=file(-), owner=rwx (read+write+execute), group=r-x (read+execute, no write), others=r-- (read only). The group (middle three characters: r-x) can read and execute but not write to the file.'
  },

  {
    id: 18,
    section: 'Permissions and ownership',
    question: 'You create a script and want to make it executable for the owner only. Which command achieves this?',
    options: [
      'chmod 777 script.sh',
      'chmod u+x script.sh',
      'chmod +x script.sh',
      'chmod 755 script.sh'
    ],
    correct: 1,
    explanation: 'chmod u+x adds execute permission for the user (owner) only. chmod +x adds execute for everyone (user, group, and others). chmod 755 gives owner rwx and everyone else r-x. chmod 777 gives everyone full permissions including write — a significant security risk. For owner-only execute, u+x is the precise answer.'
  },

  {
    id: 19,
    section: 'Permissions and ownership',
    question: 'What does chmod 644 filename mean in numeric notation?',
    options: [
      'Owner: read+write+execute, Group: read, Others: read',
      'Owner: read+write, Group: read, Others: read',
      'Owner: read+write, Group: read+write, Others: read',
      'Owner: execute, Group: read, Others: read'
    ],
    correct: 1,
    explanation: 'Numeric permissions use octal: r=4, w=2, x=1. 6 = 4+2 = read+write. 4 = read only. 644 = owner(6=rw-), group(4=r--), others(4=r--). This is the standard permission for web server files — owner can edit, everyone else can read. 755 (rwxr-xr-x) is standard for directories and scripts.'
  },

  {
    id: 20,
    section: 'Permissions and ownership',
    question: 'You try to run a script with `./myscript.sh` and get "Permission denied". What is the most likely cause and fix?',
    options: [
      'The script has a syntax error — run bash myscript.sh to debug it',
      'The script does not have execute permission — run chmod +x myscript.sh first',
      'You need to be root to run shell scripts — use sudo ./myscript.sh',
      'The script path is wrong — use the absolute path instead'
    ],
    correct: 1,
    explanation: '"Permission denied" when running a script most commonly means the execute bit is not set. chmod +x myscript.sh adds execute permission. You can also run it with bash myscript.sh (which does not require execute permission since bash runs it directly), but the correct long-term fix is to make the script executable. sudo is not required for normal scripts and introduces unnecessary privilege escalation.'
  },

  {
    id: 21,
    section: 'Permissions and ownership',
    question: 'What does `sudo` do and when should you use it?',
    options: [
      'sudo runs a command as a different user — use it whenever a command fails',
      'sudo runs a command with superuser (root) privileges — use it only when a command genuinely requires elevated permissions, and understand what the command does before running it with sudo',
      'sudo is a safety mode that prevents commands from making permanent changes',
      'sudo temporarily disables all file permission checks for the current session'
    ],
    correct: 1,
    explanation: 'sudo (superuser do) runs a command as root — the highest privilege level with access to everything on the system. Use it only when genuinely necessary (installing system packages, editing system configuration files, etc.) and only when you understand what the command will do. Running arbitrary commands with sudo that fail without it is a dangerous habit — the permission error often exists for good reason.'
  },

  // ── SECTION 5: PROCESSES AND SYSTEM (5 questions) ─────────────────────────

  {
    id: 22,
    section: 'Processes and system',
    question: 'A process is running and consuming too much CPU. You identify its PID as 4521. How do you terminate it gracefully?',
    options: [
      'kill -9 4521',
      'kill 4521',
      'stop 4521',
      'terminate 4521'
    ],
    correct: 1,
    explanation: 'kill 4521 without a signal flag sends SIGTERM (signal 15) — a graceful termination request that allows the process to clean up and exit normally. kill -9 sends SIGKILL — an immediate, forceful termination that gives the process no chance to clean up. Use SIGTERM first; only escalate to SIGKILL if the process does not respond. There is no stop or terminate command.'
  },

  {
    id: 23,
    section: 'Processes and system',
    question: 'You run a long process and want to continue using the terminal while it runs. What is the correct approach?',
    options: [
      'Open a new terminal window — you cannot background processes in the same terminal',
      'Append & to the command to run it in the background: long-process &',
      'Press Ctrl+Z to pause it and then type bg to resume it in the background',
      'Both B and C work — B starts in background from the beginning, C backgrounds a running foreground process'
    ],
    correct: 3,
    explanation: 'Both approaches work. Appending & starts the process directly in the background — you get the terminal back immediately. Ctrl+Z pauses a running foreground process (SIGSTOP), then bg resumes it in the background. Use & when you know in advance you want the process in the background. Use Ctrl+Z + bg when you have already started a process in the foreground and want to background it without restarting.'
  },

  {
    id: 24,
    section: 'Processes and system',
    question: 'What does `ps aux` display?',
    options: [
      'The auxiliary system processes — processes run by the operating system only',
      'A snapshot of all running processes with their PID, user, CPU usage, memory usage, and command',
      'A real-time updating view of process activity sorted by CPU usage',
      'Only processes started in the current terminal session'
    ],
    correct: 1,
    explanation: 'ps aux shows a static snapshot of all running processes. a = all users, u = user-readable format (shows user, CPU, memory), x = include processes not attached to a terminal. For a real-time updating view, use top or htop. ps shows a moment-in-time snapshot, not a continuous feed.'
  },

  {
    id: 25,
    section: 'Processes and system',
    question: 'You are running a process in the foreground and want to stop it immediately. What do you press?',
    options: [
      'Ctrl+Z — this stops the process',
      'Ctrl+C — this sends SIGINT which interrupts and terminates the process',
      'Ctrl+D — this closes the process',
      'Ctrl+X — this exits the process'
    ],
    correct: 1,
    explanation: 'Ctrl+C sends SIGINT (interrupt signal) to the foreground process, which typically terminates it. Ctrl+Z sends SIGSTOP which pauses (suspends) the process without terminating it — it can be resumed with fg or bg. Ctrl+D sends EOF (end of file) which closes the current shell session or signals the end of input to a program. Ctrl+X has no universal meaning (it is an Emacs shortcut).'
  },

  {
    id: 26,
    section: 'Processes and system',
    question: 'What does `df -h` display?',
    options: [
      'A list of all defined functions in the current shell',
      'Disk filesystem usage — how much space is used and available on each mounted filesystem, in human-readable format',
      'The default file permissions for the current user',
      'Directory fragmentation statistics'
    ],
    correct: 1,
    explanation: 'df (disk free) shows filesystem disk space usage. -h makes it human-readable (showing GB, MB rather than raw bytes). It shows each mounted filesystem, total size, used space, available space, and mount point. Use this when you need to check disk space. du (disk usage) shows how much space individual files and directories consume.'
  },

  // ── SECTION 6: ENVIRONMENT VARIABLES AND CONFIGURATION (5 questions) ──────

  {
    id: 27,
    section: 'Environment variables and configuration',
    question: 'You set an environment variable with `export MY_VAR=hello`. You open a new terminal window. Is MY_VAR available?',
    options: [
      'Yes — export makes variables permanently available across all sessions',
      'No — export makes a variable available to child processes of the current session, but not to new terminal sessions',
      'Yes — but only for 24 hours, after which it expires',
      'It depends on whether you have superuser privileges'
    ],
    correct: 1,
    explanation: 'export makes a variable available to child processes spawned from the current shell session — for example, a script you run from that terminal can access it. But when you close the terminal or open a new one, a fresh shell starts without that variable. To make variables persistent across sessions, add them to your shell configuration file (~/.bashrc, ~/.zshrc, or ~/.bash_profile).'
  },

  {
    id: 28,
    section: 'Environment variables and configuration',
    question: 'What is the PATH environment variable and why does it matter?',
    options: [
      'It stores the current directory you are in — the same as pwd',
      'It is a colon-separated list of directories the shell searches when you type a command, determining which programs can be run by name without specifying their full path',
      'It is the path to the user\'s home directory',
      'It controls which files the current user has permission to access'
    ],
    correct: 1,
    explanation: 'PATH is a list of directories (separated by :) that the shell searches in order when you type a command. When you type "node", the shell looks for an executable called "node" in each PATH directory until it finds one. This is why installing a program often requires adding its directory to PATH. If a command is not found, it usually means its directory is not in PATH.'
  },

  {
    id: 29,
    section: 'Environment variables and configuration',
    question: 'Where should you add a permanent environment variable on a bash system?',
    options: [
      '/etc/environment — the only correct location for environment variables',
      '~/.bashrc or ~/.bash_profile (or ~/.zshrc for zsh) — your shell configuration file that runs on each new session',
      'Directly into the kernel configuration',
      'In /tmp/environment — a temporary file that is read on each login'
    ],
    correct: 1,
    explanation: '~/.bashrc runs every time a new interactive bash shell starts. ~/.bash_profile runs on login shells. Adding export MY_VAR=value to either makes the variable available in all future sessions. /etc/environment affects all users system-wide and requires root — use it for system-level configuration, not personal variables. /tmp is temporary and cleared on reboot.'
  },

  {
    id: 30,
    section: 'Environment variables and configuration',
    question: 'What does `echo $HOME` output?',
    options: [
      'The text "$HOME" literally',
      'The path to the current user\'s home directory',
      'An error — HOME is not a standard variable',
      'The hostname of the current machine'
    ],
    correct: 1,
    explanation: 'The $ prefix expands a variable to its value. HOME is a standard environment variable set automatically by the shell to the current user\'s home directory (e.g. /home/username on Linux, /Users/username on macOS). Without the $, echo HOME would print the literal text "HOME". Standard variables include HOME, USER, PATH, SHELL, PWD, and TERM.'
  },

  {
    id: 31,
    section: 'Environment variables and configuration',
    question: 'You have a .env file containing API_KEY=abc123. How do you load it into your current shell session?',
    options: [
      'import .env',
      'source .env  (or . .env)',
      'load .env',
      'export .env'
    ],
    correct: 1,
    explanation: 'source .env (or its shorthand . .env) runs the .env file in the current shell context, executing each line as if you had typed it — which causes the variable assignments to take effect in your current session. import and load are not shell commands. export .env would try to export a variable named ".env" with no value, not load the file.'
  },

  // ── SECTION 7: PIPES, REDIRECTION, AND CHAINING (5 questions) ────────────

  {
    id: 32,
    section: 'Pipes, redirection, and chaining',
    question: 'What does `command1 | command2` do?',
    options: [
      'Runs command1 and command2 simultaneously in parallel',
      'Runs command1 and, if it succeeds, runs command2',
      'Sends the standard output of command1 as the standard input of command2',
      'Runs command2 only if command1 fails'
    ],
    correct: 2,
    explanation: 'The pipe (|) connects the stdout of the left command to the stdin of the right command. For example, cat file.txt | grep "error" sends the content of file.txt as input to grep. This is the Unix philosophy: small tools that do one thing well, combined into powerful pipelines. Parallel execution is &. Run if success is &&. Run if failure is ||.'
  },

  {
    id: 33,
    section: 'Pipes, redirection, and chaining',
    question: 'What is the difference between `>` and `>>` for output redirection?',
    options: [
      '> writes faster; >> writes more safely',
      '> overwrites the file if it exists; >> appends to the file',
      '> redirects stdout; >> redirects both stdout and stderr',
      "> is for text files; >> is for binary files"
    ],
    correct: 1,
    explanation: '> redirects stdout to a file, overwriting its contents if the file already exists. >> appends stdout to the end of the file, preserving existing content. Use > when you want to create or replace a file. Use >> when you want to add to an existing file — for example, appending to a log file. Getting these wrong is a common source of accidental data loss.'
  },

  {
    id: 34,
    section: 'Pipes, redirection, and chaining',
    question: 'You want to run three commands and stop if any one fails. Which syntax achieves this?',
    options: [
      'command1 ; command2 ; command3',
      'command1 && command2 && command3',
      'command1 || command2 || command3',
      'command1 | command2 | command3'
    ],
    correct: 1,
    explanation: '&& (AND) runs the next command only if the previous one succeeded (exit code 0). command1 && command2 && command3 stops at the first failure. ; runs commands sequentially regardless of whether previous ones succeeded or failed. || (OR) runs the next command only if the previous one failed. | pipes output between commands.'
  },

  {
    id: 35,
    section: 'Pipes, redirection, and chaining',
    question: 'What does `grep "error" log.txt 2>/dev/null` do differently from `grep "error" log.txt`?',
    options: [
      'It suppresses error messages from grep itself (stderr) by redirecting them to /dev/null',
      'It searches for errors in /dev/null instead of log.txt',
      'It makes grep run silently without any output',
      'It redirects the output of grep to /dev/null, discarding matches'
    ],
    correct: 0,
    explanation: '2>/dev/null redirects file descriptor 2 (stderr — standard error) to /dev/null (the null device that discards everything). This means error messages from grep (such as "Permission denied" or "No such file") are discarded, while successful matches still appear on stdout. /dev/null is not searched. The output (stdout, fd 1) is not affected.'
  },

  {
    id: 36,
    section: 'Pipes, redirection, and chaining',
    question: 'You run `cat /var/log/syslog | grep "error" | wc -l`. What does this pipeline output?',
    options: [
      'The content of syslog filtered to show error lines',
      'The number of lines in syslog that contain the word "error"',
      'A count of all words in syslog',
      'An error, because you cannot pipe more than two commands'
    ],
    correct: 1,
    explanation: 'This is a three-stage pipeline. cat outputs syslog content → grep filters to lines containing "error" → wc -l counts the remaining lines. The final output is a single number: how many lines in syslog contain "error". You can chain as many pipes as needed. This pattern — filter then count — is extremely common in log analysis.'
  },

  // ── SECTION 8: SHELL SCRIPTING BASICS (4 questions) ──────────────────────

  {
    id: 37,
    section: 'Shell scripting basics',
    question: 'What is the purpose of the first line `#!/bin/bash` in a shell script?',
    options: [
      'It is a comment explaining what the script does',
      'It is a shebang line that tells the operating system which interpreter to use when executing the script',
      'It imports the bash library into the script',
      'It is required syntax that all scripts must start with, regardless of interpreter'
    ],
    correct: 1,
    explanation: 'The shebang (#!) followed by the interpreter path tells the OS which program to use to execute the script when it is run as ./script.sh. #!/bin/bash means "use bash". #!/usr/bin/env python3 would mean "use python3". Without a shebang, the OS uses the current shell, which may not be what you intend. It is specifically the first line — anywhere else, it is treated as a comment.'
  },

  {
    id: 38,
    section: 'Shell scripting basics',
    question: 'In a bash script, what does `$1` refer to?',
    options: [
      'The script\'s process ID',
      'The first argument passed to the script when it was run',
      'The first line of the script',
      'The exit code of the last command'
    ],
    correct: 1,
    explanation: 'In bash scripts, positional parameters $1, $2, $3 etc. refer to the arguments passed to the script. If you run ./deploy.sh production, then $1 is "production". $0 is the script name itself. $# is the number of arguments. $@ is all arguments. $? is the exit code of the last command.'
  },

  {
    id: 39,
    section: 'Shell scripting basics',
    question: 'What does this script do?\n\n```\nfor file in *.log; do\n  echo "Processing $file"\n  gzip "$file"\ndone\n```',
    options: [
      'It lists all .log files and exits',
      'It loops through every .log file in the current directory, prints its name, and compresses it with gzip',
      'It creates a new .log file for each file in the directory',
      'It deletes all .log files after displaying their names'
    ],
    correct: 1,
    explanation: 'This is a for loop over a glob pattern. *.log matches all files ending in .log in the current directory. For each matching file, it prints "Processing filename" and then runs gzip on it (which compresses the file and replaces it with filename.log.gz). This is a practical script for bulk-compressing log files.'
  },

  {
    id: 40,
    section: 'Shell scripting basics',
    question: 'Your script should exit immediately if any command fails, rather than continuing with potentially invalid state. Which line at the start of the script achieves this?',
    options: [
      'set -e',
      'exit on error',
      'strict mode on',
      'set -x'
    ],
    correct: 0,
    explanation: 'set -e (also written as set -o errexit) causes the script to exit immediately if any command returns a non-zero exit code (indicating failure). Without it, bash continues executing even after errors, which can lead to scripts running in an invalid state. set -x enables debug mode (prints each command before executing it — useful for debugging but not for production). set -u (undefined) is also commonly combined: set -euo pipefail is a common safe scripting header.'
  },

];
