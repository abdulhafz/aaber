import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, RotateCcw, AlertCircle, HelpCircle, Info } from "lucide-react";

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

interface SyntaxTreeProps {
  result: ParseResult;
  selectedWordIndex: number | null;
  onSelectWord: (index: number | null) => void;
  isDarkMode: boolean;
}

// Flat structure defined for D3 Stratified Hierarchy
interface TreeNodeData {
  id: string; // root or word_{index}
  name: string;
  diacritics: string;
  partOfSpeech: string;
  grammaticalCase: string;
  relationship: string;
  parent: string | null;
  wordIdx: number | null; // null for virtual root
}

export default function SyntaxTree({
  result,
  selectedWordIndex,
  onSelectWord,
  isDarkMode
}: SyntaxTreeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasValidRelationships, setHasValidRelationships] = useState<boolean>(true);

  // Re-render D3 whenever data, selection, or dark mode changes
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !result || !result.words) return;

    const { words } = result;

    // Detect if words have valid relationship structure. If missing entirely, fallback to automated chain/star layout
    const relationsPresent = words.some(w => w.parentWord !== undefined || w.relationship !== undefined);
    setHasValidRelationships(relationsPresent || words.length <= 1);

    // Build flat array for D3
    const flatData: TreeNodeData[] = [];

    // 1. Create a virtual root node representing the Sentence type
    const isNominal = result.overallExplanation.includes("اسمية") || result.overallExplanation.includes("إنّ") || result.overallExplanation.includes("كان");
    const sentenceTypeLabel = isNominal ? "جملة اسميّة" : "جملة فعليّة";

    flatData.push({
      id: "root",
      name: sentenceTypeLabel,
      diacritics: sentenceTypeLabel,
      partOfSpeech: "بنية إسنادية",
      grammaticalCase: "مبني",
      relationship: "",
      parent: null,
      wordIdx: null
    });

    // Helper to find parent index
    const findParentWordIndex = (parentWordStr: string, currentIdx: number): number | null => {
      if (!parentWordStr) return null;
      // Clean string helper to compare without diacritics if necessary
      const clean = (s: string) => s.replace(/[\u064B-\u065F]/g, "").trim();
      const targetClean = clean(parentWordStr);

      // Check for exact word or clean match, excluding current to prevent cycles
      for (let i = 0; i < words.length; i++) {
        if (i === currentIdx) continue;
        if (clean(words[i].word) === targetClean || clean(words[i].diacritics) === targetClean) {
          return i;
        }
      }
      return null;
    };

    // 2. Add each word
    words.forEach((w, idx) => {
      let resolvedParentId = "root"; // Default fallback is virtual root

      if (w.parentWord) {
        const parentIdx = findParentWordIndex(w.parentWord, idx);
        if (parentIdx !== null) {
          resolvedParentId = `word_${parentIdx}`;
        }
      } else if (!relationsPresent && idx > 0) {
        // Simple automatic syntactic chain fallback: connect sequential words if no API relations are provided yet (e.g. initial load or legacy response)
        resolvedParentId = "word_0";
      }

      flatData.push({
        id: `word_${idx}`,
        name: w.word,
        diacritics: w.diacritics || w.word,
        partOfSpeech: w.partOfSpeech,
        grammaticalCase: w.grammaticalCase,
        relationship: w.relationship || (idx === 0 ? "عنصر أساسي" : "متمّم"),
        parent: resolvedParentId,
        wordIdx: idx
      });
    });

    // Clear previous elements
    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();

    // Get real container width and height
    const containerWidth = containerRef.current.clientWidth || 900;
    const containerHeight = Math.max(380, Math.min(480, words.length * 90 + 150));

    // Append canvas group
    const g = svgEl
      .attr("width", "100%")
      .attr("height", containerHeight)
      .append("g")
      .attr("id", "main-tree-canvas");

    // Add marker for arrowheads
    svgEl
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 22) // Place arrowhead near border of child nodes
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 1.5 L 8 5 L 0 8.5 z")
      .attr("fill", isDarkMode ? "#4b5563" : "#cbd5e1");

    // 3. Set up Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svgEl.call(zoomBehavior);

    // 4. Stratify dataset
    try {
      const stratify = d3.stratify<TreeNodeData>()
        .id(d => d.id)
        .parentId(d => d.parent);

      const root = stratify(flatData);

      // 5. Generate tree layout
      // Use wider separation for words
      const treeLayout = d3.tree<TreeNodeData>()
        .size([containerWidth - 160, containerHeight - 160]);

      treeLayout(root);

      // Swap coordinates for top-down layout and center it
      root.each(d => {
        // Shift a bit to respect margins
        const tempX = d.x;
        d.x = tempX + 80;
        d.y = d.y + 70;
      });

      // 6. Draw connection links
      const linkGenerator = d3.linkVertical<any, any>()
        .x(d => d.x)
        .y(d => d.y);

      // Add link groups
      const links = g.append("g")
        .attr("class", "links")
        .selectAll(".link")
        .data(root.links())
        .enter()
        .append("g")
        .attr("class", "link-group");

      // Draw custom bezier curves with arrow markers
      links.append("path")
        .attr("class", "link-line")
        .attr("d", linkGenerator)
        .attr("fill", "none")
        .attr("stroke", (d: any) => {
          const isTargetSelected = d.target.data.wordIdx === selectedWordIndex;
          const isSourceSelected = d.source.data.wordIdx === selectedWordIndex;
          if (isTargetSelected || isSourceSelected) {
            return "#10b981"; // Highlight connection
          }
          return isDarkMode ? "#334155" : "#e2e8f0";
        })
        .attr("stroke-width", (d: any) => {
          const isTargetSelected = d.target.data.wordIdx === selectedWordIndex;
          return isTargetSelected ? 3 : 1.7;
        })
        .attr("marker-end", "url(#arrow)")
        .style("stroke-dasharray", (d: any) => {
          // Dash lines for less strong relations, solid for direct argument syntax relations
          return d.target.data.relationship.includes("حرف جر") || d.target.data.relationship.includes("مضاف") ? "5,5" : "none";
        });

      // 7. Draw connection labels (relation types) in the center of the curves
      links.append("rect")
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2 - 40)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 10)
        .attr("width", 80)
        .attr("height", 18)
        .attr("rx", 5)
        .attr("fill", isDarkMode ? "#0f172a" : "#ffffff")
        .attr("stroke", (d: any) => {
          const isSelected = d.target.data.wordIdx === selectedWordIndex;
          return isSelected ? "#059669" : (isDarkMode ? "#1e293b" : "#f1f5f9");
        })
        .attr("stroke-width", 1);

      links.append("text")
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 + 3)
        .attr("text-anchor", "middle")
        .attr("fill", (d: any) => {
          const isSelected = d.target.data.wordIdx === selectedWordIndex;
          return isSelected ? "#10b981" : (isDarkMode ? "#94a3b8" : "#64748b");
        })
        .style("font-size", "10px")
        .style("font-family", "Cairo, system-ui")
        .style("font-weight", "bold")
        .text((d: any) => d.target.data.relationship);

      // 8. Draw interactive nodes (words / cards)
      const nodes = g.append("g")
        .attr("class", "nodes")
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node-group")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
        .style("cursor", "pointer")
        .on("click", (event, d: any) => {
          onSelectWord(d.data.wordIdx);
        });

      // Dimensions for each word card
      const rectW = 120;
      const rectH = 55;

      // Card Background with gradient / shadows
      nodes.append("rect")
        .attr("x", -rectW / 2)
        .attr("y", -rectH / 2)
        .attr("width", rectW)
        .attr("height", rectH)
        .attr("rx", 10)
        .attr("fill", (d: any) => {
          if (d.data.id === "root") {
            return isDarkMode ? "url(#rootGradDark)" : "url(#rootGradLight)";
          }
          const isSelected = d.data.wordIdx === selectedWordIndex;
          if (isSelected) {
            return isDarkMode ? "#022c22" : "#ecfdf5";
          }
          return isDarkMode ? "#1e293b" : "#ffffff";
        })
        .attr("stroke", (d: any) => {
          if (d.data.id === "root") {
            return "#6366f1";
          }
          const isSelected = d.data.wordIdx === selectedWordIndex;
          if (isSelected) {
            return "#10b981"; // Emerald green for active item
          }
          return isDarkMode ? "#334155" : "#e2e8f0";
        })
        .attr("stroke-width", (d: any) => {
          const isSelected = d.data.wordIdx === selectedWordIndex;
          return isSelected || d.data.id === "root" ? 2.5 : 1.2;
        })
        .attr("filter", "url(#drop-shadow)");

      // Glow filters and Gradients definitions inside the node renderer dynamically
      const defs = svgEl.select("defs");

      // Root Gradient Dark
      const rootGradDark = defs.append("linearGradient")
        .attr("id", "rootGradDark")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      rootGradDark.append("stop").attr("offset", "0%").attr("stop-color", "#312e81");
      rootGradDark.append("stop").attr("offset", "100%").attr("stop-color", "#1e1b4b");

      // Root Gradient Light
      const rootGradLight = defs.append("linearGradient")
        .attr("id", "rootGradLight")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      rootGradLight.append("stop").attr("offset", "0%").attr("stop-color", "#e0e7ff");
      rootGradLight.append("stop").attr("offset", "100%").attr("stop-color", "#c7d2fe");

      // Dropped Shadow filter to create depth
      const shadowFilter = defs.append("filter")
        .attr("id", "drop-shadow")
        .attr("height", "130%");
      shadowFilter.append("feDropShadow")
        .attr("dx", 0)
        .attr("dy", 3)
        .attr("stdDeviation", 3)
        .attr("flood-opacity", isDarkMode ? 0.4 : 0.08);

      // Node Label (Arabic Diacritics word / Root summary)
      nodes.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("fill", (d: any) => {
          if (d.data.id === "root") {
            return isDarkMode ? "#e0e7ff" : "#312e81";
          }
          const isSelected = d.data.wordIdx === selectedWordIndex;
          if (isSelected) {
            return isDarkMode ? "#34d399" : "#065f46";
          }
          return isDarkMode ? "#f8fafc" : "#1e293b";
        })
        .style("font-size", (d: any) => d.data.id === "root" ? "13px" : "15px")
        .style("font-family", "Amiri, Georgia, serif")
        .style("font-weight", "bold")
        .text((d: any) => d.data.diacritics);

      // Node Sub-label (Part of speech or category)
      nodes.append("text")
        .attr("x", 0)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("fill", (d: any) => {
          if (d.data.id === "root") {
            return isDarkMode ? "#a5b4fc" : "#4f46e5";
          }
          const isSelected = d.data.wordIdx === selectedWordIndex;
          if (isSelected) {
            return isDarkMode ? "#a7f3d0" : "#047857";
          }
          return isDarkMode ? "#94a3b8" : "#64748b";
        })
        .style("font-size", "10px")
        .style("font-family", "Cairo, system-ui")
        .style("font-weight", "500")
        .text((d: any) => {
          // Truncate long categories for beautiful labels
          const pos = d.data.partOfSpeech;
          return pos.length > 20 ? pos.substring(0, 18) + "..." : pos;
        });

      // Small Badge indicator for grammatical case
      nodes.filter((d: any) => d.data.id !== "root")
        .append("rect")
        .attr("x", -rectW / 2 + 6)
        .attr("y", -rectH / 2 + 6)
        .attr("width", 38)
        .attr("height", 13)
        .attr("rx", 3)
        .attr("fill", (d: any) => {
          const gc = d.data.grammaticalCase;
          if (gc.includes("مرفوع")) return "rgba(16, 185, 129, 0.15)";
          if (gc.includes("منصوب")) return "rgba(59, 130, 246, 0.15)";
          if (gc.includes("مجرور")) return "rgba(245, 158, 11, 0.15)";
          if (gc.includes("مجزوم")) return "rgba(239, 68, 68, 0.15)";
          return "rgba(100, 116, 139, 0.15)";
        });

      nodes.filter((d: any) => d.data.id !== "root")
        .append("text")
        .attr("x", -rectW / 2 + 25)
        .attr("y", -rectH / 2 + 15)
        .attr("text-anchor", "middle")
        .attr("fill", (d: any) => {
          const gc = d.data.grammaticalCase;
          if (gc.includes("مرفوع")) return "#10b981";
          if (gc.includes("منصوب")) return "#3b82f6";
          if (gc.includes("مجرور")) return "#f59e0b";
          if (gc.includes("مجزوم")) return "#ef4444";
          return isDarkMode ? "#94a3b8" : "#475569";
        })
        .style("font-size", "8px")
        .style("font-family", "Cairo, system-ui")
        .style("font-weight", "900")
        .text((d: any) => {
          const gc = d.data.grammaticalCase;
          if (gc.includes("مرفوع")) return "مرفوع";
          if (gc.includes("منصوب")) return "منصوب";
          if (gc.includes("مجرور")) return "مجرور";
          if (gc.includes("مجزوم")) return "مجزوم";
          return "مبني";
        });

      // 9. Initial centering: center the tree diagram automatically
      const initialScale = 0.95;
      const initialTransform = d3.zoomIdentity
        .translate((containerWidth * (1 - initialScale)) / 2 + 10, 10)
        .scale(initialScale);

      svgEl.call(zoomBehavior.transform, initialTransform);

    } catch (e) {
      console.error("D3 stratification error:", e);
    }

  }, [result, selectedWordIndex, isDarkMode]);

  // Handle manual Scale & Pivot Actions
  const handleZoom = (direction: "in" | "out" | "reset") => {
    const svgEl = d3.select(svgRef.current);
    if (!svgEl || !containerRef.current) return;

    if (direction === "reset") {
      const containerWidth = containerRef.current.clientWidth || 900;
      const initialScale = 0.95;
      const initialTransform = d3.zoomIdentity
        .translate((containerWidth * (1 - initialScale)) / 2 + 10, 10)
        .scale(initialScale);

      svgEl.transition().duration(400).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any, 
        initialTransform
      );
    } else {
      const offset = direction === "in" ? 1.3 : 0.7;
      svgEl.transition().duration(250).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        offset
      );
    }
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${
      isDarkMode 
        ? "bg-slate-900/60 border-slate-800/80" 
        : "bg-white border-slate-100 shadow-md shadow-slate-100/50"
    }`} id="syntax-tree-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-indigo-500 rounded-full"></span>
            <span>شجرة العلاقات النحوية التفاعلية</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مخطط شجري توضيحي يوضح تبعيّة الكلمات ووحداتها النحوية (اسحب وحرك للتصفح)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => handleZoom("in")}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                : "bg-slate-50 hover:bg-slate-200 text-slate-700"
            }`}
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom("out")}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                : "bg-slate-50 hover:bg-slate-200 text-slate-700"
            }`}
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom("reset")}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                : "bg-slate-50 hover:bg-slate-200 text-slate-700"
            }`}
            title="إعادة التموضع"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas SVG wrapper */}
      <div 
        ref={containerRef}
        className={`relative w-full rounded-2xl overflow-hidden border ${
          isDarkMode ? "bg-slate-950/70 border-slate-800/60" : "bg-slate-50/50 border-slate-200/50"
        }`}
        style={{ direction: "ltr" }} // Force Left-to-Right layout on canvas math container so drawing is symmetric
      >
        <svg 
          ref={svgRef}
          className="w-full h-full block focus:outline-none"
          dir="ltr"
        />

        {!hasValidRelationships && (
          <div className="absolute bottom-3 right-3 left-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2 text-indigo-400 text-xs flex items-center gap-2 pointer-events-none select-none">
            <Info className="w-4 h-4 shrink-0" />
            <span className="font-sans">
              يتم استعراض الشجرة بهيكل متسلسل متزن لعدم توفر تبعية مخصصة في النتائج المخزنة مسبقاً.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400 dark:text-slate-500 justify-end">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>تلميح: انقر على أي كلمة في الشجرة لإظهار إعرابها التفصيلي في اللوحة أدناه.</span>
      </div>
    </div>
  );
}
