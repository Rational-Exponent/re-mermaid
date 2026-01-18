const Resolver = require('@forge/resolver').default;
const { route } = require('@forge/api');
const api = require('@forge/api').default;

const resolver = new Resolver();

// Input validation helpers
const isValidPageId = (pageId) => {
  return pageId && typeof pageId === 'string' && /^\d+$/.test(pageId);
};

const isValidIssueKey = (issueKey) => {
  return issueKey && typeof issueKey === 'string' && /^[A-Z][A-Z0-9]*-\d+$/i.test(issueKey);
};

const isValidSourceName = (sourceName) => {
  // sourceName is optional, but if provided must be a non-empty string
  return sourceName === null || sourceName === undefined ||
    (typeof sourceName === 'string' && sourceName.length > 0 && sourceName.length <= 255);
};

resolver.define('getPageContent', async ({ payload, context }) => {
  const { pageId } = payload;

  if (!isValidPageId(pageId)) {
    return {
      success: false,
      error: 'Invalid page ID format'
    };
  }

  try {
    const response = await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${pageId}?body-format=atlas_doc_format`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const page = await response.json();
    return {
      success: true,
      content: page.body?.atlas_doc_format?.value,
      title: page.title,
      version: page.version?.number
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

resolver.define('getMermaidSource', async ({ payload, context }) => {
  const { pageId, sourceName } = payload;

  if (!isValidPageId(pageId)) {
    return {
      success: false,
      error: 'Invalid page ID format'
    };
  }

  if (!isValidSourceName(sourceName)) {
    return {
      success: false,
      error: 'Invalid source name format'
    };
  }

  try {
    const response = await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${pageId}?body-format=atlas_doc_format`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const page = await response.json();
    const adf = JSON.parse(page.body?.atlas_doc_format?.value || '{}');

    const mermaidSource = findMermaidSource(adf, sourceName);

    return {
      success: true,
      source: mermaidSource,
      version: page.version?.number
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

resolver.define('updateMermaidSource', async ({ payload, context }) => {
  const { pageId, sourceName, newSource, currentVersion } = payload;

  // Input validation
  if (!isValidPageId(pageId)) {
    return {
      success: false,
      error: 'Invalid page ID format'
    };
  }

  if (!isValidSourceName(sourceName)) {
    return {
      success: false,
      error: 'Invalid source name format'
    };
  }

  if (typeof newSource !== 'string') {
    return {
      success: false,
      error: 'Invalid source content'
    };
  }

  try {
    const getResponse = await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${pageId}?body-format=atlas_doc_format`
    );

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch page: ${getResponse.status}`);
    }

    const page = await getResponse.json();

    // Version validation to prevent race conditions (TOCTOU)
    if (currentVersion && page.version.number !== currentVersion) {
      return {
        success: false,
        error: 'Page has been modified by another user. Please refresh and try again.',
        conflict: true,
        serverVersion: page.version.number
      };
    }

    const adf = JSON.parse(page.body?.atlas_doc_format?.value || '{}');

    const updatedAdf = updateMermaidInAdf(adf, sourceName, newSource);

    const updateResponse = await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${pageId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: pageId,
          status: 'current',
          title: page.title,
          body: {
            representation: 'atlas_doc_format',
            value: JSON.stringify(updatedAdf)
          },
          version: {
            number: page.version.number + 1,
            message: `Updated Mermaid diagram: ${sourceName || 'default'}`
          }
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();

      // Check for version conflict from Confluence API
      if (updateResponse.status === 409) {
        return {
          success: false,
          error: 'Page was modified while saving. Please refresh and try again.',
          conflict: true
        };
      }

      throw new Error(`Failed to update page: ${updateResponse.status} - ${errorText}`);
    }

    return {
      success: true,
      newVersion: page.version.number + 1
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

resolver.define('getPageHistory', async ({ payload }) => {
  const { pageId } = payload;

  if (!isValidPageId(pageId)) {
    return {
      success: false,
      error: 'Invalid page ID format'
    };
  }

  try {
    const response = await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${pageId}/versions?limit=10`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      versions: data.results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

function findMermaidSource(adf, sourceName) {
  if (!adf || !adf.content) return null;

  for (let i = 0; i < adf.content.length; i++) {
    const node = adf.content[i];

    if (node.type === 'expand') {
      const title = node.attrs?.title || '';

      if (title.startsWith('mermaid:')) {
        const name = title.replace('mermaid:', '').trim();

        if (!sourceName || name === sourceName) {
          return extractTextFromNode(node);
        }
      }
    }
  }

  return null;
}

function extractTextFromNode(node) {
  if (!node) return '';

  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content) {
    return node.content.map(extractTextFromNode).join('');
  }

  return '';
}

function updateMermaidInAdf(adf, sourceName, newSource) {
  if (!adf || !adf.content) return adf;

  const updatedContent = adf.content.map(node => {
    if (node.type === 'expand') {
      const title = node.attrs?.title || '';

      if (title.startsWith('mermaid:')) {
        const name = title.replace('mermaid:', '').trim();

        if (!sourceName || name === sourceName) {
          return {
            ...node,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: newSource
              }]
            }]
          };
        }
      }
    }
    return node;
  });

  return { ...adf, content: updatedContent };
}

resolver.define('getJiraIssue', async ({ payload }) => {
  const { issueKey } = payload;

  if (!isValidIssueKey(issueKey)) {
    return {
      success: false,
      error: 'Invalid issue key format'
    };
  }

  try {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=description`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch issue: ${response.status}`);
    }

    const issue = await response.json();

    let description = '';
    if (issue.fields?.description?.content) {
      description = extractTextFromAdf(issue.fields.description);
    }

    return {
      success: true,
      description,
      key: issue.key
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

function extractTextFromAdf(adf) {
  if (!adf || !adf.content) return '';

  return adf.content.map(node => {
    if (node.type === 'codeBlock' && node.attrs?.language === 'mermaid') {
      const text = node.content?.map(c => c.text || '').join('') || '';
      return '```mermaid\n' + text + '```';
    }

    if (node.type === 'paragraph' || node.type === 'text') {
      return extractTextFromNode(node);
    }

    if (node.content) {
      return extractTextFromAdf(node);
    }

    return '';
  }).join('\n');
}

exports.handler = resolver.getDefinitions();
