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
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async analyzeRhymeQuality(rhymeGroups, songTitle = "Unknown Song") {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized. Please check your API key.');
    }

    try {
      const prompt = this.createRhymeAnalysisPrompt(rhymeGroups, songTitle);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      console.log('Raw AI response:', text); // Debug log
      
      // Clean up the response text to extract JSON
      text = text.trim();
      
      // Sometimes AI adds markdown code blocks, remove them
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON within the response if it's not pure JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      
      console.log('Cleaned text for parsing:', text); // Debug log
      
      // Parse the JSON response
      let analysisData;
      try {
        analysisData = JSON.parse(text);
        
        // Ensure all required fields exist
        if (!analysisData.insights) analysisData.insights = [];
        if (!analysisData.groupRatings) analysisData.groupRatings = [];
        if (!analysisData.overallAssessment) analysisData.overallAssessment = 'Analysis completed.';
        if (!analysisData.suggestions) analysisData.suggestions = [];
        
        // Fix any formatting issues in group ratings
        if (analysisData.groupRatings) {
          analysisData.groupRatings = analysisData.groupRatings.map(rating => ({
            ...rating,
            words: Array.isArray(rating.words) ? rating.words : (rating.words || '').split(/[\s,]+/).filter(w => w.length > 0)
          }));
        }
        
        console.log('Processed AI analysis data:', analysisData);
        
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Text that failed to parse:', text);
        
        // Fallback: create a basic response
        analysisData = {
          insights: ['AI analysis encountered a formatting issue.'],
          groupRatings: rhymeGroups.slice(0, 3).map((group, index) => ({
            groupIndex: index + 1,
            rating: 'good',
            comment: 'Technical analysis shows this as a valid rhyme group.',
            words: group.words || []
          })),
          overallAssessment: 'Technical analysis available above.',
          suggestions: ['Try the analysis again for more detailed AI insights.']
        };
      }
      
      return {
        success: true,
        insights: analysisData.insights,
        groupRatings: analysisData.groupRatings,
        overallAssessment: analysisData.overallAssessment,
        suggestions: analysisData.suggestions
      };
      
    } catch (error) {
      console.error('Error analyzing rhyme quality:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  createRhymeAnalysisPrompt(rhymeGroups, songTitle) {
    const groupsText = rhymeGroups.map((group, index) => 
      `Group ${index + 1} - ${group.rhymeSound} (${group.count} words): [${group.words.join(', ')}]`
    ).join('\n');

    return `Analyze rhyme quality in "${songTitle}". You MUST analyze ALL groups provided and include ALL words.

RHYME GROUPS TO ANALYZE:
${groupsText}

STRICT REQUIREMENTS:
1. Analyze ALL ${rhymeGroups.length} groups above - NO EXCEPTIONS
2. Include ALL words from each group in your response - DO NOT OMIT ANY
3. Rate each group: "excellent", "good", "fair", or "weak"
4. Explain why each group works or doesn't work

Return JSON with this EXACT structure:
{
  "insights": [
    "Insight about overall rhyme patterns",
    "Another specific insight"
  ],
  "groupRatings": [
    {
      "groupIndex": 1,
      "rating": "excellent",
      "comment": "Explanation of why this group works",
      "words": ["include", "every", "single", "word", "from", "the", "group"]
    }
  ],
  "overallAssessment": "Summary of rhyme scheme quality",
  "suggestions": [
    "Specific improvement suggestion"
  ]
}

CRITICAL: You must create a groupRating entry for each of the ${rhymeGroups.length} groups listed above. Include every word shown in each group.`;
  }
}

export default new GeminiService();