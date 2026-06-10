import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client lazily or handle missing key gracefully
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI features will require config.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// JSON payload support
app.use(express.json());

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Grammar Parsing
app.post("/api/parse", async (req, res): Promise<any> => {
  const { sentence } = req.body;

  if (!sentence || typeof sentence !== "string" || sentence.trim().length === 0) {
    return res.status(400).json({
      error: "يرجى تقديم جملة عربية صالحة للإعراب.",
    });
  }

  const cleanSentence = sentence.trim();

  try {
    const ai = getGeminiClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "مفتاح API الخاص بـ Gemini غير مهيأ. يرجى تهيئته في لوحة أسرار الذكاء الاصطناعي (Secrets panel).",
      });
    }

    const systemInstruction = 
      "أنت 'المُعرِب الذكي'، وهو وبوت ذكي رائد وأستاذ لغة عربية متمكن خبير في النحو والصرف والبلاغة (مثل سيبويه والكسائي).\n" +
      "مهمتك الرئيسية هي إعراب الجملة العربية المرسلة إليك إعراباً تفصيلياً دقيقاً كلمة بكلمة، واستخراج القواعد النحوية المشروحة بشكل مبسط ومناسب لطلاب العلم.\n" +
      "يجب تقديم الإجابة باللغة العربية الفصحى السليمة والخالية من الأخطاء النحوية، مع تجنب أي معلومات تقنية زائدة أو لغة أجنبية.\n" +
      "قم بتقسيم الكلمات المتصلة بالضمائر أو حروف الجر عند الإعراب إن كان ذلك يعين على الإيضاح (مثل: 'به' -> 'الباء' حرف جر، و 'الهاء' ضمير متصل).\n" +
      "كما يجب عليك تحديد العلاقات النحوية بين الكلمات لتكوين شجرة إعراب (Syntax Tree). لكل كلمة، حدد الكلمة التي ترتبط بها وتعتمد عليها (parentWord) ونوع العلاقة النحوية التي تربطهما (relationship) مثل 'فاعل لـ'، 'مفعول به لـ'، 'خبر لـ'، 'مضاف إليه لـ'، 'نعت لـ'، 'اسم إنّ لـ'، 'اسم مجرور بحرف جر'. الكلمة الجذر في الجملة (مثل المبتدأ الأول أو الفعل الرئيسي) تكون بلا أب (parentWord فارغ '').";

    const prompt = `الرجاء إعراب وتحليل الجملة العربية التالية إعراباً شاملاً ودقيقاً كلمة بكلمة:
"${cleanSentence}"`;

    // Helper functions for retry with exponential backoff and automatic model fallback
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of modelsToTry) {
      console.log(`[المعرب الذكي] Attempting content generation with model: ${modelName}`);
      let retriesLeft = 2; // 3 attempts per model
      let currentDelay = 1000;

      while (retriesLeft >= 0) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2, // Low temperature for factual parsing
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  originalSentence: {
                    type: Type.STRING,
                    description: "الجملة الأصلية التي خضعت للإعراب."
                  },
                  overallExplanation: {
                    type: Type.STRING,
                    description: "تحليل عام وتوضيح لنوع الجملة (اسمية، فعلية، شبه جملة) مع ركائزها كالمبتدأ والخبر أو الفعل والفاعل."
                  },
                  words: {
                    type: Type.ARRAY,
                    description: "قائمة بكل كلمة وإعرابها بالتفصيل.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: {
                          type: Type.STRING,
                          description: "الكلمة أو جزء الكلمة المستهدف بالإعراب."
                        },
                        partOfSpeech: {
                          type: Type.STRING,
                          description: "نوع أو قسم الكلمة (مثلاً: فعل ماضٍ، فاعل، مفعول به، اسم مجرور، مبتدأ، خبر، نعت، إلخ)."
                        },
                        grammaticalCase: {
                          type: Type.STRING,
                          description: "الحالة النحوية (مرفوع، منصوب، مجرور، مجزوم، أو مبني)."
                        },
                        diacritics: {
                          type: Type.STRING,
                          description: "التشكيل الصحيح للكلمة في هذا السياق اللغوي."
                        },
                        parsing: {
                          type: Type.STRING,
                          description: "الإعراب اللغوي الكامل بعبارات فصيحة (مثال: فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره)."
                        },
                        explanation: {
                          type: Type.STRING,
                          description: "تفسير ميسر للقاعدة النحوية المطبقة مع هذه الكلمة لتسهيل الفهم على المبتدئين."
                        },
                        parentWord: {
                          type: Type.STRING,
                          description: "الكلمة التي تعتمد عليها هذه الكلمة نحوياً في الجملة، أو سلسلة فارغة '' إذا كانت هذه الكلمة هي جذر الجملة (رأس الشجرة)."
                        },
                        relationship: {
                          type: Type.STRING,
                          description: "العلاقة النحوية التي تربط هذه الكلمة بكلمتها الأب (مثل: 'فاعل لـ'، 'مفعول به لـ'، 'خبر لـ'، 'نعت لـ'، 'مضاف إليه لـ'، 'مبتدأ'، 'فعل رئيسي'، إلخ)."
                        }
                      },
                      required: ["word", "partOfSpeech", "grammaticalCase", "diacritics", "parsing", "explanation", "parentWord", "relationship"]
                    }
                  },
                  rules: {
                    type: Type.ARRAY,
                    description: "سلسلة من القواعد والفوائد النحوية المستخلصة لتعلم اللغة العربية.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: {
                          type: Type.STRING,
                          description: "عنوان القاعدة النحوية المستخرجة (مثال: أحكام الفاعل، علامات بناء الفعل الماضي)."
                        },
                        explanation: {
                          type: Type.STRING,
                          description: "شرح مبسط جداً ومترابط مع إعطاء مثال توضيحي سريع."
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
          break; // success, break out of retry loop for this model
        } catch (err: any) {
          lastError = err;
          const errStr = String(err?.message || err?.stack || err || "");
          console.error(`[المعرب الذكي] Error with model ${modelName} (retries left: ${retriesLeft}):`, errStr);

          const isTransient = 
            errStr.includes("503") || 
            errStr.includes("429") || 
            errStr.includes("UNAVAILABLE") || 
            errStr.includes("high demand") || 
            errStr.includes("temporary") ||
            err?.status === 503 ||
            err?.status === 429 ||
            err?.code === 503 ||
            err?.code === 429;

          if (isTransient && retriesLeft > 0) {
            console.warn(`[المعرب الذكي] Transient error. Retrying in ${currentDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay *= 2;
            retriesLeft--;
          } else {
            // Non-transient or retries exhausted, move to the next model fallback
            console.warn(`[المعرب الذكي] Moving to the next fallback model...`);
            break;
          }
        }
      }

      if (response) {
        console.log(`[المعرب الذكي] Successfully generated content with model: ${modelName}`);
        break; // break out of model search loop
      }
    }

    if (!response) {
      throw lastError || new Error("فشلت جميع محاولات الإعراب بسبب ضغط شديد مؤقت على خوادم الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى لاحقاً.");
    }
    const text = response.text;
    if (!text) {
      throw new Error("لم يتم استلام أي استجابة من نموذج الذكاء الاصطناعي.");
    }

    try {
      const parsedData = JSON.parse(text);
      return res.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", text, parseError);
      return res.status(500).json({
        error: "حدث خطأ في قراءة رد الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
        rawText: text
      });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: error.message || "حدث خطأ غير متوقع أثناء معالجة وإعراب الجملة.",
    });
  }
});

// Setup development server or production build static content
async function setupViteOrStaticProd() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode, mounting Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode, serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[المعرب الذكي] Server is running on port ${PORT}`);
  });
}

setupViteOrStaticProd();
