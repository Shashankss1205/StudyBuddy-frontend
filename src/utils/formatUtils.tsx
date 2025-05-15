import React from 'react';
import { markdownStyles } from '../styles';

export const formatText = (text: string) => {
  if (!text) return <div></div>;
  
  // Process markdown formatting
  let formattedText = text;
  
  // Bold: **text** -> <strong>text</strong>
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* -> <em>text</em>
  formattedText = formattedText.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  
  // Headers: # Header -> <h1>Header</h1>, ## Header -> <h2>Header</h2>, etc.
  formattedText = formattedText.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  formattedText = formattedText.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  formattedText = formattedText.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  
  // Lists: - item -> <li>item</li>, numbered lists: 1. item -> <ol><li>item</li></ol>
  formattedText = formattedText.replace(/^- (.*?)$/gm, '<li>$1</li>');
  formattedText = formattedText.replace(/(?:^<li>.*<\/li>$(?:\r\n|\n|\r)?)+/gm, '<ul>$&</ul>');
  
  // Numbered lists: 1. item -> <ol><li>item</li></ol>
  formattedText = formattedText.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
  formattedText = formattedText.replace(/(?:^<li>.*<\/li>$(?:\r\n|\n|\r)?)+/gm, match => {
    if (match.indexOf('<ul>') === -1) {
      return '<ol>' + match + '</ol>';
    }
    return match;
  });
  
  // Code blocks: `code` -> <code>code</code>
  formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Multi-line code blocks: ```code``` -> <pre><code>code</code></pre>
  formattedText = formattedText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Line breaks: preserve paragraph breaks
  formattedText = formattedText.replace(/\n\n/g, '</p><p>');
  
  // For equations and math expressions, wrap them in special spans
  formattedText = formattedText.replace(/\$\$(.*?)\$\$/g, '<span class="math-formula">$1</span>');
  
  // Apply CSS styles through inline styles
  formattedText = formattedText
    .replace(/<h1>/g, '<h1 style="font-size:2rem; margin-top:1.5rem; margin-bottom:0.5rem; font-weight:600; border-bottom:1px solid #eaecef; padding-bottom:0.3rem">')
    .replace(/<h2>/g, '<h2 style="font-size:1.5rem; margin-top:1.5rem; margin-bottom:0.5rem; font-weight:600; border-bottom:1px solid #eaecef; padding-bottom:0.3rem">')
    .replace(/<h3>/g, '<h3 style="font-size:1.25rem; margin-top:1.5rem; margin-bottom:0.5rem; font-weight:600">')
    .replace(/<p>/g, '<p style="margin-top:1rem; margin-bottom:1rem">')
    .replace(/<ul>/g, '<ul style="padding-left:2rem; margin-top:0.5rem; margin-bottom:0.5rem">')
    .replace(/<ol>/g, '<ol style="padding-left:2rem; margin-top:0.5rem; margin-bottom:0.5rem">')
    .replace(/<li>/g, '<li style="margin-top:0.25rem; margin-bottom:0.25rem">')
    .replace(/<code>/g, '<code style="font-family:monospace; background-color:#f1f1f1; padding:2px 4px; border-radius:3px; font-size:0.9rem">')
    .replace(/<pre>/g, '<pre style="font-family:monospace; background-color:#f6f8fa; padding:1rem; border-radius:5px; overflow:auto; font-size:0.9rem; margin-top:0.5rem; margin-bottom:0.5rem">')
    .replace(/<span class="math-formula">/g, '<span class="math-formula" style="font-family:serif; font-style:italic; padding:0.25rem 0; font-size:1.1rem">')
    .replace(/<strong>/g, '<strong style="font-weight:700">')
    .replace(/<em>/g, '<em style="font-style:italic">');
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: `<p>${formattedText}</p>` }} 
      className="markdown-content"
      style={markdownStyles.content}
    />
  );
};

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}; 