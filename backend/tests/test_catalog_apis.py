import requests
import sys
import json
from datetime import datetime

class CatalogAPITester:
    def __init__(self, base_url="https://code-insight-43.preview.emergentagent.com"):
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

    def test_labs_catalog_basic(self):
        """Test basic labs catalog retrieval"""
        try:
            response = requests.get(f"{self.api_url}/catalog/labs", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                # Verify required top-level fields
                required_fields = ['labs', 'total', 'page', 'total_pages', 'filters']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing top-level fields: {missing_fields}"
                else:
                    labs = data.get('labs', [])
                    details += f", Labs count: {len(labs)}, Total: {data.get('total', 0)}"
                    
                    # Verify lab item structure
                    if labs:
                        lab = labs[0]
                        lab_fields = ['lab_id', 'title', 'certification_name', 'vendor', 'status', 'is_locked']
                        missing_lab_fields = [field for field in lab_fields if field not in lab]
                        if missing_lab_fields:
                            success = False
                            details += f", Missing lab fields: {missing_lab_fields}"
                    
                    # Verify filters structure
                    filters = data.get('filters', {})
                    filter_fields = ['certifications', 'vendors', 'difficulties', 'domains']
                    missing_filter_fields = [field for field in filter_fields if field not in filters]
                    if missing_filter_fields:
                        success = False
                        details += f", Missing filter fields: {missing_filter_fields}"
                        
            self.log_test("Labs Catalog - Basic Retrieval", success, details)
            return success
        except Exception as e:
            self.log_test("Labs Catalog - Basic Retrieval", False, str(e))
            return False

    def test_labs_catalog_filters(self):
        """Test labs catalog with specific filters"""
        test_cases = [
            ("Vendor Filter", {"vendor": "AWS"}),
            ("Certification Filter", {"certification": "aws-saa-c03"}),
            ("Difficulty Filter", {"difficulty": "Intermediate"}),
            ("Domain Filter", {"domain": "Security"}),
            ("Search Filter", {"search": "serverless"}),
            ("Pagination", {"page": "1", "limit": "5"})
        ]
        
        all_passed = True
        for test_name, params in test_cases:
            try:
                response = requests.get(f"{self.api_url}/catalog/labs", params=params, timeout=10)
                success = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                if success:
                    data = response.json()
                    labs = data.get('labs', [])
                    details += f", Labs count: {len(labs)}"
                    
                    # Verify pagination parameters if testing pagination
                    if 'page' in params:
                        expected_page = int(params['page'])
                        expected_limit = int(params['limit'])
                        actual_page = data.get('page', 0)
                        if actual_page != expected_page:
                            success = False
                            details += f", Page mismatch: expected {expected_page}, got {actual_page}"
                        if len(labs) > expected_limit:
                            success = False
                            details += f", Limit exceeded: expected max {expected_limit}, got {len(labs)}"
                
                self.log_test(f"Labs Catalog - {test_name}", success, details)
                if not success:
                    all_passed = False
            except Exception as e:
                self.log_test(f"Labs Catalog - {test_name}", False, str(e))
                all_passed = False
        
        return all_passed

    def test_projects_catalog_basic(self):
        """Test basic projects catalog retrieval"""
        try:
            response = requests.get(f"{self.api_url}/catalog/projects", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                # Verify required top-level fields
                required_fields = ['projects', 'total', 'page', 'total_pages', 'filters']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing top-level fields: {missing_fields}"
                else:
                    projects = data.get('projects', [])
                    details += f", Projects count: {len(projects)}, Total: {data.get('total', 0)}"
                    
                    # Verify project item structure
                    if projects:
                        project = projects[0]
                        project_fields = ['project_id', 'title', 'certification_name', 'vendor', 'status', 'is_locked']
                        missing_project_fields = [field for field in project_fields if field not in project]
                        if missing_project_fields:
                            success = False
                            details += f", Missing project fields: {missing_project_fields}"
                    
                    # Verify filters structure
                    filters = data.get('filters', {})
                    filter_fields = ['certifications', 'vendors', 'difficulties', 'technologies']
                    missing_filter_fields = [field for field in filter_fields if field not in filters]
                    if missing_filter_fields:
                        success = False
                        details += f", Missing filter fields: {missing_filter_fields}"
                        
            self.log_test("Projects Catalog - Basic Retrieval", success, details)
            return success
        except Exception as e:
            self.log_test("Projects Catalog - Basic Retrieval", False, str(e))
            return False

    def test_projects_catalog_filters(self):
        """Test projects catalog with specific filters"""
        test_cases = [
            ("Vendor Filter", {"vendor": "GCP"}),
            ("Difficulty Filter", {"difficulty": "Advanced"}),
            ("Technology Filter", {"technology": "GKE"}),
            ("Search Filter", {"search": "microservices"})
        ]
        
        all_passed = True
        for test_name, params in test_cases:
            try:
                response = requests.get(f"{self.api_url}/catalog/projects", params=params, timeout=10)
                success = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                if success:
                    data = response.json()
                    projects = data.get('projects', [])
                    details += f", Projects count: {len(projects)}"
                
                self.log_test(f"Projects Catalog - {test_name}", success, details)
                if not success:
                    all_passed = False
            except Exception as e:
                self.log_test(f"Projects Catalog - {test_name}", False, str(e))
                all_passed = False
        
        return all_passed

    def test_assessments_catalog_basic(self):
        """Test basic assessments catalog retrieval"""
        try:
            response = requests.get(f"{self.api_url}/catalog/assessments", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                # Verify required top-level fields
                required_fields = ['assessments', 'total', 'page', 'total_pages', 'filters']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing top-level fields: {missing_fields}"
                else:
                    assessments = data.get('assessments', [])
                    details += f", Assessments count: {len(assessments)}, Total: {data.get('total', 0)}"
                    
                    # Verify assessment item structure
                    if assessments:
                        assessment = assessments[0]
                        assessment_fields = ['assessment_id', 'title', 'certification_name', 'vendor', 'status', 'is_locked']
                        missing_assessment_fields = [field for field in assessment_fields if field not in assessment]
                        if missing_assessment_fields:
                            success = False
                            details += f", Missing assessment fields: {missing_assessment_fields}"
                    
                    # Verify filters structure
                    filters = data.get('filters', {})
                    filter_fields = ['certifications', 'vendors', 'types', 'topics']
                    missing_filter_fields = [field for field in filter_fields if field not in filters]
                    if missing_filter_fields:
                        success = False
                        details += f", Missing filter fields: {missing_filter_fields}"
                        
            self.log_test("Assessments Catalog - Basic Retrieval", success, details)
            return success
        except Exception as e:
            self.log_test("Assessments Catalog - Basic Retrieval", False, str(e))
            return False

    def test_assessments_catalog_filters(self):
        """Test assessments catalog with specific filters"""
        test_cases = [
            ("Vendor Filter", {"vendor": "AWS"}),
            ("Assessment Type Filter", {"assessment_type": "domain"}),
            ("Domain Filter", {"domain": "IAM"}),
            ("Search Filter", {"search": "security"})
        ]
        
        all_passed = True
        for test_name, params in test_cases:
            try:
                response = requests.get(f"{self.api_url}/catalog/assessments", params=params, timeout=10)
                success = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                if success:
                    data = response.json()
                    assessments = data.get('assessments', [])
                    details += f", Assessments count: {len(assessments)}"
                
                self.log_test(f"Assessments Catalog - {test_name}", success, details)
                if not success:
                    all_passed = False
            except Exception as e:
                self.log_test(f"Assessments Catalog - {test_name}", False, str(e))
                all_passed = False
        
        return all_passed

    def run_all_catalog_tests(self):
        """Run all catalog API tests"""
        print("🚀 Starting SkillTrack365 Catalog API Tests")
        print("=" * 50)
        
        # Test Labs Catalog API
        print("\n📚 Testing Labs Catalog API")
        labs_basic = self.test_labs_catalog_basic()
        labs_filters = self.test_labs_catalog_filters()
        
        # Test Projects Catalog API
        print("\n🛠️ Testing Projects Catalog API")
        projects_basic = self.test_projects_catalog_basic()
        projects_filters = self.test_projects_catalog_filters()
        
        # Test Assessments Catalog API
        print("\n📝 Testing Assessments Catalog API")
        assessments_basic = self.test_assessments_catalog_basic()
        assessments_filters = self.test_assessments_catalog_filters()
        
        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Catalog API Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
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
    tester = CatalogAPITester()
    summary = tester.run_all_catalog_tests()
    
    # Return appropriate exit code
    return 0 if summary["success_rate"] >= 90 else 1

if __name__ == "__main__":
    sys.exit(main())