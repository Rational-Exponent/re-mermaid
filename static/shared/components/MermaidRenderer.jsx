import React, { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

// Simple hash function for stable diagram IDs
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

const MermaidRenderer = ({ source, isDarkMode }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  // Stable ID based on content hash for better caching
  const diagramId = useMemo(() => `mermaid-${hashCode(source || '')}`, [source]);

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
          diagramId,
          source.trim()
        );

        // Sanitize SVG output to prevent XSS attacks
        const sanitizedSvg = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ['foreignObject'],
          ADD_ATTR: ['target', 'xlink:href']
        });

        containerRef.current.innerHTML = sanitizedSvg;
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Mermaid render error:', err);
        }
        setError(err.message || 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [source, isDarkMode, diagramId]);

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
