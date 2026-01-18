# CLAUDE.md - Development Guide for re-mermaid

## Project Overview
Atlassian Forge app for rendering and editing Mermaid diagrams in Confluence and Jira with AI-tool-friendly source storage.

## Tech Stack
- **Platform**: Atlassian Forge (Cloud)
- **Frontend**: React 18 + Vite + Custom UI
- **Backend**: Forge Resolver (Node.js 22.x)
- **Diagram Engine**: Mermaid.js 11.x
- **Security**: DOMPurify for XSS protection

## Project Structure
```
re-mermaid/
├── manifest.yml              # Forge app manifest
├── package.json              # Root dependencies
├── src/
│   └── index.ts              # Backend resolver functions
├── static/
│   ├── shared/               # Shared components library
│   │   ├── components/
│   │   │   ├── MermaidRenderer.jsx  # SVG rendering with DOMPurify
│   │   │   ├── MermaidEditor.jsx    # Split-pane editor
│   │   │   └── ErrorBoundary.jsx    # Error handling
│   │   ├── hooks/
│   │   │   └── useDarkMode.js       # Theme detection hook
│   │   ├── utils/
│   │   │   └── svgExport.js         # PNG/SVG export utilities
│   │   └── index.js                 # Public exports
│   ├── confluence-macro/     # Confluence macro Custom UI
│   │   ├── src/
│   │   │   ├── App.jsx       # Uses @shared imports
│   │   │   ├── main.jsx
│   │   │   └── styles.css
│   │   ├── vite.config.js    # Alias: @shared -> ../shared
│   │   └── build/            # Built assets (git-ignored)
│   ├── jira-panel/           # Jira issue panel (same structure)
│   └── icons/
│       └── build/mermaid.svg
```

## Key Commands
```bash
# Install all dependencies
npm run install:all

# Build Custom UI modules
npm run build

# Deploy to development
forge deploy

# Deploy to production
forge deploy -e production

# Install on site
forge install

# Run linter
forge lint

# View logs
forge logs
```

## Architecture Decisions

### AI-Friendly Source Storage
Mermaid source is stored in native Confluence **Expand macros** (not inside the custom macro), making it readable/editable by AI tools like Claude Code.

Pattern:
1. User creates Expand with title `mermaid:<name>`
2. Mermaid source goes inside the Expand
3. `mermaid-diagram` macro below it renders the diagram
4. AI tools can read/edit the Expand content directly

### Security Architecture
- **XSS Protection**: All rendered SVG is sanitized with DOMPurify before DOM insertion
- **Mermaid Security**: `securityLevel: 'strict'` prevents script execution in diagrams
- **Input Validation**: All resolver functions validate pageId, issueKey, and sourceName parameters
- **Version Conflict Detection**: `updateMermaidSource` validates page version to prevent race conditions
- **CSP**: Manifest uses `unsafe-inline` for scripts/styles (required for Forge Custom UI). Mitigation: DOMPurify sanitization layer.

### Shared Components
Components are deduplicated in `static/shared/` and imported via Vite alias `@shared`. Both apps resolve dependencies from their own `node_modules` via Vite config.

### Scopes Required
- `read:page:confluence` - Read page content
- `write:page:confluence` - Update diagrams
- `read:jira-work` - Read Jira issues

## Development Workflow

### Making Changes
1. Edit source files in `static/shared/` or app-specific `src/`
2. Rebuild: `npm run build`
3. Deploy: `forge deploy`
4. Test in Confluence/Jira

### Using Tunnel (faster iteration)
```bash
forge tunnel
```
Changes reflect immediately without redeploying.

## Resolver Functions (src/index.ts)

| Function | Description | Validation |
|----------|-------------|------------|
| `getPageContent` | Fetch full page content | pageId: numeric string |
| `getMermaidSource` | Extract Mermaid code from Expand macros | pageId, sourceName (optional) |
| `updateMermaidSource` | Save edited diagram with version check | pageId, sourceName, newSource, currentVersion |
| `getPageHistory` | Get page version history | pageId |
| `getJiraIssue` | Read Jira issue description for diagrams | issueKey: PROJECT-123 format |

## Shared Components (@shared)

### MermaidRenderer.jsx
- Renders Mermaid syntax to SVG with DOMPurify sanitization
- Supports dark/light themes via Atlassian color tokens
- Uses content-hash for stable diagram IDs (better caching)
- Error display with source code visibility

### MermaidEditor.jsx
- Split-pane editor (source | preview)
- Live preview with 300ms debounce
- Template snippets: flowchart, sequence, class, state, ER, gantt

### ErrorBoundary.jsx
- React error boundary for graceful failure handling
- "Try Again" recovery button
- Error details disclosure

### useDarkMode Hook
- Detects system color scheme preference
- Proper event listener cleanup (no memory leaks)

### svgExport Utils
- `svgToBase64()` - UTF-8 safe encoding (replaces deprecated `unescape`)
- `downloadFile()` - Generic file download
- `exportSvg()` / `exportPng()` - Diagram export functions

## Environment
- Node.js 20.x or 22.x required (Forge CLI requirement)
- Forge CLI: `npm install -g @forge/cli`
