import React, { useState, useEffect, useCallback } from 'react';
import MermaidRenderer from './MermaidRenderer';

const TEMPLATES = {
  flowchart: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
  sequence: `sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request
    B-->>A: Response`,
  classDiagram: `classDiagram
    class Animal {
        +name: string
        +age: int
        +makeSound()
    }
    class Dog {
        +breed: string
        +bark()
    }
    Animal <|-- Dog`,
  stateDiagram: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Success --> [*]
    Error --> Idle: Retry`,
  erDiagram: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : includes`,
  gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1: 2024-01-01, 7d
    Task 2: 2024-01-08, 5d
    section Phase 2
    Task 3: 2024-01-15, 10d`
};

const MermaidEditor = ({ source, onSave, onCancel, isDarkMode }) => {
  const [editedSource, setEditedSource] = useState(source);
  const [previewSource, setPreviewSource] = useState(source);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewSource(editedSource);
    }, 300);

    return () => clearTimeout(timer);
  }, [editedSource]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(editedSource);
    } finally {
      setIsSaving(false);
    }
  }, [editedSource, onSave]);

  const handleInsertTemplate = useCallback((templateKey) => {
    setEditedSource(TEMPLATES[templateKey]);
  }, []);

  return (
    <div>
      <div className="mermaid-toolbar">
        <button
          className="mermaid-button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          className="mermaid-button mermaid-button--secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
        <select
          className="mermaid-button mermaid-button--secondary"
          onChange={(e) => e.target.value && handleInsertTemplate(e.target.value)}
          value=""
          style={{ cursor: 'pointer' }}
        >
          <option value="">Insert template...</option>
          <option value="flowchart">Flowchart</option>
          <option value="sequence">Sequence Diagram</option>
          <option value="classDiagram">Class Diagram</option>
          <option value="stateDiagram">State Diagram</option>
          <option value="erDiagram">ER Diagram</option>
          <option value="gantt">Gantt Chart</option>
        </select>
      </div>

      <div className="mermaid-editor">
        <div className="mermaid-editor__source">
          <textarea
            className="mermaid-editor__textarea"
            value={editedSource}
            onChange={(e) => setEditedSource(e.target.value)}
            placeholder="Enter Mermaid diagram syntax..."
            spellCheck={false}
          />
        </div>
        <div className="mermaid-editor__preview">
          <MermaidRenderer source={previewSource} isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default MermaidEditor;
