import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Search, 
  Brain, 
  Download, 
  History, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Shield,
  Zap
} from 'lucide-react';

const NaturalLanguageQueryInterface = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('json');

  useEffect(() => {
    loadTemplates();
    loadQueryHistory();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/nl-query/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadQueryHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/nl-query/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setQueryHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const processQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/nl-query/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          query: query.trim(),
          outputFormat: selectedFormat
        })
      });

      const data = await response.json();
      setResults(data);
      
      if (data.success) {
        // Add to history
        setQueryHistory(prev => [{
          id: data.requestId,
          query: query.trim(),
          timestamp: new Date().toISOString(),
          queryType: data.queryType,
          resultCount: data.resultCount,
          executionTime: data.executionTime
        }, ...prev.slice(0, 9)]);
      }

    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to process query',
        suggestions: ['Check your internet connection', 'Try again later']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const useTemplate = (template) => {
    setQuery(template);
  };

  const downloadResults = async (format) => {
    if (!results || !results.success) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/nl-query/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          query: query.trim(),
          outputFormat: format
        })
      });

      if (format === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_results.csv';
        a.click();
      } else if (format === 'pdf') {
        const pdfData = await response.blob();
        const url = window.URL.createObjectURL(pdfData);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_report.pdf';
        a.click();
      }

    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getQueryTypeIcon = (type) => {
    switch (type) {
      case 'PATIENT_SEARCH': return <Users className="h-4 w-4" />;
      case 'MEDICAL_ANALYSIS': return <BarChart3 className="h-4 w-4" />;
      case 'COMPLIANCE_REPORTING': return <FileText className="h-4 w-4" />;
      case 'RISK_ASSESSMENT': return <Shield className="h-4 w-4" />;
      case 'OPERATIONAL_INSIGHTS': return <TrendingUp className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getQueryTypeColor = (type) => {
    switch (type) {
      case 'PATIENT_SEARCH': return 'bg-blue-100 text-blue-800';
      case 'MEDICAL_ANALYSIS': return 'bg-green-100 text-green-800';
      case 'COMPLIANCE_REPORTING': return 'bg-yellow-100 text-yellow-800';
      case 'RISK_ASSESSMENT': return 'bg-red-100 text-red-800';
      case 'OPERATIONAL_INSIGHTS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderChart = (chart) => {
    // Simple chart rendering - in production use Chart.js or Recharts
    return (
      <div key={chart.title} className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">{chart.title}</h4>
        <div className="space-y-2">
          {chart.data.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm">{item.label}</span>
              <div className="flex items-center gap-2">
                <div 
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${(item.value / Math.max(...chart.data.map(d => d.value))) * 100}px` }}
                />
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          Natural Language Query System
        </h1>
        <p className="text-gray-600">
          Ask questions about your EHR data in plain English
        </p>
      </div>

      <Tabs defaultValue="query" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Query
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Ask Your Question
              </CardTitle>
              <CardDescription>
                Type your question in natural language. For example: "Find all patients with diabetes from last month"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your question here... e.g., 'How many pre-employment exams had heart conditions this year?'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
                className="min-h-[80px]"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Output format:</span>
                  <select 
                    value={selectedFormat} 
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF Report</option>
                  </select>
                </div>
                
                <Button 
                  onClick={processQuery}
                  disabled={!query.trim() || isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Ask Question
                    </>
                  )}
                </Button>
              </div>

              {/* Quick Examples */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Quick examples:</span>
                {[
                  'Find patients with high blood pressure',
                  'How many exams completed last month?',
                  'Show incomplete questionnaires'
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => useTemplate(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getQueryTypeIcon(category.category.replace(' ', '_').toUpperCase())}
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.templates.map((template, templateIndex) => (
                      <Button
                        key={templateIndex}
                        variant="ghost"
                        size="sm"
                        onClick={() => useTemplate(template)}
                        className="w-full text-left justify-start h-auto p-2 text-sm"
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Query History
              </CardTitle>
              <CardDescription>
                Your recent natural language queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queryHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No queries yet</p>
                ) : (
                  queryHistory.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.query}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${getQueryTypeColor(item.queryType)}`}>
                              {getQueryTypeIcon(item.queryType)}
                              <span className="ml-1">{item.queryType.replace('_', ' ')}</span>
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>{item.resultCount} results</div>
                          <div>{item.executionTime}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuery(item.query)}
                        className="mt-2 h-6 text-xs"
                      >
                        Use Again
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {!results ? (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No results yet. Ask a question to get started!</p>
              </CardContent>
            </Card>
          ) : results.success ? (
            <div className="space-y-4">
              {/* Query Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Query Results
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResults('csv')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResults('pdf')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge className={getQueryTypeColor(results.queryType)}>
                        {getQueryTypeIcon(results.queryType)}
                        <span className="ml-1">{results.queryType.replace('_', ' ')}</span>
                      </Badge>
                      <span>{results.resultCount} results found</span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {results.executionTime}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Interpretation:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {results.interpretation}
                      </p>
                    </div>
                    
                    {results.summary && (
                      <div>
                        <h4 className="font-medium mb-2">Summary:</h4>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                          {results.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              {results.charts && results.charts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Visual Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.charts.map((chart, index) => renderChart(chart))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Data Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {results.results.length > 0 && Object.keys(results.results[0]).map((header) => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.results.map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              {results.suggestions && results.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Follow-up Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {results.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => useTemplate(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Query Failed</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{results.error}</p>
                {results.suggestions && (
                  <div className="space-y-1">
                    <p className="font-medium">Suggestions:</p>
                    <ul className="list-disc list-inside text-sm">
                      {results.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NaturalLanguageQueryInterface;