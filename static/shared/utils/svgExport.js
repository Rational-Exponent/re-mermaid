// Helper function to encode SVG for data URI (replaces deprecated unescape)
export function svgToBase64(svgData) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(svgData);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Download a file with the given content
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export SVG element as a file
export function exportSvg(svgElement, filename = 'diagram.svg') {
  if (!svgElement) {
    throw new Error('No SVG element provided');
  }
  const svgData = new XMLSerializer().serializeToString(svgElement);
  downloadFile(svgData, filename, 'image/svg+xml');
}

// Export SVG element as PNG
export function exportPng(svgElement, filename = 'diagram.png', isDarkMode = false) {
  return new Promise((resolve, reject) => {
    if (!svgElement) {
      reject(new Error('No SVG element provided'));
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
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
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG for PNG export'));
    };

    img.src = 'data:image/svg+xml;base64,' + svgToBase64(svgData);
  });
}
