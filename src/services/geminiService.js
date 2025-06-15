import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Initialize with API key from environment variable
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found. Set REACT_APP_GEMINI_API_KEY in your environment.');
      this.genAI = null;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Rate limiting and caching
    this.lastApiCall = 0;
    this.cache = new Map();
    this.rateLimitMs = 10000; // 10 seconds between calls
  }

  // Generate cache key from song content
  generateCacheKey(lyrics, analysisType) {
    const content = `${analysisType}:${lyrics}`;
    return btoa(content).slice(0, 32); // Simple hash
  }

  // Check if we can make an API call (rate limiting)
  canMakeApiCall() {
    const now = Date.now();
    return (now - this.lastApiCall) >= this.rateLimitMs;
  }

  // Get time until next allowed API call
  getTimeUntilNextCall() {
    const now = Date.now();
    const timeSince = now - this.lastApiCall;
    return Math.max(0, this.rateLimitMs - timeSince);
  }

  async analyzeLyricalCoherence(lyrics, songTitle = "Unknown Song") {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized. Please check your API key.');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(lyrics, 'coherence');
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached coherence analysis');
      return { ...this.cache.get(cacheKey), fromCache: true };
    }

    // Check rate limiting
    if (!this.canMakeApiCall()) {
      const waitTime = Math.ceil(this.getTimeUntilNextCall() / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before analyzing again.`);
    }

    try {
      const prompt = this.createCoherenceAnalysisPrompt(lyrics, songTitle);
      
      this.lastApiCall = Date.now();
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      console.log('Raw coherence analysis:', text);
      
      // Clean up the response text
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      
      let analysisData;
      try {
        analysisData = JSON.parse(text);
        
        // Ensure all required fields exist with proper validation
        analysisData.coherenceScore = Math.max(0, Math.min(100, analysisData.coherenceScore || 70));
        analysisData.storyFlow = analysisData.storyFlow || 'fair';
        analysisData.thematicUnity = analysisData.thematicUnity || 'fair';
        analysisData.narrativeConsistency = analysisData.narrativeConsistency || 'fair';
        analysisData.sectionConnections = analysisData.sectionConnections || 'fair';
        analysisData.overallAssessment = analysisData.overallAssessment || 'Analysis completed.';
        analysisData.observations = Array.isArray(analysisData.observations) ? analysisData.observations : [];
        analysisData.references = Array.isArray(analysisData.references) ? analysisData.references : [];
        
      } catch (parseError) {
        console.error('Coherence JSON parse error:', parseError);
        console.error('Failed to parse:', text);
        
        // Fallback response
        analysisData = {
          coherenceScore: 70,
          storyFlow: 'fair',
          thematicUnity: 'fair',
          narrativeConsistency: 'fair',
          sectionConnections: 'fair',
          overallAssessment: 'Analysis completed with technical fallback.',
          observations: ['Song structure is present', 'Try the analysis again for more detailed insights'],
          references: []
        };
      }
      
      const result_data = {
        success: true,
        fromCache: false,
        ...analysisData
      };
      
      // Cache the result
      this.cache.set(cacheKey, result_data);
      
      return result_data;
      
    } catch (error) {
      console.error('Error analyzing lyrical coherence:', error);
      return {
        success: false,
        error: error.message,
        fromCache: false
      };
    }
  }

  createCoherenceAnalysisPrompt(lyrics, songTitle) {
    return `Analyze the lyrical coherence and narrative quality of "${songTitle}".

LYRICS TO ANALYZE:
${lyrics}

Provide OBJECTIVE ANALYSIS ONLY. Do not suggest changes or improvements.

Evaluate these aspects:
1. STORY FLOW: How well the narrative progresses from beginning to end
2. THEMATIC UNITY: How consistently the song maintains its central theme/message  
3. SECTION CONNECTIONS: How well verses, chorus, and bridge connect thematically

Rate each aspect as: "excellent", "good", "fair", or "weak"
Provide an overall coherence score from 0-100 (higher = more coherent).

Focus on ANALYSIS not ADVICE:
- Describe what the song accomplishes narratively
- Identify patterns and techniques observed
- Note structural choices and their effects
- Assess clarity and consistency objectively

IDENTIFY REFERENCES:
Look for allusions, references, or connections to:
- Biblical stories, mythology, folklore
- Literature, poetry, famous quotes
- Historical events, figures, or periods
- Pop culture, movies, TV shows, other songs
- Cultural symbols, idioms, or sayings
- Geographic locations with cultural significance

For each reference found, categorize the type and explain the connection clearly.

Return JSON with this EXACT structure in mind:
{
  "coherenceScore": 0-100,
  "storyFlow": "excellent", "good", "fair", or "weak",
  "thematicUnity": "excellent", "good", "fair", or "weak",
  "narrativeConsistency": "excellent", "good", "fair", or "weak",
  "sectionConnections": "excellent", "good", "fair", or "weak",
  "overallAssessment": "Long explanatory objective summary of what the lyrics accomplish and how they function",
  "references": [
    {
      "type": "biblical",
      "reference": "Garden of Eden imagery",
      "context": "Lines about paradise lost and innocence",
      "explanation": "Alludes to the biblical story of Adam and Eve's fall from grace"
    },
    {
      "type": "literary",
      "reference": "Romeo and Juliet",
      "context": "Star-crossed lovers theme",
      "explanation": "References Shakespeare's tragic romance about forbidden love"
    }
  ]
}`;
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
  }
}

const geminiServiceInstance = new GeminiService();
export default geminiServiceInstance;