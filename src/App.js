import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Book, Shuffle, Music } from 'lucide-react';
import DOMPurify from 'dompurify';

// Import utilities
import { 
  countSyllables, 
  calculateReadingLevel, 
  calculateVocabularyComplexity
} from './utils/textAnalysis';
import { analyzeRhymeStatistics } from './utils/phoneticUtils';
import { songVocabularyPhoneticMap } from './data/songVocabularyPhoneticMap';

// Import hooks
import { useSearchHistory, useDarkMode, useHighlightWord } from './hooks/useLocalStorage';
import { useFileUpload } from './hooks/useFileUpload';
import { useSearch } from './hooks/useSearch';

// Import components
import Header from './components/Header/Header';
import Manual from './components/Shared/Manual';
import SongModal from './components/Shared/SongModal';
import SearchTab from './components/Tabs/SearchTab';
import DictionaryTab from './components/Tabs/DictionaryTab';
import SynonymsTab from './components/Tabs/SynonymsTab';
import RhymesTab from './components/Tabs/RhymesTab';
import AnalysisTab from './components/Tabs/AnalysisTab';
import UploadTab from './components/Tabs/UploadTab';
import StatsTab from './components/Tabs/StatsTab';

/* eslint-disable react-hooks/exhaustive-deps */

const LyricsSearchApp = () => {
  // Basic state
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [selectedSong, setSelectedSong] = useState(null);
  
  // Use custom hooks for localStorage
  const [searchHistory, setSearchHistory] = useSearchHistory();
  const [darkMode, setDarkMode] = useDarkMode();
  const [highlightWord, setHighlightWord] = useHighlightWord();
  
  // Dictionary API states
  const [definitionQuery, setDefinitionQuery] = useState('');
  const [definitionResults, setDefinitionResults] = useState(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  
  // Synonyms API states
  const [synonymQuery, setSynonymQuery] = useState('');
  const [synonymResults, setSynonymResults] = useState(null);
  const [synonymLoading, setSynonymLoading] = useState(false);
  
  // Rhymes API states
  const [rhymeQuery, setRhymeQuery] = useState('');
  const [rhymeResults, setRhymeResults] = useState(null);
  const [rhymeLoading, setRhymeLoading] = useState(false);

  // Analysis states
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const [selectedSongForAnalysis, setSelectedSongForAnalysis] = useState(null);

  // Manual states
  const [showManual, setShowManual] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [exampleSongDeleted, setExampleSongDeleted] = useState(false);

  // Stats filter
  const [selectedStatsFilter, setSelectedStatsFilter] = useState('all');

  // File upload hook
  const fileUploadHook = useFileUpload(setSongs);
  
  // Search hook
  const { searchResults } = useSearch(songs, searchQuery, highlightWord);

  // Load example song
  const loadingExampleRef = useRef(false);
  
  useEffect(() => {
    const loadExampleSong = async () => {
      if (exampleSongDeleted || loadingExampleRef.current) return;
      
      const exampleExists = songs.some(song => song.isExample);
      if (exampleExists) return;
      
      loadingExampleRef.current = true;

      try {
        const response = await fetch('/HUMAN.txt');
        if (response.ok) {
          const content = await response.text();
          const exampleSong = {
            id: 'example-song-' + Date.now(),
            title: 'HUMAN',
            lyrics: DOMPurify.sanitize(content),
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            dateAdded: new Date().toISOString(),
            filename: 'HUMAN.txt',
            isExample: true
          };
          
          setSongs(prev => [exampleSong, ...prev]);
          
          // Clear any previous search states for fresh start
          setSearchQuery('');
          setHighlightWord('');
          setDefinitionQuery('');
          setDefinitionResults(null);
          setSynonymQuery('');
          setSynonymResults(null);
          setRhymeQuery('');
          setRhymeResults(null);
        }
      } catch (error) {
        console.error('Failed to load example song:', error);
      } finally {
        loadingExampleRef.current = false;
      }
    };

    if (songs.length === 0) {
      setTimeout(loadExampleSong, 100);
    }
  }, [songs.length, exampleSongDeleted]);

  // Reset stats filter when songs change
  useEffect(() => {
    if (songs.length === 0) {
      setSelectedStatsFilter('all');
    } else if (selectedStatsFilter !== 'all') {
      const selectedSongExists = songs.some(song => song.id.toString() === selectedStatsFilter);
      if (!selectedSongExists) {
        setSelectedStatsFilter('all');
      }
    }
  }, [songs, selectedStatsFilter]);
  
  // Enhanced statistics with song filtering
  const stats = useMemo(() => {
    const filteredSongs = selectedStatsFilter === 'all' 
      ? songs 
      : songs.filter(song => song.id.toString() === selectedStatsFilter);
    
    if (filteredSongs.length === 0) {
      return {
        totalSongs: 0,
        totalWords: 0,
        uniqueWords: 0,
        mostUsedWords: [],
        syllableDistribution: {},
        wordLengthDistribution: {},
        averageWordsPerSong: 0,
        averageLinesPerSong: 0,
        averageWordLength: 0,
        averageSyllablesPerWord: 0,
        totalLines: 0,
        readingLevel: 0,
        vocabularyComplexity: 0,
        rhymeStats: {
          totalRhymableWords: 0,
          perfectRhymes: 0,
          nearRhymes: 0,
          soundsLike: 0,
          internalRhymes: 0,
          rhymeDensity: 0,
          allRhymeGroups: []
        }
      };
    }

    // Calculate basic metrics first
    const totalWords = filteredSongs.reduce((sum, song) => sum + song.wordCount, 0);
    const allWords = filteredSongs.flatMap(song => 
      song.lyrics.toLowerCase().split(/\s+/).filter(word => word.match(/[a-zA-Z]/))
    );
    
    const wordFreq = {};
    const syllableCount = {};
    const wordLengthCount = {};
    let totalSyllables = 0;
    let totalCharacters = 0;
    let validWordCount = 0;

    allWords.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 0) {
        validWordCount++;
        totalCharacters += cleanWord.length;
        
        if (cleanWord.length > 2) {
          wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
        
        const syllables = countSyllables(cleanWord);
        totalSyllables += syllables;
        const syllableKey = syllables > 4 ? '5+' : syllables.toString();
        syllableCount[syllableKey] = (syllableCount[syllableKey] || 0) + 1;
        
        const lengthKey = cleanWord.length > 10 ? '11+' : cleanWord.length.toString();
        wordLengthCount[lengthKey] = (wordLengthCount[lengthKey] || 0) + 1;
      }
    });

    const mostUsedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const allLines = filteredSongs.flatMap(song => 
      song.lyrics.split('\n').filter(line => line.trim().length > 0)
    );
    const totalLines = allLines.length;

    const avgReadingLevel = filteredSongs.length > 0 ? 
      filteredSongs.reduce((sum, song) => sum + calculateReadingLevel(song.lyrics), 0) / filteredSongs.length : 0;
    
    const avgVocabularyComplexity = filteredSongs.length > 0 ? 
      filteredSongs.reduce((sum, song) => sum + calculateVocabularyComplexity(song.lyrics, wordFreq), 0) / filteredSongs.length : 0;
    
    // Calculate rhyme statistics
    const combinedRhymeStats = filteredSongs.length > 0 ? 
      filteredSongs.reduce((acc, song) => {
        const songRhymes = analyzeRhymeStatistics(song.lyrics, songVocabularyPhoneticMap);
        return {
          totalRhymableWords: acc.totalRhymableWords + songRhymes.totalRhymableWords,
          perfectRhymes: acc.perfectRhymes + songRhymes.perfectRhymes,
          nearRhymes: acc.nearRhymes + songRhymes.nearRhymes,
          soundsLike: acc.soundsLike + songRhymes.soundsLike,
          internalRhymes: acc.internalRhymes + songRhymes.internalRhymes,
          rhymeDensity: acc.rhymeDensity + songRhymes.rhymeDensity,
          allRhymeGroups: [...acc.allRhymeGroups, ...songRhymes.rhymeGroups]
        };
      }, {
        totalRhymableWords: 0,
        perfectRhymes: 0,
        nearRhymes: 0,
        soundsLike: 0,
        internalRhymes: 0,
        rhymeDensity: 0,
        allRhymeGroups: []
      }) : {
        totalRhymableWords: 0,
        perfectRhymes: 0,
        nearRhymes: 0,
        soundsLike: 0,
        internalRhymes: 0,
        rhymeDensity: 0,
        allRhymeGroups: []
      };

    if (filteredSongs.length > 1) {
      combinedRhymeStats.rhymeDensity = combinedRhymeStats.rhymeDensity / filteredSongs.length;
    }

    return {
      totalSongs: filteredSongs.length,
      totalWords,
      uniqueWords: Object.keys(wordFreq).length,
      mostUsedWords,
      syllableDistribution: syllableCount,
      wordLengthDistribution: wordLengthCount,
      averageWordsPerSong: filteredSongs.length > 0 ? Math.round(totalWords / filteredSongs.length) : 0,
      averageLinesPerSong: filteredSongs.length > 0 ? Math.round(totalLines / filteredSongs.length) : 0,
      averageWordLength: validWordCount > 0 ? (totalCharacters / validWordCount).toFixed(1) : 0,
      averageSyllablesPerWord: validWordCount > 0 ? (totalSyllables / validWordCount).toFixed(1) : 0,
      totalLines,
      readingLevel: avgReadingLevel,
      vocabularyComplexity: avgVocabularyComplexity,
      rhymeStats: combinedRhymeStats
    };
  }, [songs, selectedStatsFilter]);

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

  // Delete individual song
  const deleteSong = (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      setSongs(prev => {
        const songToDelete = prev.find(song => song.id === songId);
        if (songToDelete && songToDelete.isExample) {
          setExampleSongDeleted(true);
        }
        return prev.filter(song => song.id !== songId);
      });
    }
  };

  // Delete all songs
  const deleteAllSongs = () => {
    if (window.confirm('Are you sure you want to delete ALL songs? This cannot be undone.')) {
      setSongs([]);
      setSearchQuery('');
      setHighlightWord('');
      setSearchHistory([]);
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

  // Enhanced DataMuse API for synonyms with multiple antonym sources
  const searchSynonyms = async (word) => {
    if (!word.trim()) return;
    
    setSynonymLoading(true);
    setHighlightWord(word);
    try {
      const [synonymsResponse, antonymsResponse, relatedResponse] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${word.toLowerCase()}&max=20`),
        fetch(`https://api.datamuse.com/words?rel_ant=${word.toLowerCase()}&max=20`),
        fetch(`https://api.datamuse.com/words?ml=${word.toLowerCase()}&max=30`)
      ]);
      
      const synonyms = synonymsResponse.ok ? await synonymsResponse.json() : [];
      let antonyms = antonymsResponse.ok ? await antonymsResponse.json() : [];
      const related = relatedResponse.ok ? await relatedResponse.json() : [];
      
      if (antonyms.length < 5) {
        const antonymPatterns = ['un', 'non', 'dis', 'in', 'im', 'ir', 'anti'];
        const moreAntonyms = related.filter(relatedWord => {
          const wordLower = relatedWord.word.toLowerCase();
          const searchLower = word.toLowerCase();
          
          return antonymPatterns.some(prefix => 
            wordLower.startsWith(prefix + searchLower) || 
            searchLower.startsWith(prefix + wordLower)
          );
        });
        
        const allAntonyms = [...antonyms, ...moreAntonyms];
        antonyms = allAntonyms.filter((item, index, self) => 
          index === self.findIndex(t => t.word === item.word)
        ).slice(0, 15);
      }
      
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

  // Enhanced search function with custom routing and auto-search
  const searchInLyrics = (word, targetTab = 'search') => {
    setSearchQuery(word);
    setHighlightWord(word);
    setActiveTab(targetTab);
    addToSearchHistory(word);
    
    if (targetTab === 'dictionary') {
      setDefinitionQuery(word);
      setTimeout(() => searchDefinition(word), 100);
    } else if (targetTab === 'synonyms') {
      setSynonymQuery(word);
      setTimeout(() => searchSynonyms(word), 100);
    } else if (targetTab === 'rhymes') {
      setRhymeQuery(word);
      setTimeout(() => searchRhymes(word), 100);
    }
  };

  const themeClasses = darkMode 
    ? 'dark bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Header */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showManual={showManual}
        setShowManual={setShowManual}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Universal Search Bar */}
      {!['upload', 'stats', 'analysis'].includes(activeTab) && !showManual && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="relative mobile-search">
            {activeTab === 'search' && <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'dictionary' && <Book className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'synonyms' && <Shuffle className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'rhymes' && <Music className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            
            <input
              type="text"
              placeholder={
                activeTab === 'search' ? 'Search lyrics... (use "quotes" for exact)' :
                activeTab === 'dictionary' ? "Enter a word to get its definition..." :
                activeTab === 'synonyms' ? "Find synonyms and antonyms..." :
                activeTab === 'rhymes' ? "Find words that rhyme..." : ""
              }
              value={
                activeTab === 'search' ? searchQuery :
                activeTab === 'dictionary' ? definitionQuery :
                activeTab === 'synonyms' ? synonymQuery :
                activeTab === 'rhymes' ? rhymeQuery : ""
              }
              onChange={(e) => {
                if (activeTab === 'search') handleSearch(e.target.value);
                else if (activeTab === 'dictionary') setDefinitionQuery(e.target.value);
                else if (activeTab === 'synonyms') setSynonymQuery(e.target.value);
                else if (activeTab === 'rhymes') setRhymeQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'dictionary') searchDefinition(definitionQuery);
                  else if (activeTab === 'synonyms') searchSynonyms(synonymQuery);
                  else if (activeTab === 'rhymes') searchRhymes(rhymeQuery);
                }
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Dynamic search button */}
          {activeTab !== 'search' && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  if (activeTab === 'dictionary') searchDefinition(definitionQuery);
                  else if (activeTab === 'synonyms') searchSynonyms(synonymQuery);
                  else if (activeTab === 'rhymes') searchRhymes(rhymeQuery);
                }}
                disabled={
                  (activeTab === 'dictionary' && definitionLoading) ||
                  (activeTab === 'synonyms' && synonymLoading) ||
                  (activeTab === 'rhymes' && rhymeLoading)
                }
                className={`px-6 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white disabled:bg-gray-700' 
                    : 'bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400'
                }`}
              >
                {(activeTab === 'dictionary' && definitionLoading) || 
                (activeTab === 'synonyms' && synonymLoading) || 
                (activeTab === 'rhymes' && rhymeLoading) ? '...' : 
                activeTab === 'dictionary' ? 'Define' :
                activeTab === 'synonyms' ? 'Search' :
                activeTab === 'rhymes' ? 'Find Rhymes' : 'Search'}
              </button>
            </div>
          )}
        
          {/* Search History - only show for main search tab */}
          {activeTab === 'search' && searchHistory.length > 0 && (
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
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 mobile-content">
        {/* Manual Content */}
        <Manual 
          showManual={showManual}
          onClose={() => setShowManual(false)}
          darkMode={darkMode}
        />

        {/* Tab Content - Only show when manual is closed */}
        {!showManual && (
          <>
            {activeTab === 'search' && (
              <SearchTab 
                searchQuery={searchQuery}
                highlightWord={highlightWord}
                searchResults={searchResults}
                songs={songs}
                stats={stats}
                onSongSelect={setSelectedSong}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'dictionary' && (
              <DictionaryTab 
                definitionResults={definitionResults}
                definitionLoading={definitionLoading}
                definitionQuery={definitionQuery}
                onSearchInLyrics={searchInLyrics}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'synonyms' && (
              <SynonymsTab 
                synonymResults={synonymResults}
                synonymLoading={synonymLoading}
                synonymQuery={synonymQuery}
                onSearchInLyrics={searchInLyrics}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'rhymes' && (
              <RhymesTab 
                rhymeResults={rhymeResults}
                rhymeLoading={rhymeLoading}
                rhymeQuery={rhymeQuery}
                onSearchInLyrics={searchInLyrics}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisTab 
                songs={songs}
                selectedSongForAnalysis={selectedSongForAnalysis}
                setSelectedSongForAnalysis={setSelectedSongForAnalysis}
                analysisResults={analysisResults}
                setAnalysisResults={setAnalysisResults}
                analysisType={analysisType}
                setAnalysisType={setAnalysisType}
                onSearchInLyrics={searchInLyrics}
                stats={stats}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'upload' && (
              <UploadTab 
                songs={songs}
                onFileUpload={fileUploadHook.handleFileUpload}
                onDeleteSong={deleteSong}
                onDeleteAllSongs={deleteAllSongs}
                onSongSelect={setSelectedSong}
                isDragging={fileUploadHook.isDragging}
                handleDragOver={fileUploadHook.handleDragOver}
                handleDragLeave={fileUploadHook.handleDragLeave}
                handleDrop={fileUploadHook.handleDrop}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'stats' && (
              <StatsTab 
                songs={songs}
                stats={stats}
                selectedStatsFilter={selectedStatsFilter}
                setSelectedStatsFilter={setSelectedStatsFilter}
                onSearchInLyrics={(word) => {
                  handleSearch(word);
                  setActiveTab('search');
                }}
                darkMode={darkMode}
              />
            )}
          </>
        )}
      </div>

      {/* Song Modal */}
      <SongModal 
        selectedSong={selectedSong}
        onClose={() => setSelectedSong(null)}
        highlightWord={highlightWord}
        darkMode={darkMode}
      />
    </div>
  );
};

export default LyricsSearchApp;