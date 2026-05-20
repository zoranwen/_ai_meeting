/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  FileText,
  Trash2,
  Copy,
  Check,
  Download,
  AlertCircle,
  Settings,
  Globe,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  ClipboardPaste,
  FileCheck2,
  ListRestart
} from "lucide-react";
import {
  SUMMARY_STYLES,
  TARGET_LANGUAGES,
  TRANSCRIPT_EXAMPLE,
  SummaryStyle
} from "./types";
import MarkdownRenderer from "./components/MarkdownRenderer";

const LOADING_STEPS = [
  "正在剔除逐字稿冗餘贅字與修正不通順對話...",
  "深入分析各方立場、碰撞焦點與達成的共識事項...",
  "正在按照您設定的會議記錄風格進行大綱排版與排版格式...",
  "正在將整份報告完整翻譯、校對並進行多國語言精緻潤色...",
  "撰寫工作分配、主辦人與預估截止日期，即將完成..."
];

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>("專業雙語結構化報告");
  const [targetLanguage, setTargetLanguage] = useState("繁體中文");
  
  // Advanced Settings Accordion
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [meetingSubject, setMeetingSubject] = useState("");
  const [meetingAttendees, setMeetingAttendees] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Result state
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const resultRef = useRef<HTMLDivElement>(null);

  // Interval hook for loading step messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStepIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Load sample content helper
  const handleLoadExample = () => {
    setTranscript(TRANSCRIPT_EXAMPLE);
    setMeetingSubject("AI 會議工具整合與時程對接會議");
    setMeetingAttendees("Jack, Alice, Bob");
    setCustomPrompt("注意 Alice 寫 parser 的部分，要標記成特殊重點。");
    showNotification("會議範例逐字稿已成功載入！");
  };

  // Clear inputs helper
  const handleClear = () => {
    setTranscript("");
    setMeetingSubject("");
    setMeetingAttendees("");
    setCustomPrompt("");
    showNotification("已清空所有輸入內容。");
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTranscript(text);
        showNotification("已順利貼上剪貼簿內容！");
      } else {
        setError("您的剪貼簿似乎沒有文字內容");
      }
    } catch (err) {
      setError("無法讀取剪貼簿，請手動貼上內容");
    }
  };

  // Process core AI generation API call
  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("請先貼上或輸入「會議逐字稿」或「重點筆記」再進行生成。");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      // Craft combined contextual prompt to pass along
      let combinedContext = "";
      if (meetingSubject) combinedContext += `會議主題：${meetingSubject}\n`;
      if (meetingAttendees) combinedContext += `與會人員：${meetingAttendees}\n`;
      if (customPrompt) combinedContext += `特別強調/自訂指令：${customPrompt}\n`;

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transcript: transcript,
          style: selectedStyle,
          targetLanguage: targetLanguage,
          additionalContext: combinedContext || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "伺服器在生成摘要時發生極限錯誤。");
      }

      setResult(data.result);
      
      // Auto-scroll to results in mobile viewports elegantly
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "與 AI 通訊時發生不可預期的問題，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  // Export as Markdown File
  const handleDownloadFile = (fileType: "md" | "txt") => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Subject prefix
    const titleClean = meetingSubject ? meetingSubject.replace(/[\s\x00-\x1f\x7f-\x9f/\\:*?"<>|]/g, "_") : "會議紀錄報告";
    link.href = url;
    link.download = `${titleClean}_${selectedStyle}_${targetLanguage}.${fileType}`;
    document.body.appendChild(link);
    URL.revokeObjectURL(url);
    showNotification(`已下載為 ${fileType.toUpperCase()} 格式檔案`);
  };

  // Copy results helper
  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    showNotification("已成功將會議紀錄複製到剪貼簿！");
    setTimeout(() => setCopied(false), 2000);
  };

  // Flash notifications banner helper
  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg("");
    }, 3000);
  };

  // Count words helper
  const wordCount = transcript.trim() ? transcript.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-slate-200 flex flex-col justify-between font-sans">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-slate-100 px-5 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-medium"
          >
            <Sparkles size={16} className="text-amber-400" />
            <span>{feedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Sparkles size={20} className="text-amber-300" />
            </div>
            <div>
              <h1 id="app-title" className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-display">
                AI 會議記錄生成與翻譯工具
                <span className="text-[10px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Gemini-3.5
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                以最流暢的方式，自動重組破碎逐字稿並輸出多語商務格式
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadExample}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 text-indigo-700 transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
            >
              <FileCheck2 size={13} strokeWidth={2.5} />
              代入範例測試
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 transition flex items-center gap-1 focus:outline-none cursor-pointer"
              title="清空目前輸入"
            >
              <Trash2 size={13} />
              清空
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Input & Settings (7 Cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Input card container */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                  <FileText size={13} className="text-indigo-500" />
                  步驟一：貼上會議內容
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePasteClipboard}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                    title="從剪貼簿貼上"
                  >
                    <ClipboardPaste size={13} />
                    貼上剪貼簿
                  </button>
                  {wordCount > 0 && (
                    <span className="text-[10px] font-mono select-none px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded">
                      已輸入 {wordCount} 字
                    </span>
                  )}
                </div>
              </div>

              {/* Textarea Input area */}
              <div className="relative">
                <textarea
                  id="transcript-input"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="請在此處貼上會議的「錄音逐字稿」、「隨手重點筆記」或討論大綱... (亦可直接點擊右上方「代入範例測試」體驗)"
                  className="w-full h-80 px-5 py-4 text-slate-800 text-sm placeholder:text-slate-400 border-0 focus:outline-none focus:ring-0 resize-none font-sans leading-relaxed"
                />
                
                {transcript.trim() === "" && (
                  <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none px-5">
                    <p className="text-xs text-slate-400">
                      貼上逐字稿後，AI 秘書將提煉贅字、自動拆解並梳理決策脈絡
                    </p>
                  </div>
                )}
              </div>

              {/* Advanced collapsable options */}
              <div className="border-t border-slate-150">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-5 py-3 flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50/45 transition font-medium focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings size={13} className="text-slate-400" />
                    會議資訊與附加備註 (選填，可優化生成結果)
                  </span>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-slate-50/30"
                    >
                      <div className="p-5 border-t border-slate-100 space-y-4">
                        {/* Subject */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            會議主題名稱
                          </label>
                          <input
                            type="text"
                            value={meetingSubject}
                            onChange={(e) => setMeetingSubject(e.target.value)}
                            placeholder="例如：第四季度產品對接會、專案進度同步會"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        {/* Attendees */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            與會人員與職位
                          </label>
                          <input
                            type="text"
                            value={meetingAttendees}
                            onChange={(e) => setMeetingAttendees(e.target.value)}
                            placeholder="例如：Jack (PM), Alice (QA), Bob (FE)"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        {/* Extra Instructs */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            AI 執行特定指示或特殊字彙
                          </label>
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="例如：希望能以活潑的語氣撰寫、請把「API」用大寫標記、或者是著重整理關於時程延期的部分..."
                            className="w-full h-16 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Config Box: Style & Language select */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
              
              {/* Summary Styles */}
              <div>
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 mb-3.5">
                  <CheckSquare size={13} className="text-indigo-550" />
                  步驟二：選擇整理風格
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUMMARY_STYLES.map((style) => {
                    const isActive = selectedStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3 text-left rounded-xl border text-xs transition flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-550/5 cursor-pointer ${
                          isActive
                            ? "border-indigo-650 bg-indigo-50/40 font-semibold text-indigo-900 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-bold flex items-center justify-between w-full">
                          {style.name}
                          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                        </span>
                        <span className="text-[10px] leading-relaxed text-slate-500 font-normal">
                          {style.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Languages */}
              <div className="pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                  <Globe size={13} className="text-indigo-500" />
                  步驟三：目標翻譯語系
                </span>

                <div className="relative shrink-0 w-full sm:w-56">
                  <select
                    id="lang-select"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 pr-8 cursor-pointer"
                  >
                    {TARGET_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Error notifications */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3"
                >
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">發生錯誤</p>
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Big Trigger Submit Action */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 shadow-lg shadow-indigo-100/80 flex items-center justify-center gap-2 focus:outline-none ${
                loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.985] hover:shadow-xl hover:shadow-indigo-150 cursor-pointer"
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-indigo-400 border-t-white animate-spin" />
                  <span>AI 秘書正全力解析中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-amber-300 fill-amber-300/40" />
                  <span>生成會議總結與翻譯 💻</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

          </div>

          {/* Right Panel: Output Summary Card (7 Cols on desktop) */}
          <div ref={resultRef} className="lg:col-span-7 h-full">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
              
              {/* Output Header */}
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 font-display select-none">
                  <FileCheck2 size={13} className="text-indigo-600" />
                  AI 生成成果區
                </span>

                {/* File Action Controls (Visible only if output exists) */}
                {result && !loading && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <button
                      onClick={handleCopyResult}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all focus:outline-none flex items-center gap-1 text-xs cursor-pointer"
                      title="複製全文"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">已複製</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>複製全文</span>
                        </>
                      )}
                    </button>
                    
                    <div className="h-3 w-[1px] bg-slate-200" />
                    
                    <button
                      onClick={() => handleDownloadFile("md")}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all focus:outline-none flex items-center gap-1 text-xs cursor-pointer"
                      title="下載為 Markdown 格式"
                    >
                      <Download size={13} />
                      <span>.MD</span>
                    </button>

                    <button
                      onClick={() => handleDownloadFile("txt")}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all focus:outline-none flex items-center gap-1 text-xs cursor-pointer"
                      title="下載為純文字檔"
                    >
                      <Download size={13} />
                      <span>.TXT</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Output Card Content Workspace */}
              <div className="flex-grow p-6 md:p-8 flex flex-col justify-center min-h-[400px]">
                
                <AnimatePresence mode="wait">
                  
                  {/* Phase A: Idle Empty Screen */}
                  {!loading && !result && (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="text-center py-12 max-w-sm mx-auto space-y-4"
                    >
                      <div className="h-16 w-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mx-auto mb-1 shadow-inner">
                        <FileCheck2 size={26} className="text-indigo-500/80" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-slate-800">
                          準備好生成您的會議精要
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          於左側貼上錄音逐字稿、隨筆大綱，選擇欲整理風格與偏好語言，點選「生成會議紀錄」後成果在此呈現。
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleLoadExample}
                          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white flex items-center gap-2 mx-auto hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 transition active:scale-[0.97] cursor-pointer"
                        >
                          <Sparkles size={12} className="fill-white/20 text-amber-300" />
                          直接代入「會議時光」逐字稿
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Phase B: Real-Time Dynamic Processing Loading state */}
                  {loading && (
                    <motion.div
                      key="loading-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-16 max-w-md mx-auto space-y-6"
                    >
                      {/* Interactive Rotating Cosmic Sparkle */}
                      <div className="relative h-14 w-14 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-slate-100 border-t-indigo-600 animate-spin" />
                        <Sparkles size={20} className="text-indigo-600 animate-pulse" />
                      </div>

                      {/* Active Substep messages */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800">
                          AI 秘書正精密解構中
                        </h3>
                        
                        {/* Dynamic Step description */}
                        <div className="h-12 flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            <motion.p
                               key={loadingStepIndex}
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               transition={{ duration: 0.3 }}
                               className="text-xs text-slate-500"
                            >
                              {LOADING_STEPS[loadingStepIndex]}
                            </motion.p>
                          </AnimatePresence>
                        </div>

                        {/* Faux elegant progress bar */}
                        <div className="w-48 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden">
                          <motion.div
                            initial={{ width: "3%" }}
                            animate={{ width: "97%" }}
                            transition={{ duration: 12, ease: "easeInOut" }}
                            className="bg-indigo-600 h-full rounded-full"
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-450">
                        正在使用高速 Gemini 3.5 核心。預估在 3 - 5 秒內完成深度渲染。
                      </p>
                    </motion.div>
                  )}

                  {/* Phase C: Finished Markdown report output */}
                  {result && !loading && (
                    <motion.div
                      key="result-state"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="w-full text-left"
                    >
                      {/* Style Meta Header */}
                      <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-100 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          生成日期：2026-05-20
                        </span>
                        <span className="text-slate-300 select-none">|</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 font-bold text-indigo-700 border border-indigo-100">
                          款式：{selectedStyle}
                        </span>
                        <span className="text-slate-300 select-none">|</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 font-bold text-amber-700 border border-amber-200/50">
                          目標語系：{targetLanguage}
                        </span>
                      </div>

                      {/* Pure Markdown Custom Renderer block */}
                      <MarkdownRenderer content={result} />
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>

              {/* Bottom Card Footer */}
              {result && !loading && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-4 shrink-0 flex items-center justify-between text-xs text-slate-400 select-none font-mono">
                  <span>MODEL : gemini-3.5-flash</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Check size={12} className="text-indigo-600" />
                    格式化渲染完成
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* App Level Footer */}
      <footer className="border-t border-slate-200 bg-white/50 py-6 mt-12 text-center text-xs text-slate-400 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2026 AI 會議記錄生成與翻譯工具. Powered by Google AI Studio & Gemini Cloud Engine.</p>
          <p className="mt-1 font-mono text-[10px] text-slate-350">
            LOCAL TIME: 2026-05-20 | SECURE SERVER MODE
          </p>
        </div>
      </footer>

    </div>
  );
}
