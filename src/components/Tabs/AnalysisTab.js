import React from 'react';
import { generateRhymingDictionary, analyzeMeter, analyzeMeterPatterns, calculateFlowConsistency, analyzeRhythmVariation, performWritingQualityAnalysis } from '../../utils/textAnalysis';
import { analyzeFullTextRhymes } from '../../utils/phoneticUtils';
import { songVocabularyPhoneticMap } from '../../data/songVocabularyPhoneticMap';
import HighlightedLyrics from '../Analysis/HighlightedLyrics';

const AnalysisTab = ({ 
  songs,
  selectedSongForAnalysis,
  setSelectedSongForAnalysis,
  analysisResults,
  setAnalysisResults,
  analysisType,
  setAnalysisType,
  onSearchInLyrics,
  stats,
  darkMode 
}) => {
  const handleRhymingDictionary = () => {
    if (songs.length === 0) {
      alert('Please upload some songs first!');
      return;
    }
    const rhymeDict = generateRhymingDictionary(songs);
    setAnalysisResults(rhymeDict);
    setAnalysisType('rhyming-dictionary');
  };

  const handleFlowRhythm = () => {
    if (!selectedSongForAnalysis) return;
    const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
    if (!song) return;

    setAnalysisResults(null); 
    setAnalysisType('flow-rhythm-loading');
    
    try {
      // Analyze meter patterns
      const meterAnalysis = analyzeMeterPatterns(song.lyrics, songVocabularyPhoneticMap);
      
      // Calculate flow consistency
      const flowConsistency = calculateFlowConsistency(meterAnalysis);
      
      // Analyze rhythm variation
      const rhythmVariation = analyzeRhythmVariation(meterAnalysis);
      
      setAnalysisResults({
        song,
        meterAnalysis,
        flowConsistency,
        rhythmVariation
      });
      setAnalysisType('flow-rhythm');
    } catch (error) {
      console.error('Error in flow & rhythm analysis:', error);
      alert('An error occurred during flow & rhythm analysis.');
      setAnalysisType(null);
    }
  };

  const handleWritingQuality = () => {
    if (!selectedSongForAnalysis) return;
    const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
    if (!song) return;

    setAnalysisResults(null); 
    setAnalysisType('writing-quality-loading');
    
    try {
      const qualityAnalysis = performWritingQualityAnalysis(song.lyrics);
      
      setAnalysisResults({
        song,
        ...qualityAnalysis
      });
      setAnalysisType('writing-quality');
    } catch (error) {
      console.error('Error in writing quality analysis:', error);
      alert('An error occurred during writing quality analysis.');
      setAnalysisType(null);
    }
  };

  const handleRhymeScheme = () => {
    if (!selectedSongForAnalysis) return;
    const song = songs.find(s => s.id.toString() === selectedSongForAnalysis.toString());
    if (!song) return;

    setAnalysisResults(null); 
    setAnalysisType('rhyme-scheme-loading');
    
    try {
      const structuredLyrics = analyzeFullTextRhymes(song.lyrics, songVocabularyPhoneticMap); 
      setAnalysisResults({ song, structuredLyrics });
      setAnalysisType('rhyme-scheme');
    } catch (error) {
      console.error('Error in phonetic rhyme analysis:', error);
      alert('An error occurred during rhyme analysis.');
      setAnalysisType(null);
    }
  };

  const handleMeterAnalysis = () => {
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
  };

  return (
    <div>
      {/* Song Selection - Moved to Top */}
      <div className={`p-4 rounded-lg border mb-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className="font-medium mb-2">Select Song to Analyze</h3>
        <select
          value={selectedSongForAnalysis || ''}
          onChange={(e) => setSelectedSongForAnalysis(e.target.value)}
          className={`w-full max-w-md p-3 rounded border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">Choose a song...</option>
          {songs.map(song => (
            <option key={song.id} value={song.id.toString()}>{song.title}</option>
          ))}
        </select>
      </div>

      {/* Analysis Buttons Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <button
          onClick={handleRhymingDictionary}
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
          onClick={handleRhymeScheme}
          disabled={!selectedSongForAnalysis}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Rhyme Scheme</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Visualize rhyming patterns
          </p>
        </button>

        <button
          onClick={handleMeterAnalysis}
          disabled={!selectedSongForAnalysis}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Syllables</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Count syllables & analyze meter
          </p>
        </button>
        
        <button
          onClick={handleFlowRhythm}
          disabled={!selectedSongForAnalysis}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Flow & Rhythm</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Analyze meter and flow patterns
          </p>
        </button>

        <button
          onClick={handleWritingQuality}
          disabled={!selectedSongForAnalysis}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSongForAnalysis
              ? darkMode 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
              : darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <h3 className="font-medium mb-2">Writing Quality</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Detect weak words, clichés & power words
          </p>
        </button>
      </div>

      {/* Quick Stats - Moved to Bottom */}
      <div className={`p-4 rounded-lg border mb-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className="font-medium mb-2">Quick Stats</h3>
        <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div>{songs.length} songs loaded</div>
          <div>{stats.totalWords.toLocaleString()} total words</div>
          <div>{stats.uniqueWords.toLocaleString()} unique words</div>
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
                            onClick={() => onSearchInLyrics(word, 'search')}
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
            
          {analysisType === 'flow-rhythm-loading' && (
             <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Analyzing Flow & Rhythm...</div>
          )}

          {analysisType === 'flow-rhythm' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Flow & Rhythm Analysis: "{analysisResults.song.title}"
              </h3>
              
              {/* Overall Scores */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    analysisResults.flowConsistency >= 0.8 ? 'text-green-500' :
                    analysisResults.flowConsistency >= 0.6 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(analysisResults.flowConsistency * 100).toFixed(0)}%
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Flow Consistency
                  </div>
                </div>
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analysisResults.rhythmVariation?.sections || 0}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sections Detected
                  </div>
                </div>
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    analysisResults.rhythmVariation?.variation === 'low' ? 'text-blue-500' :
                    analysisResults.rhythmVariation?.variation === 'moderate' ? 'text-yellow-500' : 'text-purple-500'
                  }`}>
                    {analysisResults.rhythmVariation?.variation === 'low' ? 'Low' :
                     analysisResults.rhythmVariation?.variation === 'moderate' ? 'Med' : 'High'}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rhythm Variation
                  </div>
                </div>
              </div>

              {/* Rhythm Variation Summary */}
              {analysisResults.rhythmVariation && (
                <div className={`p-4 rounded border mb-6 ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rhythm Analysis Summary
                  </h4>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {analysisResults.rhythmVariation.summary}
                  </p>
                </div>
              )}

              {/* Section Breakdown */}
              {analysisResults.rhythmVariation?.sectionBreakdown && (
                <div className="space-y-4">
                  <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Section Analysis
                  </h4>
                  {analysisResults.rhythmVariation.sectionBreakdown.map((section, index) => (
                    <div key={index} className={`p-4 rounded border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Section {index + 1}
                        </h5>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {section.avgSyllables} avg syllables • {section.dominantMeter} meter
                        </div>
                      </div>
                      <div className="space-y-1">
                        {section.lines.slice(0, 3).map((line, lineIndex) => (
                          <div key={lineIndex} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className={`inline-block w-8 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {line.syllables}
                            </span>
                            {line.text}
                          </div>
                        ))}
                        {section.lines.length > 3 && (
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            ... and {section.lines.length - 3} more lines
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {analysisType === 'writing-quality-loading' && (
             <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Analyzing Writing Quality...</div>
          )}

          {analysisType === 'writing-quality' && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Writing Quality Analysis: "{analysisResults.song.title}"
              </h3>
              
              {/* Quality Score Summary */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-3xl font-bold ${
                    analysisResults.summary.qualityScore >= 80 ? 'text-green-500' :
                    analysisResults.summary.qualityScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {analysisResults.summary.qualityScore}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Quality Score
                  </div>
                </div>
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    analysisResults.summary.totalIssues === 0 ? 'text-green-500' :
                    analysisResults.summary.totalIssues <= 5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {analysisResults.summary.totalIssues}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Issues Found
                  </div>
                </div>
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    analysisResults.summary.strengths >= 10 ? 'text-green-500' :
                    analysisResults.summary.strengths >= 5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {analysisResults.summary.strengths}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Power Words
                  </div>
                </div>
                <div className={`p-4 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-lg font-bold ${
                    analysisResults.summary.qualityScore >= 80 ? 'text-green-500' :
                    analysisResults.summary.qualityScore >= 60 ? 'text-yellow-500' : 'text-orange-500'
                  }`}>
                    {analysisResults.summary.qualityScore >= 80 ? 'Strong' :
                     analysisResults.summary.qualityScore >= 60 ? 'Good' : 'Needs Work'}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Overall Rating
                  </div>
                </div>
              </div>

              {/* Improvement Suggestion */}
              <div className={`p-4 rounded border mb-6 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
              }`}>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  💡 Suggestion
                </h4>
                <p className={`${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                  {analysisResults.summary.improvement}
                </p>
              </div>

              {/* Weak Words */}
              {analysisResults.weakWords.length > 0 && (
                <div className={`p-4 rounded border mb-4 ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                    ⚠️ Weak Words ({analysisResults.weakWords.length})
                  </h4>
                  <div className="space-y-2">
                    {analysisResults.weakWords.slice(0, 10).map((item, index) => (
                      <div key={index} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className={`inline-block w-16 text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                          Line {item.line}
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                          "{item.word}"
                        </span>
                        <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          → {item.suggestion}
                        </span>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.context}
                        </div>
                      </div>
                    ))}
                    {analysisResults.weakWords.length > 10 && (
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ... and {analysisResults.weakWords.length - 10} more weak words
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Clichés */}
              {analysisResults.cliches.length > 0 && (
                <div className={`p-4 rounded border mb-4 ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-orange-50 border-orange-200'
                }`}>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                    🔄 Clichés ({analysisResults.cliches.length})
                  </h4>
                  <div className="space-y-2">
                    {analysisResults.cliches.map((item, index) => (
                      <div key={index} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className={`inline-block w-16 text-xs font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                          Line {item.line}
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                          "{item.phrase}"
                        </span>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          💡 {item.suggestion}
                        </div>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.context}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overused Phrases */}
              {analysisResults.overusedPhrases.length > 0 && (
                <div className={`p-4 rounded border mb-4 ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                    🔁 Overused Phrases ({analysisResults.overusedPhrases.length})
                  </h4>
                  <div className="space-y-2">
                    {analysisResults.overusedPhrases.slice(0, 5).map((item, index) => (
                      <div key={index} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className={`font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                          "{item.phrase}"
                        </span>
                        <span className={`text-xs ml-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          (used {item.count} times)
                        </span>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Lines: {item.instances.map(inst => inst.line).join(', ')}
                        </div>
                      </div>
                    ))}
                    {analysisResults.overusedPhrases.length > 5 && (
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ... and {analysisResults.overusedPhrases.length - 5} more overused phrases
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Power Words */}
              {analysisResults.powerWords.length > 0 && (
                <div className={`p-4 rounded border mb-4 ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
                }`}>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                    ⚡ Power Words ({analysisResults.powerWords.length}) - Great job!
                  </h4>
                  <div className="space-y-2">
                    {analysisResults.powerWords.slice(0, 10).map((item, index) => (
                      <div key={index} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className={`inline-block w-16 text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          Line {item.line}
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                          "{item.word}"
                        </span>
                        <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({item.category})
                        </span>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.context}
                        </div>
                      </div>
                    ))}
                    {analysisResults.powerWords.length > 10 && (
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ... and {analysisResults.powerWords.length - 10} more power words
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Perfect Score Message */}
              {analysisResults.summary.totalIssues === 0 && analysisResults.summary.strengths > 0 && (
                <div className={`p-6 rounded border text-center ${
                  darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="text-4xl mb-2">🎉</div>
                  <p className={`font-bold text-lg mb-2 ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                    Excellent Writing Quality!
                  </p>
                  <p className={`${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    No major issues detected and you're using impactful language. Keep up the great work!
                  </p>
                </div>
              )}
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
  );
};

export default AnalysisTab;