import { env } from '@/lib/env';

interface AnalysisResponse {
  thematicWords: string[];
  keyWords: Array<{
    word: string;
    importance: number;
    reason: string;
  }>;
  keySentences: Array<{
    sentence: string;
    importance: number;
    reason: string;
  }>;
  backgroundKnowledge: Array<{
    topic: string;
    description: string;
    relevance: string;
  }>;
}

export async function analyzeArticleContent(content: string): Promise<AnalysisResponse> {
  try {
    const response = await fetch(env.OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'English Learning System'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet',
        messages: [{
          role: 'user',
          content: `Analyze the following English text and provide a structured analysis. Return ONLY a JSON object with the following structure, no other text:
          {
            "thematicWords": ["word1", "word2", ...],
            "keyWords": [
              {
                "word": "example",
                "importance": 5,
                "reason": "explanation"
              }
            ],
            "keySentences": [
              {
                "sentence": "example sentence",
                "importance": 5,
                "reason": "explanation"
              }
            ],
            "backgroundKnowledge": [
              {
                "topic": "topic name",
                "description": "description",
                "relevance": "relevance explanation"
              }
            ]
          }

          Text to analyze: ${content}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    
    // Parse the JSON string from the AI response
    try {
      const analysisResult = JSON.parse(data.choices[0].message.content);
      return analysisResult;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    console.error('Error analyzing article:', error);
    throw error;
  }
}