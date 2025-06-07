import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Download, Edit3, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RhymeEditor = ({ 
  structuredLyrics, 
  editedLyrics,
  onLyricsUpdate,
  songId,
  songTitle,
  darkMode,
  isEditMode,
  setIsEditMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Available rhyme groups
  const rhymeGroups = [
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
    ...Array.from({ length: 20 }, (_, i) => (i + 1).toString()) // 1-20
  ];

  // Helper function to get rhyme class
  const getManualRhymeClass = (groupIdentifier) => {
    if (!groupIdentifier) return 'rhyme-group-default';
    
    if (/^[A-Z]$/.test(groupIdentifier)) {
      return `rhyme-group-${groupIdentifier.toLowerCase()}`;
    }
    
    if (/^[0-9]$/.test(groupIdentifier)) {
      return `rhyme-group-${groupIdentifier}`;
    }
    
    return 'rhyme-group-default';
  };

  // Calculate which words belong to each rhyme group
  const rhymeGroupWords = useMemo(() => {
    const groups = {};
    const lyrics = editedLyrics || structuredLyrics;
    
    lyrics.forEach(line => {
      line.forEach(word => {
        if (word.rhymeGroup && word.clean) {
          if (!groups[word.rhymeGroup]) {
            groups[word.rhymeGroup] = new Set();
          }
          groups[word.rhymeGroup].add(word.clean.toLowerCase());
        }
      });
    });

    // Convert Sets to Arrays
    Object.keys(groups).forEach(key => {
      groups[key] = Array.from(groups[key]);
    });

    return groups;
  }, [editedLyrics, structuredLyrics]);

  // Get a preview of words in a group (for display)
  const getGroupPreview = (group) => {
    const words = rhymeGroupWords[group];
    if (!words || words.length === 0) return '';
    
    // Show up to 3 words
    const preview = words.slice(0, 3).join(', ');
    if (words.length > 3) {
      return `${preview}...`;
    }
    return preview;
  };

  // Load saved edits from localStorage
  useEffect(() => {
    if (songId) {
      const savedEdits = localStorage.getItem(`rhymeEdits_${songId}`);
      if (savedEdits) {
        const parsed = JSON.parse(savedEdits);
        onLyricsUpdate(parsed);
        setHistory([parsed]);
        setHistoryIndex(0);
      } else {
        setHistory([structuredLyrics]);
        setHistoryIndex(0);
      }
    }
  }, [songId, structuredLyrics, onLyricsUpdate]);

  // Save edits to localStorage
  const saveEdits = useCallback((newLyrics) => {
    if (songId) {
      localStorage.setItem(`rhymeEdits_${songId}`, JSON.stringify(newLyrics));
    }
    onLyricsUpdate(newLyrics);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLyrics);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [songId, onLyricsUpdate, history, historyIndex]);

  // Handle word click event from child component
  useEffect(() => {
    const handleWordClickEvent = (event) => {
      const { word, lineIndex, wordIndex, event: clickEvent } = event.detail;
      if (!isEditMode || !word.clean) return;
      
      clickEvent.stopPropagation();
      setSelectedWord({ word, lineIndex, wordIndex });
      setMenuPosition({
        x: clickEvent.clientX,
        y: clickEvent.clientY
      });
      setShowGroupMenu(true);
    };

    const element = document.querySelector('[data-rhyme-editor]');
    if (element) {
      element.addEventListener('wordClick', handleWordClickEvent);
      return () => element.removeEventListener('wordClick', handleWordClickEvent);
    }
  }, [isEditMode]);

  // Update rhyme group for a word
  const updateRhymeGroup = (newGroup) => {
    if (!selectedWord) return;

    const newLyrics = editedLyrics.map((line, lIdx) =>
      line.map((word, wIdx) => {
        if (lIdx === selectedWord.lineIndex && wIdx === selectedWord.wordIndex) {
          return {
            ...word,
            rhymeGroup: newGroup,
            manuallyEdited: true
          };
        }
        return word;
      })
    );

    saveEdits(newLyrics);
    setShowGroupMenu(false);
    setSelectedWord(null);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onLyricsUpdate(history[newIndex]);
      if (songId) {
        localStorage.setItem(`rhymeEdits_${songId}`, JSON.stringify(history[newIndex]));
      }
    }
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onLyricsUpdate(history[newIndex]);
      if (songId) {
        localStorage.setItem(`rhymeEdits_${songId}`, JSON.stringify(history[newIndex]));
      }
    }
  };

  // Reset to original
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all manual edits?')) {
      saveEdits(structuredLyrics);
      if (songId) {
        localStorage.removeItem(`rhymeEdits_${songId}`);
      }
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    const element = document.getElementById('rhyme-visualization');
    if (!element) return;

    try {
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true);
      
      // Create a temporary container with forced desktop styling
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px';
      tempContainer.style.minWidth = '794px';
      tempContainer.style.maxWidth = '794px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.color = '#374151';
      tempContainer.style.padding = '20px';
      tempContainer.style.overflow = 'visible';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif';
      tempContainer.style.fontSize = '16px'; // Force desktop font size
      tempContainer.style.lineHeight = '1.625'; // Force desktop line height
      
      // Force desktop styling on the cloned element
      clonedElement.style.width = '100%';
      clonedElement.style.maxWidth = 'none';
      clonedElement.style.minWidth = 'auto';
      clonedElement.style.backgroundColor = '#ffffff';
      clonedElement.style.color = '#374151';
      clonedElement.style.whiteSpace = 'pre-wrap';
      clonedElement.style.wordBreak = 'break-word';
      clonedElement.style.overflow = 'visible';
      clonedElement.style.fontSize = '16px'; // Force desktop font size
      clonedElement.style.lineHeight = '1.625'; // Force desktop line height
      clonedElement.className = clonedElement.className.replace(/dark/g, '');
      
      // Apply desktop styling to all child elements
      const allElements = clonedElement.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove any inline dark styles
        if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent') {
          el.style.backgroundColor = '';
        }
        if (el.style.color) {
          el.style.color = '#374151';
        }
        
        // Force desktop font sizes and spacing
        if (el.tagName === 'PRE') {
          el.style.whiteSpace = 'pre-wrap';
          el.style.wordBreak = 'break-word';
          el.style.fontSize = '16px';
          el.style.lineHeight = '1.625';
        }
        
        // Force desktop spacing for divs (line containers)
        if (el.tagName === 'DIV') {
          el.style.minHeight = '1.5em';
          el.style.fontSize = '16px';
          el.style.lineHeight = '1.625';
        }
        
        // Force desktop styling for spans (words)
        if (el.tagName === 'SPAN') {
          el.style.fontSize = '16px';
          el.style.fontWeight = el.classList.contains('rhyme-word-highlight') ? '600' : 'normal';
          el.style.borderRadius = '0.25rem';
          el.style.padding = '1px 4px';
          el.style.margin = '0 1px';
        }
      });
      
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Force a reflow to ensure proper rendering
      void tempContainer.offsetHeight;

      // Use higher DPI and force desktop-like capture
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher scale for better quality
        logging: false,
        useCORS: true,
        windowWidth: 1200, // Force larger window width
        windowHeight: 800, // Force larger window height
        width: 794,
        height: tempContainer.scrollHeight,
        dpi: 300, // High DPI for crisp text
        allowTaint: false,
        removeContainer: false
      });
      
      // Remove temp container
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png', 1.0); // Max quality
      
      // Calculate dimensions for single page
      const pdfWidth = 210; // A4 width in mm
      const imgWidth = pdfWidth - 20; // Leave 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF with custom page height to fit all content
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, Math.max(297, imgHeight + 30)] // Ensure minimum A4 height
      });
      
      // Add title with proper sizing
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${songTitle}`, 10, 15);
      
      // Add the entire image in one go
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight, undefined, 'FAST');
      
      // Save PDF
      pdf.save(`${songTitle}_rhyme_scheme.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowGroupMenu(false);
      setSelectedWord(null);
    };

    if (showGroupMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showGroupMenu]);

  return (
    <div 
      className={`mb-6 rounded-lg border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}
      data-rhyme-editor
    >
      {/* Header */}
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Manual Rhyme Editor
          </h4>
        </div>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Disclaimer */}
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            darkMode ? 'bg-gray-700' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
              darkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="font-medium mb-1">Rhyme detection is not always 100% accurate</p>
              <p>Use this tool to manually adjust rhyme groups. Click any word in edit mode to change its rhyme group or remove it from rhyming.</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditMode
                  ? darkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </button>

            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`px-3 py-2 rounded-lg transition-colors ${
                historyIndex <= 0
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Undo
            </button>

            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`px-3 py-2 rounded-lg transition-colors ${
                historyIndex >= history.length - 1
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Redo
            </button>

            <button
              onClick={handleReset}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Original
            </button>

            <button
              onClick={handleExportPDF}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      )}

      {/* Rhyme Group Selection Menu */}
      {showGroupMenu && selectedWord && (
        <div
          className={`fixed z-50 rounded-lg shadow-lg border rhyme-group-menu ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            maxHeight: '400px',
            width: '320px',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              "{selectedWord.word.clean}"
            </div>
            {selectedWord.word.rhymeGroup && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Current group: {selectedWord.word.rhymeGroup}
              </div>
            )}
          </div>
          
          <div className="p-2">
            <button
              onClick={() => updateRhymeGroup(null)}
              className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                darkMode ? 'hover:bg-gray-700' : ''
              }`}
            >
              Remove from rhyme group
            </button>
            
            <div className={`my-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {rhymeGroups.map(group => {
                const preview = getGroupPreview(group);
                const isActive = rhymeGroupWords[group] && rhymeGroupWords[group].length > 0;
                const isCurrentGroup = selectedWord.word.rhymeGroup === group;
                
                return (
                  <button
                    key={group}
                    onClick={() => updateRhymeGroup(group)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between group ${
                      isCurrentGroup
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : darkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className={`inline-block w-6 h-6 rounded text-center leading-6 font-medium ${getManualRhymeClass(group)}`}
                        style={{
                          fontSize: '12px',
                          lineHeight: '24px'
                        }}
                      >
                        {group}
                      </span>
                      <span className={isCurrentGroup ? 'text-white' : ''}>
                        Group {group}
                      </span>
                    </div>
                    {isActive && (
                      <span className={`text-xs truncate max-w-[180px] ${
                        isCurrentGroup 
                          ? 'text-white opacity-80' 
                          : darkMode 
                            ? 'text-gray-400' 
                            : 'text-gray-500'
                      }`}>
                        {preview}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RhymeEditor;