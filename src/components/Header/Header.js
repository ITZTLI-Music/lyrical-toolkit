import React from 'react';
import { Search, Upload, BarChart3, Book, Shuffle, Music, Moon, Sun } from 'lucide-react';

const Header = ({ 
  activeTab, 
  setActiveTab, 
  showManual, 
  setShowManual, 
  darkMode, 
  setDarkMode 
}) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Top row: Use table-like display for perfect centering */}
        <div style={{ display: 'table', width: '100%', marginBottom: '1rem' }}>
          <div style={{ display: 'table-cell', width: '33.33%', verticalAlign: 'middle' }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors dark-mode-toggle ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              style={darkMode ? { color: 'white' } : {}}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          <div style={{ display: 'table-cell', width: '33.33%', verticalAlign: 'middle', textAlign: 'center' }}>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
              Lyrical-Toolkit
            </h1>
          </div>
          
          <div style={{ display: 'table-cell', width: '33.33%', verticalAlign: 'middle', textAlign: 'right' }}>
            <button
              onClick={() => {
                setShowManual(!showManual);
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                showManual
                  ? darkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Book className="w-4 h-4 inline mr-2" />
              {showManual ? 'Hide Manual' : 'Show Manual'}
            </button>
          </div>
        </div>
        
        {/* Bottom row: Equal sized buttons for perfect centering */}
        <div style={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ 
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {['dictionary', 'synonyms', 'rhymes','upload','search', 'analysis', 'stats'].map((tab) => {
              const icons = {
                search: Search,
                dictionary: Book,
                synonyms: Shuffle,
                rhymes: Music,
                analysis: BarChart3,
                upload: Upload,
                stats: BarChart3
              };
              const Icon = icons[tab];
              
              // Capitalize first letter for display
              const displayName = tab.charAt(0).toUpperCase() + tab.slice(1);
              
              // Special styling for upload tab
              const isUploadTab = tab === 'upload';

              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setShowManual(false); // Close manual when switching tabs
                  }}
                  style={{
                    // Same size for all buttons
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    border: isUploadTab ? '2px solid' : '1px solid',
                    borderColor: isUploadTab 
                      ? (darkMode ? '#3b82f6' : '#60a5fa')
                      : (darkMode ? '#4b5563' : '#d1d5db'),
                    backgroundColor: activeTab === tab && !showManual
                      ? (darkMode ? '#000000' : '#1f2937')
                      : isUploadTab
                        ? (darkMode ? '#1e3a8a' : '#dbeafe')
                        : (darkMode ? '#374151' : '#f3f4f6'),
                    color: activeTab === tab && !showManual
                      ? '#ffffff'
                      : isUploadTab
                        ? (darkMode ? '#93c5fd' : '#1e40af')
                        : (darkMode ? '#d1d5db' : '#374151'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '120px' // Ensure consistent width
                  }}
                >
                  <Icon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  {displayName}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;