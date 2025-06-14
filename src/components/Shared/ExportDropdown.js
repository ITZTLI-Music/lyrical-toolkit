import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown, FileText, FileImage } from 'lucide-react';

const ExportDropdown = ({ song, onExportTxt, onExportPdf, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = (type) => {
    if (type === 'txt') {
      onExportTxt(song);
    } else if (type === 'pdf') {
      onExportPdf(song);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors ${
          darkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className={`absolute top-full right-0 mt-1 w-32 rounded-lg shadow-lg border z-10 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => handleExport('txt')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-t-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Text (.txt)
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-b-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <FileImage className="w-4 h-4" />
            PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;