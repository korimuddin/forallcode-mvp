export const readmeTemplates = {
  caseStudy: `# Project Name

## The problem

Who is this project for, and what problem does it solve?

## My contribution

Describe what you built yourself. Credit collaborators, tutorials, and tools that helped.

## Decisions and trade-offs

Explain one important choice, the alternatives you considered, and why you chose this approach.

## How to run it

List the actual setup requirements and commands for this project.

## Evidence of the work

Link to your pull request, relevant commits, screenshots, and a live demo if available. Do not include secrets or private project information.

## How I checked the result

Describe the tests or checks you ran, their results, and any known limitations.

## What I learned

What can you explain now that you could not explain before? What would you improve next?
`,
  blank: `# Project Name

> Short description of your project

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

## Contributing

## Licence

MIT
`,

  library: `# Package Name

> One-line description

<!-- badges -->

## Features

- Feature one
- Feature two
- Feature three

## Installation

\`\`\`bash
npm install package-name
\`\`\`

## Quick start

\`\`\`javascript
import { thing } from "package-name";
\`\`\`

## API

## Contributing

## Licence

MIT
`,

  personal: `# Project Name

A brief description of what this project does and who it's for.

## About

## Built with

## Getting started

### Prerequisites

### Installation

## Usage

## Roadmap

## Licence

MIT
`,

  opensource: `# Project Name

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> Description

## Why this exists

## Features

## Installation

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

### Code of conduct

### Reporting bugs

### Submitting changes

## Licence

MIT - see [LICENSE](LICENSE) for details.
`,

  portfolio: `# Project Name

> Built as part of my portfolio - [yoursite.com](https://yoursite.com)

## What it does

## What I learned

## Tech stack

## Screenshots

## Run it locally

\`\`\`bash
git clone ...
npm install
npm run dev
\`\`\`
`
};

export const readmeTemplateOptions = [
  { id: "blank", key: "blank", name: "Blank", label: "Blank", emoji: "✦", description: "Simple starter structure", isPro: false },
  { id: "library", key: "library", name: "Library / package", label: "Library / package", emoji: "□", description: "Package basics, installation, API notes", isPro: false },
  { id: "personal", key: "personal", name: "Personal project", label: "Personal project", emoji: "◇", description: "About, tech stack, roadmap", isPro: false },
  { id: "opensource", key: "opensource", name: "Open source", label: "Open source", emoji: "○", description: "Contributing, licence, code of conduct", isPro: false },
  { id: "portfolio", key: "portfolio", name: "Portfolio repo", label: "Portfolio repo", emoji: "☆", description: "Learning notes, screenshots, local run steps", isPro: false }
];

export const proTemplates = [
  {
    id: "saas-product",
    name: "SaaS product",
    emoji: "🚀",
    description: "Hero banner, feature grid, pricing table, screenshots, CTA",
    isPro: true,
    content: `<div align="center">
  <h1>🚀 Product Name</h1>
  <p><em>Your one-line value proposition</em></p>

  ![Version](https://img.shields.io/badge/version-1.0.0-9b8fd4?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT-7aaa72?style=flat-square)
  ![Status](https://img.shields.io/badge/status-active-7aaa72?style=flat-square)
</div>

---

## What it does

> One paragraph describing the problem you solve and how you solve it.

## Features

| Feature | Description |
|---|---|
| Fast | Description |
| Secure | Description |
| Beautiful | Description |
| Responsive | Description |

## Screenshots

<!-- Add screenshots here -->

## Getting started

\`\`\`bash
npm install your-package
npm run dev
\`\`\`

## Pricing

| Free | Pro |
|---|---|
| Feature 1 | Everything in Free |
| Feature 2 | Unlimited X |
| Up to 3 Y | Custom domains |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## Licence

MIT - see [LICENSE](LICENSE).`
  },
  {
    id: "api-library",
    name: "API / Library",
    emoji: "📦",
    description: "Installation, full API reference, type signatures, examples",
    isPro: true,
    content: `# 📦 library-name

> Short description of what this library does.

[![npm version](https://img.shields.io/npm/v/library-name)](https://npmjs.com/package/library-name)
[![bundle size](https://img.shields.io/bundlephobia/minzip/library-name)](https://bundlephobia.com/package/library-name)

## Installation

\`\`\`bash
npm install library-name
yarn add library-name
pnpm add library-name
\`\`\`

## Quick start

\`\`\`typescript
import { Client } from "library-name";

const client = new Client({ apiKey: "your-key" });
const result = await client.doSomething();
\`\`\`

## API reference

### \`new Client(options)\`

| Option | Type | Default | Description |
|---|---|---|---|
| \`apiKey\` | \`string\` | required | Your API key |
| \`timeout\` | \`number\` | \`5000\` | Request timeout in ms |

### \`client.doSomething(params)\`

\`\`\`typescript
doSomething(params: {
  id: string;
  options?: Record<string, unknown>;
}): Promise<Result>
\`\`\`

## TypeScript

Full TypeScript support included. No \`@types\` package needed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT`
  },
  {
    id: "cli-tool",
    name: "CLI tool",
    emoji: "⌨",
    description: "Installation, command reference, options table, usage examples",
    isPro: true,
    content: `# ⌨ cli-name

> What your CLI does in one sentence.

## Installation

\`\`\`bash
npm install -g cli-name
brew install cli-name
\`\`\`

## Usage

\`\`\`
cli-name [command] [options]
\`\`\`

## Commands

| Command | Description |
|---|---|
| \`init\` | Initialise a new project |
| \`build\` | Build for production |
| \`dev\` | Start development server |
| \`deploy\` | Deploy to production |

## Options

| Flag | Alias | Description | Default |
|---|---|---|---|
| \`--output\` | \`-o\` | Output directory | \`./dist\` |
| \`--verbose\` | \`-v\` | Enable verbose logging | \`false\` |
| \`--config\` | \`-c\` | Path to config file | \`./config.json\` |

## Examples

\`\`\`bash
cli-name init my-project
cli-name build --output ./build --verbose
cli-name deploy --config ./deploy.config.json
\`\`\`

## Configuration

\`\`\`json
{
  "output": "./dist",
  "verbose": false
}
\`\`\`

## Licence

MIT`
  },
  {
    id: "research-paper",
    name: "Research / paper",
    emoji: "📄",
    description: "Abstract, methodology, results, citation block",
    isPro: true,
    content: `# Paper or Project Title

**Authors:** Author One, Author Two, Author Three

**Institution:** University / Organisation

**Date:** Month Year

---

## Abstract

> One paragraph summarising the problem, approach, and key findings.

## Introduction

Background and motivation for this work. What problem does it address and why does it matter?

## Methodology

Describe your approach, data, and methods clearly enough that someone could reproduce your work.

## Results

| Metric | Baseline | Ours | Improvement |
|---|---|---|---|
| Metric 1 | 0.00 | 0.00 | +0% |
| Metric 2 | 0.00 | 0.00 | +0% |

## Discussion

Interpretation of results, limitations, and directions for future work.

## Citation

\`\`\`bibtex
@article{authorname2024title,
  title   = {Paper Title},
  author  = {Author One and Author Two},
  journal = {Journal Name},
  year    = {2024},
  volume  = {1},
  pages   = {1--10}
}
\`\`\`

## Licence

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)`
  },
  {
    id: "game",
    name: "Game project",
    emoji: "🎮",
    description: "Gameplay description, controls, screenshots, download links",
    isPro: true,
    content: `# 🎮 Game Name

> A short description of the game and its genre.

<!-- Screenshot or GIF here -->

## Play it

**[Play in browser](https://link-to-game.com)**

**Download:** [Windows](#) · [macOS](#) · [Linux](#)

## About

Describe the gameplay, story, or concept in 2-3 sentences.

## Controls

| Key / Button | Action |
|---|---|
| WASD / Arrow keys | Move |
| Space | Jump |
| Left click | Attack |
| Escape | Pause |

## Built with

- Engine: Unity / Godot / Phaser / custom
- Language: C# / GDScript / JavaScript
- Assets: where art/sound came from

## Screenshots

<!-- Add screenshots here -->

## Development

\`\`\`bash
git clone https://github.com/you/game-name
npm install && npm run dev
\`\`\`

## Licence

MIT - feel free to learn from and modify the code.`
  },
  {
    id: "docs-site",
    name: "Documentation site",
    emoji: "📚",
    description: "Overview, concepts, guides, navigation, deployment notes",
    isPro: true,
    content: `# 📚 Documentation Name

> Clear, friendly documentation for Project Name.

## Start here

This documentation explains what the project does, who it is for, and how to get productive quickly.

## Concepts

| Concept | Meaning |
|---|---|
| Core idea | Explain the central idea |
| Workflow | Explain the expected flow |
| Extension point | Explain where users customise |

## Guides

- [Install locally](#install-locally)
- [Create your first project](#create-your-first-project)
- [Deploy to production](#deploy-to-production)

## Install locally

\`\`\`bash
git clone https://github.com/you/project-name
cd project-name
npm install
npm run dev
\`\`\`

## Create your first project

1. Configure your environment.
2. Start the development server.
3. Open the local app and follow the setup flow.

## Deploy to production

Add deployment instructions and required environment variables.

## Support

Open an issue or start a discussion if anything is unclear.`
  },
  {
    id: "mobile-app",
    name: "Mobile app",
    emoji: "📱",
    description: "App overview, store links, feature list, privacy notes",
    isPro: true,
    content: `# 📱 App Name

> A short, useful sentence about what the app helps people do.

## Download

- [App Store](#)
- [Google Play](#)
- [TestFlight / beta](#)

## Features

| Feature | Why it matters |
|---|---|
| Offline support | Works anywhere |
| Secure sync | Keeps data safe |
| Gentle reminders | Helps users build habits |

## Screenshots

<!-- Add phone screenshots here -->

## Tech stack

- React Native / Swift / Kotlin
- Supabase / Firebase / custom API
- RevenueCat / Stripe / native billing

## Development

\`\`\`bash
npm install
npm run ios
npm run android
\`\`\`

## Privacy

Describe what data is collected, why, and how users can delete it.

## Licence

MIT`
  },
  {
    id: "data-science",
    name: "Data science",
    emoji: "📊",
    description: "Dataset notes, notebook structure, metrics, reproducibility",
    isPro: true,
    content: `# 📊 Analysis Title

> One-line summary of the question this analysis answers.

## Research question

What are we trying to understand, predict, or explain?

## Dataset

| Field | Type | Notes |
|---|---|---|
| column_a | string | Description |
| column_b | number | Description |
| target | number | What the model predicts |

## Method

Describe cleaning, feature engineering, modelling, and validation.

## Results

| Model | Metric | Score |
|---|---|---|
| Baseline | RMSE | 0.00 |
| Final model | RMSE | 0.00 |

## Reproduce

\`\`\`bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
\`\`\`

## Notebooks

- \`01_exploration.ipynb\`
- \`02_features.ipynb\`
- \`03_model.ipynb\`

## Licence

MIT`
  }
];

export const allReadmeTemplateOptions = [
  { key: "caseStudy", label: "Project case study", description: "Problem, contribution, decisions, evidence, and lessons learned", isPro: false },
  ...readmeTemplateOptions, ...proTemplates
];
