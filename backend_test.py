import requests
import sys
import json
from datetime import datetime

class SkillTrack365APITester:
    def __init__(self, base_url="https://certtrack-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_seed_data(self):
        """Test data seeding endpoint"""
        try:
            response = requests.post(f"{self.api_url}/seed", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("Seed Data", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Data", False, str(e))
            return False

    def test_get_certifications(self):
        """Test getting certifications list"""
        try:
            response = requests.get(f"{self.api_url}/certifications", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Count: {len(data)} certifications"
                # Verify structure
                if data and isinstance(data, list):
                    cert = data[0]
                    required_fields = ['cert_id', 'vendor', 'name', 'code', 'difficulty']
                    missing_fields = [field for field in required_fields if field not in cert]
                    if missing_fields:
                        success = False
                        details += f", Missing fields: {missing_fields}"
            self.log_test("Get Certifications", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test("Get Certifications", False, str(e))
            return False, []

    def test_get_certification_detail(self, cert_id):
        """Test getting specific certification details"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Cert: {data.get('name', 'N/A')}"
            self.log_test(f"Get Certification Detail ({cert_id})", success, details)
            return success
        except Exception as e:
            self.log_test(f"Get Certification Detail ({cert_id})", False, str(e))
            return False

    def test_get_labs(self, cert_id):
        """Test getting labs for a certification"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}/labs", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Labs count: {len(data)}"
            self.log_test(f"Get Labs ({cert_id})", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test(f"Get Labs ({cert_id})", False, str(e))
            return False, []

    def test_get_assessments(self, cert_id):
        """Test getting assessments for a certification"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}/assessments", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Assessments count: {len(data)}"
            self.log_test(f"Get Assessments ({cert_id})", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test(f"Get Assessments ({cert_id})", False, str(e))
            return False, []

    def test_get_projects(self, cert_id):
        """Test getting projects for a certification"""
        try:
            response = requests.get(f"{self.api_url}/certifications/{cert_id}/projects", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Projects count: {len(data)}"
            self.log_test(f"Get Projects ({cert_id})", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test(f"Get Projects ({cert_id})", False, str(e))
            return False, []

    def test_auth_endpoints_without_auth(self):
        """Test auth-protected endpoints without authentication"""
        endpoints = [
            ("/auth/me", "GET"),
            ("/dashboard", "GET"),
            ("/labs/complete", "POST"),
            ("/assessments/submit", "POST"),
            ("/projects/complete", "POST")
        ]
        
        for endpoint, method in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                else:
                    response = requests.post(f"{self.api_url}{endpoint}", json={}, timeout=10)
                
                success = response.status_code == 401
                details = f"Status: {response.status_code} (Expected: 401)"
                self.log_test(f"Auth Protection - {endpoint}", success, details)
            except Exception as e:
                self.log_test(f"Auth Protection - {endpoint}", False, str(e))

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SkillTrack365 Backend API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return self.get_summary()
        
        # Seed data
        self.test_seed_data()
        
        # Test public endpoints
        success, certifications = self.test_get_certifications()
        
        if success and certifications:
            # Test with first certification
            cert_id = certifications[0]['cert_id']
            self.test_get_certification_detail(cert_id)
            self.test_get_labs(cert_id)
            self.test_get_assessments(cert_id)
            self.test_get_projects(cert_id)
        
        # Test auth protection
        self.test_auth_endpoints_without_auth()
        
        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return {
            "tests_run": self.tests_run,
            "tests_passed": self.tests_passed,
            "success_rate": success_rate,
            "failed_tests": self.failed_tests
        }

def main():
    tester = SkillTrack365APITester()
    summary = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if summary["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())