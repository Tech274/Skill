import requests
import sys
import json
from datetime import datetime

class CheckoutAPITester:
    def __init__(self, base_url="https://lab-orchestrate.preview.emergentagent.com"):
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

    def test_checkout_create_without_auth(self):
        """Test checkout creation without authentication"""
        try:
            checkout_data = {
                "plan": "monthly",
                "origin_url": self.base_url
            }
            response = requests.post(f"{self.api_url}/checkout/create", json=checkout_data, timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Checkout Create - Auth Protection", success, details)
            return success
        except Exception as e:
            self.log_test("Checkout Create - Auth Protection", False, str(e))
            return False

    def test_checkout_status_without_auth(self):
        """Test checkout status without authentication"""
        try:
            response = requests.get(f"{self.api_url}/checkout/status/test-session-id", timeout=10)
            success = response.status_code == 401  # Should require auth
            details = f"Status: {response.status_code} (Expected: 401 without auth)"
            self.log_test("Checkout Status - Auth Protection", success, details)
            return success
        except Exception as e:
            self.log_test("Checkout Status - Auth Protection", False, str(e))
            return False

    def test_stripe_webhook_endpoint(self):
        """Test Stripe webhook endpoint"""
        try:
            webhook_data = {"type": "test_event", "data": {}}
            response = requests.post(f"{self.api_url}/webhook/stripe", json=webhook_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data.get('received', False)}"
            self.log_test("Stripe Webhook Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Stripe Webhook Endpoint", False, str(e))
            return False

    def test_invalid_plan_checkout(self):
        """Test checkout with invalid plan (should fail even without auth due to validation)"""
        try:
            checkout_data = {
                "plan": "invalid_plan",
                "origin_url": self.base_url
            }
            response = requests.post(f"{self.api_url}/checkout/create", json=checkout_data, timeout=10)
            # Should either be 401 (auth required) or 400 (invalid plan)
            success = response.status_code in [400, 401]
            details = f"Status: {response.status_code} (Expected: 400 or 401)"
            self.log_test("Checkout Create - Invalid Plan", success, details)
            return success
        except Exception as e:
            self.log_test("Checkout Create - Invalid Plan", False, str(e))
            return False

    def run_checkout_tests(self):
        """Run all checkout/payment related tests"""
        print("💳 Starting Checkout/Payment API Tests")
        print("=" * 40)
        
        # Test checkout endpoints
        self.test_checkout_create_without_auth()
        self.test_checkout_status_without_auth()
        self.test_stripe_webhook_endpoint()
        self.test_invalid_plan_checkout()
        
        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 40)
        print(f"📊 Checkout Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
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
    tester = CheckoutAPITester()
    summary = tester.run_checkout_tests()
    
    # Return appropriate exit code
    return 0 if summary["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())