import React, { useState, useEffect, useCallback } from 'react';
import { invoke, view } from '@forge/bridge';
import {
  MermaidRenderer,
  MermaidEditor,
  ErrorBoundary,
  useDarkMode,
  svgToBase64,
  downloadFile
} from '@shared';

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

function App() {
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [context, setContext] = useState(null);
  const [version, setVersion] = useState(null);
  const isDarkMode = useDarkMode();

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await view.getContext();
        setContext(ctx);

        if (ctx?.extension?.content?.id) {
          const pageId = ctx.extension.content.id;
          const sourceName = ctx.extension.config?.source || null;

          const result = await invoke('getMermaidSource', { pageId, sourceName });

          if (result.success && result.source) {
            setSource(result.source);
            setVersion(result.version);
          } else {
            setSource(DEFAULT_DIAGRAM);
          }
        } else {
          setSource(DEFAULT_DIAGRAM);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Init error:', err);
        }
        setError(err.message);
        setSource(DEFAULT_DIAGRAM);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSave = useCallback(async (newSource) => {
    if (!context?.extension?.content?.id) {
      setError('Cannot save: no page context');
      return;
    }

    if (isSaving) return; // Prevent double-save

    setIsSaving(true);
    try {
      const pageId = context.extension.content.id;
      const sourceName = context.extension.config?.source || null;

      const result = await invoke('updateMermaidSource', {
        pageId,
        sourceName,
        newSource,
        currentVersion: version
      });

      if (result.success) {
        setSource(newSource);
        setVersion(result.newVersion);
        setIsEditing(false);
        setError(null);
      } else if (result.conflict) {
        // Handle version conflict
        setError(`${result.error} (Your version: ${version}, Server version: ${result.serverVersion || 'unknown'})`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [context, version, isSaving]);

  const handleExport = useCallback(async (format) => {
    const svgElement = document.querySelector('.mermaid-diagram svg');
    if (!svgElement) {
      setError('No diagram to export');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);

    if (format === 'svg') {
      downloadFile(svgData, 'diagram.svg', 'image/svg+xml');
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
          a.download = 'diagram.png';
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      };

      img.onerror = () => {
        setError('Failed to export PNG');
      };

      img.src = 'data:image/svg+xml;base64,' + svgToBase64(svgData);
    }
  }, [isDarkMode]);

  if (loading) {
    return <div className="mermaid-loading">Loading diagram...</div>;
  }

  return (
    <ErrorBoundary>
      <div className={`mermaid-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="mermaid-toolbar">
          {!isEditing && (
            <>
              <button
                className="mermaid-button"
                onClick={() => setIsEditing(true)}
                aria-label="Edit Mermaid diagram"
              >
                Edit
              </button>
              <button
                className="mermaid-button mermaid-button--secondary"
                onClick={() => handleExport('png')}
                aria-label="Export diagram as PNG"
              >
                Export PNG
              </button>
              <button
                className="mermaid-button mermaid-button--secondary"
                onClick={() => handleExport('svg')}
                aria-label="Export diagram as SVG"
              >
                Export SVG
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mermaid-error" role="alert">
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                textDecoration: 'underline'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {isSaving && (
          <div className="mermaid-loading" style={{ padding: '8px 0' }}>
            Saving changes...
          </div>
        )}

        {isEditing ? (
          <MermaidEditor
            source={source}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isDarkMode={isDarkMode}
            isSaving={isSaving}
          />
        ) : (
          <MermaidRenderer source={source} isDarkMode={isDarkMode} />
        )}

        {version && (
          <div className="mermaid-version-info">
            Version: {version}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
