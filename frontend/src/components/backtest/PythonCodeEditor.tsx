import React from 'react'
import Editor from '@monaco-editor/react'

interface PythonCodeEditorProps {
  code: string
  onChange?: (code: string | undefined) => void
  readOnly?: boolean
  height?: string
  theme?: 'light' | 'dark'
}

export const PythonCodeEditor: React.FC<PythonCodeEditorProps> = ({
  code,
  onChange,
  readOnly = false,
  height = '500px',
  theme = 'dark',
}) => {
  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="python"
        value={code}
        onChange={handleEditorChange}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: false },  // Disable minimap for cleaner view
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
        }}
      />
    </div>
  )
}

