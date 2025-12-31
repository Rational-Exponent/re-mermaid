# CLAUDE.md - Development Guide for re-mermaid

## Project Overview
Atlassian Forge app for rendering and editing Mermaid diagrams in Confluence and Jira with AI-tool-friendly source storage.

## Tech Stack
- **Platform**: Atlassian Forge (Cloud)
- **Frontend**: React 18 + Vite + Custom UI
- **Backend**: Forge Resolver (Node.js)
- **Diagram Engine**: Mermaid.js 11.x

## Project Structure
```
re-mermaid/
├── manifest.yml              # Forge app manifest
├── package.json              # Root dependencies
├── src/
│   └── index.ts              # Backend resolver functions
├── static/
│   ├── confluence-macro/     # Confluence macro Custom UI
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   └── components/
│   │   │       ├── MermaidRenderer.jsx
│   │   │       └── MermaidEditor.jsx
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

### Scopes Required
- `read:page:confluence` - Read page content
- `write:page:confluence` - Update diagrams
- `read:jira-work` - Read Jira issues

## Development Workflow

### Making Changes
1. Edit source files
2. Rebuild: `npm run build`
3. Deploy: `forge deploy`
4. Test in Confluence/Jira

### Using Tunnel (faster iteration)
```bash
forge tunnel
```
Changes reflect immediately without redeploying.

## Resolver Functions (src/index.ts)
- `getMermaidSource` - Extract Mermaid code from Expand macros
- `updateMermaidSource` - Save edited diagram back to page
- `getPageHistory` - Get page version history
- `getJiraIssue` - Read Jira issue description for diagrams

## Custom UI Components

### MermaidRenderer.jsx
- Renders Mermaid syntax to SVG
- Supports dark/light themes
- Auto-detects system color scheme

### MermaidEditor.jsx
- Split-pane editor (source | preview)
- Live preview with debounce
- Template snippets for common diagrams

## Environment
- Node.js 20.x or 22.x required (Forge CLI requirement)
- Forge CLI: `npm install -g @forge/cli`
