export interface QA {
  id: string;
  question: string;
  answer: string;
}

export interface MarkdownData {
  title: string;
  qas: QA[];
}

export const parseMarkdown = (text: string): MarkdownData => {
  let title = 'Untitled Quiz';
  const qas: QA[] = [];

  // Match title
  const titleMatch = text.match(/^#\s+(.*)/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // 1. 新しいフォーマット (Obsidian Callouts: > [!info]- Title) のパース
  const calloutRegex = />\s*\[!.*?\]-?\s*(.*)\n((?:>.*\n?)*)/g;
  let match;
  let hasCallouts = false;

  while ((match = calloutRegex.exec(text)) !== null) {
    hasCallouts = true;
    const question = match[1].trim();
    // 答えの各行から先頭の "> " または ">" を削除
    const answer = match[2]
      .split('\n')
      .filter((line, index, arr) => !(index === arr.length - 1 && line === ''))
      .map(line => line.replace(/^>\s?/, ''))
      .join('\n');

    qas.push({
      id: crypto.randomUUID(),
      question,
      answer: answer.trim(),
    });
  }

  // 2. もしコールアウトが見つからなければ、旧フォーマット (<details>タグ) としてパース
  if (!hasCallouts) {
    const detailsRegex = /<details>[\s\n]*<summary>([\s\S]*?)<\/summary>[\s\n]*([\s\S]*?)[\s\n]*<\/details>/gi;
    let hasDetails = false;
    
    while ((match = detailsRegex.exec(text)) !== null) {
      hasDetails = true;
      qas.push({
        id: crypto.randomUUID(),
        question: match[1].trim(),
        answer: match[2].trim(),
      });
    }

    // 3. それも見つからなければ、最古のフォーマット (## 見出し) としてパース
    if (!hasDetails) {
      const lines = text.split('\n');
      let currentQuestion = '';
      let currentAnswer = '';
      let isParsingAnswer = false;
      
      for (const line of lines) {
        if (line.startsWith('# ')) {
          continue;
        } else if (line.startsWith('## ')) {
          if (currentQuestion) {
            qas.push({
              id: crypto.randomUUID(),
              question: currentQuestion.trim(),
              answer: currentAnswer.trim(),
            });
          }
          currentQuestion = line.substring(3).trim();
          currentAnswer = '';
          isParsingAnswer = true;
        } else if (isParsingAnswer) {
          currentAnswer += line + '\n';
        }
      }
      if (currentQuestion) {
        qas.push({
          id: crypto.randomUUID(),
          question: currentQuestion.trim(),
          answer: currentAnswer.trim(),
        });
      }
    }
  }
  
  return { title, qas };
};

export const serializeMarkdown = (data: MarkdownData): string => {
  let text = `# ${data.title}\n\n`;
  for (const qa of data.qas) {
    // 答えの各行の先頭に "> " を追加する
    const formattedAnswer = qa.answer
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');
    
    // Obsidianでデフォルトで折りたたむために [!info]- とマイナス記号をつける
    text += `> [!info]- ${qa.question}\n${formattedAnswer}\n\n`;
  }
  return text;
};
