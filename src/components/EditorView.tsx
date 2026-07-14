import React, { useState, useEffect, useRef } from 'react';
import type { MarkdownData, QA } from '../utils/markdownParser';
import { Trash2, Plus, GripVertical, Eye, Edit3 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MarkdownViewer } from './MarkdownViewer';

interface EditorViewProps {
  data: MarkdownData;
  setData: React.Dispatch<React.SetStateAction<MarkdownData>>;
}

// ---------------------------------------------
// Helper for IME Auto Close
// ---------------------------------------------
export const handleIMEAutoClose = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
  currentValue: string, 
  updateValue: (val: string) => void
) => {
  const target = e.target;
  let value = target.value;
  const start = target.selectionStart;

  // IMEで「が確定入力されたことを検知し、」を補完する
  if (start !== null && start > 0 && value.length === currentValue.length + 1) {
    if (value[start - 1] === '「') {
      value = value.substring(0, start) + '」' + value.substring(start);
      setTimeout(() => {
        target.setSelectionRange(start, start);
      }, 0);
    }
  }
  updateValue(value);
};

// ---------------------------------------------
// Sortable QA Item Component
// ---------------------------------------------
interface SortableQAItemProps {
  qa: QA;
  index: number;
  handleQAChange: (id: string, field: 'question' | 'answer', value: string) => void;
  handleDelete: (id: string) => void;
  handleAutoClose: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, currentValue: string, updateValue: (val: string) => void) => void;
}

const SortableQAItem: React.FC<SortableQAItemProps> = ({ qa, index, handleQAChange, handleDelete, handleAutoClose }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: qa.id });
  const [isPreview, setIsPreview] = useState(false);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} className="glass-panel flex gap-4" style={{ ...style, padding: '1.5rem', position: 'relative' }}>
      <div 
        {...attributes} 
        {...listeners} 
        style={{ cursor: 'grab', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'var(--text-color-muted)' }}
      >
        <GripVertical />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="flex justify-end mb-[-0.5rem]">
          <button 
            type="button"
            onClick={() => setIsPreview(!isPreview)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
            className="hover-bg-primary-transparent"
          >
            {isPreview ? <><Edit3 size={14} /> 編集に戻る</> : <><Eye size={14} /> プレビュー</>}
          </button>
        </div>

        {isPreview ? (
          <>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-color-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>問題 {index + 1} (プレビュー)</strong>
              <div style={{ padding: '0.5rem 0' }}>
                <MarkdownViewer content={qa.question} />
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-color-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>答え (プレビュー)</strong>
              <div style={{ padding: '0.5rem 0' }}>
                <MarkdownViewer content={qa.answer} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-color-muted)' }}>問題 {index + 1}</label>
              <input 
                type="text" 
                value={qa.question} 
                onChange={(e) => handleIMEAutoClose(e, qa.question, (v) => handleQAChange(qa.id, 'question', v))}
                onKeyDown={(e) => handleAutoClose(e, qa.question, (v) => handleQAChange(qa.id, 'question', v))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-color-muted)' }}>答え</label>
              <textarea 
                value={qa.answer} 
                onChange={(e) => handleIMEAutoClose(e, qa.answer, (v) => handleQAChange(qa.id, 'answer', v))}
                onKeyDown={(e) => handleAutoClose(e, qa.answer, (v) => handleQAChange(qa.id, 'answer', v))}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
              />
            </div>
          </>
        )}
      </div>
      
      <button 
        className="btn-icon" 
        style={{ color: 'var(--danger-color)', alignSelf: 'flex-start' }}
        onClick={() => handleDelete(qa.id)}
        title="削除"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};

// ---------------------------------------------
// Editor View Component
// ---------------------------------------------
export const EditorView: React.FC<EditorViewProps> = ({ data, setData }) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isPreviewNew, setIsPreviewNew] = useState(false);
  const deletedQasRef = useRef<{index: number, qa: QA}[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.qas.findIndex((qa) => qa.id === active.id);
      const newIndex = data.qas.findIndex((qa) => qa.id === over.id);
      
      setData({
        ...data,
        qas: arrayMove(data.qas, oldIndex, newIndex),
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, title: e.target.value });
  };

  const handleQAChange = (id: string, field: 'question' | 'answer', value: string) => {
    const updatedQAs = data.qas.map((qa) =>
      qa.id === id ? { ...qa, [field]: value } : qa
    );
    setData({ ...data, qas: updatedQAs });
  };

  const handleDelete = (id: string) => {
    const index = data.qas.findIndex((qa) => qa.id === id);
    if (index !== -1) {
      const deletedQa = data.qas[index];
      deletedQasRef.current.push({ index, qa: deletedQa });
    }
    setData(current => ({ ...current, qas: current.qas.filter((qa) => qa.id !== id) }));
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        if (deletedQasRef.current.length === 0) return;
        
        e.preventDefault();
        
        const lastDeleted = deletedQasRef.current.pop();
        if (!lastDeleted) return;
        
        setData(currentData => {
          const newQas = [...currentData.qas];
          const insertIndex = Math.min(lastDeleted.index, newQas.length);
          // dnd-kitのキャッシュバグを防ぐため、新しいIDを付与する
          const restoredQa = { ...lastDeleted.qa, id: crypto.randomUUID() };
          newQas.splice(insertIndex, 0, restoredQa);
          return { ...currentData, qas: newQas };
        });
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setData]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    const newQA: QA = {
      id: crypto.randomUUID(),
      question: newQuestion,
      answer: newAnswer,
    };
    
    setData({ ...data, qas: [...data.qas, newQA] });
    setNewQuestion('');
    setNewAnswer('');
    setIsPreviewNew(false);
  };

  const handleAutoClose = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, 
    currentValue: string, 
    updateValue: (val: string) => void
  ) => {
    // IME入力中またはIME変換開始キーの場合は無視する（[]「になるバグを防止）
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    const pairs: Record<string, string> = {
      '$': '$',
      '(': ')',
      '{': '}',
      '[': ']',
      '「': '」'
    };

    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (start === null || end === null) return;

    // Backspaceでペアを同時に削除する
    if (e.key === 'Backspace' && start === end && start > 0) {
      const charBefore = currentValue.substring(start - 1, start);
      const charAfter = currentValue.substring(start, start + 1);

      if (pairs[charBefore] && pairs[charBefore] === charAfter) {
        e.preventDefault();
        const newValue = currentValue.substring(0, start - 1) + currentValue.substring(start + 1);
        updateValue(newValue);

        setTimeout(() => {
          target.setSelectionRange(start - 1, start - 1);
        }, 0);
      }
      return;
    }

    // オートクローズ
    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const newValue = currentValue.substring(0, start) + e.key + pairs[e.key] + currentValue.substring(end);
      updateValue(newValue);

      setTimeout(() => {
        target.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  const handleNewAnswerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAdd(e as any);
      return;
    }
    handleAutoClose(e, newAnswer, setNewAnswer);
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ display: 'flex' }}>
      
      {/* 1. タイトル編集 */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color-muted)' }}>カテゴリ・タイトル</label>
        <input 
          type="text" 
          value={data.title} 
          onChange={handleTitleChange}
          style={{ width: '100%', fontSize: '1.5rem', fontWeight: 'bold' }}
        />
      </div>

      {/* 2. 新しい問題を追加 */}
      <form className="glass-panel flex-col gap-4" style={{ display: 'flex', padding: '2rem', border: '1px dashed var(--primary-color)' }} onSubmit={handleAdd}>
        <div className="flex justify-between items-center">
          <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>新しい問題を追加</h3>
          <button 
            type="button"
            onClick={() => setIsPreviewNew(!isPreviewNew)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
            className="hover-bg-primary-transparent"
          >
            {isPreviewNew ? <><Edit3 size={14} /> 編集に戻る</> : <><Eye size={14} /> プレビュー</>}
          </button>
        </div>

        {isPreviewNew ? (
          <>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-color-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>問題 (プレビュー)</strong>
              <div style={{ padding: '0.5rem 0' }}>
                <MarkdownViewer content={newQuestion || '*未入力*'} />
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-color-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>答え (プレビュー)</strong>
              <div style={{ padding: '0.5rem 0' }}>
                <MarkdownViewer content={newAnswer || '*未入力*'} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-color-muted)' }}>問題</label>
              <input 
                type="text" 
                value={newQuestion} 
                onChange={(e) => handleIMEAutoClose(e, newQuestion, setNewQuestion)}
                onKeyDown={(e) => handleAutoClose(e, newQuestion, setNewQuestion)}
                style={{ width: '100%' }}
                placeholder="例: 二次方程式 $ax^2 + bx + c = 0$ の解の公式は？"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-color-muted)' }}>答え</label>
              <textarea 
                value={newAnswer} 
                onChange={(e) => handleIMEAutoClose(e, newAnswer, setNewAnswer)}
                onKeyDown={handleNewAnswerKeyDown}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                placeholder="例: $$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$&#10;(Cmd + Enter または Ctrl + Enter で追加)"
              />
            </div>
          </>
        )}
        <div className="flex justify-between items-center mt-2">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-color-muted)' }}>ヒント: 答えの入力欄で Cmd + Enter を押すとすぐに追加できます。</span>
          <button type="submit" className="btn btn-primary" disabled={!newQuestion.trim() || !newAnswer.trim()}>
            <Plus size={18} />
            追加する
          </button>
        </div>
      </form>

      {/* 3. 既存の問題リスト (ドラッグ＆ドロップ対応) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={data.qas.map(qa => qa.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-col gap-4" style={{ display: 'flex' }}>
            {data.qas.map((qa, index) => (
              <SortableQAItem 
                key={qa.id} 
                qa={qa} 
                index={index} 
                handleQAChange={handleQAChange}
                handleDelete={handleDelete}
                handleAutoClose={handleAutoClose}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

    </div>
  );
};
