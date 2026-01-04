import requests
import sys
import json
from datetime import datetime

class AuthFlowTester:
    def __init__(self, base_url="https://codeinsight-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
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

    def test_auth_me_without_session(self):
        """Test /auth/me without session token"""
        try:
            response = requests.get(f"{self.api_url}/auth/me", timeout=10)
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected: 401 without session)"
            self.log_test("Auth Me - No Session", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me - No Session", False, str(e))
            return False

    def test_session_creation_invalid_session_id(self):
        """Test session creation with invalid session_id"""
        try:
            session_data = {"session_id": "invalid_session_id_12345"}
            response = requests.post(f"{self.api_url}/auth/session", json=session_data, timeout=10)
            success = response.status_code == 401  # Should fail with invalid session
            details = f"Status: {response.status_code} (Expected: 401 for invalid session)"
            self.log_test("Session Creation - Invalid Session ID", success, details)
            return success
        except Exception as e:
            self.log_test("Session Creation - Invalid Session ID", False, str(e))
            return False

    def test_session_creation_missing_session_id(self):
        """Test session creation without session_id"""
        try:
            response = requests.post(f"{self.api_url}/auth/session", json={}, timeout=10)
            success = response.status_code == 422  # Should fail validation
            details = f"Status: {response.status_code} (Expected: 422 for missing session_id)"
            self.log_test("Session Creation - Missing Session ID", success, details)
            return success
        except Exception as e:
            self.log_test("Session Creation - Missing Session ID", False, str(e))
            return False

    def test_logout_without_session(self):
        """Test logout without session"""
        try:
            response = requests.post(f"{self.api_url}/auth/logout", timeout=10)
            success = response.status_code == 200  # Should succeed even without session
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("Logout - No Session", success, details)
            return success
        except Exception as e:
            self.log_test("Logout - No Session", False, str(e))
            return False

    def test_auth_endpoints_structure(self):
        """Test auth endpoint response structures"""
        # Test /auth/me structure (should be 401 but check error format)
        try:
            response = requests.get(f"{self.api_url}/auth/me", timeout=10)
            success = response.status_code == 401
            details = f"Status: {response.status_code}"
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    if "detail" in error_data:
                        details += f", Error: {error_data['detail']}"
                    else:
                        success = False
                        details += ", Missing 'detail' field in error response"
                except:
                    success = False
                    details += ", Invalid JSON in error response"
            self.log_test("Auth Me - Error Structure", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me - Error Structure", False, str(e))
            return False

    def run_auth_tests(self):
        """Run all authentication flow tests"""
        print("🔐 Starting Authentication Flow Tests")
        print("=" * 40)
        
        # Test auth endpoints
        self.test_auth_me_without_session()
        self.test_session_creation_invalid_session_id()
        self.test_session_creation_missing_session_id()
        self.test_logout_without_session()
        self.test_auth_endpoints_structure()
        
        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 40)
        print(f"📊 Auth Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
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
    tester = AuthFlowTester()
    summary = tester.run_auth_tests()
    
    # Return appropriate exit code
    return 0 if summary["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())