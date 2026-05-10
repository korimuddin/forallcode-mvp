export const readmeTemplates = {
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
  { key: "blank", label: "Blank" },
  { key: "library", label: "Library / package" },
  { key: "personal", label: "Personal project" },
  { key: "opensource", label: "Open source" },
  { key: "portfolio", label: "Portfolio repo" }
];
