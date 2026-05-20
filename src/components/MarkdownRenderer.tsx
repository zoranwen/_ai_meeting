/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

// Inline token parsed representation
type BlockToken =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "codeblock"; text: string; language?: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "ordered"; text: string; num: string; indent: number }
  | { type: "todo"; text: string; checked: boolean; indent: number }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

  // Parse Markdown lines into dynamic UI Blocks
  const blocks = useMemo(() => {
    if (!content) return [];

    const lines = content.split("\n");
    const parsedBlocks: BlockToken[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle Code Block Toggle
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          parsedBlocks.push({
            type: "codeblock",
            text: codeBlockContent.join("\n"),
            language: codeBlockLang,
          });
          codeBlockContent = [];
          codeBlockLang = "";
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBlockLang = line.trim().substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      const trimmed = line.trim();

      // Horizontal Rule
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        parsedBlocks.push({ type: "hr" });
        continue;
      }

      // Headers
      if (line.startsWith("# ")) {
        parsedBlocks.push({ type: "h1", text: line.substring(2) });
        continue;
      }
      if (line.startsWith("## ")) {
        parsedBlocks.push({ type: "h2", text: line.substring(3) });
        continue;
      }
      if (line.startsWith("### ")) {
        parsedBlocks.push({ type: "h3", text: line.substring(4) });
        continue;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        parsedBlocks.push({ type: "blockquote", text: line.substring(2) });
        continue;
      }

      // Check for Todo item: - [ ] or - [x] or * [ ] or * [x]
      const todoMatch = line.match(/^(\s*)([-*])\s+\[([ xX])\]\s+(.*)$/);
      if (todoMatch) {
        const indentSpace = todoMatch[1] || "";
        const checked = todoMatch[3].toLowerCase() === "x";
        const text = todoMatch[4];
        parsedBlocks.push({
          type: "todo",
          text,
          checked,
          indent: Math.floor(indentSpace.length / 2),
        });
        continue;
      }

      // Unordered lists
      const bulletMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
      if (bulletMatch) {
        const indentSpace = bulletMatch[1] || "";
        const text = bulletMatch[3];
        // Ensure it's not a horizontal rule double-trigger
        if (text.trim() !== "" && text !== "---" && text !== "***") {
          parsedBlocks.push({
            type: "bullet",
            text,
            indent: Math.floor(indentSpace.length / 2),
          });
          continue;
        }
      }

      // Ordered lists
      const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        const indentSpace = orderedMatch[1] || "";
        const num = orderedMatch[2];
        const text = orderedMatch[3];
        parsedBlocks.push({
          type: "ordered",
          text,
          num,
          indent: Math.floor(indentSpace.length / 2),
        });
        continue;
      }

      // Empty Lines (as vertical negative space)
      if (trimmed === "") {
        // Only push single layout spacers if the last one wasn't empty
        if (
          parsedBlocks.length > 0 &&
          parsedBlocks[parsedBlocks.length - 1].type !== "hr" &&
          (parsedBlocks[parsedBlocks.length - 1] as any).text !== ""
        ) {
          parsedBlocks.push({ type: "paragraph", text: "" });
        }
        continue;
      }

      // Standard Paragraph
      parsedBlocks.push({ type: "paragraph", text: line });
    }

    // Cleanup residual code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      parsedBlocks.push({
        type: "codeblock",
        text: codeBlockContent.join("\n"),
        language: codeBlockLang,
      });
    }

    return parsedBlocks;
  }, [content]);

  // Helper code copy
  const handleCopyBlock = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockIndex(index);
    setTimeout(() => {
      setCopiedBlockIndex(null);
    }, 2000);
  };

  // Helper to parse line level rich styling: **bold**, *italic*, `code`
  const renderInlineStyles = (text: string) => {
    if (!text) return <span className="block h-2"></span>;

    // We can parse bold, italics, and inline code using structured regex mapping.
    // To safe avoid JSX mapping arrays, we splits string into token parts.
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let keyIndex = 0;

    // Regex to match **bold**, *italic*, or `code`
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const tokens = currentText.split(regex);

    if (tokens.length === 1) {
      return <span>{text}</span>;
    }

    return (
      <>
        {tokens.map((token, i) => {
          if (token.startsWith("**") && token.endsWith("**")) {
            return (
              <strong key={i} className="font-bold text-stone-900 mx-0.5">
                {token.slice(2, -2)}
              </strong>
            );
          }
          if (token.startsWith("*") && token.endsWith("*")) {
            return (
              <em key={i} className="italic text-stone-800 mx-0.5 font-medium">
                {token.slice(1, -1)}
              </em>
            );
          }
          if (token.startsWith("`") && token.endsWith("`")) {
            return (
              <code
                key={i}
                className="font-mono text-xs px-1.5 py-0.5 mx-0.5 bg-indigo-50 border border-indigo-100/60 rounded font-medium text-indigo-900"
              >
                {token.slice(1, -1)}
              </code>
            );
          }
          return <span key={i}>{token}</span>;
        })}
      </>
    );
  };

  // Action item task hook allowing client side task interaction
  const [todoStates, setTodoStates] = useState<Record<string, boolean>>({});
  const toggleTodoState = (index: number) => {
    setTodoStates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="space-y-3.5 text-slate-700 leading-relaxed font-sans text-sm md:text-base">
      {blocks.map((block, index) => {
        const uniqKey = `${block.type}-${index}`;

        switch (block.type) {
          case "h1":
            return (
              <h1
                key={uniqKey}
                className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight pt-6 pb-2 border-b border-slate-200 mt-6 first:mt-0"
              >
                {renderInlineStyles(block.text)}
              </h1>
            );

          case "h2":
            return (
              <h3
                key={uniqKey}
                className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight pt-5 pb-1 mt-5 flex items-center gap-3"
              >
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
                {renderInlineStyles(block.text)}
              </h3>
            );

          case "h3":
            return (
              <h4
                key={uniqKey}
                className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight pt-4 mt-4"
              >
                {renderInlineStyles(block.text)}
              </h4>
            );

          case "blockquote":
            return (
              <blockquote
                key={uniqKey}
                className="pl-4 py-2 my-2 border-l-4 border-indigo-400 bg-indigo-50/30 rounded-r text-slate-650 font-sans italic"
              >
                {renderInlineStyles(block.text)}
              </blockquote>
            );

          case "codeblock":
            return (
              <div
                key={uniqKey}
                className="relative my-4 rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs md:text-sm overflow-x-auto shadow-inner group border border-slate-800"
              >
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleCopyBlock(block.text, index)}
                    className="p-1 px-2 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-755 transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-slate-600"
                    title="複製程式碼"
                  >
                    {copiedBlockIndex === index ? (
                      <>
                        <Check size={12} className="text-emerald-450" />
                        <span className="text-[10px] text-emerald-450">已複製</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span className="text-[10px]">複製</span>
                      </>
                    )}
                  </button>
                </div>
                {block.language && (
                  <div className="text-[10px] text-slate-500 font-sans uppercase tracking-widest pb-1 border-b border-slate-800/80 mb-2">
                    {block.language}
                  </div>
                )}
                <pre className="whitespace-pre overflow-x-auto selection:bg-slate-800">
                  {block.text}
                </pre>
              </div>
            );

          case "bullet":
            return (
              <div
                key={uniqKey}
                className="flex items-start gap-2.5 pl-1.5"
                style={{ paddingLeft: `${block.indent * 1.5 + 0.375}rem` }}
              >
                <span className="text-indigo-400 select-none mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/80" />
                <span className="flex-1">{renderInlineStyles(block.text)}</span>
              </div>
            );

          case "ordered":
            return (
              <div
                key={uniqKey}
                className="flex items-start gap-2.5 pl-1.5"
                style={{ paddingLeft: `${block.indent * 1.5 + 0.375}rem` }}
              >
                <span className="text-indigo-600 font-mono font-bold shrink-0 text-xs mt-1">
                  {block.num}.
                </span>
                <span className="flex-1">{renderInlineStyles(block.text)}</span>
              </div>
            );

          case "todo":
            const isChecked = todoStates[index] !== undefined ? todoStates[index] : block.checked;
            return (
              <div
                key={uniqKey}
                className="flex items-start gap-3 pl-1.5 select-none"
                style={{ paddingLeft: `${block.indent * 1.5 + 0.375}rem` }}
              >
                <button
                  onClick={() => toggleTodoState(index)}
                  className={`mt-1 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition focus:outline-none ${
                    isChecked
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-slate-300 hover:border-slate-400"
                  }`}
                >
                  {isChecked && <Check size={11} strokeWidth={3} />}
                </button>
                <span
                  className={`flex-1 cursor-pointer transition-all duration-200 ${
                    isChecked ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"
                  }`}
                  onClick={() => toggleTodoState(index)}
                >
                  {renderInlineStyles(block.text)}
                </span>
              </div>
            );

          case "hr":
            return (
              <hr
                key={uniqKey}
                className="border-0 border-t border-slate-200 my-5 md:my-7"
              />
            );

          case "paragraph":
          default:
            if (block.text === "") {
              return <div key={uniqKey} className="h-2" />;
            }
            return (
              <p key={uniqKey} className="text-slate-650 leading-relaxed">
                {renderInlineStyles(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
