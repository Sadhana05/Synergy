# Synergy Terminal Documentation

## Overview
The Synergy Terminal is a fully functional command-line interface integrated into the Synergy collaborative coding environment. It provides file management, workspace operations, and system utilities with a professional terminal experience.

## Features

### 🎯 Core Functionality
- **Command Execution** - Full command parsing and execution
- **Command History** - Navigate through previous commands with arrow keys
- **Tab Completion** - Auto-complete available commands
- **Real-time Output** - Immediate command response and feedback
- **Workspace Integration** - Direct access to workspace files and operations

### 🎨 User Interface
- **Professional Design** - Clean, modern terminal interface
- **Responsive Layout** - Collapsible and maximizable views
- **Auto-focus** - Automatic input focus when terminal opens
- **Visual Feedback** - Color-coded output and status indicators

## Available Commands

### 📁 File Management
```bash
ls              # List files in workspace
ls -la          # List files with detailed information
mkdir <name>    # Create a new directory (simulated)
touch <file>    # Create a new file (simulated)
```

### 🔍 System Information
```bash
whoami          # Display current user information
pwd             # Show current directory path
date            # Show current date and time
status          # Show workspace status
```

### 💬 Terminal Operations
```bash
help            # Show available commands
clear           # Clear terminal history
history         # Show command history
about           # About this terminal
exit            # Close terminal
```

### 📝 Text Operations
```bash
echo <text>     # Echo text to terminal
```

### 💾 Workspace Operations
```bash
save            # Save current workspace (auto-saves)
```

### 🐍 Python Commands (Simulated)
```bash
pip install <package>    # Install Python package
pip list                 # List installed packages
pip uninstall <package>  # Uninstall Python package
python <file.py>         # Run Python script
python --version         # Show Python version
python -m pip install <pkg> # Install package using module
```

### 📦 Node.js Commands (Simulated)
```bash
npm install <package>    # Install Node.js package
npm list                 # List installed packages
npm run <script>         # Run npm script
node --version           # Show Node.js version
node <file.js>           # Run JavaScript file
npx <command>            # Run npm package without installing
```

### 🔄 Git Commands (Simulated)
```bash
git status               # Show git status
git add <file>           # Add file to staging
git commit -m "msg"      # Commit changes
git push                 # Push to remote
git pull                 # Pull from remote
```

### 🪟 Windows Package Manager (Simulated)
```bash
winget install <package>  # Install Windows application
winget list               # List installed applications
winget uninstall <pkg>   # Uninstall Windows application
winget search <query>    # Search for packages
winget upgrade           # Upgrade all packages
```

### 🐧 Linux Package Managers (Simulated)
```bash
# Debian/Ubuntu (APT)
apt install <package>    # Install Debian/Ubuntu package
apt list --installed     # List installed packages
apt remove <package>     # Remove Debian/Ubuntu package
apt update               # Update package lists
apt upgrade              # Upgrade packages

# RHEL/CentOS (YUM)
yum install <package>    # Install RHEL/CentOS package
yum list installed       # List installed packages
yum remove <package>     # Remove RHEL/CentOS package
```

### 🍺 Homebrew (macOS) (Simulated)
```bash
brew install <package>   # Install macOS package
brew list                # List installed packages
brew uninstall <package> # Remove macOS package
brew update              # Update Homebrew
brew upgrade             # Upgrade packages
```

## Command Examples

### File Listing
```bash
admin$ ls
index.html
styles.css
script.js

admin$ ls -la
-rw-r--r-- 1 admin 1234B 3/11/2026 index.html
-rw-r--r-- 1 admin 567B 3/11/2026 styles.css
-rw-r--r-- 1 admin 890B 3/11/2026 script.js
```

### User Information
```bash
admin$ whoami
admin@synergy

admin$ pwd
/workspace/MyProject
```

### System Status
```bash
admin$ status
Workspace Status:
  Name: MyProject
  Files: 3
  User: admin
  Loading: No
  Terminal: Normal
```

### Python Package Management
```bash
admin$ pip install pygame
Collecting pygame
  Downloading pygame-1.0.0-py3-none-any.whl (1.2MB)
Installing collected packages: pygame
Successfully installed pygame-1.0.0

admin$ pip list
Package    Version
---------- -------
pygame    2.5.2
numpy     1.24.3
requests  2.31.0
flask     2.3.3

admin$ python --version
Python 3.11.5

admin$ python game.py
Running game.py...
Hello, World!
Script executed successfully.
```

### Node.js Package Management
```bash
admin$ npm install express
npm notice created a lockfile as package-lock.json
npm notice express@1.0.0
added 1 package, and audited 1 package in 1s

found 0 vulnerabilities

admin$ npm list
synergy-project@1.0.0
├── react@18.2.0
├── typescript@5.0.0
└── vite@4.4.0

admin$ node --version
v18.17.0

admin$ npm run dev
> synergy-project@1.0.0 dev
> dev

  VITE v4.4.0  ready in 250 ms

  ➜  Local:   https://synergy-collab-umber.vercel.app/
  ➜  Network: use --host to expose
```

### Git Version Control
```bash
admin$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  modified:   src/App.tsx
  new file:   src/components/NewComponent.tsx

Untracked files:
  src/utils/helper.js

admin$ git add src/utils/helper.js
Added src/utils/helper.js to staging area

admin$ git commit -m "Add helper utility"
[main 1234567] Add helper utility
 1 file changed, 5 insertions(+), 2 deletions(-)

admin$ git push
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), 300 bytes | 300.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0), pack-reused 0
To https://github.com/user/repo.git
   abc1234..def5678  main -> main
```

### Windows Package Management
```bash
admin$ winget install Python.Python.3
Found package [Python.Python.3] (Python.Python.3)
The package will be installed from the Windows Package Manager repository.
Downloading...
Starting package install...
Successfully installed [Python.Python.3]

admin$ winget list
Name                           Id                                    Version
--------------------------------------------------------------------
Python 3.11                   Python.Python.3                     3.11.5
Microsoft Visual Studio Code  Microsoft.VisualStudioCode           1.85.1
Git                            Git.Git                              2.42.0
Node.js                        OpenJS.NodeJS                       18.17.0

admin$ winget search python
Name                           Id                                    Version Source
--------------------------------------------------------------------
Python 3.11                   Python.Python.3                     3.11.5 winget
Python 3.10                   Python.Python.3                     3.10.11 winget
Anaconda3                      Anaconda.Anaconda3                   2023.09 winget
```

### Linux Package Management (APT)
```bash
admin$ apt install python3
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  python3
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 1,234 kB of archives.
After this operation, 3,456 kB of additional disk space will be used.
Get:1 http://archive.ubuntu.com/ubuntu jammy/main amd64 python3 amd64 3.11.5 [1,234 kB]
Fetched 1,234 kB in 1s (1,234 kB/s)
Selecting previously unselected package python3.
(Reading database ... 123456 files and directories currently installed.)
Preparing to unpack .../python3_3.11.5_amd64.deb ...
Unpacking python3 (3.11.5) ...
Setting up python3 (3.11.5) ...

admin$ apt update
Get:1 http://archive.ubuntu.com/ubuntu jammy InRelease [269 kB]
Get:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [269 kB]
Get:3 http://archive.ubuntu.com/ubuntu jammy-backports InRelease [269 kB]
Get:4 http://archive.ubuntu.com/ubuntu jammy-security InRelease [269 kB]
Reading package lists... Done
```

### macOS Package Management (Homebrew)
```bash
admin$ brew install python
==> Downloading https://ghcr.io/Formula/python.tar.gz
==> Downloading from https://packages.brew.sh
Already downloaded: /Users/user/Library/Caches/Homebrew/python--1.0.0.tar.gz
==> Pouring python--1.0.0.arm64_sequoia.bottle.tar.gz
🍺  /opt/homebrew/Cellar/python/1.0.0: 123 files, 4.5MB
==> Running 'brew cleanup python'...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see 'man brew')

admin$ brew list
==> Formulae
python           1.0.0
python@3.11      3.11.5
git              2.42.0
node             18.17.0

admin$ brew update
==> Auto-updating Homebrew...
Adjusting HOMEBREW_BOTTLE_DOMAIN...
==> Checking for outdated Homebrew packages...
==> Your Homebrew is up-to-date.
```

## Keyboard Shortcuts

### 🎮 Navigation
- **↑ Arrow** - Navigate up in command history
- **↓ Arrow** - Navigate down in command history
- **Tab** - Auto-complete commands
- **Enter** - Execute command

### 🖱️ Mouse Operations
- **Click Terminal** - Focus input field
- **Maximize Button** - Toggle fullscreen mode
- **Minimize Button** - Collapse terminal

## Terminal States

### 📐 Display Modes
- **Normal** - Default 200px height
- **Maximized** - Fullscreen terminal view
- **Collapsed** - Minimized to header bar

### 🎨 Visual Elements
- **Prompt Format** - `username$` (e.g., `admin$`)
- **Command Color** - Foreground color for commands
- **Output Color** - Muted color for command output
- **Success Color** - Green color for prompt symbol

## Integration Features

### 🔗 Workspace Context
- **File Access** - Direct access to workspace files
- **User Context** - Displays current logged-in user
- **Workspace Info** - Shows current workspace name and status
- **Loading State** - Indicates workspace loading status

### 🛠️ Error Handling
- **Command Validation** - Checks for valid commands and parameters
- **Error Messages** - Clear error feedback for invalid commands
- **Graceful Failures** - Handles edge cases and missing data

## Technical Implementation

### ⚙️ Architecture
- **React Component** - Built with React hooks and TypeScript
- **Context Integration** - Uses Auth and Workspace contexts
- **State Management** - Local state for terminal operations
- **Event Handling** - Keyboard and mouse event processing

### 🔧 Components
- **TerminalPanel** - Main terminal component
- **Command Parser** - Command parsing and execution logic
- **History Manager** - Command history navigation
- **UI Controls** - Maximize/minimize functionality

### 📊 Data Structures
```typescript
interface TerminalCommand {
  command: string;
  output: string;
  timestamp: Date;
}
```

## Usage Tips

### 🚀 Getting Started
1. Type `help` to see all available commands
2. Use `ls` to explore workspace files
3. Use arrow keys to navigate command history
4. Press Tab to auto-complete commands

### 💡 Best Practices
- Use `clear` to clean up terminal history
- Use `status` to check workspace state
- Use `history` to review recent commands
- Use `exit` to minimize terminal when done

### 🎯 Advanced Features
- **Maximize Mode** - Press maximize button for fullscreen terminal
- **Quick Navigation** - Use arrow keys for command history
- **Auto-completion** - Press Tab to complete commands
- **Click Focus** - Click anywhere in terminal to focus input

## Future Enhancements

### 🔮 Planned Features
- **Real File Operations** - Actual file creation and deletion
- **Git Integration** - Git commands and version control
- **Process Management** - Background process handling
- **Custom Commands** - User-defined command aliases
- **Themes** - Multiple terminal color schemes
- **Search** - Command history search functionality

### 🛠️ Technical Improvements
- **WebSocket Integration** - Real-time command execution
- **Plugin System** - Extensible command architecture
- **Performance** - Optimized rendering for large outputs
- **Accessibility** - Screen reader and keyboard navigation support

## Troubleshooting

### 🔧 Common Issues
- **Input not focused** - Click anywhere in terminal to focus
- **Commands not working** - Check command spelling and parameters
- **History not working** - Commands are saved after execution
- **Maximize issues** - Click maximize button to toggle fullscreen

### 🐛 Error Messages
- `command not found` - Command doesn't exist or misspelled
- `missing operand` - Required parameter not provided
- `No files in workspace` - Workspace has no files to list

## Security Considerations

### 🔒 Safety Features
- **Command Validation** - Only allows predefined commands
- **Parameter Checking** - Validates command parameters
- **No System Access** - Simulated file operations only
- **Context Isolation** - Terminal operates within workspace context

---

*Synergy Terminal v1.0.0 - A professional command-line interface for collaborative coding*
