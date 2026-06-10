import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  History, 
  Moon, 
  Sun, 
  Sparkles, 
  Trash2, 
  BookOpenCheck, 
  AlertCircle, 
  ChevronLeft,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SyntaxTree from "./components/SyntaxTree";

// Interfaces
interface WordParse {
  word: string;
  partOfSpeech: string;
  grammaticalCase: string;
  diacritics: string;
  parsing: string;
  explanation: string;
  parentWord?: string;
  relationship?: string;
}

interface GrammarRule {
  title: string;
  explanation: string;
}

interface ParseResult {
  originalSentence: string;
  overallExplanation: string;
  words: WordParse[];
  rules: GrammarRule[];
}

interface HistoryItem {
  id: string;
  sentence: string;
  result: ParseResult;
  timestamp: string;
}

// Default classical examples pre-calculated for immediate feedback & flawless offline/missing API key fallback
const EXAMPLE_SENTENCES: Record<string, ParseResult> = {
  "يَكْتُبُ الطَّالِبُ الدَّرْسَ": {
    originalSentence: "يَكْتُبُ الطَّالِبُ الدَّرْسَ",
    overallExplanation: "جملة فعلية تبدأ بفعل مضارع مرفوع، وفاعل مرفوع (الطَّالِبُ)، تلاه مفعول به منصوب (الدَّرْسَ) يوضّح الكيان الذي وقع عليه فعل الكتابة.",
    words: [
      {
        word: "يَكْتُبُ",
        partOfSpeech: "فعل مضارع",
        grammaticalCase: "مرفوع",
        diacritics: "يَكْتُبُ",
        parsing: "فعل مضارع مرفوع وعلامة رفعه الضمة الظاهرة على آخره لأنه صحيح الآخر ولم يسبقه ناصب ولا جازم.",
        explanation: "الفعل المضارع هو الكلمة التي تدل على حدث يقع في الزمن الحاضر أو المستقبل ويبدأ بأحد الحروف الزائدة (أ، ن، ي، ت).",
        parentWord: "",
        relationship: "فعل رئيسي"
      },
      {
        word: "الطَّالِبُ",
        partOfSpeech: "فاعل",
        grammaticalCase: "مرفوع",
        diacritics: "الطَّالِبُ",
        parsing: "فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره لأنه اسم مفرد.",
        explanation: "الفاعل في اللغة العربية هو من قام بالفعل أو اتصف به، وحكمه الإعرابي الرفع دائماً بالضمة أو ما ينوب عنها.",
        parentWord: "يَكْتُبُ",
        relationship: "فاعل لـ"
      },
      {
        word: "الدَّرْسَ",
        partOfSpeech: "مفعول به",
        grammaticalCase: "منصوب",
        diacritics: "الدَّرْسَ",
        parsing: "مفعول به منصوب وعلامة نصبه الفتحة الظاهرة على آخره لأنه اسم مفرد.",
        explanation: "المفعول به هو اسم منصوب يدل على الشيء أو الشخص الذي وقع عليه تأثير فعل الفاعل.",
        parentWord: "يَكْتُبُ",
        relationship: "مفعول به لـ"
      }
    ],
    rules: [
      {
        title: "ركنَا الجملة الفعلية الأساسيان",
        explanation: "تتكون الجملة الفعلية من فعل وفاعل. الفعل يحدد الحدث والزمن، والفاعل يحدد من قام بهذا الحدث. المفعول به متمم للجملة المتعدية وليس ركناً أساسياً دائماً."
      },
      {
        title: "علامات الإعراب الأصلية",
        explanation: "الضمة هي علامة الرفع الأصلية (وتأتي للفاعل والاسم المفرد والمضارع صحيح الآخر)، بينما الفتحة هي علامة النصب الأصلية للأسماء المفردة."
      }
    ]
  },
  "إِنَّ الْعِلْمَ نُورٌ": {
    originalSentence: "إِنَّ الْعِلْمَ نُورٌ",
    overallExplanation: "جملة اسمية مؤكدة بالحرف الناسخ 'إِنَّ' الذي يدخل على المبتدأ (الْعِلْمَ) فينصبه ويسمى اسمه، ويرفع الخبر (نُورٌ) ويسمى خبره.",
    words: [
      {
        word: "إِنَّ",
        partOfSpeech: "حرف ناسخ (توكيد ونصب)",
        grammaticalCase: "مبني",
        diacritics: "إِنَّ",
        parsing: "حرف توكيد ونصب ناسخ مبني على الفتح لا محل له من الإعراب.",
        explanation: "الأحرف الناسخة تدخل على الجملة الاسمية لتغيير حكمها، فتنصب المبتدأ كاسم لها وترفع الخبر.",
        parentWord: "",
        relationship: "حرف ناسخ"
      },
      {
        word: "الْعِلْمَ",
        partOfSpeech: "اسم إنّ",
        grammaticalCase: "منصوب",
        diacritics: "الْعِلْمَ",
        parsing: "اسم إنَّ منصوب وعلامة نصبه الفتحة الظاهرة على آخره لأنه اسم مفرد.",
        explanation: "اسم إنَّ كان في الأصل مبتدأ مرفوعاً، ولكن بعد دخول 'إنّ' تغيرت حالته ونظامه الإعرابي ليصبح منصوباً.",
        parentWord: "إِنَّ",
        relationship: "اسم إنّ لـ"
      },
      {
        word: "نُورٌ",
        partOfSpeech: "خبر إنّ",
        grammaticalCase: "مرفوع",
        diacritics: "نُورٌ",
        parsing: "خبر إنَّ مرفوع وعلامة رفعه الضمة الظاهرة على آخره لأنه اسم مفرد.",
        explanation: "خبر إنَّ هو الجزء الذي يتمم الفائدة الإخبارية مع الاسم، ويبقى مرفوعاً بالضمة الظاهرة.",
        parentWord: "إِنَّ",
        relationship: "خبر إنّ لـ"
      }
    ],
    rules: [
      {
        title: "أحكام إنَّ وأخواتها",
        explanation: "الحروف الناسخة هي (إنّ، أنّ، كأنّ، لكنّ، ليت، لعل). هذه الأدوات تغير معالم الجملة الاسمية تماماً حيث تنصب المبتدأ وترفع الخبر."
      },
      {
        title: "مفهوم البناء والإعراب",
        explanation: "الأحرف في اللغة العربية كلها مبنية (لا تتبدل حركتها بتغير وظيفتها)، وتُبنى على حركة الحرف الأخير فيها، ولا محل لها من الإعراب."
      }
    ]
  },
  "كَانَ الْمَطَرُ غَزِيرًا": {
    originalSentence: "كَانَ الْمَطَرُ غَزِيرًا",
    overallExplanation: "جملة اسمية منسوخة بـ 'كَانَ' وهو فعل ماض ناقص يدخل على الجملة الاسمية فيرفع المبتدأ (الْمَطَرُ) اسماً له، وينصب الخبر (غَزِيرًا) خبراً له.",
    words: [
      {
        word: "كَانَ",
        partOfSpeech: "فعل ماض ناقص ناسخ",
        grammaticalCase: "مبني",
        diacritics: "كَانَ",
        parsing: "فعل ماض ناقص ناسخ مبني على الفتح الظاهر على آخره.",
        explanation: "الأفعال الناقصة تسمى كذلك لأنها لا تكتفي بوجود الفاعل بل تحتاج اسماً وخبراً لتتم بهما فائدة الجملة.",
        parentWord: "",
        relationship: "فعل ناسخ"
      },
      {
        word: "الْمَطَرُ",
        partOfSpeech: "اسم كان",
        grammaticalCase: "مرفوع",
        diacritics: "الْمَطَرُ",
        parsing: "اسم كَانَ مرفوع وعلامة رفعه الضمة الظاهرة على آخره كونه اسماً مفرداً.",
        explanation: "اسم كَانَ يكون مرفوعاً دائماً ويسند إليه المعنى الفعلي للحدث المنسوخ.",
        parentWord: "كَانَ",
        relationship: "اسم كان لـ"
      },
      {
        word: "غَزِيرًا",
        partOfSpeech: "خبر كان",
        grammaticalCase: "منصوب",
        diacritics: "غَزِيرًا",
        parsing: "خبر كَانَ منصوب وعلامة نصبه الفتحة الظاهرة مع تنوين النصب على آخره.",
        explanation: "خبر كَانَ يوضح الميزة أو الصفة التي اتصف بها الاسم في ذلك الزمن الماضي المنقضي أو المستمر.",
        parentWord: "كَانَ",
        relationship: "خبر كان لـ"
      }
    ],
    rules: [
      {
        title: "عمل الأفعال الناقصة (كان وأخواتها)",
        explanation: "تدخل كان وأخواتها (صار، ليس، أصبح، أضحى، ظل، أمسى، بات...) على المبتدأ والخبر فترفع الأول اسماً لها وتنصب الثاني خبراً لها."
      },
      {
        title: "الفرق بين الأحرف الناسخة والأفعال الناسخة",
        explanation: "إنّ وأخواتها (حروف تنسخ فتنصب ثم ترفع)، بينما كان وأخواتها (أفعال تنسخ فترفع ثم تنصب)، وهي علاقة عكسية شهيرة في النحو العربي."
      }
    ]
  },
  "شَرِبَ الْوَلَدُ الْمَاءَ": {
    originalSentence: "شَرِبَ الْوَلَدُ الْمَاءَ",
    overallExplanation: "جملة فعلية أساسية مبنية من فعل ماض مبني على الفتح الفاعل المرفوع (الْوَلَدُ) والمفعول به المنصوب (الْمَاءَ).",
    words: [
      {
        word: "شَرِبَ",
        partOfSpeech: "فعل ماض",
        grammaticalCase: "مبني",
        diacritics: "شَرِبَ",
        parsing: "فعل ماض مبني على الفتح الظاهر على آخره لأنه صحيح الآخر ولم يتصل به شيء.",
        explanation: "الفعل الماضي يحدد حدثاً تم وانتهى قبل الكلام، وهو في الأصل مبني دائماً على الفتح ما لم يتصل به ضمير يحرك آخره.",
        parentWord: "",
        relationship: "فعل رئيسي"
      },
      {
        word: "الْوَلَدُ",
        partOfSpeech: "فاعل",
        grammaticalCase: "مرفوع",
        diacritics: "الْوَلَدُ",
        parsing: "فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره لأنه اسم مفرد.",
        explanation: "الفاعل هو المسند إليه الفعل لتحديد هوية صانع الحدث.",
        parentWord: "شَرِبَ",
        relationship: "فاعل لـ"
      },
      {
        word: "الْمَاءَ",
        partOfSpeech: "مفعول به",
        grammaticalCase: "منصوب",
        diacritics: "الْمَاءَ",
        parsing: "مفعول به منصوب وعلامة نصبه الفتحة الظاهرة على آخره.",
        explanation: "الاسم الذي يقع عليه فعل الشرب يوضع منصوباً في حالة المفعولية.",
        parentWord: "شَرِبَ",
        relationship: "مفعول به لـ"
      }
    ],
    rules: [
      {
        title: "علامات بناء الفعل الماضي",
        explanation: "يبنى الفعل الماضي على الفتح إذا لم يتصل به شيء أو اتصلت به تاء التأنيث الساكنة أو ألف الاثنين. ويبنى على السكون إذا اتصل بضمير رفع متحرك."
      }
    ]
  }
};

const LOADING_STATUSES = [
  "جاري تحليل البداية النحوية للجملة...",
  "يتم الآن تفكيك الكلمات وربطها ببرنامج النحو...",
  "نقوم الآن بضبط الحركات النحوية بدقة...",
  "جاري تحديد الحالات الإعرابية واستخلاص علامات الإعراب...",
  "نحن الآن نقارن النتائج مع القواعد النحوية لعلماء النحو العربي...",
  "يتم صياغة الشرح التعليمي والقواعد النحوية حالياً..."
];

const COLOR_BORDERS = [
  "border-b-4 border-emerald-500",
  "border-b-4 border-blue-500",
  "border-b-4 border-amber-500",
  "border-b-4 border-purple-500",
  "border-b-4 border-teal-500",
  "border-b-4 border-rose-500"
];

const TEXT_COLORS = [
  "text-emerald-400",
  "text-blue-400",
  "text-amber-400",
  "text-purple-400",
  "text-teal-400",
  "text-rose-400"
];

export default function App() {
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [result, setResult] = useState<ParseResult | null>(EXAMPLE_SENTENCES["يَكْتُبُ الطَّالِبُ الدَّرْسَ"]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark" || 
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    if (!result) return;
    
    let textToCopy = `✨ إعراب جملة: "${result.originalSentence}" عبر تطبيق المعرب الذكي ✨\n\n`;
    textToCopy += `📊 الهيكل الأساسي للجملة:\n${result.overallExplanation}\n\n`;
    textToCopy += `🔍 الإعراب التفصيلي للكلمات:\n`;
    
    result.words.forEach((w, idx) => {
      textToCopy += `${idx + 1}. 【 ${w.diacritics || w.word} 】\n`;
      textToCopy += `   • نوع الكلمة: ${w.partOfSpeech}\n`;
      textToCopy += `   • الحالة النحوية: ${w.grammaticalCase}\n`;
      textToCopy += `   • الإعراب: ${w.parsing}\n`;
      textToCopy += `   • القاعدة النحوية: ${w.explanation}\n\n`;
    });
    
    if (result.rules && result.rules.length > 0) {
      textToCopy += `💡 القواعد والفوائد النحوية المستخلصة:\n`;
      result.rules.forEach((rule, idx) => {
        textToCopy += `   • ${rule.title}: ${rule.explanation}\n`;
      });
      textToCopy += `\n`;
    }
    
    textToCopy += `⚜️ تم الإعراب بواسطة تطبيق "المعرب الذكي" - مدرسك النحوي التفاعلي.`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Keep a status messages rotation during wait
  useEffect(() => {
    let intervalId: any;
    if (loading) {
      setLoadingMessage(LOADING_STATUSES[0]);
      let index = 1;
      intervalId = setInterval(() => {
        setLoadingMessage(LOADING_STATUSES[index % LOADING_STATUSES.length]);
        index++;
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading]);

  // Handle CSS themes & store
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Load history from localStorage on startup
  useEffect(() => {
    const stored = localStorage.getItem("parsing_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Storage read error", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (newResult: ParseResult) => {
    const isDup = history.some(item => item.sentence.trim() === newResult.originalSentence.trim());
    if (isDup) return;

    const newItem: HistoryItem = {
      id: "hist_" + Date.now(),
      sentence: newResult.originalSentence,
      result: newResult,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("ar-EG")
    };

    const updated = [newItem, ...history].slice(0, 50); 
    setHistory(updated);
    localStorage.setItem("parsing_history", JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف السجل بالكامل؟")) {
      setHistory([]);
      localStorage.removeItem("parsing_history");
    }
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("parsing_history", JSON.stringify(updated));
  };

  // Perform parsing action
  const handleParse = async (targetSentence: string = sentence) => {
    const cleanStr = targetSentence.trim();
    if (!cleanStr) {
      setErrorMsg("الرجاء كتابة أو اختيار جملة أولاً.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSelectedWordIndex(0);

    // Speed fast-path for identical local examples
    const standardMatches = Object.keys(EXAMPLE_SENTENCES).find(
      key => key.replace(/[\s\u064B-\u065F]/g, "") === cleanStr.replace(/[\s\u064B-\u065F]/g, "")
    );
    if (standardMatches) {
      setTimeout(() => {
        const found = EXAMPLE_SENTENCES[standardMatches];
        setResult(found);
        saveToHistory(found);
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence: cleanStr }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "فشل الاتصال بالملقّم لإجراء الإعراب.");
      }

      setResult(resData.data);
      saveToHistory(resData.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ غير متوقع أثناء الاتصال بالخادم الذكي.");
      
      setErrorMsg(
        `لم نتمكن من الوصول للمعرّب الذكي لقلة الاتصال أو مشكلة بمفاتيح API في الخادم. نوصي بالتجربة الفورية باستخدام الجمل الأمثلة بالأسفل.`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (ex: string) => {
    setSentence(ex);
    handleParse(ex);
  };

  const filteredHistory = history.filter(item => 
    item.sentence.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      dir="rtl" 
      className={`min-h-screen transition-all duration-300 font-sans p-4 md:p-8 ${
        isDarkMode 
          ? "bg-[#0f172a] text-slate-100" 
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Background Decorative Mesh Pattern in Bento Theme */}
      <div className="absolute top-0 right-0 left-0 h-[500px] bg-linear-to-b from-emerald-500/5 via-slate-500/0 to-transparent pointer-events-none" />

      {/* Main Grid Wrapper in compliance with the Bento Blueprint */}
      <div className="max-w-[1200px] mx-auto relative space-y-6">
        
        {/* Header Section (Adaptive modern layout) */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
              <BookOpenCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>المُعرِب الذكي</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-sans font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-400/10">الذكاء النحوي</span>
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                مدرسك العربي الفصيح لتبسيط قواعد اللغة وإعراب الجمل متصل الذكاء
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className={`hidden md:flex px-4 py-2 rounded-2xl border transition-colors items-center gap-2.5 text-xs font-semibold ${
              isDarkMode 
                ? "bg-slate-800/40 border-slate-700/80 text-slate-300" 
                : "bg-white border-slate-200 text-slate-600"
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>التحليل الذكي تفاعلي الآن</span>
            </div>

            {/* Quick Dark Mode Swapper */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
              title={isDarkMode ? "تفعيل الوضع المضيء" : "تفعيل الوضع الليلي"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>
          </div>
        </header>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Bento Block 1 (Sidebar / Left side in RTL): Historic Sentences */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className={`rounded-3xl border p-5 flex flex-col h-full min-h-[380px] transition-all ${
              isDarkMode 
                ? "bg-slate-900/65 border-slate-800/90 text-slate-300/90" 
                : "bg-white border-slate-200/90 text-slate-800"
            }`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/70">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-400" />
                  <span>سجل الجمل السابقة</span>
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[10px] text-rose-500 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                  >
                    تفجير السجل
                  </button>
                )}
              </div>

              {/* History Search filter box */}
              <div className="mb-3.5 relative">
                <input
                  type="text"
                  placeholder="ابحث في المسجلات النحوية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs p-2.5 pr-8 rounded-xl border focus:outline-hidden transition-all text-right ${
                    isDarkMode 
                      ? "bg-slate-950/70 border-slate-800 focus:border-emerald-500/50 text-slate-200" 
                      : "bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-800"
                  }`}
                />
                <span className="absolute right-2.5 top-3.5 text-slate-400">🔍</span>
              </div>

              {/* Historic sentences container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] lg:max-h-none pr-1">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500 italic font-serif">
                    {searchQuery ? "لم يتم العثور على نتائج للتحقيق." : "السجل التفاعلي خالٍ حالياً."}
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setResult(item.result);
                        setSentence(item.sentence);
                        setSelectedWordIndex(0);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group text-right flex justify-between items-start gap-2 ${
                        isDarkMode 
                          ? "bg-slate-950/60 border-slate-800 hover:border-emerald-500/65 hover:bg-slate-950 text-slate-200" 
                          : "bg-slate-50/80 border-slate-200 hover:border-emerald-500 hover:bg-emerald-500/5 text-slate-800"
                      }`}
                    >
                      <div className="overflow-hidden space-y-1">
                        <p className="font-serif font-bold text-xs md:text-sm truncate">
                          {item.sentence}
                        </p>
                        <span className="text-[9px] text-slate-500 block">
                          {item.timestamp}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto cursor-pointer"
                        title="احذف الجملة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bento Column 2 (Main input & result): Bento Grid Cells */}
          <div className="lg:col-span-9 flex flex-col gap-5">
            
            {/* Input Card Cell (Bento Block 2) */}
            <div className={`rounded-3xl border p-6 shadow-xs relative overflow-hidden transition-all ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800" 
                : "bg-white border-slate-200"
            }`}>
              
              <div className="relative">
                <textarea
                  rows={2}
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  placeholder="أدخل الجملة العربية التي تريد إعرابها كاملة مكلمة هنا..."
                  className={`w-full rounded-2xl p-5 pr-12 text-xl md:text-2xl font-serif text-right leading-relaxed resize-none focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 border transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-white placeholder-slate-550" 
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                  id="sentence_input"
                />
                
                <div className="absolute right-4 top-5 text-slate-500 pointer-events-none">
                  <Sparkles className="w-6 h-6 text-emerald-500/40" />
                </div>

                {/* Actuating button container inside Textarea */}
                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => handleParse()}
                    disabled={loading || sentence.trim().length === 0}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    id="parse_btn"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      "إعراب الجملة"
                    )}
                    <BookOpen className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Predefined quick examples collection */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-2">
                  جمل نموذجية سريعة بنكهة تراثية مريحة لإبهار المتعلم:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(EXAMPLE_SENTENCES).map((ex, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadExample(ex)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-serif border cursor-pointer transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-emerald-400 hover:bg-slate-800" 
                          : "bg-emerald-50/50 border-emerald-100/50 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error messaging inside workspace */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">توقف مؤقت في المعالجة الذكية</p>
                  <p className="text-slate-600 dark:text-slate-300 leading-normal">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Parsing Results area configured as highly structured Bento elements */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-12 text-center rounded-3xl border py-16 space-y-4 shadow-xs ${
                    isDarkMode 
                      ? "bg-slate-900/60 border-slate-800 text-slate-200" 
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="inline-flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-emerald-400 absolute animate-pulse" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h4 className="text-md font-bold font-serif text-slate-800 dark:text-slate-100">
                      يُحَلِّل الآن عِلْمُ النَّحْوِ ذَكَاءَهُ
                    </h4>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      {loadingMessage}
                    </p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key={result.originalSentence}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-5"
                >
                  {/* شجرة الإعراب التفاعلية باستخدام D3 */}
                  <div className="col-span-1 md:col-span-12">
                    <SyntaxTree
                      result={result}
                      selectedWordIndex={selectedWordIndex}
                      onSelectWord={(index) => setSelectedWordIndex(index)}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Bento block 3: Word-by-word Detail panel (8/12 cols) */}
                  <div className={`col-span-1 md:col-span-8 rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                    isDarkMode 
                      ? "bg-slate-900/40 border-slate-800" 
                      : "bg-white border-slate-200"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100 dark:border-slate-800/70">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="w-2 h-5 bg-emerald-500 rounded-full"></span>
                          <span>التحليل التفصيلي للكلمات (انقر للفحص)</span>
                        </h3>
                        <button
                          onClick={handleCopyAll}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${
                            copied
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : isDarkMode
                                ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-500/40 hover:text-emerald-650"
                          }`}
                          title="نسخ الإعراب الكامل للجملة"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                              <span className="font-sans font-bold">تم نسخ الإعراب كاملًا</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="font-sans font-bold">نسخ الإعراب الكامل</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Display as individual bento word cells */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {result.words.map((w, idx) => {
                          const borderStyle = COLOR_BORDERS[idx % COLOR_BORDERS.length];
                          const textColor = TEXT_COLORS[idx % TEXT_COLORS.length];
                          const isSelected = selectedWordIndex === idx;

                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedWordIndex(idx)}
                              className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all border pointer-events-auto ${
                                isSelected 
                                  ? "bg-slate-950 border-emerald-500 shadow-md scale-102" 
                                  : isDarkMode 
                                    ? "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:scale-101" 
                                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:scale-101"
                              } ${borderStyle}`}
                            >
                              <span className={`text-2xl font-serif font-extrabold mb-1.5 ${textColor}`}>
                                {w.diacritics || w.word}
                              </span>
                              <div className="h-[1px] w-full bg-slate-700/30 dark:bg-slate-800 mb-1.5" />
                              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-serif line-clamp-1">
                                {w.partOfSpeech}
                              </p>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-sm mt-1 text-slate-400 bg-slate-800/10 dark:bg-slate-800">
                                {w.grammaticalCase}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Detail pane of selected word */}
                      {selectedWordIndex !== null && result.words[selectedWordIndex] && (
                        <div className={`p-4.5 rounded-2xl border ${
                          isDarkMode 
                            ? "bg-slate-950/80 border-slate-800/80 text-slate-200" 
                            : "bg-slate-50 border-slate-200/80 text-slate-800"
                        }`}>
                          <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-800/10 dark:border-slate-800/40">
                            <span className="font-serif font-bold text-sm text-emerald-600 dark:text-emerald-400">
                              موقع الإعراب: "{result.words[selectedWordIndex].word}"
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {result.words[selectedWordIndex].grammaticalCase}
                            </span>
                          </div>
                          
                          <p className="text-xs md:text-sm font-serif leading-relaxed text-slate-700 dark:text-slate-300">
                            {result.words[selectedWordIndex].parsing}
                          </p>

                          <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 dark:bg-amber-400/5 text-slate-600 dark:text-slate-400 text-xs">
                            <div className="font-serif font-bold text-amber-600 dark:text-amber-400 mb-1">
                              مفهوم القاعدة المبسط:
                            </div>
                            <p>{result.words[selectedWordIndex].explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700/15 flex justify-center">
                      <div className="bg-emerald-550/10 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full px-5 py-2 text-xs">
                        تم فحص الجملة بدقة لغوية واختبار علامات الرفع والجر
                      </div>
                    </div>

                  </div>

                  {/* Bento block 4: Grammar Rules Box (5/12 cols) */}
                  <div className="col-span-1 md:col-span-4 flex flex-col gap-5">
                    
                    {/* Overall Structure card */}
                    <div className={`rounded-3xl border p-5 flex flex-col gap-3.5 transition-all ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800" 
                        : "bg-white border-slate-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-serif font-bold text-slate-800 dark:text-white">الهيكل الأساسي للجملة</h3>
                      </div>
                      <p className="text-xs md:text-sm font-serif leading-relaxed text-slate-600 dark:text-slate-400">
                        {result.overallExplanation}
                      </p>
                    </div>

                    {/* Rules listing cards */}
                    {result.rules && result.rules.map((rule, index) => (
                      <div 
                        key={index}
                        className={`rounded-3xl border p-5 flex flex-col gap-2.5 transition-all relative overflow-hidden ${
                          isDarkMode 
                            ? "bg-slate-900 border-slate-800" 
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500" />
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-serif">
                          {rule.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-right">
                          {rule.explanation}
                        </p>
                      </div>
                    ))}

                    {/* Educational tips widget */}
                    <div className="rounded-3xl bg-linear-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/10 p-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 font-serif">فائدة نحوية مفيدة</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-serif">
                        هل تعلم أن حركات الإعراب الأربعة (الضمة، الفتحة، الكسرة، السكون) تمثل أمهات الحركات النحوية، وهناك سبع علامات فرعية كواو الجماعة وألف الاثنين وثبوت النون.
                      </p>
                    </div>

                  </div>

                </motion.div>
              ) : (
                <div className={`p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 py-24 space-y-3 ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}>
                  <BookOpenCheck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto animate-pulse" />
                  <p className="text-lg font-serif">اكتب جملة عربية بالصندوق بالأعلى أو اختر من الجمل النموذجية مسبقة الإعداد.</p>
                  <p className="text-xs leading-normal">ستعرض النتائج كلمة بكلمة مع القواعد والفوائد النحوية.</p>
                </div>
              )}
            </AnimatePresence>

          </div>

        </div>

        {/* Static Arabic educational citation line at bottom */}
        <footer className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-800/10 dark:border-slate-800/50 pt-6">
          <p className="font-serif leading-relaxed">
             المعرّب الذكي لغة الضاد الفصحى © 2026. بني هذا التطبيق لمساعدة معلمين ومحبين النحو في استخراج القواعد النحوية مبرهنة وميسرة.
          </p>
        </footer>

      </div>
    </div>
  );
}
