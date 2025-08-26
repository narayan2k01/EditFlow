import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpWideNarrow, 
  ArrowDownWideNarrow, 
  RefreshCcw, 
  Type, 
  Download,
  Volume2,
  Share2,
  History,
  ThumbsUp,
  Loader2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas'; // jsPDF requires this for its html method
import logo from '/icon.png';

interface TextFormProps {
  mode: 'light' | 'dark';
  searchTerm?: string;
}

interface TextHistory {
  text: string;
  timestamp: number;
}

export default function TextForm({ mode, searchTerm }: TextFormProps) {
  const [text, setText] = useState('');
  const [bionicText, setBionicText] = useState('');
  const [isTextBionic, setIsTextBionic] = useState(false);
  const [history, setHistory] = useState<TextHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [speaking, setSpeaking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showThumbsUp, setShowThumbsUp] = useState(false);
  const speechSynthesis = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const bionicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedText = localStorage.getItem('editflow-text');
    if (savedText) {
      setText(savedText);
      addToHistory(savedText);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('editflow-text', text);
  }, [text]);
  
  useEffect(() => {
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'gi');
      const highlightedText = text.replace(/\n\s*\n/g, '<br/><br/>').replace(regex, match => `<mark class="bg-yellow-200 dark:bg-yellow-600">${match}</mark>`);
      setBionicText(highlightedText);
    } 
    else if (isTextBionic && text) {
      const paragraphs = text.split(/\n\s*\n/);
      const bionifiedParagraphs = paragraphs.map(paragraph => {
        const words = paragraph.split(/(\s+)/);
        const bionicWords = words.map(word => {
          if (word.trim().length === 0) return word;
          const midPoint = Math.ceil(word.length / 2);
          return `<strong>${word.slice(0, midPoint)}</strong>${word.slice(midPoint)}`;
        });
        return bionicWords.join('');
      });
      setBionicText(bionifiedParagraphs.join('<br/><br/>'));
    } 
    else {
      setBionicText('');
    }
  }, [searchTerm, text, isTextBionic]);

  const addToHistory = (newText: string) => {
    const newHistory = [...history.slice(0, historyIndex + 1), { text: newText, timestamp: Date.now() }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => { if (historyIndex > 0) { setHistoryIndex(prev => prev - 1); setText(history[historyIndex - 1].text); } };
  const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(prev => prev + 1); setText(history[historyIndex + 1].text); } };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    addToHistory(newText);
    setIsTextBionic(false);
  };

  const handleUpperCase = () => { const newText = text.toUpperCase(); setText(newText); addToHistory(newText); };
  const handleLowerCase = () => { const newText = text.toLowerCase(); setText(newText); addToHistory(newText); };
  const handleClearText = () => { setText(''); setIsTextBionic(false); addToHistory(''); };
  const handleCapitalizedCase = () => { const newText = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); setText(newText); addToHistory(newText); };
  const handleClearExtraSpace = () => { const newText = text.replace(/\s+/g, ' ').trim(); setText(newText); addToHistory(newText); };
  const handleBionicReading = () => { if (text) { setIsTextBionic(!isTextBionic); } };
  
  const handleTextToSpeech = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const handleShare = async () => { /* share logic */ };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    // Remove all * and # characters
    const cleaned = pasted.replace(/[*#]/g, '');
    // Insert at cursor position
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.slice(0, start) + cleaned + text.slice(end);
    setText(newText);
    addToHistory(newText);
  };

  // Helper: Convert plain text to HTML with formatting
  function formatTextToHTML(text: string) {
    // Split by paragraphs (double line breaks)
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map(paragraph => {
      // Detect headings/subheadings (simple heuristics)
      if (/^#\s/.test(paragraph)) {
        // Markdown H1
        return `<h1 style="font-size:1.5em;font-weight:bold;margin:1em 0 0.5em 0;">${paragraph.replace(/^#\s/, '')}</h1>`;
      }
      if (/^##\s/.test(paragraph)) {
        // Markdown H2
        return `<h2 style="font-size:1.2em;font-weight:bold;margin:1em 0 0.5em 0;">${paragraph.replace(/^##\s/, '')}</h2>`;
      }
      if (/^[A-Z\s\d\W]{8,}$/.test(paragraph.trim())) {
        // All caps line, treat as headline
        return `<h3 style="font-size:1em;font-weight:bold;margin:1em 0 0.5em 0;">${paragraph.trim()}</h3>`;
      }
      // Otherwise, treat as paragraph, preserve single line breaks
      return `<p style="margin:0 0 1em 0;white-space:pre-line;">${paragraph.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setShowThumbsUp(false);

    const doc = new jsPDF({
      unit: 'px',
      format: 'a4',
    });

    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const headerHeight = 70;

    const drawHeader = () => {
      doc.addImage(logo, 'PNG', margin, margin - 10, 30, 30);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EditFlow Document', margin + 40, margin + 10);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Words: ${text.split(/\s+/).filter(Boolean).length}`, margin, margin + 30);
      doc.text(`Characters: ${text.length}`, margin + 120, margin + 30);
      doc.text(`Reading time: ${(0.008 * text.split(' ').filter(Boolean).length).toFixed(2)} mins`, margin, margin + 45);
      doc.text(`Sentences: ${text.split(/[.!?]+/).filter(Boolean).length}`, margin + 120, margin + 45);
      doc.text(`Paragraphs: ${text.split(/\n\s*\n/).filter(Boolean).length}`, margin, margin + 60);
      doc.text(`Characters (no spaces): ${text.replace(/\s/g, '').length}`, margin + 120, margin + 60);
      doc.setDrawColor(180);
      doc.setLineWidth(0.5);
      doc.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);
    };

    // Prepare export HTML
    let exportHTML = '';
    if (isTextBionic && bionicRef.current) {
      exportHTML = bionicRef.current.innerHTML;
    } else {
      exportHTML = formatTextToHTML(text);
    }

    // Split HTML into paragraphs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = exportHTML;
    const nodes = Array.from(tempDiv.childNodes);

    let pageNum = 0;
    let i = 0;
    while (i < nodes.length) {
      // Create a page container
      const pageDiv = document.createElement('div');
      pageDiv.style.width = `${contentWidth}px`;
      pageDiv.style.fontSize = fontSize;
      pageDiv.style.fontFamily = fontFamily;
      pageDiv.style.background = mode === 'dark' ? '#0f172a' : '#f8fafc';
      pageDiv.style.color = mode === 'dark' ? 'white' : 'black';
      pageDiv.style.lineHeight = '1.5';
      pageDiv.style.wordBreak = 'break-word';
      pageDiv.style.padding = '0px';
      pageDiv.style.position = 'absolute';
      pageDiv.style.left = '-9999px';
      pageDiv.style.top = '0';
      pageDiv.style.overflow = 'hidden';
      pageDiv.style.display = 'block';

      // For first page, reduce height for header
      const availableHeight = pageNum === 0 ? contentHeight - headerHeight : contentHeight;
      pageDiv.style.height = `${availableHeight}px`;

      // Add paragraphs until we fill the page
      let currentHeight = 0;
      let startIdx = i;
      while (i < nodes.length) {
        pageDiv.appendChild(nodes[i].cloneNode(true));
        document.body.appendChild(pageDiv);
        const measuredHeight = pageDiv.scrollHeight;
        document.body.removeChild(pageDiv);

        if (measuredHeight > availableHeight) {
          // Remove last node, page is full
          pageDiv.removeChild(pageDiv.lastChild!);
          break;
        } else {
          currentHeight = measuredHeight;
          i++;
        }
      }

      // If nothing fits, force at least one paragraph per page
      if (pageDiv.childNodes.length === 0 && i < nodes.length) {
        pageDiv.appendChild(nodes[i].cloneNode(true));
        i++;
      }

      document.body.appendChild(pageDiv);

      const canvas = await html2canvas(pageDiv, {
        backgroundColor: null,
        scale: 2,
        width: contentWidth,
        height: availableHeight,
        windowWidth: contentWidth,
        windowHeight: availableHeight,
      });

      document.body.removeChild(pageDiv);

      if (pageNum === 0) {
        drawHeader();
        doc.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          margin,
          margin + headerHeight,
          contentWidth,
          availableHeight
        );
      } else {
        doc.addPage();
        doc.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          contentWidth,
          availableHeight
        );
      }

      pageNum++;
    }

    doc.save('editflow-document.pdf');
    setIsDownloading(false);
    setShowThumbsUp(true);
    setTimeout(() => setShowThumbsUp(false), 2000);
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-2 sm:px-4 md:px-8 py-4">
      <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 ${mode === 'dark' ? 'text-white' : 'text-slate-900'} text-center`}>
        Bionic Reading Text Editor
      </h2>

      <div className="relative">
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 rounded-t-lg shadow flex flex-wrap gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-800 justify-center">
          {/* --- Formatting Group --- */}
          <div className="flex gap-3">
            <button onClick={handleUpperCase} className="toolbar-btn group flex flex-col items-center" title="Convert to UPPERCASE">
              <ArrowUpWideNarrow className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">UPPERCASE</span>
            </button>
            <button onClick={handleLowerCase} className="toolbar-btn group flex flex-col items-center" title="Convert to lowercase">
              <ArrowDownWideNarrow className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">lowercase</span>
            </button>
            <button onClick={handleCapitalizedCase} className="toolbar-btn group flex flex-col items-center" title="Capitalize Each Word">
              <Type className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">Capitalize</span>
            </button>
            <button onClick={handleClearExtraSpace} className="toolbar-btn group flex flex-col items-center" title="Remove Extra Spaces">
              <RefreshCcw className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">Trim</span>
            </button>
            <button onClick={handleBionicReading} className={`toolbar-btn group flex flex-col items-center ${isTextBionic ? 'bg-blue-100 dark:bg-slate-700' : ''}`} title="Bionic Reading">
              <Type className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">Bionic</span>
            </button>
          </div>
          {/* --- Utility Group --- */}
          <div className="flex gap-3">
            <button onClick={handleTextToSpeech} className="toolbar-btn group flex flex-col items-center" title={speaking ? "Stop Speaking" : "Speak"}>
              <Volume2 className={`w-6 h-6 mb-1 ${speaking ? 'text-red-500' : 'group-hover:text-blue-600'} transition-colors`} />
              <span className="text-xs font-medium group-hover:text-blue-600">{speaking ? "Stop" : "Speak"}</span>
            </button>
            <button onClick={undo} disabled={historyIndex <= 0} className="toolbar-btn group flex flex-col items-center" title="Undo">
              <History className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">Undo</span>
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="toolbar-btn group flex flex-col items-center" title="Redo">
              <History style={{ transform: 'scaleX(-1)' }} className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">Redo</span>
            </button>
            <button onClick={handleClearText} className="toolbar-btn group flex flex-col items-center" title="Clear All">
              <RefreshCcw className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">Clear</span>
            </button>
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="toolbar-btn group flex flex-col items-center" title="Download PDF">
              {isDownloading ? <Loader2 className="w-6 h-6 mb-1 animate-spin" /> : showThumbsUp ? <ThumbsUp className="w-6 h-6 mb-1 text-yellow-400" /> : <Download className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />}
              <span className="text-xs font-medium group-hover:text-blue-600">{isDownloading ? "Downloading" : showThumbsUp ? "Done!" : "PDF"}</span>
            </button>
            <button onClick={handleShare} className="toolbar-btn group flex flex-col items-center" title="Share">
              <Share2 className="w-6 h-6 mb-1 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-medium group-hover:text-blue-600">Share</span>
            </button>
          </div>
        </div>

        {/* --- TEXT AREA / BIONIC VIEW --- */}
        <div className={`p-2 sm:p-4 rounded-b-lg shadow-lg mb-8 ${mode === 'dark' ? 'bg-slate-800' : 'bg-white'} overflow-auto`}>
          {isTextBionic || searchTerm ? (
            <div
              ref={bionicRef}
              className="w-full min-h-[12rem] sm:min-h-[16rem] p-2 sm:p-6 rounded-b-lg outline-none transition-colors text-justify whitespace-pre-wrap"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                fontFamily,
                backgroundColor: mode === 'dark' ? '#0f172a' : '#f8fafc',
                color: mode === 'dark' ? 'white' : 'black'
              }}
              dangerouslySetInnerHTML={{ __html: bionicText }}
            />
          ) : (
            <textarea
              className={`w-full min-h-[12rem] sm:min-h-[16rem] p-2 sm:p-6 rounded-b-lg outline-none transition-colors text-justify resize-y ${mode === 'dark' ? 'bg-slate-900 text-white placeholder:text-slate-400' : 'bg-slate-50 text-slate-900 placeholder:text-slate-500'}`}
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                fontFamily
              }}
              value={text}
              onChange={handleTextChange}
              onPaste={handlePaste}
              placeholder="Start typing or paste your text here..."
            />
          )}
        </div>
      </div>

      {/* Live Counts */}
      <div className="flex flex-wrap gap-4 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 justify-center">
        <span>Words: {text.split(/\s+/).filter(Boolean).length}</span>
        <span>Characters: {text.length}</span>
        <span>Paragraphs: {text.split(/\n\s*\n/).filter(Boolean).length}</span>
      </div>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center text-xs sm:text-sm ${mode === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'} rounded-lg`}>
        &copy; {new Date().getFullYear()} EditFlow &mdash; Made with <span className="text-red-500">♥</span> for creators.
      </footer>

      {/* Go to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-4 sm:right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-2 sm:p-3 flex flex-col items-center transition-all"
        title="Go to Top"
      >
        <ArrowUpWideNarrow className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-xs font-semibold mt-1">Top</span>
      </button>
    </div>
  );
}


