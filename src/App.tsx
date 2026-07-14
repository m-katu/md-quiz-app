import { useState } from 'react';
import { useFileSystem } from './utils/useFileSystem';
import { parseMarkdown, serializeMarkdown } from './utils/markdownParser';
import type { MarkdownData, QA } from './utils/markdownParser';
import { Header } from './components/Header';
import { EditorView } from './components/EditorView';
import { QuizView } from './components/QuizView';

const initialData: MarkdownData = {
  title: '新しい問題集',
  qas: []
};

function App() {
  const [mode, setMode] = useState<'editor' | 'quiz'>('editor');
  const [data, setData] = useState<MarkdownData>(initialData);
  const { fileName, openFile, importFile, saveFile, saveFileAs, resetFile } = useFileSystem();

  const handleNewFile = () => {
    if (confirm('新しく作成しますか？保存されていない変更は失われます。')) {
      resetFile();
      setData(initialData);
      setMode('editor');
    }
  };

  const handleOpenFile = async () => {
    const content = await openFile();
    if (content !== null) {
      setData(parseMarkdown(content));
    }
  };

  const handleImportFile = async () => {
    const contents = await importFile();
    if (contents && contents.length > 0) {
      let newQas: QA[] = [];
      contents.forEach(content => {
        const importedData = parseMarkdown(content);
        newQas = [...newQas, ...importedData.qas];
      });
      
      setData(prev => ({
        ...prev,
        qas: [...prev.qas, ...newQas]
      }));
    }
  };

  const handleSaveFile = async () => {
    const content = serializeMarkdown(data);
    await saveFile(content, data.title);
  };

  const handleSaveFileAs = async () => {
    const content = serializeMarkdown(data);
    await saveFileAs(content, data.title);
  };

  return (
    <div className="container">
      <Header 
        fileName={fileName} 
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile} 
        onImportFile={handleImportFile}
        onSaveFile={handleSaveFile}
        onSaveFileAs={handleSaveFileAs}
        mode={mode}
        setMode={setMode}
      />
      
      <main>
        {mode === 'editor' ? (
          <EditorView data={data} setData={setData} />
        ) : (
          <QuizView data={data} setData={setData} />
        )}
      </main>
    </div>
  );
}

export default App;
