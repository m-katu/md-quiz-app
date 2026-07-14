import React, { useState, useEffect } from 'react';
import type { MarkdownData, QA } from '../utils/markdownParser';
import { CheckCircle, XCircle, RefreshCw, ArrowUpToLine, Shuffle, ArrowLeft } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

interface QuizViewProps {
  data: MarkdownData;
  setData: (data: MarkdownData) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ data, setData }) => {
  const [activeQAs, setActiveQAs] = useState<QA[]>(data.qas);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [isFinished, setIsFinished] = useState(false);

  // 外部データが変わったらリセット
  useEffect(() => {
    setActiveQAs(data.qas);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
    setIsFinished(false);
  }, [data]);

  const currentQA = activeQAs[currentIndex];

  const handleGoBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || !currentQA) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        // 裏面（答え）を表示している時
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          handleResult('correct');
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          handleResult('incorrect');
        }
      } else {
        // 表面（問題）を表示している時
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          handleSkip();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          handleGoBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, currentIndex, currentQA]);

  if (!data || data.qas.length === 0) {
    return (
      <div className="glass-panel flex justify-center items-center animate-fade-in" style={{ minHeight: '300px' }}>
        <p style={{ color: 'var(--text-color-muted)' }}>問題がありません。エディタモードで追加してください。</p>
      </div>
    );
  }

  const handleResult = (result: 'correct' | 'incorrect') => {
    if (!currentQA) return;
    
    setResults(prev => ({ ...prev, [currentQA.id]: result }));
    setIsFlipped(false);
    
    setTimeout(() => {
      if (currentIndex + 1 < activeQAs.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 200);
  };

  const handleSkip = () => {
    if (!currentQA) return;
    
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex + 1 < activeQAs.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 200);
  };

  const handleRestartAll = () => {
    setActiveQAs(data.qas);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
    setIsFinished(false);
  };

  const handleShuffleRestart = () => {
    // Fisher-Yates シャッフルアルゴリズムでランダム化
    const shuffled = [...data.qas];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setActiveQAs(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
    setIsFinished(false);
  };

  const handleReviewIncorrect = () => {
    const incorrectQAs = data.qas.filter(qa => results[qa.id] === 'incorrect');
    setActiveQAs(incorrectQAs);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
    setIsFinished(false);
  };

  const handleMoveIncorrectToTop = () => {
    const incorrectQAs = data.qas.filter(qa => results[qa.id] === 'incorrect');
    const correctQAs = data.qas.filter(qa => results[qa.id] !== 'incorrect');
    
    setData({
      ...data,
      qas: [...incorrectQAs, ...correctQAs]
    });
    alert('間違えた問題をリストの先頭に移動しました！\n（※エディタの順番に反映されました。ファイルに書き込む場合は「保存」ボタンを押してください）');
  };

  if (isFinished) {
    const correctCount = Object.values(results).filter(r => r === 'correct').length;
    const totalCount = activeQAs.length;
    const isPerfect = correctCount === totalCount;
    const hasIncorrect = !isPerfect;

    return (
      <div className="flex-col items-center gap-6 animate-fade-in" style={{ display: 'flex' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, textAlign: 'center' }}>{data.title}</h2>
        <div className="glass-panel flex-col items-center gap-6" style={{ padding: '3rem', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: 0, color: isPerfect ? 'var(--success-color)' : 'var(--text-color)' }}>
            {isPerfect ? '全問正解！🎉' : 'お疲れ様でした！'}
          </h3>
          <p style={{ fontSize: '1.25rem', margin: 0 }}>
            {totalCount}問中 <strong style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>{correctCount}</strong> 問正解しました。
          </p>
          
          <div className="flex gap-4" style={{ marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {hasIncorrect && (
              <>
                <button className="btn btn-secondary" onClick={handleReviewIncorrect}>
                  <XCircle size={18} />
                  間違えた問題だけ復習
                </button>
                <button className="btn btn-secondary" onClick={handleMoveIncorrectToTop} style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                  <ArrowUpToLine size={18} />
                  間違えた問題を先頭へ移動
                </button>
              </>
            )}
            <button className="btn btn-secondary" onClick={handleShuffleRestart}>
              <Shuffle size={18} />
              シャッフルしてやり直す
            </button>
            <button className="btn btn-primary" onClick={handleRestartAll}>
              <RefreshCw size={18} />
              最初からやり直す
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col items-center gap-6 animate-fade-in" style={{ display: 'flex' }}>
      <h2 style={{ fontSize: '1.5rem', margin: 0, textAlign: 'center' }}>{data.title}</h2>
      <div className="flex justify-between" style={{ width: '100%', maxWidth: '700px', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="flex gap-4 items-center">
          <span style={{ color: 'var(--text-color-muted)' }}>
            {currentIndex + 1} / {activeQAs.length}
          </span>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} 
              onClick={handleGoBack}
              disabled={currentIndex === 0}
              title="前の問題に戻ります"
            >
              <ArrowLeft size={14} />
              戻る
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} 
              onClick={handleShuffleRestart}
              title="問題をランダムに並び替えて最初からやり直します"
            >
              <Shuffle size={14} />
              シャッフル
            </button>
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-color-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
          {isFlipped ? '[←] 間違えた / [→] 覚えた' : '[←] 戻る / [Space] めくる / [→] スキップ'}
        </span>
      </div>

      <div 
        className="perspective-1000" 
        style={{ width: '100%', maxWidth: '700px', height: '400px', cursor: 'pointer' }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div 
          className="transform-style-3d transition-transform-06"
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front (Question) */}
          <div 
            className="glass-panel backface-hidden flex-col justify-center items-center"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              padding: '2.5rem',
              display: 'flex',
              textAlign: 'center',
              overflowY: 'auto'
            }}
          >
            <span style={{ position: 'absolute', top: '1rem', left: '1.5rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>Q</span>
            <div style={{ fontSize: '1.25rem', margin: 0, lineHeight: '1.6', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <MarkdownViewer content={currentQA?.question || ''} />
            </div>
            <span style={{ position: 'absolute', bottom: '1rem', fontSize: '0.85rem', color: 'var(--text-color-muted)' }}>クリックまたは Space キーで答えを見る</span>
          </div>

          {/* Back (Answer) */}
          <div 
            className="glass-panel backface-hidden flex-col justify-center items-center rotate-y-180"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              padding: '2.5rem',
              display: 'flex',
              textAlign: 'center',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderColor: 'var(--primary-color)',
              overflowY: 'auto'
            }}
          >
            <span style={{ position: 'absolute', top: '1rem', left: '1.5rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>A</span>
            <div style={{ fontSize: '1.15rem', margin: 0, lineHeight: '1.6', width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '3rem' }}>
              <MarkdownViewer content={currentQA?.answer || ''} />
            </div>
            
            {/* 判定ボタン群 */}
            <div className="flex gap-4" style={{ position: 'absolute', bottom: '1.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                onClick={(e) => { e.stopPropagation(); handleResult('incorrect'); }}
              >
                <XCircle size={18} />
                間違えた [←]
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                onClick={(e) => { e.stopPropagation(); handleResult('correct'); }}
              >
                <CheckCircle size={18} />
                覚えた [→]
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
