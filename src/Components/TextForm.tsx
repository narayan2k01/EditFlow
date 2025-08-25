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
import logo from '/icon.png'; // Import the logo

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
      const highlightedText = text.replace(regex, match => `<mark class="bg-yellow-200 dark:bg-yellow-600">${match}</mark>`);
      setBionicText(highlightedText);
      setIsTextBionic(true);
    } else if (isTextBionic) {
      handleBionicReading();
    } else {
      setBionicText('');
      setIsTextBionic(false);
    }
  }, [searchTerm, text, isTextBionic]);

  const addToHistory = (newText: string) => {
    const newHistory = [...history.slice(0, historyIndex + 1), { text: newText, timestamp: Date.now() }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setText(history[historyIndex - 1].text);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setText(history[historyIndex + 1].text);
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    addToHistory(newText);
    setIsTextBionic(false); // Disable bionic mode when text is edited
  };

  const handleUpperCase = () => { const newText = text.toUpperCase(); setText(newText); addToHistory(newText); };
  const handleLowerCase = () => { const newText = text.toLowerCase(); setText(newText); addToHistory(newText); };
  const handleClearText = () => { setText(''); setBionicText(''); setIsTextBionic(false); addToHistory(''); };
  const handleCapitalizedCase = () => { const newText = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); setText(newText); addToHistory(newText); };
  const handleClearExtraSpace = () => { const newText = text.replace(/\s+/g, ' ').trim(); setText(newText); addToHistory(newText); };

  const handleBionicReading = () => {
    if (!text) return;
    const words = text.split(/(\s+)/);
    const bionicWords = words.map(word => {
      if (word.trim().length === 0) return word;
      if (word.length <= 3) return `<strong>${word}</strong>`;
      const midPoint = Math.ceil(word.length / 2);
      return `<strong>${word.slice(0, midPoint)}</strong>${word.slice(midPoint)}`;
    });
    setBionicText(bionicWords.join(''));
    setIsTextBionic(!isTextBionic);
  };

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

  const handleShare = async () => { /* ... existing share logic ... */ };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin + 15; // Start below header

    // --- Map fonts and parse font size ---
    const pdfFontSize = parseInt(fontSize.replace('px', ''), 10);
    const pdfFontFamily = {
      'sans-serif': 'helvetica',
      'serif': 'times',
      'monospace': 'courier',
    }[fontFamily] || 'helvetica';
    
    doc.setFont(pdfFontFamily);
    doc.setFontSize(pdfFontSize);

    // --- Function to add logo and header to each page ---
    const addHeader = (pageNum: number) => {
        doc.addImage(logo, 'PNG', margin, margin - 10, 10, 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('EditFlow Document', margin + 12, margin - 2);
        doc.text(`Page ${pageNum}`, pageWidth - margin, margin - 2, { align: 'right' });
    };

    addHeader(1);

    // --- Advanced text rendering logic ---
    const renderText = (textToRender: string) => {
        const parts = textToRender.split(/(<strong>.*?<\/strong>)/g).filter(Boolean);
        let currentLine = '';
        let xPos = margin;

        const processPart = (partText: string, isBold: boolean) => {
            doc.setFont(pdfFontFamily, isBold ? 'bold' : 'normal');
            const words = partText.split(/\s+/).filter(Boolean);

            for (const word of words) {
                const wordWithSpace = word + ' ';
                const wordWidth = doc.getTextWidth(wordWithSpace);
                if (xPos + wordWidth > pageWidth - margin) {
                    yPos += (pdfFontSize * 0.352778); // Move to next line
                    xPos = margin;

                    if (yPos > pageHeight - margin) {
                        doc.addPage();
                        yPos = margin + 15;
                        addHeader(doc.internal.getNumberOfPages());
                    }
                }
                doc.text(wordWithSpace, xPos, yPos);
                xPos += wordWidth;
            }
        };

        for (const part of parts) {
            const isBold = part.startsWith('<strong>');
            const cleanPart = part.replace(/<\/?strong>/g, '');
            processPart(cleanPart, isBold);
        }
    };
    
    if (isTextBionic) {
      renderText(bionicText);
    } else {
      const lines = doc.splitTextToSize(text, contentWidth);
      for (let i = 0; i < lines.length; i++) {
        if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin + 15;
            addHeader(doc.internal.getNumberOfPages());
        }
        doc.text(lines[i], margin, yPos);
        yPos += (pdfFontSize * 0.352778);
      }
    }

    doc.save('editflow-document.pdf');
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
          onChange={(e) => setFontSize(e.target.value)}
        >
          <option value="14px">Small</option>
          <option value="16px">Medium</option>
          <option value="18px">Large</option>
          <option value="20px">Extra Large</option>
        </select>

        <select 
          className={`px-3 py-2 rounded-lg ${ mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900' }`}
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option value="sans-serif">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>

      <div className={`p-6 rounded-lg shadow-lg mb-8 ${ mode === 'dark' ? 'bg-slate-800' : 'bg-white' }`}>
        {isTextBionic ? (
          <div
            className={`w-full h-64 p-4 rounded-lg mb-6 outline-none transition-colors overflow-auto text-justify ${ mode === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900' }`}
            style={{ fontSize, fontFamily }}
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