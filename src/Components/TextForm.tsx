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
  Palette,
  Languages
} from 'lucide-react';
import { jsPDF } from 'jspdf';

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

  // Load saved text from localStorage on component mount
  useEffect(() => {
    const savedText = localStorage.getItem('editflow-text');
    if (savedText) {
      setText(savedText);
      addToHistory(savedText);
    }
  }, []);

  // Save text to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('editflow-text', text);
  }, [text]);

  // Update the search highlighting effect
  useEffect(() => {
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'gi');
      const highlightedText = text.replace(regex, match => `<mark class="bg-yellow-200 dark:bg-yellow-600">${match}</mark>`);
      setBionicText(highlightedText);
      setIsTextBionic(true);
    } else if (isTextBionic) {
      handleBionicReading(); // Reapply bionic reading if it was active
    } else {
      setBionicText('');
      setIsTextBionic(false);
    }
  }, [searchTerm]);

  const addToHistory = (newText: string) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), {
      text: newText,
      timestamp: Date.now()
    }]);
    setHistoryIndex(prev => prev + 1);
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
  };

  const handleUpperCase = () => {
    const newText = text.toUpperCase();
    setText(newText);
    addToHistory(newText);
  };

  const handleLowerCase = () => {
    const newText = text.toLowerCase();
    setText(newText);
    addToHistory(newText);
  };

  const handleClearText = () => {
    setText('');
    setBionicText('');
    setIsTextBionic(false);
    addToHistory('');
  };
  
  const handleCapitalizedCase = () => {
    const newText = text.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    setText(newText);
    addToHistory(newText);
  };

  const handleClearExtraSpace = () => {
    const newText = text.replace(/\s+/g, ' ').trim();
    setText(newText);
    addToHistory(newText);
  };

  const handleBionicReading = () => {
    const words = text.split(' ');
    const bionicWords = words.map(word => {
      if (word.length <= 3) return word;
      const midPoint = Math.ceil(word.length / 2);
      return `<strong>${word.slice(0, midPoint)}</strong>${word.slice(midPoint)}`;
    });
    setBionicText(bionicWords.join(' '));
    setIsTextBionic(true);
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

  const handleShare = async () => {
    if (!navigator.share) {
      try {
        await navigator.clipboard.writeText(isTextBionic ? bionicText.replace(/<[^>]+>/g, '') : text);
        alert('Text copied to clipboard!');
      } catch (error) {
        alert('Failed to copy text to clipboard');
      }
      return;
    }

    try {
      await navigator.share({
        title: 'EditFlow Text',
        text: isTextBionic ? bionicText.replace(/<[^>]+>/g, '') : text
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        alert('Failed to share text');
      }
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Set up PDF styling
    doc.setFont('helvetica');
    doc.setFontSize(12);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (2 * margin);
    
    // Function to split text into lines with proper justification
    const splitTextToLines = (text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = [];
      
      for (const word of words) {
        currentLine.push(word);
        const lineWidth = doc.getTextWidth(currentLine.join(' '));
        
        if (lineWidth > maxWidth) {
          currentLine.pop();
          lines.push(currentLine.join(' '));
          currentLine = [word];
        }
      }
      
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      
      return lines;
    };
    
    let yPosition = margin;
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const title = 'EditFlow Document';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
    
    yPosition += 15;
    
    // Reset font for content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Get the current text content (either bionic or regular)
    const currentText = isTextBionic 
      ? bionicText.replace(/<[^>]+>/g, '') // Remove HTML tags for bionic text
      : text;
    
    // Split content into paragraphs
    const paragraphs = currentText.split('\n\n');
    
    for (const paragraph of paragraphs) {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      const lines = splitTextToLines(paragraph.trim(), maxWidth);
      
      for (const line of lines) {
        if (yPosition > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Calculate word spacing for justified text (except last line)
        const words = line.split(' ');
        if (words.length > 1 && line !== lines[lines.length - 1]) {
          const spaceWidth = (maxWidth - doc.getTextWidth(line.replace(/\s/g, ''))) / (words.length - 1);
          let xPosition = margin;
          
          words.forEach((word, index) => {
            doc.text(word, xPosition, yPosition);
            if (index < words.length - 1) {
              xPosition += doc.getTextWidth(word) + spaceWidth;
            }
          });
        } else {
          // Left align the last line of each paragraph
          doc.text(line, margin, yPosition);
        }
        
        yPosition += 7;
      }
      
      // Add space between paragraphs
      yPosition += 5;
    }
    
    doc.save('editflow-document.pdf');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className={`text-3xl font-bold mb-8 ${
        mode === 'dark' ? 'text-white' : 'text-slate-900'
      }`}>
        Text Editor
      </h2>

      <div className="mb-6 flex gap-4">
        <select 
          className={`px-3 py-2 rounded-lg ${
            mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
          }`}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
        >
          <option value="14px">Small</option>
          <option value="16px">Medium</option>
          <option value="18px">Large</option>
          <option value="20px">Extra Large</option>
        </select>

        <select 
          className={`px-3 py-2 rounded-lg ${
            mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
          }`}
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option value="sans-serif">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>

      <div className={`p-6 rounded-lg shadow-lg mb-8 ${
        mode === 'dark' ? 'bg-slate-800' : 'bg-white'
      }`}>
        {isTextBionic ? (
          <div
            className={`w-full h-64 p-4 rounded-lg mb-6 outline-none transition-colors overflow-auto text-justify ${
              mode === 'dark'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-900'
            }`}
            style={{ fontSize, fontFamily }}
            dangerouslySetInnerHTML={{ __html: bionicText }}
          />
        ) : (
          <textarea
            className={`w-full h-64 p-4 rounded-lg mb-6 outline-none transition-colors text-justify ${
              mode === 'dark'
                ? 'bg-slate-900 text-white placeholder:text-slate-400'
                : 'bg-slate-50 text-slate-900 placeholder:text-slate-500'
            }`}
            style={{ fontSize, fontFamily }}
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text here..."
          />
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleUpperCase}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowUpWideNarrow className="w-4 h-4" />
            Uppercase
          </button>
          <button
            onClick={handleLowerCase}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowDownWideNarrow className="w-4 h-4" />
            Lowercase
          </button>
          <button
            onClick={handleCapitalizedCase}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Type className="w-4 h-4" />
            Capitalize
          </button>
          <button
            onClick={handleClearExtraSpace}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Clear Extra Space
          </button>
          <button
            onClick={handleBionicReading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Type className="w-4 h-4" />
            Bionify
          </button>
          <button
            onClick={handleTextToSpeech}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              speaking 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <Volume2 className="w-4 h-4" />
            {speaking ? 'Stop' : 'Speak'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <History className="w-4 h-4" />
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <History className="w-4 h-4 transform scale-x-[-1]" />
            Redo
          </button>
          <button
            onClick={handleClearText}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className={`p-6 rounded-lg ${
        mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
      }`}>
        <h3 className="text-xl font-semibold mb-6">Text Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${
            mode === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
          }`}>
            <p>Words: {text.split(/\s+/).filter(word => word.length > 0).length}</p>
            <p>Characters: {text.length}</p>
          </div>
          <div className={`p-4 rounded-lg ${
            mode === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
          }`}>
            <p>Reading time: {(0.008 * text.split(' ').length).toFixed(2)} minutes</p>
            <p>Sentences: {text.split(/[.!?]+/).length - 1}</p>
          </div>
          <div className={`p-4 rounded-lg ${
            mode === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
          }`}>
            <p>Paragraphs: {text.split(/\n\s*\n/).length}</p>
            <p>Characters (no spaces): {text.replace(/\s/g, '').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}