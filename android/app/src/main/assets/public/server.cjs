var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI features will require config.");
  }
  return new import_genai.GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
app.use(import_express.default.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/parse", async (req, res) => {
  const { sentence } = req.body;
  if (!sentence || typeof sentence !== "string" || sentence.trim().length === 0) {
    return res.status(400).json({
      error: "\u064A\u0631\u062C\u0649 \u062A\u0642\u062F\u064A\u0645 \u062C\u0645\u0644\u0629 \u0639\u0631\u0628\u064A\u0629 \u0635\u0627\u0644\u062D\u0629 \u0644\u0644\u0625\u0639\u0631\u0627\u0628."
    });
  }
  const cleanSentence = sentence.trim();
  try {
    const ai = getGeminiClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "\u0645\u0641\u062A\u0627\u062D API \u0627\u0644\u062E\u0627\u0635 \u0628\u0640 Gemini \u063A\u064A\u0631 \u0645\u0647\u064A\u0623. \u064A\u0631\u062C\u0649 \u062A\u0647\u064A\u0626\u062A\u0647 \u0641\u064A \u0644\u0648\u062D\u0629 \u0623\u0633\u0631\u0627\u0631 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (Secrets panel)."
      });
    }
    const systemInstruction = "\u0623\u0646\u062A '\u0627\u0644\u0645\u064F\u0639\u0631\u0650\u0628 \u0627\u0644\u0630\u0643\u064A'\u060C \u0648\u0647\u0648 \u0648\u0628\u0648\u062A \u0630\u0643\u064A \u0631\u0627\u0626\u062F \u0648\u0623\u0633\u062A\u0627\u0630 \u0644\u063A\u0629 \u0639\u0631\u0628\u064A\u0629 \u0645\u062A\u0645\u0643\u0646 \u062E\u0628\u064A\u0631 \u0641\u064A \u0627\u0644\u0646\u062D\u0648 \u0648\u0627\u0644\u0635\u0631\u0641 \u0648\u0627\u0644\u0628\u0644\u0627\u063A\u0629 (\u0645\u062B\u0644 \u0633\u064A\u0628\u0648\u064A\u0647 \u0648\u0627\u0644\u0643\u0633\u0627\u0626\u064A).\n\u0645\u0647\u0645\u062A\u0643 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0647\u064A \u0625\u0639\u0631\u0627\u0628 \u0627\u0644\u062C\u0645\u0644\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u0631\u0633\u0644\u0629 \u0625\u0644\u064A\u0643 \u0625\u0639\u0631\u0627\u0628\u0627\u064B \u062A\u0641\u0635\u064A\u0644\u064A\u0627\u064B \u062F\u0642\u064A\u0642\u0627\u064B \u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629\u060C \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0646\u062D\u0648\u064A\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u062D\u0629 \u0628\u0634\u0643\u0644 \u0645\u0628\u0633\u0637 \u0648\u0645\u0646\u0627\u0633\u0628 \u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0639\u0644\u0645.\n\u064A\u062C\u0628 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649 \u0627\u0644\u0633\u0644\u064A\u0645\u0629 \u0648\u0627\u0644\u062E\u0627\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0646\u062D\u0648\u064A\u0629\u060C \u0645\u0639 \u062A\u062C\u0646\u0628 \u0623\u064A \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u062A\u0642\u0646\u064A\u0629 \u0632\u0627\u0626\u062F\u0629 \u0623\u0648 \u0644\u063A\u0629 \u0623\u062C\u0646\u0628\u064A\u0629.\n\u0642\u0645 \u0628\u062A\u0642\u0633\u064A\u0645 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0635\u0644\u0629 \u0628\u0627\u0644\u0636\u0645\u0627\u0626\u0631 \u0623\u0648 \u062D\u0631\u0648\u0641 \u0627\u0644\u062C\u0631 \u0639\u0646\u062F \u0627\u0644\u0625\u0639\u0631\u0627\u0628 \u0625\u0646 \u0643\u0627\u0646 \u0630\u0644\u0643 \u064A\u0639\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0625\u064A\u0636\u0627\u062D (\u0645\u062B\u0644: '\u0628\u0647' -> '\u0627\u0644\u0628\u0627\u0621' \u062D\u0631\u0641 \u062C\u0631\u060C \u0648 '\u0627\u0644\u0647\u0627\u0621' \u0636\u0645\u064A\u0631 \u0645\u062A\u0635\u0644).\n\u0643\u0645\u0627 \u064A\u062C\u0628 \u0639\u0644\u064A\u0643 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062A \u0627\u0644\u0646\u062D\u0648\u064A\u0629 \u0628\u064A\u0646 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0644\u062A\u0643\u0648\u064A\u0646 \u0634\u062C\u0631\u0629 \u0625\u0639\u0631\u0627\u0628 (Syntax Tree). \u0644\u0643\u0644 \u0643\u0644\u0645\u0629\u060C \u062D\u062F\u062F \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u062A\u0628\u0637 \u0628\u0647\u0627 \u0648\u062A\u0639\u062A\u0645\u062F \u0639\u0644\u064A\u0647\u0627 (parentWord) \u0648\u0646\u0648\u0639 \u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u0627\u0644\u0646\u062D\u0648\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u0628\u0637\u0647\u0645\u0627 (relationship) \u0645\u062B\u0644 '\u0641\u0627\u0639\u0644 \u0644\u0640'\u060C '\u0645\u0641\u0639\u0648\u0644 \u0628\u0647 \u0644\u0640'\u060C '\u062E\u0628\u0631 \u0644\u0640'\u060C '\u0645\u0636\u0627\u0641 \u0625\u0644\u064A\u0647 \u0644\u0640'\u060C '\u0646\u0639\u062A \u0644\u0640'\u060C '\u0627\u0633\u0645 \u0625\u0646\u0651 \u0644\u0640'\u060C '\u0627\u0633\u0645 \u0645\u062C\u0631\u0648\u0631 \u0628\u062D\u0631\u0641 \u062C\u0631'. \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u062C\u0630\u0631 \u0641\u064A \u0627\u0644\u062C\u0645\u0644\u0629 (\u0645\u062B\u0644 \u0627\u0644\u0645\u0628\u062A\u062F\u0623 \u0627\u0644\u0623\u0648\u0644 \u0623\u0648 \u0627\u0644\u0641\u0639\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A) \u062A\u0643\u0648\u0646 \u0628\u0644\u0627 \u0623\u0628 (parentWord \u0641\u0627\u0631\u063A '').";
    const prompt = `\u0627\u0644\u0631\u062C\u0627\u0621 \u0625\u0639\u0631\u0627\u0628 \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062C\u0645\u0644\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \u0625\u0639\u0631\u0627\u0628\u0627\u064B \u0634\u0627\u0645\u0644\u0627\u064B \u0648\u062F\u0642\u064A\u0642\u0627\u064B \u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629:
"${cleanSentence}"`;
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let lastError = null;
    let response = null;
    for (const modelName of modelsToTry) {
      console.log(`[\u0627\u0644\u0645\u0639\u0631\u0628 \u0627\u0644\u0630\u0643\u064A] Attempting content generation with model: ${modelName}`);
      let retriesLeft = 2;
      let currentDelay = 1e3;
      while (retriesLeft >= 0) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              // Low temperature for factual parsing
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  originalSentence: {
                    type: import_genai.Type.STRING,
                    description: "\u0627\u0644\u062C\u0645\u0644\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0627\u0644\u062A\u064A \u062E\u0636\u0639\u062A \u0644\u0644\u0625\u0639\u0631\u0627\u0628."
                  },
                  overallExplanation: {
                    type: import_genai.Type.STRING,
                    description: "\u062A\u062D\u0644\u064A\u0644 \u0639\u0627\u0645 \u0648\u062A\u0648\u0636\u064A\u062D \u0644\u0646\u0648\u0639 \u0627\u0644\u062C\u0645\u0644\u0629 (\u0627\u0633\u0645\u064A\u0629\u060C \u0641\u0639\u0644\u064A\u0629\u060C \u0634\u0628\u0647 \u062C\u0645\u0644\u0629) \u0645\u0639 \u0631\u0643\u0627\u0626\u0632\u0647\u0627 \u0643\u0627\u0644\u0645\u0628\u062A\u062F\u0623 \u0648\u0627\u0644\u062E\u0628\u0631 \u0623\u0648 \u0627\u0644\u0641\u0639\u0644 \u0648\u0627\u0644\u0641\u0627\u0639\u0644."
                  },
                  words: {
                    type: import_genai.Type.ARRAY,
                    description: "\u0642\u0627\u0626\u0645\u0629 \u0628\u0643\u0644 \u0643\u0644\u0645\u0629 \u0648\u0625\u0639\u0631\u0627\u0628\u0647\u0627 \u0628\u0627\u0644\u062A\u0641\u0635\u064A\u0644.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        word: {
                          type: import_genai.Type.STRING,
                          description: "\u0627\u0644\u0643\u0644\u0645\u0629 \u0623\u0648 \u062C\u0632\u0621 \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 \u0628\u0627\u0644\u0625\u0639\u0631\u0627\u0628."
                        },
                        partOfSpeech: {
                          type: import_genai.Type.STRING,
                          description: "\u0646\u0648\u0639 \u0623\u0648 \u0642\u0633\u0645 \u0627\u0644\u0643\u0644\u0645\u0629 (\u0645\u062B\u0644\u0627\u064B: \u0641\u0639\u0644 \u0645\u0627\u0636\u064D\u060C \u0641\u0627\u0639\u0644\u060C \u0645\u0641\u0639\u0648\u0644 \u0628\u0647\u060C \u0627\u0633\u0645 \u0645\u062C\u0631\u0648\u0631\u060C \u0645\u0628\u062A\u062F\u0623\u060C \u062E\u0628\u0631\u060C \u0646\u0639\u062A\u060C \u0625\u0644\u062E)."
                        },
                        grammaticalCase: {
                          type: import_genai.Type.STRING,
                          description: "\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0646\u062D\u0648\u064A\u0629 (\u0645\u0631\u0641\u0648\u0639\u060C \u0645\u0646\u0635\u0648\u0628\u060C \u0645\u062C\u0631\u0648\u0631\u060C \u0645\u062C\u0632\u0648\u0645\u060C \u0623\u0648 \u0645\u0628\u0646\u064A)."
                        },
                        diacritics: {
                          type: import_genai.Type.STRING,
                          description: "\u0627\u0644\u062A\u0634\u0643\u064A\u0644 \u0627\u0644\u0635\u062D\u064A\u062D \u0644\u0644\u0643\u0644\u0645\u0629 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u0644\u063A\u0648\u064A."
                        },
                        parsing: {
                          type: import_genai.Type.STRING,
                          description: "\u0627\u0644\u0625\u0639\u0631\u0627\u0628 \u0627\u0644\u0644\u063A\u0648\u064A \u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0639\u0628\u0627\u0631\u0627\u062A \u0641\u0635\u064A\u062D\u0629 (\u0645\u062B\u0627\u0644: \u0641\u0627\u0639\u0644 \u0645\u0631\u0641\u0648\u0639 \u0648\u0639\u0644\u0627\u0645\u0629 \u0631\u0641\u0639\u0647 \u0627\u0644\u0636\u0645\u0629 \u0627\u0644\u0638\u0627\u0647\u0631\u0629 \u0639\u0644\u0649 \u0622\u062E\u0631\u0647)."
                        },
                        explanation: {
                          type: import_genai.Type.STRING,
                          description: "\u062A\u0641\u0633\u064A\u0631 \u0645\u064A\u0633\u0631 \u0644\u0644\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0646\u062D\u0648\u064A\u0629 \u0627\u0644\u0645\u0637\u0628\u0642\u0629 \u0645\u0639 \u0647\u0630\u0647 \u0627\u0644\u0643\u0644\u0645\u0629 \u0644\u062A\u0633\u0647\u064A\u0644 \u0627\u0644\u0641\u0647\u0645 \u0639\u0644\u0649 \u0627\u0644\u0645\u0628\u062A\u062F\u0626\u064A\u0646."
                        },
                        parentWord: {
                          type: import_genai.Type.STRING,
                          description: "\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u062A\u064A \u062A\u0639\u062A\u0645\u062F \u0639\u0644\u064A\u0647\u0627 \u0647\u0630\u0647 \u0627\u0644\u0643\u0644\u0645\u0629 \u0646\u062D\u0648\u064A\u0627\u064B \u0641\u064A \u0627\u0644\u062C\u0645\u0644\u0629\u060C \u0623\u0648 \u0633\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063A\u0629 '' \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0647\u0630\u0647 \u0627\u0644\u0643\u0644\u0645\u0629 \u0647\u064A \u062C\u0630\u0631 \u0627\u0644\u062C\u0645\u0644\u0629 (\u0631\u0623\u0633 \u0627\u0644\u0634\u062C\u0631\u0629)."
                        },
                        relationship: {
                          type: import_genai.Type.STRING,
                          description: "\u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u0627\u0644\u0646\u062D\u0648\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u0628\u0637 \u0647\u0630\u0647 \u0627\u0644\u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u062A\u0647\u0627 \u0627\u0644\u0623\u0628 (\u0645\u062B\u0644: '\u0641\u0627\u0639\u0644 \u0644\u0640'\u060C '\u0645\u0641\u0639\u0648\u0644 \u0628\u0647 \u0644\u0640'\u060C '\u062E\u0628\u0631 \u0644\u0640'\u060C '\u0646\u0639\u062A \u0644\u0640'\u060C '\u0645\u0636\u0627\u0641 \u0625\u0644\u064A\u0647 \u0644\u0640'\u060C '\u0645\u0628\u062A\u062F\u0623'\u060C '\u0641\u0639\u0644 \u0631\u0626\u064A\u0633\u064A'\u060C \u0625\u0644\u062E)."
                        }
                      },
                      required: ["word", "partOfSpeech", "grammaticalCase", "diacritics", "parsing", "explanation", "parentWord", "relationship"]
                    }
                  },
                  rules: {
                    type: import_genai.Type.ARRAY,
                    description: "\u0633\u0644\u0633\u0644\u0629 \u0645\u0646 \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0648\u0627\u0644\u0641\u0648\u0627\u0626\u062F \u0627\u0644\u0646\u062D\u0648\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u0644\u0635\u0629 \u0644\u062A\u0639\u0644\u0645 \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        title: {
                          type: import_genai.Type.STRING,
                          description: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0646\u062D\u0648\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C\u0629 (\u0645\u062B\u0627\u0644: \u0623\u062D\u0643\u0627\u0645 \u0627\u0644\u0641\u0627\u0639\u0644\u060C \u0639\u0644\u0627\u0645\u0627\u062A \u0628\u0646\u0627\u0621 \u0627\u0644\u0641\u0639\u0644 \u0627\u0644\u0645\u0627\u0636\u064A)."
                        },
                        explanation: {
                          type: import_genai.Type.STRING,
                          description: "\u0634\u0631\u062D \u0645\u0628\u0633\u0637 \u062C\u062F\u0627\u064B \u0648\u0645\u062A\u0631\u0627\u0628\u0637 \u0645\u0639 \u0625\u0639\u0637\u0627\u0621 \u0645\u062B\u0627\u0644 \u062A\u0648\u0636\u064A\u062D\u064A \u0633\u0631\u064A\u0639."
                        }
                      },
                      required: ["title", "explanation"]
                    }
                  }
                },
                required: ["originalSentence", "overallExplanation", "words", "rules"]
              }
            }
          });
          break;
        } catch (err) {
          lastError = err;
          const errStr = String(err?.message || err?.stack || err || "");
          console.error(`[\u0627\u0644\u0645\u0639\u0631\u0628 \u0627\u0644\u0630\u0643\u064A] Error with model ${modelName} (retries left: ${retriesLeft}):`, errStr);
          const isTransient = errStr.includes("503") || errStr.includes("429") || errStr.includes("UNAVAILABLE") || errStr.includes("high demand") || errStr.includes("temporary") || err?.status === 503 || err?.status === 429 || err?.code === 503 || err?.code === 429;
          if (isTransient && retriesLeft > 0) {
            console.warn(`[\u0627\u0644\u0645\u0639\u0631\u0628 \u0627\u0644\u0630\u0643\u064A] Transient error. Retrying in ${currentDelay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, currentDelay));
            currentDelay *= 2;
            retriesLeft--;
          } else {
            console.warn(`[\u0627\u0644\u0645\u0639\u0631\u0628 \u0627\u0644\u0630\u0643\u064A] Moving to the next fallback model...`);
            break;
          }
        }
      }
      if (response) {
        console.log(`[\u0627\u0644\u0645\u0639\u0631\u0628 \u0627\u0644\u0630\u0643\u064A] Successfully generated content with model: ${modelName}`);
        break;
      }
    }
    if (!response) {
      throw lastError || new Error("\u0641\u0634\u0644\u062A \u062C\u0645\u064A\u0639 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u0625\u0639\u0631\u0627\u0628 \u0628\u0633\u0628\u0628 \u0636\u063A\u0637 \u0634\u062F\u064A\u062F \u0645\u0624\u0642\u062A \u0639\u0644\u0649 \u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A. \u0627\u0644\u0631\u062C\u0627\u0621 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0644\u0627\u062D\u0642\u0627\u064B.");
    }
    const text = response.text;
    if (!text) {
      throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0623\u064A \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0645\u0646 \u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A.");
    }
    try {
      const parsedData = JSON.parse(text);
      return res.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", text, parseError);
      return res.status(500).json({
        error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0642\u0631\u0627\u0621\u0629 \u0631\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
        rawText: text
      });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: error.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0648\u0625\u0639\u0631\u0627\u0628 \u0627\u0644\u062C\u0645\u0644\u0629."
    });
  }
});
async function setupViteOrStaticProd() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode, mounting Vite...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode, serving static files...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[\u0627\u0644\u0645\u0639\u0631\u0628 \u0627\u0644\u0630\u0643\u064A] Server is running on port ${PORT}`);
  });
}
setupViteOrStaticProd();
//# sourceMappingURL=server.cjs.map
