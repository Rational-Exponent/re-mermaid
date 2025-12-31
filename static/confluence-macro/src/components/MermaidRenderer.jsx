import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const MermaidRenderer = ({ source, isDarkMode }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'default';

    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'strict',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      themeVariables: isDarkMode ? {
        primaryColor: '#579dff',
        primaryTextColor: '#b6c2cf',
        primaryBorderColor: '#3d474f',
        lineColor: '#738496',
        secondaryColor: '#22272b',
        tertiaryColor: '#2c333a',
        background: '#1d2125',
        mainBkg: '#22272b',
        nodeBorder: '#3d474f',
        clusterBkg: '#2c333a',
        titleColor: '#b6c2cf',
        edgeLabelBackground: '#22272b'
      } : {
        primaryColor: '#0052cc',
        primaryTextColor: '#172b4d',
        primaryBorderColor: '#dfe1e6',
        lineColor: '#6b778c',
        secondaryColor: '#f4f5f7',
        tertiaryColor: '#ebecf0',
        background: '#ffffff',
        mainBkg: '#f4f5f7',
        nodeBorder: '#dfe1e6',
        clusterBkg: '#f4f5f7',
        titleColor: '#172b4d',
        edgeLabelBackground: '#ffffff'
      }
    });
  }, [isDarkMode]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !source) return;

      try {
        setError(null);
        containerRef.current.innerHTML = '';

        const { svg } = await mermaid.render(
          `mermaid-${Date.now()}`,
          source.trim()
        );

        containerRef.current.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err.message || 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [source, isDarkMode]);

  if (error) {
    return (
      <div className="mermaid-error">
        <strong>Diagram Error:</strong>
        <pre>{error}</pre>
        <details style={{ marginTop: '8px' }}>
          <summary>Source</summary>
          <pre>{source}</pre>
        </details>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-diagram" />;
};

export default MermaidRenderer;
