import { useState } from 'react';

export const useFileSystem = () => {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // File System Access API がサポートされているかどうか
  const hasFileSystemAccess = 'showOpenFilePicker' in window;

  const openFileFallback = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        setFileName(file.name);
        setFileHandle(null); // フォールバックではハンドルを持てない
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = () => {
          console.error('File read error');
          resolve(null);
        };
        reader.readAsText(file);
      };
      input.click();
    });
  };

  const saveFileFallback = (content: string, defaultName: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `${defaultName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  };

  const importFileFallback = (): Promise<string[] | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown';
      input.multiple = true; // 複数選択を許可
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve(null);
          return;
        }
        
        const contents: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const content = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target?.result as string);
            reader.onerror = () => res(''); // エラーの場合は空文字としてスキップ
            reader.readAsText(file);
          });
          if (content) {
            contents.push(content);
          }
        }
        resolve(contents.length > 0 ? contents : null);
      };
      input.click();
    });
  };

  const importFile = async (): Promise<string[] | null> => {
    if (!hasFileSystemAccess) {
      return importFileFallback();
    }
    try {
      // @ts-ignore
      const handles = await window.showOpenFilePicker({
        multiple: true, // 複数選択を許可
        types: [
          {
            description: 'Markdown Files',
            accept: {
              'text/markdown': ['.md', '.markdown'],
            },
          },
        ],
      });
      
      const contents: string[] = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        const content = await file.text();
        contents.push(content);
      }
      return contents.length > 0 ? contents : null;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to import file:', error);
        alert('ファイルのインポートに失敗しました。');
      }
      return null;
    }
  };

  const openFile = async () => {
    if (!hasFileSystemAccess) {
      return openFileFallback();
    }
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Markdown Files',
            accept: {
              'text/markdown': ['.md', '.markdown'],
            },
          },
        ],
      });
      setFileHandle(handle);
      setFileName(handle.name);
      const file = await handle.getFile();
      return await file.text();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to open file:', error);
        alert('ファイルの読み込みに失敗しました。');
      }
      return null;
    }
  };

  const saveFile = async (content: string, defaultName = 'Untitled Quiz', handle = fileHandle) => {
    if (!hasFileSystemAccess || !handle) {
      return saveFileAs(content, defaultName);
    }
    try {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('ファイルの保存に失敗しました。');
      return false;
    }
  };

  const saveFileAs = async (content: string, defaultName = 'Untitled Quiz') => {
    if (!hasFileSystemAccess) {
      return saveFileFallback(content, defaultName);
    }
    try {
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: `${defaultName}.md`,
        types: [
          {
            description: 'Markdown Files',
            accept: {
              'text/markdown': ['.md'],
            },
          },
        ],
      });
      setFileHandle(handle);
      setFileName(handle.name);
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to save file as:', error);
        alert('ファイルの保存に失敗しました。');
      }
      return false;
    }
  };

  const resetFile = () => {
    setFileHandle(null);
    setFileName('');
  };

  return { fileHandle, fileName, openFile, importFile, saveFile, saveFileAs, resetFile };
};
