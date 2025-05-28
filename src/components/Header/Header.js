import React from 'react';
import { Search, Upload, BarChart3, Book, Shuffle, Music, Moon, Sun } from 'lucide-react';

const Header = ({ 
  activeTab, 
  setActiveTab, 
  showManual, 
  setShowManual, 
  loadManual, 
  manualContent, 
  darkMode, 
  setDarkMode 
}) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2 mobile-header">
          <div className="flex items-center gap-4 mobile-title">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <h1 className="text-black p-4 text-3xl font-bold">
              Lyrical-Toolkit
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2 tab-container">
              {['dictionary', 'synonyms', 'rhymes','search', 'analysis', 'upload', 'stats'].map((tab) => {
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

                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setShowManual(false); // Close manual when switching tabs
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors tab-button ${
                      activeTab === tab && !showManual
                        ? darkMode 
                          ? 'bg-black text-white'  // Keep black for dark mode selected
                          : 'bg-gray-900 text-white'  // Keep dark for light mode selected
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-2" />
                    {displayName}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => {
                setShowManual(!showManual);
                if (!showManual && !manualContent) {
                  loadManual();
                }
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
      </div>
    </div>
  );
};

export default Header;