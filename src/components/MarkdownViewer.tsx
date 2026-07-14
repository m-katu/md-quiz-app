import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <div style={{ textAlign: 'left', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => <p style={{ margin: '0.5rem 0' }} {...props} />,
          h1: ({ node, ...props }) => <h1 style={{ margin: '1rem 0' }} {...props} />,
          h2: ({ node, ...props }) => <h2 style={{ margin: '1rem 0' }} {...props} />,
          h3: ({ node, ...props }) => <h3 style={{ margin: '0.75rem 0' }} {...props} />,
          ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', textAlign: 'left' }} {...props} />,
          ol: ({ node, ...props }) => <ol style={{ paddingLeft: '1.5rem', textAlign: 'left' }} {...props} />,
          li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
