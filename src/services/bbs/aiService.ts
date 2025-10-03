const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const modelName = 'gemini-1.5-flash'; // use stable version instead of -latest to reduce 429
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  overallScore: number;
  recommendations: string[];
  mitigationStrategies: string[];
}

export interface SafetyInsight {
  trend: 'improving' | 'declining' | 'stable';
  keyAreas: string[];
  recommendations: string[];
  trainingNeeds: string[];
}

/**
 * Call Gemini API with retry + exponential backoff for rate limits (429).
 */
async function callGemini(prompt: string, retries = 3, delay = 1000): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // Handle rate limiting (429)
    if (res.status === 429) {
      if (attempt < retries) {
        console.warn(`Rate limited. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // exponential backoff
        continue;
      }
      throw new Error("Gemini API rate limit exceeded (429). Try again later.");
    }

    // Other errors
    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  throw new Error("Gemini API request failed after retries.");
}

export const aiService = {
  async analyzeRisk(observation: any): Promise<RiskAssessment> {
    try {
      const prompt = `
        Analyze this safety observation and provide a comprehensive risk assessment:

        Type: ${observation.observationType}
        Category: ${observation.category}
        Description: ${observation.description}
        Severity: ${observation.severity}
        Location: ${observation.location?.area}

        Please provide:
        1. Risk level (low/medium/high/critical)
        2. Probability score (1-10)
        3. Impact score (1-10)
        4. Overall risk score (1-100)
        5. 3-5 specific recommendations
        6. 3-5 mitigation strategies

        Return as JSON format with keys: riskLevel, probability, impact, overallScore, recommendations, mitigationStrategies
      `;

      const text = await callGemini(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      // fallback if parsing fails
      return {
        riskLevel: observation.severity as any,
        probability: 5,
        impact: 5,
        overallScore: 50,
        recommendations: ['Review safety procedures', 'Provide additional training'],
        mitigationStrategies: ['Implement immediate controls', 'Monitor closely']
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        riskLevel: observation.severity as any,
        probability: 5,
        impact: 5,
        overallScore: 50,
        recommendations: ['Review safety procedures', 'Provide additional training'],
        mitigationStrategies: ['Implement immediate controls', 'Monitor closely']
      };
    }
  },

  async generateSafetyInsights(reports: any[]): Promise<SafetyInsight> {
    try {
      const reportsData = reports.map(r => ({
        type: r.observationType,
        category: r.category,
        severity: r.severity,
        status: r.status,
        date: r.createdAt
      }));

      const prompt = `
        Analyze these BBS observations and provide safety insights:

        ${JSON.stringify(reportsData, null, 2)}

        Provide analysis on:
        1. Overall trend (improving/declining/stable)
        2. 3-5 key focus areas
        3. 5-7 specific recommendations
        4. 3-5 training needs identified

        Return as JSON with keys: trend, keyAreas, recommendations, trainingNeeds
      `;

      const text = await callGemini(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      return {
        trend: 'stable',
        keyAreas: ['PPE Compliance', 'Procedure Following'],
        recommendations: ['Increase safety training', 'Improve communication'],
        trainingNeeds: ['Safety awareness', 'Risk assessment']
      };
    } catch (error) {
      console.error('AI insights error:', error);
      return {
        trend: 'stable',
        keyAreas: ['PPE Compliance', 'Procedure Following'],
        recommendations: ['Increase safety training', 'Improve communication'],
        trainingNeeds: ['Safety awareness', 'Risk assessment']
      };
    }
  },

  async generateCorrectiveActions(observation: any): Promise<string[]> {
    try {
      const prompt = `
        Based on this safety observation, suggest 3-5 specific corrective actions:

        Type: ${observation.observationType}
        Category: ${observation.category}
        Description: ${observation.description}
        Severity: ${observation.severity}

        Provide actionable, specific corrective actions as a JSON array of strings.
      `;

      const text = await callGemini(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      return [
        'Conduct safety briefing',
        'Review and update procedures',
        'Provide additional training'
      ];
    } catch (error) {
      console.error('AI action generation error:', error);
      return [
        'Conduct safety briefing',
        'Review and update procedures',
        'Provide additional training'
      ];
    }
  }
};
