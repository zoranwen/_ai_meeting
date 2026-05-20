/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SummaryRequest {
  transcript: string;
  style: SummaryStyle;
  targetLanguage: string;
  additionalContext?: string;
}

export type SummaryStyle = "詳細會議記錄" | "極簡快捷摘要" | "行動導向方針" | "精闢條列重點" | "專業雙語結構化報告";

export const SUMMARY_STYLES: { id: SummaryStyle; name: string; desc: string }[] = [
  {
    id: "專業雙語結構化報告",
    name: "專業雙語結構化報告",
    desc: "嚴格擷取主題與時間、與會者、3-5點核心重點與 Action Items，並完整附帶專業英文對照翻譯！",
  },
  {
    id: "詳細會議記錄",
    name: "詳細會議記錄",
    desc: "完整還原議題脈絡、發言立場。適合存檔、深度複盤及大型決策儲備。",
  },
  {
    id: "極簡快捷摘要",
    name: "極簡快捷摘要",
    desc: "精煉剔除繁冗對話。純粹保留 1 分鐘核心大意與重大結論，極致高效。",
  },
  {
    id: "行動導向方針",
    name: "行動導向方針",
    desc: "焦點鎖定在 Action Items、指派人 (Owner) 與時程。目標清晰明確。",
  },
  {
    id: "精闢條列重點",
    name: "精闢條列重點",
    desc: "以深入透徹的層級 bullet points 梳理。結構感極強，適合主管簡報。",
  },
];

export const TARGET_LANGUAGES = [
  { code: "繁體中文", name: "繁體中文 (Traditional Chinese)" },
  { code: "英文", name: "英文 (English)" },
  { code: "日文", name: "日文 (Japanese)" },
  { code: "韓文", name: "韓文 (Korean)" },
  { code: "西班牙文", name: "西班牙文 (Spanish)" },
  { code: "德文", name: "德文 (German)" },
  { code: "法文", name: "法文 (French)" },
  { code: "簡體中文", name: "簡體中文 (Simplified Chinese)" },
];

export const TRANSCRIPT_EXAMPLE = `口語與會人員：
- 傑克 (Jack) - 專案經理 (PM)
- 愛麗絲 (Alice) - 前端工程師 (Frontend Lead)
- 鮑勃 (Bob) - 後端工程師 (Backend dev)

會議紀錄內容（錄音逐字稿）：
Jack: 好，大家早。我們今天對一下那個 AI 會議記錄工具開發案的進度。那個，Alice 你那邊的前端完成度怎麼樣了？
Alice: 呃，我目前是已經把 Vite 還有 React 19 對接好了，然後我們討論的那個 workspace layout 也用 Tailwind 刻好。不過，本來想安裝那個 Markdown 渲染的 npm package，但在 React 19 版本好像會報 package type mismatch，所以我決定寫一個我們自己客製、可控度高的客製化 Markdown 解析 renderer，這樣不僅動畫過渡自由，也更有彈性。明天中午前可以 finalize 吧，到時 mock data 也可以一起兜進去。
Jack: 哇，自主寫 Markdown 解析元件？聽起來太厲害了吧！這樣前端自帶客製化 UI 體驗就更香了。那 Bob 呢？後端 API 還有跟那個 Google GenAI SDK 串接的部分，有什麼 issue 嗎？
Bob: 嗯，API proxy 寫好了。按照先前討論的安全，API 金鑰可不能暴露給前端瀏覽器，所以我在 server.ts 新增了一個 POST /api/summarize 路由，專門用來跟對方的 Gemini 3.5 Flash 溝通。我測過載入速度了，大約兩秒內就能生成一份帶有 System Instruction 行動導向的總結。對了，這款 App 有附帶多國語言，所以 API 模組我也加上了在 prompt 還原與自動繁體中文、日文、英文等的多國翻譯支援。
Jack: 帥喔！那我們週五要交 Beta 版給 client 測試，感覺時程比原本預估的 tight 一點。這樣好了，明天下午兩點，我們三個在
線上對一下 API 整合的部分，大家都先 check 自己的 side 的 code 是否能 lint & build 過，這樣部署才不會有 surprise。
Bob: 沒問題，我明天兩點會配合把 server 點起來。
Alice: 好啊，那我前端就先兜這份 mock data，等明天兩點在線上對接。
Jack: OK，今天早會就先這樣，努力一下，解散！`;
