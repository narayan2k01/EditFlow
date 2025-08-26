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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const docWidth = doc.internal.pageSize.getWidth();

    const addHeader = (docInstance: jsPDF) => {
      const pageCount = (docInstance.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docInstance.setPage(i);
        docInstance.addImage(logo, 'PNG', margin, margin - 15, 15, 15);
        docInstance.setFont('helvetica', 'normal');
        docInstance.setFontSize(10);
        docInstance.text('EditFlow Document', margin + 20, margin - 5);
        docInstance.text(`Page ${i}`, docWidth - margin, margin - 5, { align: 'right' });
      }
    };

    if (isTextBionic && bionicRef.current) {
      const source = bionicRef.current;
      doc.html(source, {
        callback: function(docInstance) {
          addHeader(docInstance);
          docInstance.save('editflow-document.pdf');
        },
        x: margin,
        y: margin + 10,
        width: docWidth - (margin * 2),
        windowWidth: source.scrollWidth,
      });
    } else {
      doc.setFont(fontFamily);
      doc.setFontSize(parseInt(fontSize.replace('px',''), 10));
      const lines = doc.splitTextToSize(text, docWidth - margin * 2);
      doc.text(lines, margin, margin + 10);
      addHeader(doc);
      doc.save('editflow-document.pdf');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className={`text-3xl font-bold mb-8 ${ mode === 'dark' ? 'text-white' : 'text-slate-900' }`}>
        Text Editor
      </h2>

      <div className="mb-6 flex gap-4">
        <select 
          className={`px-3 py-2 rounded-lg ${ mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900' }`}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)} >
          <option value="14px">Small</option>
          <option value="16px">Medium</option>
          <option value="18px">Large</option>
          <option value="20px">Extra Large</option>
        </select>
        <select 
          className={`px-3 py-2 rounded-lg ${ mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900' }`}
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)} >
          <option value="sans-serif">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>

      <div className={`p-6 rounded-lg shadow-lg mb-8 ${ mode === 'dark' ? 'bg-slate-800' : 'bg-white' }`}>
        {isTextBionic || searchTerm ? (
          <div
            ref={bionicRef}
            className={`w-full h-auto p-4 rounded-lg mb-6 outline-none transition-colors text-justify whitespace-pre-wrap`} // h-auto allows it to be measured
            style={{ fontSize, fontFamily, backgroundColor: mode === 'dark' ? '#0f172a' : '#f8fafc', color: mode === 'dark' ? 'white' : 'black' }}
            dangerouslySetInnerHTML={{ __html: bionicText }}
          />
        ) : (
          <textarea
            className={`w-full h-64 p-4 rounded-lg mb-6 outline-none transition-colors text-justify ${ mode === 'dark' ? 'bg-slate-900 text-white placeholder:text-slate-400' : 'bg-slate-50 text-slate-900 placeholder:text-slate-500' }`}
            style={{ fontSize, fontFamily }}
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text here..."
          />
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={handleUpperCase} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"> <ArrowUpWideNarrow className="w-4 h-4" /> Uppercase </button>
          <button onClick={handleLowerCase} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"> <ArrowDownWideNarrow className="w-4 h-4" /> Lowercase </button>
          <button onClick={handleCapitalizedCase} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"> <Type className="w-4 h-4" /> Capitalize </button>
          <button onClick={handleClearExtraSpace} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"> <RefreshCcw className="w-4 h-4" /> Clear Extra Space </button>
          <button onClick={handleBionicReading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"> <Type className="w-4 h-4" /> {isTextBionic ? "De-Bionify" : "Bionify"} </button>
          <button onClick={handleTextToSpeech} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${ speaking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700' } text-white`}> <Volume2 className="w-4 h-4" /> {speaking ? 'Stop' : 'Speak'} </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"> <Share2 className="w-4 h-4" /> Share </button>
          <button onClick={undo} disabled={historyIndex <= 0} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"> <History className="w-4 h-4" /> Undo </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"> <History className="w-4 h-4 transform scale-x-[-1]" /> Redo </button>
          <button onClick={handleClearText} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"> <RefreshCcw className="w-4 h-4" /> Clear </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"> <Download className="w-4 h-4" /> Download PDF </button>
        </div>
      </div>

      <div className={`p-6 rounded-lg ${ mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900' }`}>
        <h3 className="text-xl font-semibold mb-6">Text Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}> <p>Words: {text.split(/\s+/).filter(Boolean).length}</p> <p>Characters: {text.length}</p> </div>
            <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}> <p>Reading time: {(0.008 * text.split(' ').filter(Boolean).length).toFixed(2)} mins</p> <p>Sentences: {text.split(/[.!?]+/).filter(Boolean).length}</p> </div>
            <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}> <p>Paragraphs: {text.split(/\n\s*\n/).filter(Boolean).length}</p> <p>Characters (no spaces): {text.replace(/\s/g, '').length}</p> </div>
        </div>
      </div>
    </div>
  );
}