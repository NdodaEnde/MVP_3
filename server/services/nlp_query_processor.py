#!/usr/bin/env python3
"""
Natural Language to Database Query Processor for Healthcare EHR System
Uses OpenAI GPT-4 to convert natural language queries to MongoDB/SQL queries
"""

import sys
import json
import asyncio
import os
from datetime import datetime, timedelta
import re

# Import the LLM integration
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:
    print("Error: emergentintegrations not installed. Run: pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/")
    sys.exit(1)

class HealthcareNLQueryProcessor:
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.model = 'gpt-4o'  # Using GPT-4o for best medical understanding
        
        # Healthcare-specific system message
        self.system_message = """You are a healthcare data query assistant that converts natural language questions about patient data into MongoDB queries and provides analysis.

IMPORTANT SAFETY GUIDELINES:
- Only generate queries for authorized medical data access
- Ensure all queries comply with HIPAA/POPIA regulations
- Never expose patient identifiable information without proper authorization
- Validate that queries are safe and don't allow data breaches

DATABASE SCHEMA - SurgiScan EHR System:
Collections:
1. patients: {firstName, surname, idNumber, age, gender, employerName, createdAt}
2. questionnaires: {patient, examination_type, completed, completedAt, medical_history, physical_examination, working_at_heights_assessment, declarations_and_signatures, validation_status}
3. examinations: {patient, examinationType, status, currentStation, createdAt, completedAt}
4. users: {firstName, lastName, email, role, department}

EXAMINATION TYPES: pre_employment, periodic, exit, return_to_work, working_at_heights

MEDICAL CONDITIONS in questionnaires.medical_history.current_conditions:
- heart_disease_high_bp (heart disease/high blood pressure)
- epilepsy_convulsions
- glaucoma_blindness  
- diabetes_endocrine
- family_mellitus_diabetes
- tuberculosis_pneumonia
- respiratory_conditions

QUERY TYPES you can handle:
1. PATIENT_SEARCH - Find patients matching criteria
2. MEDICAL_ANALYSIS - Analyze medical conditions/trends
3. COMPLIANCE_REPORTING - Track completion status
4. RISK_ASSESSMENT - Identify high-risk patients
5. OPERATIONAL_INSIGHTS - Performance metrics

RESPONSE FORMAT (JSON):
{
  "success": true,
  "interpretation": "Clear explanation of what the query asks",
  "queryType": "PATIENT_SEARCH|MEDICAL_ANALYSIS|COMPLIANCE_REPORTING|RISK_ASSESSMENT|OPERATIONAL_INSIGHTS",
  "mongoQuery": {"collection": "patients", "query": {...}, "projection": {...}},
  "sqlQuery": "SELECT ... (equivalent SQL for reference)",
  "results": [...],
  "resultCount": 0,
  "executionTime": "0ms",
  "summary": "Brief summary of findings",
  "charts": [{"type": "bar|pie|line", "data": [...], "title": "Chart Title"}],
  "suggestions": ["Follow-up question 1", "Follow-up question 2"]
}

SAFETY RULES:
- Never return actual patient data - only aggregated/anonymized results
- For patient lists, return counts and basic demographics only
- Always include appropriate date filters for performance
- Reject queries that could expose sensitive information inappropriately

Example Query Patterns:
- "Find patients with diabetes" → Count and basic demographics
- "How many pre-employment exams last month?" → Aggregate count with breakdown
- "Show incomplete questionnaires" → Status counts, not individual records
"""

    async def process_query(self, query_data):
        """Process a natural language query"""
        try:
            query = query_data['query']
            user_role = query_data.get('userRole', 'staff')
            
            # Validate API key
            if not self.openai_api_key:
                return self.create_mock_response(query, "OpenAI API key not configured")
            
            # Initialize LLM chat
            chat = LlmChat(
                api_key=self.openai_api_key,
                session_id=f"nlq_{query_data.get('requestId', 'default')}",
                system_message=self.system_message
            ).with_model("openai", self.model).with_max_tokens(4096)
            
            # Create user message with role context
            user_message = UserMessage(
                text=f"""
Natural Language Query: "{query}"
User Role: {user_role}
Current Date: {datetime.now().strftime('%Y-%m-%d')}

Please convert this to appropriate MongoDB queries and provide analysis. 
Remember to:
1. Respect user role permissions
2. Return aggregated data, not individual patient records
3. Include appropriate date filters
4. Provide meaningful insights and follow-up suggestions
"""
            )
            
            # Send to AI
            start_time = datetime.now()
            response = await chat.send_message(user_message)
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Parse AI response
            try:
                result = json.loads(response)
                result['executionTime'] = f"{execution_time:.0f}ms"
                
                # Execute the query (mock data for now)
                result = self.execute_query(result, query_data)
                
                return result
                
            except json.JSONDecodeError:
                # If AI doesn't return valid JSON, create structured response
                return self.parse_natural_response(response, query, execution_time)
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "interpretation": f"Failed to process query: {query}",
                "suggestions": ["Try rephrasing your question", "Use simpler medical terms"]
            }

    def execute_query(self, ai_result, query_data):
        """Execute the MongoDB query and return results (mock implementation)"""
        try:
            mongo_query = ai_result.get('mongoQuery', {})
            query_type = ai_result.get('queryType', 'UNKNOWN')
            
            # Mock data based on query type
            if query_type == 'PATIENT_SEARCH':
                ai_result['results'] = self.get_mock_patient_search_results()
                ai_result['resultCount'] = len(ai_result['results'])
                
            elif query_type == 'MEDICAL_ANALYSIS':
                ai_result['results'] = self.get_mock_medical_analysis_results()
                ai_result['resultCount'] = len(ai_result['results'])
                ai_result['charts'] = self.get_mock_medical_charts()
                
            elif query_type == 'COMPLIANCE_REPORTING':
                ai_result['results'] = self.get_mock_compliance_results()
                ai_result['resultCount'] = len(ai_result['results'])
                ai_result['charts'] = self.get_mock_compliance_charts()
                
            elif query_type == 'RISK_ASSESSMENT':
                ai_result['results'] = self.get_mock_risk_assessment_results()
                ai_result['resultCount'] = len(ai_result['results'])
                
            elif query_type == 'OPERATIONAL_INSIGHTS':
                ai_result['results'] = self.get_mock_operational_results()
                ai_result['resultCount'] = len(ai_result['results'])
                ai_result['charts'] = self.get_mock_operational_charts()
            
            return ai_result
            
        except Exception as e:
            ai_result['error'] = f"Query execution failed: {str(e)}"
            ai_result['success'] = False
            return ai_result

    def get_mock_patient_search_results(self):
        """Mock patient search results (anonymized)"""
        return [
            {"ageRange": "25-35", "count": 15, "percentage": 30.0},
            {"ageRange": "36-45", "count": 20, "percentage": 40.0}, 
            {"ageRange": "46-55", "count": 10, "percentage": 20.0},
            {"ageRange": "56-65", "count": 5, "percentage": 10.0}
        ]

    def get_mock_medical_analysis_results(self):
        """Mock medical analysis results"""
        return [
            {"condition": "High Blood Pressure", "count": 25, "percentage": 15.5},
            {"condition": "Diabetes", "count": 18, "percentage": 11.2},
            {"condition": "Heart Disease", "count": 12, "percentage": 7.5},
            {"condition": "Respiratory Issues", "count": 8, "percentage": 5.0}
        ]

    def get_mock_compliance_results(self):
        """Mock compliance reporting results"""
        return [
            {"status": "Completed", "count": 145, "percentage": 85.3},
            {"status": "In Progress", "count": 18, "percentage": 10.6},
            {"status": "Incomplete", "count": 7, "percentage": 4.1}
        ]

    def get_mock_risk_assessment_results(self):
        """Mock risk assessment results"""
        return [
            {"riskLevel": "High", "count": 8, "conditions": ["Multiple medical alerts", "Working at heights"]},
            {"riskLevel": "Medium", "count": 22, "conditions": ["Single medical condition"]},
            {"riskLevel": "Low", "count": 120, "conditions": ["No significant risks"]}
        ]

    def get_mock_operational_results(self):
        """Mock operational insights results"""
        return [
            {"examinationType": "Pre-Employment", "avgTime": "45 minutes", "count": 85},
            {"examinationType": "Periodic", "avgTime": "35 minutes", "count": 62},
            {"examinationType": "Exit", "avgTime": "25 minutes", "count": 23}
        ]

    def get_mock_medical_charts(self):
        """Mock chart data for medical analysis"""
        return [
            {
                "type": "pie",
                "title": "Medical Conditions Distribution",
                "data": [
                    {"label": "High Blood Pressure", "value": 25},
                    {"label": "Diabetes", "value": 18},
                    {"label": "Heart Disease", "value": 12},
                    {"label": "Other", "value": 30}
                ]
            }
        ]

    def get_mock_compliance_charts(self):
        """Mock chart data for compliance reporting"""
        return [
            {
                "type": "bar",
                "title": "Questionnaire Completion Status",
                "data": [
                    {"label": "Completed", "value": 145},
                    {"label": "In Progress", "value": 18},
                    {"label": "Incomplete", "value": 7}
                ]
            }
        ]

    def get_mock_operational_charts(self):
        """Mock chart data for operational insights"""
        return [
            {
                "type": "line",
                "title": "Average Examination Time by Type",
                "data": [
                    {"label": "Pre-Employment", "value": 45},
                    {"label": "Periodic", "value": 35},
                    {"label": "Exit", "value": 25}
                ]
            }
        ]

    def create_mock_response(self, query, error_msg):
        """Create a mock response when AI is not available"""
        return {
            "success": False,
            "error": error_msg,
            "interpretation": f"Unable to process query: {query}",
            "queryType": "UNKNOWN",
            "mongoQuery": {},
            "sqlQuery": "",
            "results": [],
            "resultCount": 0,
            "executionTime": "0ms",
            "summary": "AI service not configured. Please set OPENAI_API_KEY environment variable.",
            "charts": [],
            "suggestions": [
                "Set up OpenAI API key to enable natural language queries",
                "Try using the manual query interface",
                "Contact administrator for assistance"
            ]
        }

    def parse_natural_response(self, response, query, execution_time):
        """Parse non-JSON response from AI"""
        return {
            "success": True,
            "interpretation": f"AI interpretation of: {query}",
            "queryType": "GENERAL",
            "mongoQuery": {},
            "sqlQuery": "",
            "results": [{"response": response}],
            "resultCount": 1,
            "executionTime": f"{execution_time:.0f}ms",
            "summary": response[:200] + "..." if len(response) > 200 else response,
            "charts": [],
            "suggestions": ["Try a more specific query", "Ask about patient statistics"]
        }

async def main():
    """Main function called from Node.js"""
    try:
        # Get query data from command line argument
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No query data provided"}))
            sys.exit(1)
        
        query_data = json.loads(sys.argv[1])
        
        # Process the query
        processor = HealthcareNLQueryProcessor()
        result = await processor.process_query(query_data)
        
        # Return result as JSON
        print(json.dumps(result, default=str))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "interpretation": "Failed to process query",
            "suggestions": ["Check query format", "Try again later"]
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    asyncio.run(main())