import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown, FileText, FileImage } from 'lucide-react';

const ExportDropdown = ({ song, onExportTxt, onExportPdf, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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

  // Calculate dropdown position to prevent cut-off
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 80; // Approximate height of dropdown
      
      // If there's not enough space below, show above
      if (buttonRect.bottom + dropdownHeight > viewportHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
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

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`flex items-center gap-1 text-xs md:text-sm px-2 md:px-3 py-1 rounded transition-colors ${
          darkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
      >
        <Download className="w-3 h-3 md:w-4 md:h-4" />
        <span className="hidden sm:inline">Export</span>
        <span className="sm:hidden">⬇</span>
        <ChevronDown className="w-2 h-2 md:w-3 md:h-3" />
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 w-32 rounded-lg shadow-lg border z-[60] ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          } ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <button
            onClick={() => handleExport('txt')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
              dropdownPosition === 'top' ? 'rounded-b-lg' : 'rounded-t-lg'
            } ${
              darkMode 
                ? 'hover:bg-gray-700 text-white bg-gray-800' 
                : 'hover:bg-gray-100 text-gray-900 bg-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
              dropdownPosition === 'top' ? 'rounded-t-lg' : 'rounded-b-lg'
            } ${
              darkMode 
                ? 'hover:bg-gray-700 text-white bg-gray-800' 
                : 'hover:bg-gray-100 text-gray-900 bg-white'
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