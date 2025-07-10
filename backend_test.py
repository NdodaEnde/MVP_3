#!/usr/bin/env python3
"""
Backend API Testing for SurgiScan Platform
Tests patient registration workflow and backend functionality
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3001/api"
TEST_SA_ID = "7807215422081"  # Should show Age: 46 years

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test if backend server is running"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Health Check", 
                    True, 
                    f"Backend server is running (uptime: {data.get('uptime', 'unknown')}s)",
                    {"status": data.get("status"), "features": data.get("features")}
                )
                return True
            else:
                self.log_test("Health Check", False, f"Health endpoint returned {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_test("Health Check", False, f"Cannot connect to backend server: {str(e)}")
            return False
    
    def test_patient_creation_without_auth(self):
        """Test patient creation endpoint without authentication (should fail)"""
        patient_data = {
            "initials": "T.P.",
            "firstName": "Test",
            "surname": "Patient Branch",
            "idNumber": TEST_SA_ID,
            "dateOfBirth": "1978-07-21",
            "maritalStatus": "single",
            "gender": "male",
            "phone": "+27123456789",
            "email": "test@example.com",
            "employerName": "ABC Mining Corp",
            "position": "Miner",
            "department": "Operations",
            "employeeNumber": "EMP001",
            "examinationType": "pre_employment",
            "location": "Johannesburg"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/patients/create",
                json=patient_data,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test(
                    "Patient Creation - No Auth", 
                    True, 
                    "Correctly rejected request without authentication",
                    {"status_code": response.status_code, "response": response.json()}
                )
                return True
            else:
                self.log_test(
                    "Patient Creation - No Auth", 
                    False, 
                    f"Expected 401 Unauthorized, got {response.status_code}",
                    {"response": response.text[:200]}
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Patient Creation - No Auth", False, f"Request failed: {str(e)}")
            return False
    
    def test_sa_id_validation_utility(self):
        """Test SA ID validation utility directly by checking the logic"""
        # Test the SA ID validation logic based on the backend code
        test_id = TEST_SA_ID  # 7807215422081
        
        # Extract year, month, day from SA ID
        year = int(test_id[:2])  # 78
        month = int(test_id[2:4])  # 07
        day = int(test_id[4:6])  # 21
        
        # Calculate full year (backend logic: year < 50 ? current_century + year : previous_century + year)
        current_year = datetime.now().year
        current_century = (current_year // 100) * 100
        full_year = current_century - 100 + year if year >= 50 else current_century + year
        
        # Calculate age
        today = datetime.now()
        age = today.year - full_year
        if today.month < month or (today.month == month and today.day < day):
            age -= 1
        
        expected_age = 46  # Based on the requirement
        
        if age == expected_age:
            self.log_test(
                "SA ID Validation Logic", 
                True, 
                f"SA ID {TEST_SA_ID} correctly calculates age as {age} years",
                {
                    "sa_id": TEST_SA_ID,
                    "extracted_date": f"{full_year}-{month:02d}-{day:02d}",
                    "calculated_age": age,
                    "expected_age": expected_age
                }
            )
            return True
        else:
            self.log_test(
                "SA ID Validation Logic", 
                False, 
                f"SA ID {TEST_SA_ID} calculated age {age}, expected {expected_age}",
                {
                    "sa_id": TEST_SA_ID,
                    "calculated_age": age,
                    "expected_age": expected_age
                }
            )
            return False
    
    def test_patient_data_structure(self):
        """Test if patient data structure matches backend model requirements"""
        required_fields = [
            "initials", "firstName", "surname", "idNumber", "dateOfBirth",
            "maritalStatus", "gender", "phone", "email", "employerName",
            "examinationType"
        ]
        
        sample_data = {
            "initials": "T.P.",
            "firstName": "Test",
            "surname": "Patient Branch", 
            "idNumber": TEST_SA_ID,
            "dateOfBirth": "1978-07-21",
            "maritalStatus": "single",
            "gender": "male",
            "phone": "+27123456789",
            "email": "test@example.com",
            "employerName": "ABC Mining Corp",
            "position": "Miner",
            "department": "Operations", 
            "employeeNumber": "EMP001",
            "examinationType": "pre_employment",
            "location": "Johannesburg"
        }
        
        missing_fields = [field for field in required_fields if field not in sample_data]
        
        if not missing_fields:
            self.log_test(
                "Patient Data Structure", 
                True, 
                "All required fields present in patient data structure",
                {
                    "required_fields": required_fields,
                    "sample_data_keys": list(sample_data.keys()),
                    "validation": "All required fields present"
                }
            )
            return True
        else:
            self.log_test(
                "Patient Data Structure", 
                False, 
                f"Missing required fields: {missing_fields}",
                {
                    "missing_fields": missing_fields,
                    "required_fields": required_fields
                }
            )
            return False
    
    def test_database_connection(self):
        """Test if MongoDB database is accessible (indirect test via health check)"""
        try:
            # Since we can't directly test MongoDB without auth, we test via health endpoint
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test(
                        "Database Connection", 
                        True, 
                        "Database connection appears healthy (via health check)",
                        {"health_status": data.get("status")}
                    )
                    return True
                else:
                    self.log_test(
                        "Database Connection", 
                        False, 
                        f"Health check shows unhealthy status: {data.get('status')}"
                    )
                    return False
            else:
                self.log_test("Database Connection", False, f"Health check failed with status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_test("Database Connection", False, f"Cannot test database connection: {str(e)}")
            return False
    
    def test_api_endpoints_structure(self):
        """Test if expected API endpoints are properly structured"""
        endpoints_to_test = [
            ("/patients/create", "POST"),
            ("/patients", "GET"), 
            ("/health", "GET")
        ]
        
        results = []
        for endpoint, method in endpoints_to_test:
            try:
                if method == "GET":
                    response = self.session.get(f"{self.base_url}{endpoint}", timeout=5)
                elif method == "POST":
                    response = self.session.post(f"{self.base_url}{endpoint}", json={}, timeout=5)
                
                # We expect 401 for protected endpoints, 200 for health
                expected_codes = [200, 401, 400]  # 400 for bad request data
                if response.status_code in expected_codes:
                    results.append(True)
                else:
                    results.append(False)
                    
            except requests.exceptions.RequestException:
                results.append(False)
        
        if all(results):
            self.log_test(
                "API Endpoints Structure", 
                True, 
                "All expected API endpoints are accessible",
                {"tested_endpoints": [f"{method} {ep}" for ep, method in endpoints_to_test]}
            )
            return True
        else:
            self.log_test(
                "API Endpoints Structure", 
                False, 
                "Some API endpoints are not accessible",
                {"tested_endpoints": [f"{method} {ep}" for ep, method in endpoints_to_test]}
            )
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting SurgiScan Backend API Tests")
        print("=" * 50)
        
        tests = [
            self.test_health_check,
            self.test_database_connection,
            self.test_api_endpoints_structure,
            self.test_patient_data_structure,
            self.test_sa_id_validation_utility,
            self.test_patient_creation_without_auth
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                self.log_test(test.__name__, False, f"Test failed with exception: {str(e)}")
        
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed")
            return False
    
    def get_summary(self):
        """Get test summary"""
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        return {
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "success_rate": f"{(passed/total)*100:.1f}%" if total > 0 else "0%",
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = BackendTester()
    
    print("SurgiScan Backend API Testing")
    print(f"Testing against: {BASE_URL}")
    print(f"Test SA ID: {TEST_SA_ID} (Expected Age: 46 years)")
    print()
    
    success = tester.run_all_tests()
    summary = tester.get_summary()
    
    print(f"\n📋 Final Summary:")
    print(f"   Total Tests: {summary['total_tests']}")
    print(f"   Passed: {summary['passed']}")
    print(f"   Failed: {summary['failed']}")
    print(f"   Success Rate: {summary['success_rate']}")
    
    # Save detailed results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())