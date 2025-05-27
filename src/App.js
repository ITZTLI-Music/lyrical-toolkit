import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Upload, FileText, BarChart3, X, Plus, Moon, Sun, Book, Shuffle, Music, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { songVocabularyPhoneticMap } from './songVocabularyPhoneticMap';


/* eslint-disable react-hooks/exhaustive-deps */

// Add this Set near the top of your App.js, outside the component
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'can',
  'could', 'may', 'might', 'must', 'am', 'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'as', 'if', 'of', 'at', 'by', 'in', 'on', 'to', 'up', 'out', 'with', 'from',
  'into', 'onto', 'near', 'over', 'under', 'through', 'about', 'above', 'after',
  'again', 'against', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'now', 'then', 'say', 'says', 'said', 'also', 'get', 'go', 'goes', 'got', 'gone',
  'how', 'why', 'when', 'where', 'while', 'aint', 'give', 'im', 'id', 'ive', 'ill',
  'its', 'isnt', 'arent', 'wasnt', 'werent', 'cant', 'wont', 'dont', 'doesnt', 'didnt',
  'hasnt', 'havent', 'hadnt'
  // You can continue to expand this list if you find other common words you wish to exclude.
]);

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

  // Analysis states
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const [selectedSongForAnalysis, setSelectedSongForAnalysis] = useState(null);

  // Manual states
  const [showManual, setShowManual] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [exampleSongDeleted, setExampleSongDeleted] = useState(false);

  // Load example song
  const loadingExampleRef = useRef(false);
  
  useEffect(() => {
    const loadExampleSong = async () => {
      console.log('loadExampleSong function called');
      
      // Don't load if user has deleted it this session
      if (exampleSongDeleted) {
        console.log('Example song was deleted by user, skipping');
        return;
      }
      
      // Prevent concurrent loading
      if (loadingExampleRef.current) {
        console.log('Already loading example song, skipping');
        return;
      }
      
      // Check if example song already exists
      const exampleExists = songs.some(song => song.isExample);
      if (exampleExists) {
        console.log('Example song already exists, skipping');
        return;
      }
      
      // Set loading flag
      loadingExampleRef.current = true;

      try {
        console.log('Attempting to fetch example song...');
        const response = await fetch('/HUMAN.txt');
        console.log('Response:', response.status, response.ok);
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
          
          console.log('Adding example song to state');
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
        // Clear loading flag
        loadingExampleRef.current = false;
      }
    };

    // Load example song on mount or when songs array is empty
    if (songs.length === 0) {
      setTimeout(loadExampleSong, 100);
    }
  }, [songs.length, exampleSongDeleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load manual content
  const loadManual = async () => {
    if (manualContent) return; // Already loaded
    
    setManualLoading(true);
    try {
      const response = await fetch('/MANUAL.txt');
      if (response.ok) {
        const content = await response.text();
        setManualContent(content);
      } else {
        setManualContent('Manual content could not be loaded.');
      }
    } catch (error) {
      console.error('Failed to load manual:', error);
      setManualContent('Error loading manual content.');
    }
    setManualLoading(false);
  };

  // Save to localStorage whenever data changes
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
            title: DOMPurify.sanitize(songTitle),
            lyrics: DOMPurify.sanitize(content),
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            dateAdded: new Date().toISOString(),
            filename: DOMPurify.sanitize(file.name)
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

  // Enhanced search functionality - group by verse/paragraph
  const searchResults = useMemo(() => {
    const query = searchQuery || highlightWord;
    if (!query.trim()) return [];

    const results = [];
    
    // Check if query is wrapped in quotes for exact matching
    const isExactMatch = query.startsWith('"') && query.endsWith('"') && query.length > 2;
    const searchTerm = isExactMatch ? query.slice(1, -1) : query; // Remove quotes if present
    const searchLower = searchTerm.toLowerCase();

    songs.forEach(song => {
      // Split lyrics into verses/paragraphs (separated by empty lines)
      const verses = song.lyrics.split(/\n\s*\n/).filter(verse => verse.trim());
      
      verses.forEach((verse, verseIndex) => {
        const lines = verse.split('\n').filter(line => line.trim());
        let verseHasMatch = false;
        let matchCount = 0;
        let firstMatchLine = -1;
        
        // Check if this verse contains any matches
        lines.forEach((line, lineIndex) => {
          let lineHasMatch = false;
          
          if (isExactMatch) {
            // Exact word matching - use word boundaries
            const wordRegex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const matches = line.match(wordRegex);
            if (matches) {
              lineHasMatch = true;
              matchCount += matches.length;
            }
          } else {
            // Regular substring matching
            const matches = line.toLowerCase().match(new RegExp(searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'));
            if (matches) {
              lineHasMatch = true;
              matchCount += matches.length;
            }
          }
          
          if (lineHasMatch && !verseHasMatch) {
            verseHasMatch = true;
            firstMatchLine = lineIndex;
          }
        });
        
        // If verse has matches, add it to results
        if (verseHasMatch) {
          // Calculate the actual line number in the full song
          let lineNumberInSong = 1;
          const versesBeforeCurrent = song.lyrics.split(/\n\s*\n/).slice(0, verseIndex);
          versesBeforeCurrent.forEach(prevVerse => {
            lineNumberInSong += prevVerse.split('\n').length + 1; // +1 for the empty line separator
          });
          lineNumberInSong += firstMatchLine;
          
          results.push({
            songId: song.id,
            songTitle: song.title,
            verseContent: verse,
            verseIndex: verseIndex + 1,
            lineNumber: lineNumberInSong,
            matchCount: matchCount,
            isExactMatch: isExactMatch
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

  // Delete individual song
  const deleteSong = (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      setSongs(prev => {
        const songToDelete = prev.find(song => song.id === songId);
        // If deleting the example song, mark it as deleted
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
        // Also try related words that might include antonyms
        fetch(`https://api.datamuse.com/words?ml=${word.toLowerCase()}&max=30`)
      ]);
      
      const synonyms = synonymsResponse.ok ? await synonymsResponse.json() : [];
      let antonyms = antonymsResponse.ok ? await antonymsResponse.json() : [];
      const related = relatedResponse.ok ? await relatedResponse.json() : [];
      
      // If we don't have many antonyms, try to find more from related words
      if (antonyms.length < 5) {
        // Look for common antonym patterns in related words
        const antonymPatterns = ['un', 'non', 'dis', 'in', 'im', 'ir', 'anti'];
        const moreAntonyms = related.filter(relatedWord => {
          const wordLower = relatedWord.word.toLowerCase();
          const searchLower = word.toLowerCase();
          
          // Check if it starts with common antonym prefixes
          return antonymPatterns.some(prefix => 
            wordLower.startsWith(prefix + searchLower) || 
            searchLower.startsWith(prefix + wordLower)
          );
        });
        
        // Merge and deduplicate
        const allAntonyms = [...antonyms, ...moreAntonyms];
        antonyms = allAntonyms.filter((item, index, self) => 
          index === self.findIndex(t => t.word === item.word)
        ).slice(0, 15); // Limit to 15 total
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

  // Analyzes rhymes based on API-derived rhyme identifiers
  // In App.js, after your imports:
  const analyzeFullTextRhymes = (lyrics, vocabularyMap) => {
    if (!lyrics) return [];
    console.log("Smart Clustering Rhyme Analysis - Starting...");

    const lines = lyrics.split('\n');
    const allWordsProcessed = [];

    // Step 1: Extract all words with enhanced rhyme data
    for (const lineText of lines) {
      const lineData = [];
      const wordsInLine = lineText.split(/(\s+)/);
      for (const wordText of wordsInLine) {
        const cleanedWord = wordText.trim().toLowerCase().replace(/[^\w\s'-]|('s\b)|(^\s*')|('\s*$)/g, '').replace(/\s+/g, ' ');
        let rhymeData = null;

        if (cleanedWord && cleanedWord.length >= 1 && !STOP_WORDS.has(cleanedWord)) {
          const fullPhonetic = vocabularyMap[cleanedWord];
          if (fullPhonetic) {
            rhymeData = getEnhancedRhymeData(fullPhonetic);
          }
        }
        
        lineData.push({
          text: wordText,
          clean: cleanedWord,
          rhymeData: rhymeData,
          rhymeGroup: null
        });
      }
      allWordsProcessed.push(lineData);
    }

    // Step 2: Collect all rhymable words
    const allRhymableWords = [];
    allWordsProcessed.forEach((line, lineIndex) => {
      line.forEach((word, wordIndex) => {
        if (word.rhymeData) {
          allRhymableWords.push({
            ...word,
            lineIndex,
            wordIndex,
            id: `${lineIndex}-${wordIndex}`
          });
        }
      });
    });

    // Step 3: Create similarity matrix
    const createSimilarityMatrix = (words) => {
      const matrix = [];
      for (let i = 0; i < words.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < words.length; j++) {
          if (i === j) {
            matrix[i][j] = 100; // Perfect self-similarity
          } else {
            matrix[i][j] = calculatePhoneticSimilarity(words[i].rhymeData, words[j].rhymeData);
          }
        }
      }
      return matrix;
    };

    // Step 4: Hierarchical clustering algorithm
    const performHierarchicalClustering = (words, similarityMatrix, minSimilarity = 70) => {
      const clusters = words.map((word, index) => ({
        words: [word],
        indices: [index],
        centroid: word.rhymeData
      }));

      while (true) {
        let bestMerge = null;
        let bestSimilarity = 0;

        // Find the two most similar clusters
        for (let i = 0; i < clusters.length; i++) {
          for (let j = i + 1; j < clusters.length; j++) {
            const similarity = calculateClusterSimilarity(clusters[i], clusters[j], similarityMatrix);
            if (similarity > bestSimilarity && similarity >= minSimilarity) {
              bestSimilarity = similarity;
              bestMerge = { i, j };
            }
          }
        }

        // If no good merge found, stop clustering
        if (!bestMerge) break;

        // Merge the two best clusters
        const clusterA = clusters[bestMerge.i];
        const clusterB = clusters[bestMerge.j];
        
        const mergedCluster = {
          words: [...clusterA.words, ...clusterB.words],
          indices: [...clusterA.indices, ...clusterB.indices],
          centroid: clusterA.centroid // Keep the first cluster's centroid as representative
        };

        // Remove the old clusters and add the merged one
        clusters.splice(Math.max(bestMerge.i, bestMerge.j), 1);
        clusters.splice(Math.min(bestMerge.i, bestMerge.j), 1);
        clusters.push(mergedCluster);
      }

      return clusters.filter(cluster => cluster.words.length >= 2);
    };

    // Helper function to calculate similarity between clusters
    const calculateClusterSimilarity = (clusterA, clusterB, similarityMatrix) => {
      let totalSimilarity = 0;
      let comparisons = 0;

      for (const indexA of clusterA.indices) {
        for (const indexB of clusterB.indices) {
          totalSimilarity += similarityMatrix[indexA][indexB];
          comparisons++;
        }
      }

      return comparisons > 0 ? totalSimilarity / comparisons : 0;
    };

    // Step 5: Perform clustering
    if (allRhymableWords.length === 0) {
      let wordIdCounter = 0;
      return allWordsProcessed.map(line =>
        line.map(word => ({ ...word, id: wordIdCounter++ }))
      );
    }

    const similarityMatrix = createSimilarityMatrix(allRhymableWords);
    const clusters = performHierarchicalClustering(allRhymableWords, similarityMatrix, 77);

    // Step 6: Post-process clusters to merge very similar ones
    const consolidatedClusters = consolidateSimilarClusters(clusters, 95);

    // Step 7: Sort clusters by strength and size
    consolidatedClusters.sort((a, b) => {
      // Prioritize by cluster size, then by average internal similarity
      if (b.words.length !== a.words.length) {
        return b.words.length - a.words.length;
      }
      
      // Calculate average internal similarity for tie-breaking
      const avgSimA = calculateInternalSimilarity(a, similarityMatrix, allRhymableWords);
      const avgSimB = calculateInternalSimilarity(b, similarityMatrix, allRhymableWords);
      return avgSimB - avgSimA;
    });

    // Step 8: Intelligent Color Assignment
    const assignColorsIntelligently = (clusters, similarityMatrix, allWords) => {
      // Extended color palette: letters + numbers for more groups
      const colorIdentifiers = [
        // Primary letters (A-Z) - 26 colors
        ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
        // Extended numbers (1-20) - 20 additional colors
        ...'12345678901234567890'.split('')
      ];

      // Score each cluster for priority assignment
      const scoredClusters = clusters.map((cluster, index) => {
        const size = cluster.words.length;
        const avgSimilarity = calculateInternalSimilarity(cluster, similarityMatrix, allWords);
        
        // Priority scoring: larger groups + higher similarity get better colors
        const sizeScore = Math.min(size * 10, 50); // Up to 50 points for size
        const similarityScore = avgSimilarity * 0.3; // Up to 30 points for similarity
        const diversityBonus = calculateDiversityBonus(cluster); // Bonus for word variety
        
        return {
          cluster,
          index,
          priority: sizeScore + similarityScore + diversityBonus,
          size,
          avgSimilarity
        };
      });

      // Sort by priority (highest priority gets first/best colors)
      scoredClusters.sort((a, b) => b.priority - a.priority);

      // Assign colors with smart distribution
      const assignedColors = new Set();
      const colorAssignments = [];

      scoredClusters.forEach((scoredCluster, priorityIndex) => {
        let assignedColor = null;

        if (priorityIndex < colorIdentifiers.length) {
          // Direct assignment for high-priority groups
          assignedColor = colorIdentifiers[priorityIndex];
        } else {
          // Fallback: reuse colors but prefer less similar groups
          const availableColors = colorIdentifiers.filter(color => 
            !assignedColors.has(color) || assignedColors.size >= colorIdentifiers.length
          );
          assignedColor = availableColors[priorityIndex % availableColors.length] || 'default';
        }

        assignedColors.add(assignedColor);
        colorAssignments.push({
          cluster: scoredCluster.cluster,
          color: assignedColor,
          priority: scoredCluster.priority
        });
      });

      return colorAssignments;
    };

    // Helper function to calculate diversity bonus
    const calculateDiversityBonus = (cluster) => {
      if (cluster.words.length < 2) return 0;
      
      // Bonus for clusters with varied word types (different syllable counts, patterns)
      const syllableCounts = cluster.words.map(word => {
        if (!word.rhymeData || !word.rhymeData.fullPhonetic) return 1;
        return word.rhymeData.fullPhonetic.split(' ').filter(p => /[012]$/.test(p)).length;
      });
      
      const uniqueSyllableCounts = new Set(syllableCounts);
      const diversityBonus = Math.min(uniqueSyllableCounts.size * 3, 15); // Up to 15 points
      
      // Extra bonus for clusters with both short and long words (good flow variety)
      const hasShort = syllableCounts.some(count => count <= 2);
      const hasLong = syllableCounts.some(count => count >= 3);
      const varietyBonus = hasShort && hasLong ? 5 : 0;
      
      return diversityBonus + varietyBonus;
    };

    // Apply intelligent color assignment
    const colorAssignments = assignColorsIntelligently(consolidatedClusters, similarityMatrix, allRhymableWords);

    // Apply color assignments to words
    colorAssignments.forEach(assignment => {
      assignment.cluster.words.forEach(word => {
        allWordsProcessed[word.lineIndex][word.wordIndex].rhymeGroup = assignment.color;
      });
    });

    // Step 9: Add IDs and prepare final result
    let wordIdCounter = 0;
    const finalResult = allWordsProcessed.map(line =>
      line.map(word => ({ ...word, id: wordIdCounter++ }))
    );

    console.log(`Smart Clustering - Found ${consolidatedClusters.length} rhyme clusters`);
    console.log("ALL cluster assignments:", colorAssignments.map(assignment => ({
      color: assignment.color,
      words: assignment.cluster.words.slice(0, 3).map(w => w.clean), // Just show first 3 words
      size: assignment.cluster.words.length,
      priority: Math.round(assignment.priority)
    })));

    return finalResult;
  };

  // Helper function to consolidate very similar clusters
  const consolidateSimilarClusters = (clusters, threshold = 85) => {
    const consolidated = [...clusters];
    let changed = true;
    
    while (changed) {
      changed = false;
      
      for (let i = 0; i < consolidated.length && !changed; i++) {
        for (let j = i + 1; j < consolidated.length && !changed; j++) {
          // Check if clusters should be merged by comparing their centroids
          const similarity = calculatePhoneticSimilarity(
            consolidated[i].centroid,
            consolidated[j].centroid
          );
          
          if (similarity >= threshold) {
            // Check if clusters have compatible ending patterns before merging
            const pattern1 = getEndingPattern(consolidated[i].centroid);
            const pattern2 = getEndingPattern(consolidated[j].centroid);
            
            if (areCompatiblePatterns(pattern1, pattern2)) {
              // Merge clusters
              consolidated[i] = {
                words: [...consolidated[i].words, ...consolidated[j].words],
                indices: [...consolidated[i].indices, ...consolidated[j].indices],
                centroid: consolidated[i].centroid
              };
              consolidated.splice(j, 1);
              changed = true;
            }
          }
        }
      }
    }
    
    return consolidated;
  };

  // Helper function to calculate internal cluster similarity
  const calculateInternalSimilarity = (cluster, similarityMatrix, allWords) => {
    if (cluster.words.length < 2) return 0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < cluster.indices.length; i++) {
      for (let j = i + 1; j < cluster.indices.length; j++) {
        const indexA = cluster.indices[i];
        const indexB = cluster.indices[j];
        totalSimilarity += similarityMatrix[indexA][indexB];
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  };

    // Improved syllable counter
    const countSyllables = (word) => {
      if (!word || typeof word !== 'string') return 0;
      
      word = word.toLowerCase().trim();
      if (word.length === 0) return 0;
      if (word.length <= 2) return 1;
      
      // Remove common word endings that don't add syllables
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      
      // Count vowel groups
      let syllableCount = 0;
      let previousWasVowel = false;
      
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const isVowel = /[aeiouy]/.test(char);
        
        if (isVowel && !previousWasVowel) {
          syllableCount++;
        }
        previousWasVowel = isVowel;
      }
      
      // Handle special cases
      if (word.endsWith('le') && word.length > 2 && !/[aeiouy]/.test(word[word.length - 3])) {
        syllableCount++;
      }
      
      return Math.max(1, syllableCount);
    };

  // Calculate reading level using Flesch-Kincaid Grade Level formula
  const calculateReadingLevel = (lyrics) => {
    if (!lyrics || typeof lyrics !== 'string') return 0;
    
    // Split into sentences - be more strict about what counts as a sentence
    const sentences = lyrics.split(/[.!?]+/).filter(s => s.trim().length > 5); // Minimum 5 chars per sentence
    const words = lyrics.toLowerCase().split(/\s+/).filter(word => word.match(/[a-zA-Z]/));
    const cleanWords = words.map(word => word.replace(/[^\w]/g, '')).filter(word => word.length > 0);
    
    // Need minimum thresholds for meaningful calculation
    if (sentences.length === 0 || cleanWords.length === 0) return 0;
    if (sentences.length < 2) return Math.min(cleanWords.length * 0.5, 12); // Very short texts
    
    const totalSyllables = cleanWords.reduce((sum, word) => sum + countSyllables(word), 0);
    const avgWordsPerSentence = cleanWords.length / sentences.length;
    const avgSyllablesPerWord = totalSyllables / cleanWords.length;
    
    // Flesch-Kincaid Grade Level formula
    let gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    // Apply realistic bounds - most texts should fall between 1-20
    gradeLevel = Math.max(1, Math.min(20, gradeLevel));
    
    // Round to 1 decimal place
    return Math.round(gradeLevel * 10) / 10;
  };

  // Calculate vocabulary complexity score
  const calculateVocabularyComplexity = (lyrics, wordFrequencies) => {
    if (!lyrics || typeof lyrics !== 'string') return 0;
    
    const words = lyrics.toLowerCase().split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 0);
    
    if (words.length === 0) return 0;
    
    let complexityScore = 0;
    
    words.forEach(word => {
      const syllables = countSyllables(word);
      const length = word.length;
      const frequency = wordFrequencies[word] || 1;
      const rarity = 1 / frequency; // Less frequent words are more complex
      
      // Weighted complexity: syllables (40%), length (30%), rarity (30%)
      const wordComplexity = (syllables * 0.4) + (length * 0.3) + (rarity * 0.3);
      complexityScore += wordComplexity;
    });
    
    return Math.round((complexityScore / words.length) * 10) / 10; // Average complexity per word
  };

  // Analyze rhyme statistics using existing phonetic system - CONSERVATIVE VERSION
  const analyzeRhymeStatistics = (lyrics, vocabularyMap) => {
    if (!lyrics || typeof lyrics !== 'string') return {
      totalRhymableWords: 0,
      perfectRhymes: 0,
      nearRhymes: 0,
      soundsLike: 0,
      rhymeDensity: 0,
      internalRhymes: 0,
      rhymeGroups: []
    };

    const lines = lyrics.split('\n').filter(line => line.trim().length > 0);
    const endWords = []; // Focus on end-of-line words primarily
    const allRhymableWords = [];
    let internalRhymeCount = 0;

    // Extract end-of-line words and some internal words
    lines.forEach((line, lineIndex) => {
      const wordsInLine = line.split(/\s+/)
        .map(word => word.trim().toLowerCase().replace(/[^\w\s'-]|('s\b)|(^\s*')|('\s*$)/g, ''))
        .filter(word => word && word.length >= 3 && !STOP_WORDS.has(word)); // Raised minimum length

      if (wordsInLine.length === 0) return;

      // Get end word (most important for rhyme schemes)
      const endWord = wordsInLine[wordsInLine.length - 1];
      const endPhonetic = vocabularyMap[endWord];
      if (endPhonetic) {
        const rhymeData = getEnhancedRhymeData(endPhonetic);
        if (rhymeData) {
          const wordData = { word: endWord, rhymeData, lineIndex, isEndWord: true };
          endWords.push(wordData);
          allRhymableWords.push(wordData);
        }
      }

      // Also get some internal words for internal rhyme detection (but be selective)
      const internalWordsData = [];
      wordsInLine.slice(0, -1).forEach(word => {
        const phoneticData = vocabularyMap[word];
        if (phoneticData && word.length >= 4) { // Higher threshold for internal words
          const rhymeData = getEnhancedRhymeData(phoneticData);
          if (rhymeData) {
            const wordData = { word, rhymeData, lineIndex, isEndWord: false };
            internalWordsData.push(wordData);
            allRhymableWords.push(wordData);
          }
        }
      });

      // Check for internal rhymes within this line (conservative)
      for (let i = 0; i < internalWordsData.length; i++) {
        for (let j = i + 1; j < internalWordsData.length; j++) {
          const similarity = calculatePhoneticSimilarity(
            internalWordsData[i].rhymeData,
            internalWordsData[j].rhymeData
          );
          if (similarity >= 75) { // Slightly lower threshold for internal rhymes
            internalRhymeCount++;
          }
        }
      }
    });

    if (allRhymableWords.length === 0) {
      return {
        totalRhymableWords: 0,
        perfectRhymes: 0,
        nearRhymes: 0,
        soundsLike: 0,
        rhymeDensity: 0,
        internalRhymes: internalRhymeCount,
        rhymeGroups: []
      };
    }

    // Find unique rhyme relationships (avoid double counting)
    const uniqueRhymePairs = new Set();
    let perfectRhymeCount = 0;
    let nearRhymeCount = 0;
    let soundsLikeCount = 0;
    const rhymeGroups = new Map();

    // Prioritize end-word rhymes
    for (let i = 0; i < endWords.length; i++) {
      for (let j = i + 1; j < endWords.length; j++) {
        const word1 = endWords[i];
        const word2 = endWords[j];
        
        // Skip if same word
        if (word1.word === word2.word) continue;
        
        // Create unique pair identifier (sorted to avoid duplicates)
        const pairKey = [word1.word, word2.word].sort().join('|');
        if (uniqueRhymePairs.has(pairKey)) continue;
        uniqueRhymePairs.add(pairKey);

        const similarity = calculatePhoneticSimilarity(word1.rhymeData, word2.rhymeData);
        
        if (similarity >= 82) { // Slightly lower threshold for perfect rhymes
          perfectRhymeCount++;
          
          // Group perfect rhymes
          const groupKey = word1.rhymeData.perfect;
          if (!rhymeGroups.has(groupKey)) {
            rhymeGroups.set(groupKey, new Set());
          }
          rhymeGroups.get(groupKey).add(word1.word);
          rhymeGroups.get(groupKey).add(word2.word);
          
        } else if (similarity >= 80) { // Lower threshold for near rhymes
          nearRhymeCount++;
        } else if (similarity >= 78) { // Higher threshold for sounds-like to reduce false positives
          soundsLikeCount++;
        }
      }
    }

    // Also check some cross-category rhymes (end words with prominent internal words)
    const internalWords = allRhymableWords.filter(w => !w.isEndWord && w.word.length >= 5);
    for (let i = 0; i < endWords.length && i < 20; i++) { // Limit to prevent explosion
      for (let j = 0; j < internalWords.length && j < 10; j++) {
        const endWord = endWords[i];
        const internalWord = internalWords[j];
        
        if (endWord.word === internalWord.word) continue;
        
        const pairKey = [endWord.word, internalWord.word].sort().join('|');
        if (uniqueRhymePairs.has(pairKey)) continue;
        uniqueRhymePairs.add(pairKey);

        const similarity = calculatePhoneticSimilarity(endWord.rhymeData, internalWord.rhymeData);
        
        if (similarity >= 82) {
          perfectRhymeCount++;
        } else if (similarity >= 68) {
          nearRhymeCount++;
        } else if (similarity >= 55) {
          soundsLikeCount++;
        }
      }
    }

    // Convert rhyme groups to array and consolidate duplicates
    let rhymeGroupsArray = Array.from(rhymeGroups.entries())
      .filter(([, words]) => words.size >= 2)
      .map(([key, words]) => ({
        rhymeSound: key,
        words: Array.from(words),
        count: words.size
      }));

    // Consolidate similar/duplicate rhyme groups
    const consolidateRhymeGroups = (groups) => {
      const consolidated = [];
      const processed = new Set();

      for (let i = 0; i < groups.length; i++) {
        if (processed.has(i)) continue;

        const currentGroup = groups[i];
        const mergedWords = new Set(currentGroup.words);
        const similarGroups = [i];

        // Find groups with similar phonetic patterns or overlapping words
        for (let j = i + 1; j < groups.length; j++) {
          if (processed.has(j)) continue;

          const otherGroup = groups[j];
          
          // Check if groups should be merged
          const shouldMerge = checkGroupsShouldMerge(currentGroup, otherGroup);
          
          if (shouldMerge) {
            // Merge the groups
            otherGroup.words.forEach(word => mergedWords.add(word));
            similarGroups.push(j);
            processed.add(j);
          }
        }

        // Mark current group as processed
        processed.add(i);

        // Create consolidated group
        if (mergedWords.size >= 2) {
          // Use the most representative rhyme sound from the merged groups
          const bestRhymeSound = selectBestRhymeSound(
            similarGroups.map(idx => groups[idx].rhymeSound)
          );
          
          consolidated.push({
            rhymeSound: bestRhymeSound,
            words: Array.from(mergedWords).sort(),
            count: mergedWords.size
          });
        }
      }

      return consolidated;
    };

    // Helper function to determine if two groups should be merged - IMPROVED
    const checkGroupsShouldMerge = (group1, group2) => {
      const words1 = new Set(group1.words);
      const words2 = new Set(group2.words);
      
      // Merge if there's ANY word overlap (to catch duplicates like "grew" in multiple groups)
      const intersection = new Set([...words1].filter(word => words2.has(word)));
      
      if (intersection.size > 0) {
        return true; // Merge any groups that share words
      }
      
      // Also merge if the groups have very similar phonetic patterns
      if (group1.rhymeSound === group2.rhymeSound) {
        return true;
      }
      
      return false;
    };

    // Helper function to select the best representative rhyme sound
    const selectBestRhymeSound = (rhymeSounds) => {
      if (rhymeSounds.length === 1) return rhymeSounds[0];
      
      // Prefer shorter, more general patterns
      const sorted = rhymeSounds.sort((a, b) => {
        const phonemes1 = a.split(' ').length;
        const phonemes2 = b.split(' ').length;
        
        // Prefer patterns with 1-2 phonemes over longer ones
        if (phonemes1 <= 2 && phonemes2 > 2) return -1;
        if (phonemes2 <= 2 && phonemes1 > 2) return 1;
        
        // If both similar length, prefer the one that looks more "standard"
        return phonemes1 - phonemes2;
      });
      
      return sorted[0];
    };

    // Apply consolidation
    rhymeGroupsArray = consolidateRhymeGroups(rhymeGroupsArray);

    // Filter out weak/non-rhyming groups
    rhymeGroupsArray = rhymeGroupsArray.filter(group => {
      // Remove groups with less than 2 words
      if (group.count < 2) return false;
      
      // For 2-word groups, check if they actually rhyme well
      if (group.count === 2) {
        const [word1, word2] = group.words;
        
        // Remove obvious non-rhymes (different ending sounds)
        const ending1 = word1.toLowerCase().slice(-2);
        const ending2 = word2.toLowerCase().slice(-2);
        const lastChar1 = word1.toLowerCase().slice(-1);
        const lastChar2 = word2.toLowerCase().slice(-1);
        
        // If they don't share ANY similar ending pattern, probably not a real rhyme
        const hasSharedEnding = (
          ending1 === ending2 || 
          lastChar1 === lastChar2 ||
          (word1.toLowerCase().endsWith('m') && word2.toLowerCase().endsWith('nt')) ||
          (word1.toLowerCase().endsWith('nt') && word2.toLowerCase().endsWith('m')) ||
          // Add more specific patterns that should be kept
          (word1.toLowerCase().includes('oom') && word2.toLowerCase().includes('ew')) ||
          (word1.toLowerCase().includes('est') && word2.toLowerCase().includes('ed'))
        );
        
        // For very different words, check if they're actually similar sounding
        const wordsAreToodifferent = (
          Math.abs(word1.length - word2.length) > 3 || // Very different lengths
          (word1.toLowerCase() === 'cataclysm' && word2.toLowerCase() === 'environment') ||
          (word1.toLowerCase() === 'environment' && word2.toLowerCase() === 'cataclysm')
        );
        
        if (wordsAreToodifferent || !hasSharedEnding) {
          return false;
        }
      }
      
      return true;
    });

    // Final sort and limit
    rhymeGroupsArray = rhymeGroupsArray
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const totalWords = lyrics.toLowerCase().split(/\s+/).filter(word => word.match(/[a-zA-Z]/)).length;
    const rhymeDensity = totalWords > 0 ? ((allRhymableWords.length / totalWords) * 100) : 0;

    return {
      totalRhymableWords: allRhymableWords.length,
      perfectRhymes: perfectRhymeCount,
      nearRhymes: nearRhymeCount,
      soundsLike: soundsLikeCount,
      rhymeDensity: Math.round(rhymeDensity * 10) / 10,
      internalRhymes: internalRhymeCount,
      rhymeGroups: rhymeGroupsArray
    };
  };   

  const analyzeMeter = (lyrics) => {
    try {
      if (!lyrics || typeof lyrics !== 'string') {
        return [];
      }
      
      const lines = lyrics.split('\n').filter(line => line.trim());
      const analysis = lines.map(line => {
        const words = line.trim().split(/\s+/).filter(word => word.length > 0);
        const syllableCounts = words.map(word => countSyllables(word.replace(/[^\w]/g, '')));
        const totalSyllables = syllableCounts.reduce((sum, count) => sum + count, 0);
        
        return {
          line: line,
          syllables: totalSyllables,
          words: words.length,
          syllableBreakdown: syllableCounts
        };
      });
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing meter:', error);
      return [];
    }
  };

  // Extract the ending pattern from phonetic data
  const getEndingPattern = (rhymeData) => {
    if (!rhymeData || !rhymeData.fullPhonetic) return null;
    
    const phonemes = rhymeData.fullPhonetic.split(' ');
    // Get last 2-3 phonemes as the "ending pattern"
    return phonemes.slice(-3).join(' ');
  };

  // Check if two ending patterns are compatible for rhyming
  const areCompatiblePatterns = (pattern1, pattern2) => {
    if (!pattern1 || !pattern2) return false;
    
    // Split patterns into individual phonemes
    const phonemes1 = pattern1.split(' ');
    const phonemes2 = pattern2.split(' ');
    
    // They should share at least the last phoneme (final sound)
    const lastPhoneme1 = phonemes1[phonemes1.length - 1];
    const lastPhoneme2 = phonemes2[phonemes2.length - 1];
    
    // Basic compatibility check - must share final sound or very similar
    if (lastPhoneme1 === lastPhoneme2) return true;
    
    // Check for similar ending patterns (like different stress versions)
    const base1 = lastPhoneme1.replace(/[012]$/, '');
    const base2 = lastPhoneme2.replace(/[012]$/, '');
    
    return base1 === base2;
  };

  // Generate rhyming dictionary from user's lyrics
  const generateRhymingDictionary = (songs) => {
    const rhymeDict = {};
    
    songs.forEach(song => {
      const words = song.lyrics.toLowerCase()
        .split(/\s+/)
        .map(word => word.replace(/[^\w]/g, ''))
        .filter(word => word.length > 2);
      
      words.forEach(word => {
        const rhymeKey = word.slice(-2); // Last 2 characters for simple rhyming
        if (!rhymeDict[rhymeKey]) {
          rhymeDict[rhymeKey] = new Set();
        }
        rhymeDict[rhymeKey].add(word);
      });
    });
    
    // Convert Sets to Arrays and filter groups with 2+ words
    const filteredDict = {};
    Object.entries(rhymeDict).forEach(([key, wordSet]) => {
      const words = Array.from(wordSet);
      if (words.length >= 2) {
        filteredDict[key] = words.sort();
      }
    });
    
    return filteredDict;
  };

// Enhanced phonetic rhyme analysis with multiple rhyme types
const getEnhancedRhymeData = (phoneticString) => {
  if (!phoneticString || typeof phoneticString !== 'string') return null;

  const phonemes = phoneticString.trim().split(' ');
  if (phonemes.length === 0) return null;

  // Find stressed vowels
  let lastStressedVowelIndex = -1;
  let allStressedVowels = [];
  
  for (let i = phonemes.length - 1; i >= 0; i--) {
    const phoneme = phonemes[i];
    if (/[A-Z]+[12]$/.test(phoneme)) {
      if (lastStressedVowelIndex === -1) lastStressedVowelIndex = i;
      allStressedVowels.unshift(i);
    }
  }

  // If no primary/secondary stress, find last vowel
  if (lastStressedVowelIndex === -1) {
    for (let i = phonemes.length - 1; i >= 0; i--) {
      const phoneme = phonemes[i];
      if (/[A-Z]+0?$/.test(phoneme)) {
        const alphaPart = phoneme.replace(/[012]$/, '');
        const VOWELS = ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'];
        if (VOWELS.includes(alphaPart)) {
          lastStressedVowelIndex = i;
          break;
        }
      }
    }
  }

  if (lastStressedVowelIndex === -1) return null;

  // Generate multiple rhyme keys for different rhyme types
  const perfectRhyme = phonemes.slice(lastStressedVowelIndex).join(' ');
  const nearRhyme = phonemes.slice(Math.max(0, lastStressedVowelIndex - 1)).join(' ');
  const slantRhyme = phonemes.slice(-2).join(' '); // Last 2 phonemes for consonant rhymes
  const endingRhyme = phonemes.slice(-1)[0]; // Just the final sound

  return {
    perfect: perfectRhyme,
    near: nearRhyme,
    slant: slantRhyme,
    ending: endingRhyme,
    fullPhonetic: phoneticString
  };
};

  // Calculate phonetic similarity score
  // Enhanced flow-based phonetic similarity
  const calculatePhoneticSimilarity = (rhymeData1, rhymeData2) => {
    if (!rhymeData1 || !rhymeData2) return 0;

    let score = 0;
    const phonemes1 = rhymeData1.fullPhonetic.split(' ');
    const phonemes2 = rhymeData2.fullPhonetic.split(' ');

    // Extract core vowel sounds for flow analysis
    const extractCoreVowel = (phonemes) => {
      // Find the last stressed or prominent vowel
      for (let i = phonemes.length - 1; i >= 0; i--) {
        const phoneme = phonemes[i];
        const baseSound = phoneme.replace(/[012]$/, '');
        if (['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'].includes(baseSound)) {
          return baseSound;
        }
      }
      return null;
    };

    const coreVowel1 = extractCoreVowel(phonemes1);
    const coreVowel2 = extractCoreVowel(phonemes2);

    // Define vowel families for flow-based rhyming
    const vowelFamilies = {
      'long-oo': ['UW', 'UH'], // crew, blue, food, good
      'long-ee': ['IY', 'IH'], // me, see, bit
      'ay-sound': ['AY', 'EY'], // day, say, they
      'oh-sound': ['OW', 'AO'], // go, show, law
      'ah-sound': ['AA', 'AH'], // car, star, but
      'eh-sound': ['EH', 'AE'], // bed, cat
      'er-sound': ['ER', 'AH'], // her, word
      'oy-sound': ['OY'], // boy, toy
      'aw-sound': ['AW', 'AO'] // cow, now, law
    };

    // Check for vowel family matches (flow-based rhyming)
    let vowelFamilyMatch = false;
    let vowelFamilyScore = 0;
    
    if (coreVowel1 && coreVowel2) {
      // Exact vowel match
      if (coreVowel1 === coreVowel2) {
        vowelFamilyScore = 85;
        vowelFamilyMatch = true;
      } else {
        // Check vowel families
        for (const [, vowels] of Object.entries(vowelFamilies)) {
          if (vowels.includes(coreVowel1) && vowels.includes(coreVowel2)) {
            vowelFamilyScore = 75;
            vowelFamilyMatch = true;
            break;
          }
        }
      }
    }

    // Traditional rhyme analysis
    if (rhymeData1.perfect === rhymeData2.perfect) {
      score = 100;
    } else if (rhymeData1.near === rhymeData2.near) {
      score = 80;
    } else if (rhymeData1.slant === rhymeData2.slant) {
      score = 60;
    } else if (rhymeData1.ending === rhymeData2.ending) {
      score = 45;
    }

    // Flow-based scoring - prioritize vowel family matches
    if (vowelFamilyMatch) {
      // Only use vowel family score if traditional rhyme analysis scored low
      if (score < 50) {
        score = Math.max(score, vowelFamilyScore - 10); // Reduced vowel family scoring
      }
      
      // Bonus for consonant patterns after the vowel
      const endingConsonants1 = getEndingConsonants(phonemes1);
      const endingConsonants2 = getEndingConsonants(phonemes2);
      
      if (endingConsonants1 && endingConsonants2) {
        const consonantSimilarity = calculateConsonantSimilarity(endingConsonants1, endingConsonants2);
        score += consonantSimilarity * 10; // Reduced from 15 to 10
      }
    }

    // Additional flow pattern bonuses
    score += calculateFlowPatternBonus(phonemes1, phonemes2);

    return Math.min(score, 100);
  };

  // Helper function to extract ending consonants
  const getEndingConsonants = (phonemes) => {
    const consonants = [];
    // Get consonants after the last vowel
    let foundVowel = false;
    
    for (let i = phonemes.length - 1; i >= 0; i--) {
      const phoneme = phonemes[i];
      const baseSound = phoneme.replace(/[012]$/, '');
      
      if (['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'].includes(baseSound)) {
        foundVowel = true;
        break;
      } else {
        consonants.unshift(baseSound);
      }
    }
    
    return foundVowel ? consonants : [];
  };

  // Calculate consonant pattern similarity
  const calculateConsonantSimilarity = (consonants1, consonants2) => {
    if (consonants1.length === 0 && consonants2.length === 0) return 1;
    if (consonants1.length === 0 || consonants2.length === 0) return 0.3;
    
    // Similar consonant groups
    const consonantGroups = {
      'stops': ['B', 'P', 'D', 'T', 'G', 'K'],
      'fricatives': ['F', 'V', 'TH', 'DH', 'S', 'Z', 'SH', 'ZH'],
      'nasals': ['M', 'N', 'NG'],
      'liquids': ['L', 'R'],
      'semivowels': ['W', 'Y']
    };
    
    // Exact match
    if (consonants1.join('') === consonants2.join('')) return 1;
    
    // Similar length and pattern
    if (consonants1.length === consonants2.length) {
      let matches = 0;
      for (let i = 0; i < consonants1.length; i++) {
        if (consonants1[i] === consonants2[i]) {
          matches++;
        } else {
          // Check if they're in the same consonant group
          for (const group of Object.values(consonantGroups)) {
            if (group.includes(consonants1[i]) && group.includes(consonants2[i])) {
              matches += 0.7;
              break;
            }
          }
        }
      }
      return matches / consonants1.length;
    }
    
    return 0.2; // Different patterns, small bonus
  };

  // Calculate additional flow pattern bonuses
  const calculateFlowPatternBonus = (phonemes1, phonemes2) => {
    let bonus = 0;
    
    // Similar word length (syllable count approximation)
    const syllableCount1 = phonemes1.filter(p => /[012]$/.test(p)).length;
    const syllableCount2 = phonemes2.filter(p => /[012]$/.test(p)).length;
    
    if (syllableCount1 === syllableCount2) {
      bonus += 5; // Same syllable count bonus
    }
    
    // Common hip-hop flow patterns
    const word1 = phonemes1.join(' ');
    const word2 = phonemes2.join(' ');
    
    // -ING pattern bonus
    if ((word1.includes('IH NG') || word1.includes('IY NG')) && 
        (word2.includes('IH NG') || word2.includes('IY NG'))) {
      bonus += 10;
    }
    
    // -ED pattern bonus  
    if ((word1.includes('D') && word1.endsWith('D')) && 
        (word2.includes('D') && word2.endsWith('D'))) {
      bonus += 8;
    }
    
    // -LY pattern bonus
    if ((word1.includes('L IY') || word1.endsWith('L IY')) && 
        (word2.includes('L IY') || word2.endsWith('L IY'))) {
      bonus += 8;
    }
    
    return bonus;
  };

  // Word frequency analysis
  const generateWordFrequencyReport = (songs) => {
    const wordFreq = {};
    const totalWords = songs.reduce((sum, song) => sum + song.wordCount, 0);
    
    songs.forEach(song => {
      const words = song.lyrics.toLowerCase()
        .split(/\s+/)
        .map(word => word.replace(/[^\w]/g, ''))
        .filter(word => word.length > 2);
      
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

  const sortedWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .map(([word, count]) => ({
      word,
      count,
      percentage: ((count / totalWords) * 100).toFixed(2)
    }));
  
  return {
    totalUniqueWords: Object.keys(wordFreq).length,
    totalWords,
    topWords: sortedWords.slice(0, 50),
    allWords: sortedWords
  };
};

  // Add new state for song selection
  const [selectedStatsFilter, setSelectedStatsFilter] = useState('all');

  // Reset stats filter when songs change
  useEffect(() => {
    if (songs.length === 0) {
      setSelectedStatsFilter('all');
    } else if (selectedStatsFilter !== 'all') {
      // Check if selected song still exists
      const selectedSongExists = songs.some(song => song.id.toString() === selectedStatsFilter);
      if (!selectedSongExists) {
        setSelectedStatsFilter('all');
      }
    }
  }, [songs, selectedStatsFilter, songs.length, analyzeRhymeStatistics, calculateReadingLevel, calculateVocabularyComplexity]);/* eslint-disable react-hooks/exhaustive-deps */
  
  // Enhanced statistics with song filtering
  const stats = useMemo(() => {
    // Filter songs based on selection
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
        
        // Word frequency
        if (cleanWord.length > 2) {
          wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
        
        // Syllable distribution
        const syllables = countSyllables(cleanWord);
        totalSyllables += syllables;
        const syllableKey = syllables > 4 ? '5+' : syllables.toString();
        syllableCount[syllableKey] = (syllableCount[syllableKey] || 0) + 1;
        
        // Word length distribution
        const lengthKey = cleanWord.length > 10 ? '11+' : cleanWord.length.toString();
        wordLengthCount[lengthKey] = (wordLengthCount[lengthKey] || 0) + 1;
      }
    });

    const mostUsedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // Calculate line statistics
    const allLines = filteredSongs.flatMap(song => 
      song.lyrics.split('\n').filter(line => line.trim().length > 0)
    );
    const totalLines = allLines.length;

    // Calculate advanced stats
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

    // Average the rhyme density if multiple songs
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
  }, [songs, selectedStatsFilter, songs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean highlight function with exact match support
  const highlightText = (text, query, isExactMatch = false) => {
    if (!query || !text) {
      return text;
    }
    
    // Remove quotes if present
    let searchTerm = query.toString().trim();
    if (searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length > 2) {
      searchTerm = searchTerm.slice(1, -1);
    }
    
    // Create regex based on exact match or not
    const regexPattern = isExactMatch 
      ? `\\b(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`  // Word boundaries for exact match
      : `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`;        // No boundaries for substring match
    
    const regex = new RegExp(regexPattern, 'gi');
    
    // Check if there are matches
    if (!regex.test(text)) {
      return text;
    }
    
    // Reset regex and split
    regex.lastIndex = 0;
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const testRegex = new RegExp(regexPattern, 'gi');
      if (testRegex.test(part)) {
        return (
          <span 
            key={index}
            style={{
              backgroundColor: isExactMatch ? '#fed7aa' : '#fdba74',  // Different shades for exact vs substring
              color: '#9a3412',
              padding: '2px 4px',
              fontWeight: 'bold',
              borderRadius: '3px'
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Enhanced search function with custom routing and auto-search
  const searchInLyrics = (word, targetTab = 'search') => {
    setSearchQuery(word);
    setHighlightWord(word);
    setActiveTab(targetTab);
    addToSearchHistory(word);
    
    // Auto-search on the target tab
    if (targetTab === 'dictionary') {
      setDefinitionQuery(word);
      setTimeout(() => searchDefinition(word), 100); // Small delay to ensure state is set
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

const HighlightedLyrics = ({ structuredLyrics, darkMode }) => {
  if (!structuredLyrics) return null;

  const getManualRhymeClass = (groupIdentifier) => {
    if (!groupIdentifier) return 'rhyme-group-default';
    
    // Handle letters (A-Z)
    if (/^[A-Z]$/.test(groupIdentifier)) {
      return `rhyme-group-${groupIdentifier.toLowerCase()}`;
    }
    
    // Handle numbers (1-9, 0)
    if (/^[0-9]$/.test(groupIdentifier)) {
      return `rhyme-group-${groupIdentifier}`;
    }
    
    return 'rhyme-group-default';
  };

  return (
    <pre className={`whitespace-pre-wrap leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {structuredLyrics.map((line, lineIndex) => (
        <div key={lineIndex} style={{ minHeight: '1.5em' }}>
          {line.map((word) => {
            return word.rhymeGroup ? (
              <span
                key={word.id} // Ensure 'id' is correctly populated by analyzeFullTextRhymes
                className={`rhyme-word-highlight ${getManualRhymeClass(word.rhymeGroup)}`}
                title={`ID: ${word.rhymeKey || 'N/A'}`} // Changed from rhymeKey to apiIdentifier
              >
                {word.text}
              </span>
            ) : (
              <span key={word.id}>{word.text}</span> // Ensure 'id' is here too
            );
          })}
        </div>
      ))}
    </pre>
  );
};

const RhymeGroupsDisplay = ({ rhymeGroups, darkMode, onWordClick }) => {
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Helper function to convert phonetic code to readable rhyme pattern
  const formatRhymeSound = (phoneticCode, wordsInGroup) => {
    if (!phoneticCode || !wordsInGroup || wordsInGroup.length === 0) return 'Unknown';
    
    // Group words by actual rhyming sound rather than just spelling
    const soundGroups = new Map();
    
    wordsInGroup.forEach(word => {
      const lowerWord = word.toLowerCase();
      let soundGroup = null;
      
      // Group by rhyming sound families (how they actually sound, not just spelling)
      if (['ake', 'ape', 'ate', 'ain', 'aint', 'ane'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'ay-sound'; // make, take, shape, paint, chain, dates
      }
      else if (['ine', 'ime', 'ike', 'ight', 'ite', 'ide'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'i-sound'; // time, line, mind, kind, live, trite, unite, alike
      }
      else if (['oom', 'ew', 'ue', 'oo'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'oo-sound'; // boom, grew, food
      }
      else if (['ort', 'orse', 'orce', 'ourt'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'or-sound'; // short, force, court
      }
      else if (['ed', 'est', 'et', 'ess'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'e-sound'; // best, stress, created, emitted
      }
      else if (['ly', 'y'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'y-sound'; // collectively, endlessly
      }
      else if (['tion', 'sion', 'ous', 'us'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'shun-sound'; // conditions, relations
      }
      else if (['ing', 'ling', 'ning', 'ting'].some(ending => lowerWord.endsWith(ending))) {
        soundGroup = 'ing-sound';
      }
      else {
        // Fallback to simple ending
        const ending = lowerWord.slice(-1);
        soundGroup = `${ending}-sound`;
      }
      
      if (soundGroup) {
        soundGroups.set(soundGroup, (soundGroups.get(soundGroup) || 0) + 1);
      }
    });

    // Get the most common sound groups
    const significantSounds = Array.from(soundGroups.entries())
      .filter(([, count]) => count >= 2 || wordsInGroup.length <= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([sound]) => sound);

    if (significantSounds.length === 0) {
      return 'similar sound';
    }

    // Create readable labels
    const readableLabels = significantSounds.map(sound => {
      if (sound === 'ay-sound') return '-ape, -ake, -ain';
      if (sound === 'i-sound') return '-ine, -ime, -ike';
      if (sound === 'oo-sound') return '-oom, -ew';
      if (sound === 'or-sound') return '-ort, -orce';
      if (sound === 'e-sound') return '-ed, -est';
      if (sound === 'y-sound') return '-ly';
      if (sound === 'shun-sound') return '-tion, -sion';
      if (sound === 'ing-sound') return '-ing';
      return sound.replace('-sound', '');
    });

    if (readableLabels.length === 1) {
      return `${readableLabels[0]} sounds`;
    } else {
      return `${readableLabels.join(', ')} sounds`;
    }
  };

  const toggleGroupExpansion = (groupIndex) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupIndex)) {
      newExpanded.delete(groupIndex);
    } else {
      newExpanded.add(groupIndex);
    }
    setExpandedGroups(newExpanded);
  };

  const displayedGroups = showAllGroups ? rhymeGroups : rhymeGroups.slice(0, 6);

  return (
    <div className="space-y-3">
      {displayedGroups.map((group, index) => {
        const isExpanded = expandedGroups.has(index);
        const wordsToShow = isExpanded ? group.words : group.words.slice(0, 8);
        const hasMoreWords = group.words.length > 8;
        
        return (
          <div key={index} className={`p-3 rounded border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {group.count} words with {formatRhymeSound(group.rhymeSound, group.words)}
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              {wordsToShow.map((word, wordIndex) => (
                <button
                  key={wordIndex}
                  onClick={() => onWordClick(word)}
                  className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-white hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {word}
                </button>
              ))}
              {hasMoreWords && !isExpanded && (
                <button
                  onClick={() => toggleGroupExpansion(index)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-blue-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-blue-600'
                  }`}
                >
                  +{group.words.length - 8} more
                </button>
              )}
              {hasMoreWords && isExpanded && (
                <button
                  onClick={() => toggleGroupExpansion(index)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-blue-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-blue-600'
                  }`}
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      {rhymeGroups.length > 6 && (
        <div className="text-center">
          <button
            onClick={() => setShowAllGroups(!showAllGroups)}
            className={`px-4 py-2 rounded transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {showAllGroups 
              ? 'Show Less Groups' 
              : `Show ${rhymeGroups.length - 6} More Groups`
            }
          </button>
        </div>
      )}
    </div>
  );
};

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Header */}
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

      {/* Universal Search Bar - Show for all tabs except upload and stats */}
      {!['upload', 'stats', 'analysis'].includes(activeTab) && !showManual && (
        <>
          <div className="relative mobile-search">
            {/* Dynamic icon based on active tab */}
            {activeTab === 'search' && <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'dictionary' && <Book className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'synonyms' && <Shuffle className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'rhymes' && <Music className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            {activeTab === 'analysis' && <BarChart3 className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} w-5 h-5`} />}
            
            <input
              type="text"
              placeholder={
                activeTab === 'search' ? 'Search lyrics... (use "quotes" for exact)' :
                activeTab === 'dictionary' ? "Enter a word to get its definition..." :
                activeTab === 'synonyms' ? "Find synonyms and antonyms..." :
                activeTab === 'rhymes' ? "Find words that rhyme..." : 
                activeTab === 'analysis' ? "Analyze your lyrics..." : ""
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
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors ${                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            
            </div>

            {/* Dynamic search button - below search bar */}
            {activeTab !== 'search' && activeTab !== 'analysis' && (
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
        </>
      )}
        </div>  {/* Add this closing div for the header */}
      </div>
      

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 mobile-content">
        {/* Manual Content */}
        {showManual && (
          <div className={`rounded-lg border p-6 mb-6 transition-colors ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                User Manual
              </h2>
              <button
                onClick={() => setShowManual(false)}
                className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {manualLoading ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading manual...
              </div>
            ) : (
              <div className={`whitespace-pre-line leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {manualContent.split('\n').map((line, index) => {
                  // Make section headers bold (lines that are all caps or start with caps and don't have lowercase)
                  const isHeader = line.match(/^[A-Z][A-Z\s-]*$/) && line.trim().length > 0;
                  const isSubHeader = line.match(/^[A-Z][a-z\s]*:$/) && line.trim().length > 0;
                  
                  if (isHeader) {
                    return (
                      <div key={index} className={`font-bold text-lg mt-6 mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {line}
                      </div>
                    );
                  } else if (isSubHeader) {
                    return (
                      <div key={index} className={`font-semibold mt-4 mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {line}
                      </div>
                    );
                  } else {
                    return <div key={index}>{line}</div>;
                  }
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Only show when manual is closed */}
        {!showManual && (
          <>
            {/* Search Tab */}
            {activeTab === 'search' && (
              <div>
                {(searchQuery || highlightWord) ? (
                  <div>
                    <div className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Found {searchResults.reduce((total, result) => total + result.matchCount, 0)} matches 
                      in {searchResults.length} verse{searchResults.length !== 1 ? 's' : ''}{' '}
                      for "{searchQuery || highlightWord}"
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
                          <div className="flex items-center justify-between mb-3">
                            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {result.songTitle}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {result.matchCount} match{result.matchCount !== 1 ? 'es' : ''}
                              </span>
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Verse {result.verseIndex} • Line {result.lineNumber}
                              </span>
                            </div>
                          </div>
                          
                          <div className={`text-sm leading-relaxed whitespace-pre-line ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {highlightText(result.verseContent, searchQuery || highlightWord, result.isExactMatch)}
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

            {/* Dictionary Tab */}
            {activeTab === 'dictionary' && (
              <div>
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
                {synonymLoading && (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Finding synonyms and antonyms...
                  </div>
                )}

                {synonymResults && (
                  <div className="grid gap-6 md:grid-cols-2 mobile-grid">
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
                              onClick={() => searchInLyrics(word.word, 'rhymes')}  // Route to rhymes tab
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
                              onClick={() => searchInLyrics(word.word, 'rhymes')}  // Route to rhymes tab
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
                              onClick={() => searchInLyrics(word.word, 'dictionary')}  // Route to dictionary tab
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
                              onClick={() => searchInLyrics(word.word, 'dictionary')}
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
                              onClick={() => searchInLyrics(word.word, 'dictionary')}
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

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <button
                    onClick={() => {
                      if (songs.length === 0) {
                        alert('Please upload some songs first!');
                        return;
                      }
                      const rhymeDict = generateRhymingDictionary(songs);
                      setAnalysisResults(rhymeDict);
                      setAnalysisType('rhyming-dictionary');
                    }}
                    className={`p-4 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <h3 className="font-medium mb-2">Rhyming Dictionary</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Generate from your lyrics
                    </p>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (songs.length === 0) {
                        alert('Please upload some songs first!');
                        return;
                      }
                      const report = generateWordFrequencyReport(songs);
                      setAnalysisResults(report);
                      setAnalysisType('word-frequency');
                    }}
                    className={`p-4 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <h3 className="font-medium mb-2">Word Frequency</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Most used words report
                    </p>
                  </button>
                  
                  <div className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className="font-medium mb-2">Analyze Song</h3>
                    <select
                      value={selectedSongForAnalysis || ''}
                      onChange={(e) => setSelectedSongForAnalysis(e.target.value)}
                      className={`w-full p-2 rounded border text-sm mb-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select a song...</option>
                      {songs.map(song => (
                        <option key={song.id} value={song.id.toString()}>{song.title}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { // No longer needs to be async
                          if (!selectedSongForAnalysis) return;
                          const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
                          if (!song) return;

                          setAnalysisResults(null); 
                          setAnalysisType('rhyme-scheme-loading');
                          
                          try {
                            // Pass the imported map here
                            const structuredLyrics = analyzeFullTextRhymes(song.lyrics, songVocabularyPhoneticMap); 
                            setAnalysisResults({ song, structuredLyrics });
                            setAnalysisType('rhyme-scheme');
                          } catch (error) {
                            console.error('Error in phonetic rhyme analysis:', error);
                            alert('An error occurred during rhyme analysis.');
                            setAnalysisType(null);
                          }
                        }}
                        disabled={!selectedSongForAnalysis}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          selectedSongForAnalysis
                            ? darkMode
                              ? 'bg-black hover:bg-gray-800 text-white'
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                            : darkMode
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Rhyme Scheme
                      </button>
                      <button
                        onClick={() => {
                          if (!selectedSongForAnalysis) return;
                          const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
                          if (!song) {
                            console.error('Song not found:', selectedSongForAnalysis);
                            return;
                          }
                          try {
                            const meterAnalysis = analyzeMeter(song.lyrics);
                            setAnalysisResults({song, meterAnalysis});
                            setAnalysisType('meter-analysis');
                          } catch (error) {
                            console.error('Error in meter analysis:', error);
                            alert('Error analyzing syllables. Please try again.');
                          }
                        }}
                        disabled={!selectedSongForAnalysis}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          selectedSongForAnalysis
                            ? darkMode
                              ? 'bg-black hover:bg-gray-800 text-white'
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                            : darkMode
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Syllables
                      </button>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className="font-medium mb-2">Quick Stats</h3>
                    <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div>{songs.length} songs</div>
                      <div>{stats.totalWords.toLocaleString()} words</div>
                      <div>{stats.uniqueWords.toLocaleString()} unique</div>
                    </div>
                  </div>
                </div>
                
                {/* Analysis Results */}
                {analysisResults && (
                  <div className={`rounded-lg border p-6 transition-colors ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {analysisType === 'rhyming-dictionary' && (
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Your Personal Rhyming Dictionary
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(analysisResults).slice(0, 20).map(([rhymeKey, words]) => (
                            <div key={rhymeKey} className={`p-3 rounded border ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className={`font-medium text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Words ending in "-{rhymeKey}"
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {words.map((word, index) => (
                                  <span key={word}>
                                    <span
                                      onClick={() => searchInLyrics(word, 'search')}
                                      className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                                        darkMode 
                                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                                          : 'bg-white hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {word}
                                    </span>
                                    {index < words.length - 1 && (
                                      <span className={`text-xs mx-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        ,&nbsp;&nbsp;
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {Object.keys(analysisResults).length > 20 && (
                          <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Showing first 20 rhyme groups. Total: {Object.keys(analysisResults).length}
                          </p>
                        )}
                      </div>
                    )}           

                    {analysisType === 'rhyme-scheme-loading' && (
                       <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Analyzing Rhymes...</div>
                    )}

                    {analysisType === 'rhyme-scheme' && (
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Rhyme Analysis: "{analysisResults.song.title}"
                        </h3>
                        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                          <HighlightedLyrics 
                            structuredLyrics={analysisResults.structuredLyrics}
                            darkMode={darkMode} 
                          />
                        </div>
                      </div>
                    )}
                      
                    {analysisType === 'word-frequency' && (
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Word Frequency Report
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3 mb-6">
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {analysisResults.totalWords.toLocaleString()}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Total Words
                            </div>
                          </div>
                          <div className={`p-4 rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                         }`}>
                           <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                             {analysisResults.totalUniqueWords.toLocaleString()}
                           </div>
                           <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                             Unique Words
                           </div>
                         </div>
                         <div className={`p-4 rounded border ${
                           darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                         }`}>
                           <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                             {((analysisResults.totalUniqueWords / analysisResults.totalWords) * 100).toFixed(1)}%
                           </div>
                           <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                             Vocabulary Richness
                           </div>
                         </div>
                       </div>
                       
                       <div className="space-y-2 max-h-96 overflow-y-auto">
                         {analysisResults.topWords.map((item, index) => (
                           <div key={item.word} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                             <div className="flex items-center">
                               <span className={`text-sm w-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                 {index + 1}.
                               </span>
                               <button
                                 onClick={() => searchInLyrics(item.word)}
                                 className={`font-medium underline transition-colors ${
                                   darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                                 }`}
                               >
                                 {item.word}
                               </button>
                             </div>
                             <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {item.count} times ({item.percentage}%)
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   {analysisType === 'meter-analysis' && (
                   <div>
                     <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       Syllable & Meter Analysis: "{analysisResults.song.title}"
                     </h3>
                     
                     <div className="space-y-2">
                       {analysisResults.meterAnalysis.map((lineData, index) => (
                         <div key={index} className="flex items-center gap-4 py-2">
                           <span className={`w-12 text-center font-mono text-sm font-bold flex-shrink-0 ${
                             darkMode ? 'text-blue-400' : 'text-blue-600'
                           }`}>
                             {lineData.syllables}
                           </span>
                           <span className={`flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                             {lineData.line.trim() || '(empty line)'}
                           </span>
                           <span className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                             {lineData.words} words
                           </span>
                         </div>
                       ))}
                     </div>
                     
                     <div className={`mt-4 p-4 rounded border ${
                       darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                     }`}>
                       <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         <div>
                           <strong>Average syllables per line:</strong> {
                             (analysisResults.meterAnalysis.reduce((sum, line) => sum + line.syllables, 0) / 
                             Math.max(1, analysisResults.meterAnalysis.filter(line => line.line.trim()).length)).toFixed(1)
                           }
                         </div>
                         <div>
                           <strong>Total lines:</strong> {analysisResults.meterAnalysis.filter(line => line.line.trim()).length}
                         </div>
                         <div>
                           <strong>Syllable range:</strong> {
                             Math.min(...analysisResults.meterAnalysis.filter(line => line.line.trim()).map(line => line.syllables))
                           } - {
                             Math.max(...analysisResults.meterAnalysis.filter(line => line.line.trim()).map(line => line.syllables))
                           }
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
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
                   <div className="flex items-center justify-between mb-4">
                     <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       Your Songs ({songs.length})
                     </h3>
                     <button
                       onClick={deleteAllSongs}
                       className={`px-3 py-1 rounded text-sm transition-colors ${
                         darkMode 
                           ? 'bg-red-800 hover:bg-red-700 text-red-200' 
                           : 'bg-red-600 hover:bg-red-700 text-white'
                       }`}
                     >
                       <Trash2 className="w-4 h-4 inline mr-1" />
                       Delete All
                     </button>
                   </div>
                   <div className="grid gap-3">
                     {songs.map((song) => (
                       <div key={song.id} className={`rounded-lg border p-4 transition-colors ${
                         darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <FileText className={`w-5 h-5 mr-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                             <div>
                               <div className="flex items-center gap-2">
                                 <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                   {song.title}
                                 </h4>
                                 {song.isExample && (
                                   <span className={`text-xs px-2 py-1 rounded-full ${
                                     darkMode 
                                       ? 'bg-blue-900 text-blue-200 border border-blue-700' 
                                       : 'bg-blue-100 text-blue-800 border border-blue-200'
                                   }`}>
                                     Example
                                   </span>
                                 )}
                               </div>
                               <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                 {song.wordCount} words • Added {new Date(song.dateAdded).toLocaleDateString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => setSelectedSong(song)}
                               className={`text-sm underline transition-colors ${
                                 darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                               }`}
                             >
                               View
                             </button>
                             <button
                               onClick={() => deleteSong(song.id)}
                               className={`p-1 rounded transition-colors ${
                                 darkMode 
                                   ? 'text-red-400 hover:bg-red-900 hover:text-red-300' 
                                   : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                               }`}
                               title="Delete song"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
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
               {/* Song Selection Dropdown */}
               <div className={`rounded-lg border p-4 transition-colors ${
                 darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
               }`}>
                 <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                   Analyze Statistics For:
                 </label>
                 <select
                   value={selectedStatsFilter}
                   onChange={(e) => setSelectedStatsFilter(e.target.value)}
                   className={`w-full max-w-md p-2 rounded border ${
                     darkMode 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-white border-gray-300 text-gray-900'
                   }`}
                 >
                   <option value="all">All Songs ({songs.length} songs)</option>
                   {songs.map(song => (
                     <option key={song.id} value={song.id.toString()}>
                       {song.title}
                     </option>
                   ))}
                 </select>
               </div>

               {/* Basic Overview Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className={`rounded-lg border p-4 text-center transition-colors ${
                   darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                 }`}>
                   <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     {stats.totalSongs}
                   </div>
                   <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                     {selectedStatsFilter === 'all' ? 'Total Songs' : 'Selected Song'}
                   </div>
                 </div>
                 <div className={`rounded-lg border p-4 text-center transition-colors ${
                   darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                 }`}>
                   <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     {stats.totalWords.toLocaleString()}
                   </div>
                   <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                     Total Words
                   </div>
                 </div>
                 <div className={`rounded-lg border p-4 text-center transition-colors ${
                   darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                 }`}>
                   <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     {stats.uniqueWords.toLocaleString()}
                   </div>
                   <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                     Unique Words
                   </div>
                 </div>
                 <div className={`rounded-lg border p-4 text-center transition-colors ${
                   darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                 }`}>
                   <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     {stats.totalWords > 0 ? ((stats.uniqueWords / stats.totalWords) * 100).toFixed(1) : 0}%
                   </div>
                   <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                     Vocabulary Richness
                   </div>
                 </div>
               </div>

               {/* Structure & Composition Stats */}
               <div className={`rounded-lg border p-6 transition-colors ${
                 darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
               }`}>
                 <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                   Structure & Composition
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="text-center">
                     <div className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       {stats.averageLinesPerSong}
                     </div>
                     <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Avg Lines Per Song
                     </div>
                   </div>
                   <div className="text-center">
                     <div className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       {stats.averageWordsPerSong}
                     </div>
                     <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Avg Words Per Song
                     </div>
                   </div>
                   <div className="text-center">
                     <div className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       {stats.averageWordLength}
                     </div>
                     <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Avg Word Length
                     </div>
                   </div>
                   <div className="text-center">
                     <div className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       {stats.averageSyllablesPerWord}
                     </div>
                     <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Avg Syllables Per Word
                     </div>
                   </div>
                 </div>
               </div>

               {/* Syllable Distribution */}
               <div className={`rounded-lg border p-6 transition-colors ${
                 darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
               }`}>
                 <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                   Syllable Distribution
                 </h3>
                 <div className="space-y-3">
                   {Object.entries(stats.syllableDistribution)
                     .sort(([a], [b]) => {
                       if (a === '5+') return 1;
                       if (b === '5+') return -1;
                       return parseInt(a) - parseInt(b);
                     })
                     .map(([syllables, count]) => {
                       const percentage = stats.totalWords > 0 ? (count / stats.totalWords * 100).toFixed(1) : 0;
                       return (
                         <div key={syllables} className="flex items-center justify-between">
                           <div className="flex items-center w-1/3">
                             <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                               {syllables} syllable{syllables !== '1' ? 's' : ''}
                             </span>
                           </div>
                           <div className="flex-1 mx-4">
                             <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                               <div 
                                 className="h-2 rounded-full bg-blue-500"
                                 style={{ width: `${Math.min(100, percentage * 2)}%` }}
                               ></div>
                             </div>
                           </div>
                           <div className={`text-sm w-20 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                             {count} ({percentage}%)
                           </div>
                         </div>
                       );
                     })}
                 </div>
               </div>

               {/* Word Length Distribution */}
               <div className={`rounded-lg border p-6 transition-colors ${
                 darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
               }`}>
                 <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                   Word Length Distribution
                 </h3>
                 <div className="space-y-3">
                   {Object.entries(stats.wordLengthDistribution)
                     .sort(([a], [b]) => {
                       if (a === '11+') return 1;
                       if (b === '11+') return -1;
                       return parseInt(a) - parseInt(b);
                     })
                     .map(([length, count]) => {
                       const percentage = stats.totalWords > 0 ? (count / stats.totalWords * 100).toFixed(1) : 0;
                       return (
                         <div key={length} className="flex items-center justify-between">
                           <div className="flex items-center w-1/3">
                             <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                               {length} character{length !== '1' ? 's' : ''}
                             </span>
                           </div>
                           <div className="flex-1 mx-4">
                             <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                               <div 
                                 className="h-2 rounded-full bg-green-500"
                                 style={{ width: `${Math.min(100, percentage * 2)}%` }}
                               ></div>
                             </div>
                           </div>
                           <div className={`text-sm w-20 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                             {count} ({percentage}%)
                           </div>
                         </div>
                       );
                     })}
                 </div>
               </div>
{/* Reading Level & Complexity */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className={`rounded-lg border p-6 transition-colors ${
                   darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                 }`}>
                   <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     Reading Level
                   </h3>
                   <div className="text-center">
                     <div className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       {stats.readingLevel.toFixed(1)}
                     </div>
                     <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Flesch-Kincaid Grade Level
                     </div>
                     <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                       {stats.readingLevel < 6 ? 'Elementary' :
                        stats.readingLevel < 9 ? 'Middle School' :
                        stats.readingLevel < 13 ? 'High School' :
                        stats.readingLevel < 16 ? 'College' : 'Graduate'}
                     </div>
                   </div>
                 </div>

                 <div className={`rounded-lg border p-6 transition-colors ${
                   darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                 }`}>
                   <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     Vocabulary Complexity
                   </h3>
                   <div className="text-center">
                     <div className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                       {stats.vocabularyComplexity.toFixed(1)}
                     </div>
                     <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Complexity Score
                     </div>
                     <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                       {stats.vocabularyComplexity < 2 ? 'Simple' :
                        stats.vocabularyComplexity < 3 ? 'Moderate' :
                        stats.vocabularyComplexity < 4 ? 'Complex' : 'Very Complex'}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Rhyme Analysis */}
               <div className={`rounded-lg border p-6 transition-colors ${
                 darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
               }`}>
                 <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                   Rhyme Analysis
                 </h3>
                 
                 {/* Rhyme Stats Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                   <div className="text-center">
                     <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                       {stats.rhymeStats.perfectRhymes}
                     </div>
                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Perfect Rhymes
                     </div>
                   </div>
                   <div className="text-center">
                     <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                       {stats.rhymeStats.nearRhymes}
                     </div>
                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Near Rhymes
                     </div>
                   </div>
                   <div className="text-center">
                     <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                       {stats.rhymeStats.soundsLike}
                     </div>
                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Sounds Like
                     </div>
                   </div>
                   <div className="text-center">
                     <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                       {stats.rhymeStats.internalRhymes}
                     </div>
                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Internal Rhymes
                     </div>
                   </div>
                   <div className="text-center">
                     <div className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                       {stats.rhymeStats.rhymeDensity.toFixed(1)}%
                     </div>
                     <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       Rhyme Density
                     </div>
                   </div>
                 </div>

                 {/* Top Rhyme Groups */}
                 {stats.rhymeStats.allRhymeGroups.length > 0 && (
                   <div>
                     <h4 className={`text-md font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                       Top Rhyme Groups
                     </h4>
                     <RhymeGroupsDisplay 
                       rhymeGroups={stats.rhymeStats.allRhymeGroups}
                       darkMode={darkMode}
                       onWordClick={(word) => {
                         handleSearch(word);
                         setActiveTab('search');
                       }}
                     />
                   </div>
                 )}
               </div>
               {/* Most Used Words - Enhanced */}
               {stats.mostUsedWords.length > 0 && (
                 <div className={`rounded-lg border p-6 transition-colors ${
                   darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                 }`}>
                   <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                     Most Used Words
                   </h3>
                   <div className="space-y-2">
                     {stats.mostUsedWords.map(([word, count], index) => {
                       const percentage = stats.totalWords > 0 ? (count / stats.totalWords * 100).toFixed(2) : 0;
                       return (
                         <div key={word} className="flex items-center justify-between">
                           <div className="flex items-center">
                             <span className={`text-sm w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                               {index + 1}.
                             </span>
                             <button
                               onClick={() => {
                                 handleSearch(word);
                                 setActiveTab('search');
                               }}
                               className={`underline transition-colors ${
                                 darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                               }`}
                             >
                               {word}
                             </button>
                           </div>
                           <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                             {count} times ({percentage}%)
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>
           )}
         </>
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