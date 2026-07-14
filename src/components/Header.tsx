import React, { useState } from 'react';
import { FolderOpen, Save, Play, Edit3, FilePlus, ArrowDownToLine, Info } from 'lucide-react';

interface HeaderProps {
  fileName: string;
  onNewFile: () => void;
  onOpenFile: () => void;
  onImportFile: () => void;
  onSaveFile: () => void;
  onSaveFileAs: () => void;
  mode: 'editor' | 'quiz';
  setMode: (mode: 'editor' | 'quiz') => void;
}

export const Header: React.FC<HeaderProps> = ({ fileName, onNewFile, onOpenFile, onImportFile, onSaveFile, onSaveFileAs, mode, setMode }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
    <header className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1rem 2rem', marginBottom: '1rem', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>MD QuizApp</h1>
          <span style={{ color: 'var(--text-color-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
            {fileName || '未保存のファイル'}
          </span>
        </div>
        <div className="flex gap-2 mode-switch">
          <button className={`btn ${mode === 'editor' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('editor')}>
            <Edit3 size={18} />
            エディタ
          </button>
          <button className={`btn ${mode === 'quiz' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('quiz')}>
            <Play size={18} />
            復習
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap action-buttons" style={{ justifyContent: 'flex-end', width: '100%' }}>
        <button className="btn btn-secondary" onClick={onNewFile}>
          <FilePlus size={18} />
          新規
        </button>
        <button className="btn btn-secondary" onClick={onOpenFile}>
          <FolderOpen size={18} />
          開く
        </button>
        <button className="btn btn-secondary" onClick={onImportFile} title="他のファイルの問題を末尾に追加します">
          <ArrowDownToLine size={18} />
          統合
        </button>
        <button className="btn btn-primary" onClick={onSaveFile}>
          <Save size={18} />
          保存
        </button>
        <button className="btn btn-secondary" onClick={onSaveFileAs} title="別のファイル名で保存します">
          <Save size={18} />
          別名保存
        </button>
      </div>
    </header>

    <div className="flex flex-col items-end gap-2" style={{ paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
      <div 
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-color-muted)', cursor: 'help' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <Info size={16} />
        <span style={{ fontSize: '0.85rem' }}>アプリの説明書</span>
        
        {showTooltip && (
          <div className="glass-panel" style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            marginTop: '0.5rem', 
            padding: '1rem', 
            width: '280px', 
            zIndex: 50, 
            textAlign: 'left',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            color: 'var(--text-color)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary-color)' }}>📖 Markdown QuizApp 使い方</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>エディタ:</strong> 問題と答えを作成。並び替えや自動補完に対応しています。</li>
              <li><strong>復習:</strong> フラッシュカード形式で学習。シャッフルや「戻る」が可能です。</li>
              <li><strong>新規:</strong> 現在の内容をリセットして、新しく作成し直します。</li>
              <li><strong>開く:</strong> 保存したマークダウンファイル(.md)を読み込みます。</li>
              <li><strong>統合:</strong> 別のファイルの問題を現在のリストの末尾に追加します。</li>
              <li><strong>保存:</strong> 作成した問題をマークダウンファイル(.md)として上書き保存します。</li>
              <li><strong>別名保存:</strong> 新しいファイル名でマークダウンファイルを保存します。</li>
              <li><strong>プレビュー:</strong> 目のアイコンで数式などの実際の表示を確認できます。</li>
            </ul>
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-color-muted)', opacity: 0.8 }}>
        <strong style={{ color: 'var(--danger-color)', opacity: 1 }}>保存必須！！</strong>
      </div>
    </div>
    </>
  );
};
