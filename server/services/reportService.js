import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async calculateRiskScore(observationData) {
    const prompt = `
    As a safety expert, analyze this observation and provide a risk assessment:
    
    Observation: ${observationData.observation}
    Element: ${observationData.element}
    Legal Standard: ${observationData.legalStandard}
    Location: ${observationData.area || 'Not specified'}
    
    Please provide:
    1. Risk Score (1-20 scale)
    2. Risk Level (low, medium, high, very_high)
    3. Key Risk Factors
    4. Similar Incidents or Common Issues
    5. Specific Recommendations
    6. Confidence Level (0-100%)
    
    Respond in JSON format only.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const analysis = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      
      return {
        riskScore: analysis.riskScore || this.fallbackRiskScore(observationData),
        riskLevel: analysis.riskLevel || this.fallbackRiskLevel(analysis.riskScore || 10),
        confidence: analysis.confidenceLevel || 75,
        factors: analysis.keyRiskFactors || [],
        similarIncidents: analysis.similarIncidents || [],
        recommendations: analysis.recommendations || []
      };
    } catch (error) {
      console.error('AI Risk Assessment Error:', error);
      return this.fallbackRiskAssessment(observationData);
    }
  }

  async generateAuditInsights(auditData) {
    const prompt = `
    Analyze this safety audit data and provide comprehensive insights:
    
    Audit Type: ${auditData.type}
    Standard: ${auditData.standard}
    Compliance Rate: ${auditData.summary?.compliancePercentage || 0}%
    Total Observations: ${auditData.observations?.length || 0}
    Non-Compliances: ${auditData.summary?.nonCompliant || 0}
    
    Checklist Summary:
    ${auditData.checklist?.map(item => 
      `${item.category}: ${item.question} - ${item.response}`
    ).join('\n') || 'No checklist data'}
    
    Provide:
    1. Overall Risk Assessment
    2. Key Recommendations
    3. Trend Analysis
    4. Predictive Warnings
    5. Priority Actions
    
    Respond in JSON format only.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const insights = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      
      return {
        riskAssessment: insights.riskAssessment || 'Risk assessment not available',
        recommendations: insights.recommendations || [],
        trendAnalysis: insights.trendAnalysis || 'Trend analysis not available',
        predictiveWarnings: insights.predictiveWarnings || [],
        confidenceScore: insights.confidenceLevel || 75
      };
    } catch (error) {
      console.error('AI Insights Error:', error);
      return this.fallbackInsights(auditData);
    }
  }

  async enhanceObservationRecommendation(observation, element, legalStandard) {
    const prompt = `
    Enhance this safety observation with specific, actionable recommendations:
    
    Observation: ${observation}
    Element/Area: ${element}
    Legal Standard: ${legalStandard}
    
    Provide detailed, specific recommendations that address:
    1. Immediate actions
    2. Root cause correction
    3. Prevention measures
    4. Compliance requirements
    5. Best practices
    
    Make recommendations specific, measurable, and implementable.
    Respond with enhanced recommendations only.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Enhancement Error:', error);
      return `Enhanced recommendation not available. Original observation: ${observation}`;
    }
  }

  fallbackRiskScore(observationData) {
    // Basic scoring logic when AI is unavailable
    let score = 5; // Base score
    
    const observation = observationData.observation?.toLowerCase() || '';
    
    // High-risk keywords
    if (observation.includes('fire') || observation.includes('explosion') || 
        observation.includes('chemical') || observation.includes('electrical')) {
      score += 8;
    } else if (observation.includes('safety') || observation.includes('hazard')) {
      score += 5;
    } else if (observation.includes('compliance') || observation.includes('violation')) {
      score += 6;
    }
    
    return Math.min(20, score);
  }

  fallbackRiskLevel(score) {
    if (score >= 16) return 'very_high';
    if (score >= 12) return 'high';
    if (score >= 8) return 'medium';
    return 'low';
  }

  fallbackRiskAssessment(observationData) {
    const score = this.fallbackRiskScore(observationData);
    return {
      riskScore: score,
      riskLevel: this.fallbackRiskLevel(score),
      confidence: 60,
      factors: ['Manual assessment'],
      similarIncidents: [],
      recommendations: ['Please implement corrective actions', 'Monitor for compliance']
    };
  }

  fallbackInsights(auditData) {
    return {
      riskAssessment: 'Manual risk assessment based on compliance data',
      recommendations: [
        'Address non-compliances immediately',
        'Implement systematic monitoring',
        'Enhance training programs'
      ],
      trendAnalysis: 'Trend analysis requires historical data',
      predictiveWarnings: [],
      confidenceScore: 50
    };
  }
}

export default new AIService();