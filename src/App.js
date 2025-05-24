import React, { useState, useEffect, useMemo } from 'react';
import { Search, Upload, FileText, Clock, BarChart3, Download, X, Plus, Moon, Sun, Book, Shuffle, Music } from 'lucide-react';

const LyricsSearchApp = () => {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightWord, setHighlightWord] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [selectedSong, setSelectedSong] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // New state for additional tabs
  const [definitionQuery, setDefinitionQuery] = useState('');
  const [definitionResults, setDefinitionResults] = useState(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [synonymQuery, setSynonymQuery] = useState('');
  const [synonymResults, setSynonymResults] = useState(null);
  const [synonymLoading, setSynonymLoading] = useState(false);
  const [rhymeQuery, setRhymeQuery] = useState('');
  const [rhymeResults, setRhymeResults] = useState(null);
  const [rhymeLoading, setRhymeLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedSongs = localStorage.getItem('lyricsSearchSongs');
    const savedHistory = localStorage.getItem('lyricsSearchHistory');
    const savedDarkMode = localStorage.getItem('lyricsSearchDarkMode');
    const savedHighlight = localStorage.getItem('lyricsSearchHighlight');
    
    if (savedSongs) {
      setSongs(JSON.parse(savedSongs));
    }
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
    if (savedHighlight) {
      setHighlightWord(savedHighlight);
    }

    // Detect system dark mode preference
    if (!savedDarkMode && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('lyricsSearchSongs', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('lyricsSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('lyricsSearchDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('lyricsSearchHighlight', highlightWord);
  }, [highlightWord]);

  // File upload handler
  const handleFileUpload = async (files) => {
    const newSongs = [];
    
    for (let file of files) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          const content = await file.text();
          const songTitle = file.name.replace('.txt', '').replace(/[-_]/g, ' ');
          
          const song = {
            id: Date.now() + Math.random(),
            title: songTitle,
            lyrics: content,
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            dateAdded: new Date().toISOString(),
            filename: file.name
          };
          
          newSongs.push(song);
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
        }
      }
    }
    
    setSongs(prev => [...prev, ...newSongs]);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  // Search functionality
  const searchResults = useMemo(() => {
    const query = searchQuery || highlightWord;
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase();
    const results = [];

    songs.forEach(song => {
      const lines = song.lyrics.split('\n');
      lines.forEach((line, lineIndex) => {
        if (line.toLowerCase().includes(queryLower)) {
          const contextStart = Math.max(0, lineIndex - 1);
          const contextEnd = Math.min(lines.length - 1, lineIndex + 1);
          const context = lines.slice(contextStart, contextEnd + 1);
          
          results.push({
            songId: song.id,
            songTitle: song.title,
            matchingLine: line,
            lineNumber: lineIndex + 1,
            context: context,
            contextStart: contextStart
          });
        }
      });
    });

    return results;
  }, [searchQuery, highlightWord, songs]);

  // Add to search history
  const addToSearchHistory = (query) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      addToSearchHistory(query);
      setHighlightWord(query);
    }
  };

  // Dictionary API functions
  const searchDefinition = async (word) => {
    if (!word.trim()) return;
    
    setDefinitionLoading(true);
    setHighlightWord(word);
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        setDefinitionResults(data);
      } else {
        setDefinitionResults([]);
      }
    } catch (error) {
      console.error('Definition API error:', error);
      setDefinitionResults([]);
    }
    setDefinitionLoading(false);
  };

  // DataMuse API for synonyms
  const searchSynonyms = async (word) => {
    if (!word.trim()) return;
    
    setSynonymLoading(true);
    setHighlightWord(word);
    try {
      const [synonymsResponse, antonymsResponse] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${word.toLowerCase()}&max=20`),
        fetch(`https://api.datamuse.com/words?rel_ant=${word.toLowerCase()}&max=20`)
      ]);
      
      const synonyms = synonymsResponse.ok ? await synonymsResponse.json() : [];
      const antonyms = antonymsResponse.ok ? await antonymsResponse.json() : [];
      
      setSynonymResults({ synonyms, antonyms });
    } catch (error) {
      console.error('Synonyms API error:', error);
      setSynonymResults({ synonyms: [], antonyms: [] });
    }
    setSynonymLoading(false);
  };

  // DataMuse API for rhymes
  const searchRhymes = async (word) => {
    if (!word.trim()) return;
    
    setRhymeLoading(true);
    setHighlightWord(word);
    try {
      const [perfectResponse, nearResponse, soundsLikeResponse] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_rhy=${word.toLowerCase()}&max=30`),
        fetch(`https://api.datamuse.com/words?rel_nry=${word.toLowerCase()}&max=20`),
        fetch(`https://api.datamuse.com/words?sl=${word.toLowerCase()}&max=20`)
      ]);
      
      const perfect = perfectResponse.ok ? await perfectResponse.json() : [];
      const near = nearResponse.ok ? await nearResponse.json() : [];
      const soundsLike = soundsLikeResponse.ok ? await soundsLikeResponse.json() : [];
      
      setRhymeResults({ perfect, near, soundsLike });
    } catch (error) {
      console.error('Rhymes API error:', error);
      setRhymeResults({ perfect: [], near: [], soundsLike: [] });
    }
    setRhymeLoading(false);
  };

  // Statistics
  const stats = useMemo(() => {
    const totalWords = songs.reduce((sum, song) => sum + song.wordCount, 0);
    const allWords = songs.flatMap(song => 
      song.lyrics.toLowerCase().split(/\s+/).filter(word => word.match(/[a-zA-Z]/))
    );
    
    const wordFreq = {};
    allWords.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    const mostUsedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      totalSongs: songs.length,
      totalWords,
      uniqueWords: Object.keys(wordFreq).length,
      mostUsedWords
    };
  }, [songs]);

  // Highlight search terms in text
  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };

  // Quick search from other tabs
  const searchInLyrics = (word) => {
    setSearchQuery(word);
    setHighlightWord(word);
    setActiveTab('search');
    addToSearchHistory(word);
  };

  const themeClasses = darkMode 
    ? 'dark bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
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
              <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Lyrics Search
              </h1>
            </div>
            
            <div className="flex gap-2">
              {['search', 'definitions', 'synonyms', 'rhymes', 'upload', 'stats'].map((tab) => {
                const icons = {
                  search: Search,
                  definitions: Book,
                  synonyms: Shuffle,
                  rhymes: Music,
                  upload: Upload,
                  stats: BarChart3
                };
                const Icon = icons[tab];
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      activeTab === tab 
                        ? darkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-900 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-2" />
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar - Always visible for lyrics search */}
          {activeTab === 'search' && (
            <>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search your lyrics..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recent:</span>
                  {searchHistory.slice(0, 5).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(term)}
                      className={`text-sm px-3 py-1 rounded-full transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            {(searchQuery || highlightWord) ? (
              <div>
                <div className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Found {searchResults.length} matches for "{searchQuery || highlightWord}"
                  {highlightWord && !searchQuery && (
                    <span className={`ml-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      (highlighted from other tabs)
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className={`rounded-lg border p-4 transition-colors ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {result.songTitle}
                        </h3>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Line {result.lineNumber}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {result.context.map((contextLine, contextIndex) => (
                          <div 
                            key={contextIndex}
                            className={`${
                              contextLine === result.matchingLine 
                                ? darkMode ? 'font-medium text-white' : 'font-medium text-gray-900'
                                : darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {contextLine === result.matchingLine ? (
                              highlightText(contextLine, searchQuery || highlightWord)
                            ) : (
                              contextLine
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setSelectedSong(songs.find(s => s.id === result.songId))}
                        className={`mt-3 text-xs underline transition-colors ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        View full song
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Start searching your lyrics
                </h3>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter any word or phrase to find where you've used it before
                </p>
                
                {songs.length > 0 && (
                  <div className={`rounded-lg border p-4 max-w-md mx-auto transition-colors ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div>{stats.totalSongs} songs loaded</div>
                      <div>{stats.totalWords.toLocaleString()} total words</div>
                      <div>{stats.uniqueWords.toLocaleString()} unique words</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Definitions Tab */}
      {activeTab === 'definitions' && (
        <div>
          <div className="mb-6">
            <div className="relative">
              <Book className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />
              <input
                type="text"
                placeholder="Enter a word to get its definition..."
                value={definitionQuery}
                onChange={(e) => setDefinitionQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchDefinition(definitionQuery)}
                className={`w-full pl-10 pr-24 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={() => searchDefinition(definitionQuery)}
                disabled={definitionLoading}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded transition-colors ${
                  darkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white disabled:bg-gray-700' 
                    : 'bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400'
                }`}
              >
                {definitionLoading ? '...' : 'Define'}
              </button>
            </div>
          </div>

          {definitionLoading && (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Looking up definition...
            </div>
          )}

          {definitionResults && (
            <div className="space-y-4">
              {definitionResults.length > 0 ? (
                definitionResults.map((entry, entryIndex) => (
                  <div key={entryIndex} className={`rounded-lg border p-6 transition-colors ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {entry.word}
                      </h2>
                      <button
                        onClick={() => searchInLyrics(entry.word)}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        Search in lyrics
                      </button>
                    </div>
                    
                    {entry.phonetics && entry.phonetics[0] && (
                      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {entry.phonetics[0].text}
                      </p>
                    )}

                    {entry.meanings.map((meaning, meaningIndex) => (
                      <div key={meaningIndex} className="mb-4">
                        <h3 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {meaning.partOfSpeech}
                        </h3>
                        <div className="space-y-2">
                          {meaning.definitions.slice(0, 3).map((def, defIndex) => (
                            <div key={defIndex}>
                              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {defIndex + 1}. {def.definition}
                              </p>
                              {def.example && (
                                <p className={`text-sm italic mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Example: "{def.example}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No definition found for "{definitionQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
        {/* Synonyms Tab */}
        {activeTab === 'synonyms' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Shuffle className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Find synonyms and antonyms..."
                  value={synonymQuery}
                  onChange={(e) => setSynonymQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchSynonyms(synonymQuery)}
                  className={`w-full pl-10 pr-24 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  onClick={() => searchSynonyms(synonymQuery)}
                  disabled={synonymLoading}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded transition-colors ${
                    darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-white disabled:bg-gray-700' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400'
                  }`}
                >
                  {synonymLoading ? '...' : 'Search'}
                </button>
              </div>
            </div>

            {synonymLoading && (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Finding synonyms and antonyms...
              </div>
            )}

            {synonymResults && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`rounded-lg border p-6 transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Synonyms for "{synonymQuery}"
                  </h3>
                  {synonymResults.synonyms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {synonymResults.synonyms.map((word, index) => (
                        <button
                          key={index}
                          onClick={() => searchInLyrics(word.word)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            darkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {word.word}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No synonyms found
                    </p>
                  )}
                </div>

                <div className={`rounded-lg border p-6 transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Antonyms for "{synonymQuery}"
                  </h3>
                  {synonymResults.antonyms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {synonymResults.antonyms.map((word, index) => (
                        <button
                          key={index}
                          onClick={() => searchInLyrics(word.word)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            darkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {word.word}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No antonyms found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rhymes Tab */}
        {activeTab === 'rhymes' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Music className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Find words that rhyme..."
                  value={rhymeQuery}
                  onChange={(e) => setRhymeQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRhymes(rhymeQuery)}
                  className={`w-full pl-10 pr-24 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  onClick={() => searchRhymes(rhymeQuery)}
                  disabled={rhymeLoading}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded transition-colors ${
                    darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-white disabled:bg-gray-700' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400'
                  }`}
                >
                  {rhymeLoading ? '...' : 'Find Rhymes'}
                </button>
              </div>
            </div>

            {rhymeLoading && (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Finding rhymes...
              </div>
            )}

            {rhymeResults && (
              <div className="space-y-6">
                <div className={`rounded-lg border p-6 transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Perfect Rhymes for "{rhymeQuery}"
                  </h3>
                  {rhymeResults.perfect.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rhymeResults.perfect.map((word, index) => (
                        <button
                          key={index}
                          onClick={() => searchInLyrics(word.word)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            darkMode 
                              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                          }`}
                        >
                          {word.word}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No perfect rhymes found
                    </p>
                  )}
                </div>

                <div className={`rounded-lg border p-6 transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Near Rhymes for "{rhymeQuery}"
                  </h3>
                  {rhymeResults.near.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rhymeResults.near.map((word, index) => (
                        <button
                          key={index}
                          onClick={() => searchInLyrics(word.word)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            darkMode 
                              ? 'bg-green-900 hover:bg-green-800 text-green-200' 
                              : 'bg-green-100 hover:bg-green-200 text-green-800'
                          }`}
                        >
                          {word.word}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No near rhymes found
                    </p>
                  )}
                </div>

                <div className={`rounded-lg border p-6 transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Sounds Like "{rhymeQuery}"
                  </h3>
                  {rhymeResults.soundsLike.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rhymeResults.soundsLike.map((word, index) => (
                        <button
                          key={index}
                          onClick={() => searchInLyrics(word.word)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            darkMode 
                              ? 'bg-purple-900 hover:bg-purple-800 text-purple-200' 
                              : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                          }`}
                        >
                          {word.word}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No similar sounding words found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging 
                  ? darkMode 
                    ? 'border-gray-500 bg-gray-800' 
                    : 'border-gray-400 bg-gray-50'
                  : darkMode
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Upload your lyrics
              </h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Drag and drop your .txt files here, or click to browse
              </p>
              
              <input
                type="file"
                multiple
                accept=".txt"
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Choose Files
              </label>
              
              <p className={`text-xs mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Supports up to 50 .txt files
              </p>
            </div>

            {/* Uploaded Songs List */}
            {songs.length > 0 && (
              <div className="mt-8">
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Your Songs ({songs.length})
                </h3>
                <div className="grid gap-3">
                  {songs.map((song) => (
                    <div key={song.id} className={`rounded-lg border p-4 transition-colors ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className={`w-5 h-5 mr-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <div>
                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {song.title}
                            </h4>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {song.wordCount} words • Added {new Date(song.dateAdded).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSong(song)}
                          className={`text-sm underline transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-lg border p-6 transition-colors ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalSongs}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Songs
                </div>
              </div>
              <div className={`rounded-lg border p-6 transition-colors ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalWords.toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Words
                </div>
              </div>
              <div className={`rounded-lg border p-6 transition-colors ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.uniqueWords.toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Unique Words
                </div>
              </div>
            </div>

            {stats.mostUsedWords.length > 0 && (
              <div className={`rounded-lg border p-6 transition-colors ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Most Used Words
                </h3>
                <div className="space-y-2">
                  {stats.mostUsedWords.map(([word, count], index) => (
                    <div key={word} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`text-sm w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {index + 1}.
                        </span>
                        <button
                          onClick={() => handleSearch(word)}
                          className={`underline transition-colors ${
                            darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                          }`}
                        >
                          {word}
                        </button>
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {count} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Song Modal */}
      {selectedSong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden transition-colors ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b transition-colors ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedSong.title}
              </h2>
              <button
                onClick={() => setSelectedSong(null)}
                className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <pre className={`whitespace-pre-wrap leading-relaxed ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {highlightWord ? highlightText(selectedSong.lyrics, highlightWord) : selectedSong.lyrics}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LyricsSearchApp;