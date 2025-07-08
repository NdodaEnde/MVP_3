const express = require('express');
const router = express.Router();

// Simple natural language query endpoint (mock for testing)
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    console.log('🧠 Processing Natural Language Query:', query);
    
    // Mock response for testing
    const mockResponse = {
      success: true,
      requestId: `nlq_${Date.now()}`,
      originalQuery: query,
      interpretation: `You asked about: "${query}". This is a mock response for testing.`,
      queryType: 'PATIENT_SEARCH',
      results: [
        { condition: 'High Blood Pressure', count: 25, percentage: 15.5 },
        { condition: 'Diabetes', count: 18, percentage: 11.2 },
        { condition: 'Heart Disease', count: 12, percentage: 7.5 }
      ],
      resultCount: 3,
      executionTime: '250ms',
      summary: 'Found patient data related to your query. This is mock data for testing.',
      charts: [{
        type: 'pie',
        title: 'Medical Conditions Distribution',
        data: [
          { label: 'High Blood Pressure', value: 25 },
          { label: 'Diabetes', value: 18 },
          { label: 'Heart Disease', value: 12 }
        ]
      }],
      suggestions: [
        'Show trends over time',
        'Filter by age group',
        'Compare with previous year'
      ]
    };
    
    res.json(mockResponse);
    
  } catch (error) {
    console.error('Error in natural language query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query',
      suggestions: ['Try rephrasing your question', 'Use simpler terms']
    });
  }
});

// Get query templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        category: 'Patient Search',
        templates: [
          'Find all patients with high blood pressure',
          'Show patients examined last month',
          'List patients with medical alerts'
        ]
      },
      {
        category: 'Medical Analysis',
        templates: [
          'How many pre-employment exams had heart conditions this year?',
          'What percentage of patients have diabetes?',
          'Show medical condition trends'
        ]
      },
      {
        category: 'Compliance Reporting',
        templates: [
          'Show incomplete questionnaires from this week',
          'List overdue examinations',
          'Find patients missing documentation'
        ]
      }
    ];
    
    res.json({ success: true, templates });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

// Get query history (mock)
router.get('/history', async (req, res) => {
  try {
    const history = [
      {
        id: 'q1',
        query: 'Find patients with diabetes',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        queryType: 'PATIENT_SEARCH',
        resultCount: 25,
        executionTime: '1.2s'
      },
      {
        id: 'q2',
        query: 'How many pre-employment exams last month?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        queryType: 'MEDICAL_ANALYSIS',
        resultCount: 85,
        executionTime: '0.8s'
      }
    ];
    
    res.json({ success: true, history, total: history.length });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to load history' });
  }
});

module.exports = router;
