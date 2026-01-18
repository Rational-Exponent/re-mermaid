# re-mermaid

Atlassian Forge app for editing and displaying Mermaid diagrams in Confluence and Jira.

## Features

- **Mermaid Diagram Rendering** - Supports all Mermaid diagram types (flowcharts, sequence, class, ER, gantt, etc.)
- **Dark Theme Support** - Auto-detects and adapts to Confluence/Jira dark mode
- **Inline Editor** - Edit diagrams with live preview and template snippets
- **Export** - Export diagrams to PNG/SVG for use in documents
- **AI-Friendly** - Source stored in native Confluence elements, readable by AI tools
- **Version Tracking** - Displays page version with conflict detection
- **Security** - XSS protection via DOMPurify, input validation, strict Mermaid mode

## Installation

### Prerequisites

- Node.js 20.x or 22.x
- Atlassian Forge CLI: `npm install -g @forge/cli`
- Atlassian Cloud site (Confluence and/or Jira)

### Setup

```bash
# Clone the repository
git clone https://github.com/Rational-Exponent/re-mermaid.git
cd re-mermaid

# Install dependencies
npm run install:all

# Login to Forge
forge login

# Deploy
npm run build
forge deploy -e production

# Install on your site
forge install -e production
```

## Usage

### Confluence

1. Create an **Expand** macro with title starting with `mermaid:` (e.g., `mermaid:my-flowchart`)
2. Inside the Expand, write your Mermaid diagram code:
   ```
   graph TD
       A[Start] --> B{Decision}
       B -->|Yes| C[Action]
       B -->|No| D[End]
   ```
3. Below the Expand, insert the **Mermaid Diagram** macro
4. Save the page - your diagram renders automatically

### Jira

- Add Mermaid code blocks in issue descriptions using ` ```mermaid ` syntax
- The Mermaid Diagrams panel displays rendered diagrams

### Editing Diagrams

- **Option A**: Edit the Expand content directly (AI tools can do this)
- **Option B**: Click "Edit" on the rendered diagram for the inline editor

### Exporting

Click "Export PNG" or "Export SVG" to download the diagram for use in Word/PDF documents.

## Development

```bash
# Build Custom UI
npm run build

# Deploy to development
forge deploy

# Use tunnel for fast iteration
forge tunnel

# Run linter
forge lint

# View logs
forge logs
```

### Project Structure

```
re-mermaid/
├── manifest.yml              # Forge app manifest
├── src/index.ts              # Backend resolver functions
└── static/
    ├── shared/               # Shared React components
    │   ├── components/       # MermaidRenderer, MermaidEditor, ErrorBoundary
    │   ├── hooks/            # useDarkMode (with proper cleanup)
    │   └── utils/            # SVG export utilities
    ├── confluence-macro/     # Confluence Custom UI
    └── jira-panel/           # Jira Custom UI
```

## Architecture

```
┌─────────────────────────────────────────┐
│ Confluence Page                         │
├─────────────────────────────────────────┤
│  ▼ mermaid:flowchart (Expand macro)     │
│  ┌─────────────────────────────────┐    │
│  │ graph TD                        │    │
│  │   A[Start] --> B[End]           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Mermaid Diagram macro]                │
│  ┌─────────────────────────────────┐    │
│  │   ┌───────┐      ┌───────┐      │    │
│  │   │ Start │ ───▶ │  End  │      │    │
│  │   └───────┘      └───────┘      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Why this architecture?**
- Source code lives in native Confluence content (Expand macro)
- AI tools can read and edit the source directly
- Diagram survives even if the macro is removed
- Version history preserved through Confluence

### Security

| Layer | Protection |
|-------|------------|
| SVG Output | Sanitized with [DOMPurify](https://github.com/cure53/DOMPurify) before DOM insertion |
| Mermaid Config | `securityLevel: 'strict'` prevents script execution |
| API Inputs | Validated pageId, issueKey, sourceName formats |
| Concurrency | Version conflict detection prevents data loss |

### Tech Stack

- [Atlassian Forge](https://developer.atlassian.com/platform/forge/) - Cloud app platform
- [React 18](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Mermaid.js 11](https://mermaid.js.org/) - Diagram rendering
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS protection

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `forge lint` to check for issues
5. Submit a pull request
