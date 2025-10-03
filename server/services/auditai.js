import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const modelName = 'gemini-1.5-flash-latest'; // or your preferred model
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
const API_KEY = process.env.GEMINI_API_KEY;

export const generateObservationSuggestions = async (observationText) => {
  const prompt = `
You are an expert safety auditor. When I provide an observation, output exactly five fields in this order and format—no asterisks, no extra text:

1. Element:  
   Choose one from {“Chemical Safety”, “Electrical Safety”, “People Safety”, “Emergency Preparedness”, “Safety Management System”, “Fire Safety”, “Cylinder Safety”, “Gas Safety”, “Ergonomics”, “Process Safety”, “Environmental Safety”, “Machine Safety”, “Personal Protective Equipment”, “Contractor Safety”, “Working at Height Safety”} that best matches the observation.

2. Legal Standard:  
   • List only Indian Acts/Codes/Rules whose scope explicitly covers the hazard described.  
   • Before you include a standard, verify its title and scope relate directly to the observed issue.  
   • Give full names with year (e.g. “Factories Act, 1948”; “Indian Electricity Rules, 1956”; “NBC Part 6, 2016”; “IS 1239-2018”).  
   • Separate entries with semicolons. 

3. Recommendation:  
   • 1–2 professional sentences (max 80 words) that are clear, practical to implement in-plant.  
   • Focus on immediate corrective steps and a brief follow-up or verification measure.

4. Risk Level:  
   One of {Very High, High, Medium, Low, Very Low}.

5. Risk Score:  
   Integer 1–5, where 1 = Very High and 5 = Very Low.

Observation:  
this is my observation: "${observationText}"

Provide only the five fields—no additional commentary.
  `;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseGeminiResponse(text);
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    return {
      element: 'Safety Management System',
      legalStandard: 'Factories Act, 1948',
      recommendation: 'Conduct immediate inspection and implement corrective measures as per standard procedure.',
      risk: 'Medium',
      riskScore: '3'
    };
  }
};

const parseGeminiResponse = (text) => {
  const result = {
    element: '',
    legalStandard: '',
    recommendation: '',
    risk: '',
    riskScore: ''
  };

  const lines = text
    .split('\n')
    .map(line => line.trim().replace(/^\d+\.\s*/, ''))
    .filter(line => line.length > 0);

  let currentKey = '';
  for (let line of lines) {
    const match = line.match(/^([a-zA-Z\s]+)\s*:\s*(.*)$/);
    if (match) {
      currentKey = match[1].toLowerCase().trim();
      const value = match[2].trim();

      if (currentKey.includes('element')) result.element = value;
      else if (currentKey.includes('legal')) result.legalStandard = value;
      else if (currentKey.includes('recommendation')) result.recommendation = value;
      else if (currentKey.includes('risk score')) result.riskScore = value.replace(/[^0-9]/g, '');
      else if (currentKey.includes('risk')) result.risk = value;
    }
  }

  return result;
};
