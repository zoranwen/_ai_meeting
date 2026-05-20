import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Lazily checking standard Express version variables
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini Client
  // According to our guidelines, the key is resolved from GEMINI_API_KEY securely.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. API calls will fail.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  app.use(express.json({ limit: "10mb" }));

  // API Endpoints
  app.post("/api/summarize", async (req, res) => {
    try {
      const { transcript, style, targetLanguage, additionalContext } = req.body;

      if (!transcript || transcript.trim() === "") {
        return res.status(400).json({ error: "會議內容不能為空" });
      }

      const activeStyle = style || "詳細會議記錄";
      const activeLanguage = targetLanguage || "繁體中文";

      const userPrompt = `
以下是需要處理的會議逐字稿內容：
---
${transcript}
---

【額外背景與自訂指令】：
${additionalContext || "無背景說明或客製化指令。"}
`;

      const systemInstruction = `
你是一位頂尖的高級行政秘書、專業會議紀錄官與跨國敏捷專利翻譯專家。
你的任務是將使用者提供的隨意散落、碎裂、或包含贅字、夾雜多國語言的「會議逐字稿內容」進行深度分析與結構化重組。
接著根據所選的整理風格，去蕪存菁，寫成一篇條理分明、層次躍然紙上、在商業報告中極具專業感的文件，並翻譯為指定的目標語言。

請遵循以下四大核心寫作規範：

1. 格式結構與高質感排版：
   - 請一律使用標準的 Markdown 格式，運用精緻、邏輯層次優美的排版。
   - 使用適合比例的標題（例如：H2 ##, H3 ###），並對重要名詞、數據或結論進行「加粗字體」標示。
   - 善用 Markdown 的條列式清單及精確編號，讓決策與對話順序一目了然。
   - 針對重大決議或行動方案，可使用引用區塊（>），大幅增加視覺衝擊。
   - 所有生成的 Markdown 一定要具備完整的收尾與極致美感，不要隨意中斷。

2. 風格模式定義（請嚴格對齊【${activeStyle}】風格的要求）：
   - 『專業雙語結構化報告』：
     * 你必須嚴格提供結構化的會議紀錄，完全依照以下 Markdown 標準格式與標題架構回覆，不要包含問候或結語：
       1. **會議主題與時間**：擷取會議的主題（含詳細日期、本地時間或估計時程）。
       2. **與會者**：精確列出所有參與、提及的人員、職稱。
       3. **會議重點總結**：提煉 3 到 5 個最核心、無贅字的重點。
       4. **Action Items (待辦事項)**：列出每項待辦事項，具體指出負責人與後續行動方案。
       5. **英文翻譯版**：將上述 1~4 點的所有中文重點、與會者、待辦事項完全且完整地翻譯成專業、商務、高級的英文對照版本。
       * 繁體中文部分必須一律使用極致優美的繁體中文（Traditional Chinese）回覆。
   - 『詳細會議記錄』：
     * 結構包含：【會議基本概述】（大約2~3句精練描述目的和最首要結論）、【各項議題深入討論】（以 H3 分段列出，詳細描述每個討論分支的背景、各方發言立場、碰撞爭執點與最後的對等共識）、【決議與行動清單】。
   - 『極簡快捷摘要』：
     * 去粗取精。完全過濾冗贅的對話過程，以精準的 3-5 句核心概括，搭配極簡重點總結。適合極速掌握。
   - 『行動導向方針』：
     * 極致聚焦在待辦清單 (Action Items)、時程 (Timeline)、指派負責人 (Owner)。對背景交代極簡。
     * 清單應具備清楚的「完成定義/目標」與「下個里程碑」。
   - 『精闢條列重點』：
     * 將所有會議中出現的金句、洞察、共識與重要爭論，轉換為層層遞進、脈絡分明的條列重點，極具彙報或簡報投影片提煉的即視感。

3. 專業語言潤絲與去除冗餘贅字：
   - 自動將逐字稿中的口語發話贅詞（例如：那個、呃、那我就、對、好吧、真的啦）徹底去除，確保文體為高級書面商務語言。
   - 若原稿中混用中英文、提及專有名詞（如 deploy, workflow, OKR, QA 等），在保持產業專業度的前提下自然融入，並為非通用之技術詞彙加上流暢的中英文雙語備註。

4. 翻譯與語言統一性：
   - 使用者指定之目標語言為：【${activeLanguage}】。
   - 【最核心要求】：不論原本的逐字稿是用何種夾雜語言記錄，你生成的最終「整篇會議記錄與總結報告」，包括所有的標題、表格、備註和條款，都必須「完全、乾淨地使用【${activeLanguage}】」完美翻譯與書寫！不能在結果中留下未翻譯的別種口語原句雜音！

現在，請立即針對會議內容，生成高質感的【${activeStyle}】其【${activeLanguage}】版本會議總結報告：
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.25, // 較低溫度能最大化對齊原本會議的事實，不過度腦補
        },
      });

      const resultText = response.text || "（AI 未產生內容）";
      res.json({ result: resultText });
    } catch (error: any) {
      console.error("Express App Summarize Error:", error);
      res.status(500).json({ error: error.message || "伺服器在與 AI 模型進行通訊時發生了錯誤。" });
    }
  });

  // Serve static files / Vite middleware
  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI App Server running successfully at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup error:", err);
});
