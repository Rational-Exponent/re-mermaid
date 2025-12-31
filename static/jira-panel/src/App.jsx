import React, { useState, useEffect, useCallback } from 'react';
import { invoke, view } from '@forge/bridge';
import MermaidRenderer from './components/MermaidRenderer';
import MermaidEditor from './components/MermaidEditor';

const MERMAID_PATTERN = /```mermaid\n([\s\S]*?)```/g;

function App() {
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await view.getContext();
        setContext(ctx);

        const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(colorScheme.matches);
        colorScheme.addEventListener('change', (e) => setIsDarkMode(e.matches));

        if (ctx?.extension?.issue?.key) {
          await loadDiagrams(ctx.extension.issue.key);
        }
      } catch (err) {
        console.error('Init error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadDiagrams = async (issueKey) => {
    try {
      const result = await invoke('getJiraIssue', { issueKey });

      if (result.success) {
        const description = result.description || '';
        const matches = [...description.matchAll(MERMAID_PATTERN)];
        const extractedDiagrams = matches.map((match, index) => ({
          id: index,
          source: match[1].trim()
        }));

        setDiagrams(extractedDiagrams);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = useCallback(async (index, format) => {
    const svgElement = document.querySelectorAll('.mermaid-diagram svg')[index];
    if (!svgElement) {
      setError('No diagram to export');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);

    if (format === 'svg') {
      downloadFile(svgData, `diagram-${index + 1}.svg`, 'image/svg+xml');
    } else if (format === 'png') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = isDarkMode ? '#1d2125' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `diagram-${index + 1}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  }, [isDarkMode]);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="mermaid-loading">Loading diagrams...</div>;
  }

  if (diagrams.length === 0) {
    return (
      <div className={`mermaid-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <p style={{ padding: '16px', opacity: 0.7 }}>
          No Mermaid diagrams found in this issue's description.
        </p>
        <p style={{ padding: '0 16px', fontSize: '13px', opacity: 0.5 }}>
          Add diagrams using <code>```mermaid</code> code blocks in the description.
        </p>
      </div>
    );
  }

  return (
    <div className={`mermaid-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {error && <div className="mermaid-error">{error}</div>}

      {diagrams.map((diagram, index) => (
        <div key={diagram.id} style={{ marginBottom: '24px' }}>
          <div className="mermaid-toolbar">
            <span style={{ fontWeight: 500, marginRight: 'auto' }}>
              Diagram {index + 1}
            </span>
            <button
              className="mermaid-button mermaid-button--secondary"
              onClick={() => handleExport(index, 'png')}
            >
              Export PNG
            </button>
            <button
              className="mermaid-button mermaid-button--secondary"
              onClick={() => handleExport(index, 'svg')}
            >
              Export SVG
            </button>
          </div>

          {editingIndex === index ? (
            <MermaidEditor
              source={diagram.source}
              onSave={(newSource) => {
                const newDiagrams = [...diagrams];
                newDiagrams[index] = { ...diagram, source: newSource };
                setDiagrams(newDiagrams);
                setEditingIndex(null);
              }}
              onCancel={() => setEditingIndex(null)}
              isDarkMode={isDarkMode}
            />
          ) : (
            <MermaidRenderer source={diagram.source} isDarkMode={isDarkMode} />
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
