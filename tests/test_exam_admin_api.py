"""
Phase 4: Exam & Certification Admin API Tests
Tests for Question Bank, Exams, Certificate Templates, and Issued Certificates endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_"

class TestExamAdminEndpointsAuth:
    """Test that all exam admin endpoints require authentication"""
    
    # === Question Bank Auth Tests ===
    def test_question_bank_stats_requires_auth(self):
        """GET /api/admin/question-bank/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/question-bank/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/question-bank/stats requires auth (401)")
    
    def test_question_bank_list_requires_auth(self):
        """GET /api/admin/question-bank requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/question-bank")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/question-bank requires auth (401)")
    
    def test_question_bank_list_with_filters_requires_auth(self):
        """GET /api/admin/question-bank with filters requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/question-bank?cert_id=aws-saa-c03&difficulty=easy")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/question-bank with filters requires auth (401)")
    
    def test_question_bank_create_requires_auth(self):
        """POST /api/admin/question-bank requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/question-bank", json={
            "cert_id": "aws-saa-c03",
            "domain": "Test Domain",
            "topic": "Test Topic",
            "question_text": "Test question?",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/question-bank requires auth (401)")
    
    def test_question_bank_update_requires_auth(self):
        """PUT /api/admin/question-bank/{id} requires authentication"""
        response = requests.put(f"{BASE_URL}/api/admin/question-bank/q_test123", json={
            "question_text": "Updated question?"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT /api/admin/question-bank/{id} requires auth (401)")
    
    def test_question_bank_delete_requires_auth(self):
        """DELETE /api/admin/question-bank/{id} requires authentication (super_admin)"""
        response = requests.delete(f"{BASE_URL}/api/admin/question-bank/q_test123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ DELETE /api/admin/question-bank/{id} requires auth (401)")
    
    # === Exam Management Auth Tests ===
    def test_exam_stats_requires_auth(self):
        """GET /api/admin/exams/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/exams/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/exams/stats requires auth (401)")
    
    def test_exam_list_requires_auth(self):
        """GET /api/admin/exams requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/exams")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/exams requires auth (401)")
    
    def test_exam_list_with_filters_requires_auth(self):
        """GET /api/admin/exams with filters requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/exams?cert_id=aws-saa-c03&exam_type=practice")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/exams with filters requires auth (401)")
    
    def test_exam_create_requires_auth(self):
        """POST /api/admin/exams requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/exams", json={
            "cert_id": "aws-saa-c03",
            "title": "Test Exam",
            "description": "Test description",
            "exam_type": "practice"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/exams requires auth (401)")
    
    def test_exam_update_requires_auth(self):
        """PUT /api/admin/exams/{id} requires authentication"""
        response = requests.put(f"{BASE_URL}/api/admin/exams/exam_test123", json={
            "title": "Updated Exam"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT /api/admin/exams/{id} requires auth (401)")
    
    def test_exam_delete_requires_auth(self):
        """DELETE /api/admin/exams/{id} requires authentication (super_admin)"""
        response = requests.delete(f"{BASE_URL}/api/admin/exams/exam_test123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ DELETE /api/admin/exams/{id} requires auth (401)")
    
    # === Certificate Template Auth Tests ===
    def test_certificate_templates_list_requires_auth(self):
        """GET /api/admin/certificate-templates requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/certificate-templates")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/certificate-templates requires auth (401)")
    
    def test_certificate_template_create_requires_auth(self):
        """POST /api/admin/certificate-templates requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/certificate-templates", json={
            "cert_id": "aws-saa-c03",
            "name": "Test Template"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/certificate-templates requires auth (401)")
    
    def test_certificate_template_update_requires_auth(self):
        """PUT /api/admin/certificate-templates/{id} requires authentication"""
        response = requests.put(f"{BASE_URL}/api/admin/certificate-templates/tmpl_test123", json={
            "name": "Updated Template"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT /api/admin/certificate-templates/{id} requires auth (401)")
    
    def test_certificate_template_delete_requires_auth(self):
        """DELETE /api/admin/certificate-templates/{id} requires authentication (super_admin)"""
        response = requests.delete(f"{BASE_URL}/api/admin/certificate-templates/tmpl_test123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ DELETE /api/admin/certificate-templates/{id} requires auth (401)")
    
    # === Issued Certificates Auth Tests ===
    def test_issued_certificates_list_requires_auth(self):
        """GET /api/admin/issued-certificates requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/issued-certificates")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/admin/issued-certificates requires auth (401)")
    
    def test_issued_certificate_revoke_requires_auth(self):
        """POST /api/admin/issued-certificates/{id}/revoke requires authentication (super_admin)"""
        response = requests.post(f"{BASE_URL}/api/admin/issued-certificates/cert_test123/revoke?reason=test")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/issued-certificates/{id}/revoke requires auth (401)")


class TestExamAdminEndpointsExist:
    """Test that all exam admin endpoints exist (not 404)"""
    
    def test_question_bank_stats_endpoint_exists(self):
        """GET /api/admin/question-bank/stats endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/admin/question-bank/stats")
        assert response.status_code != 404, f"Endpoint returned 404 - not found"
        print("✓ GET /api/admin/question-bank/stats endpoint exists")
    
    def test_question_bank_list_endpoint_exists(self):
        """GET /api/admin/question-bank endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/admin/question-bank")
        assert response.status_code != 404, f"Endpoint returned 404 - not found"
        print("✓ GET /api/admin/question-bank endpoint exists")
    
    def test_exam_stats_endpoint_exists(self):
        """GET /api/admin/exams/stats endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/admin/exams/stats")
        assert response.status_code != 404, f"Endpoint returned 404 - not found"
        print("✓ GET /api/admin/exams/stats endpoint exists")
    
    def test_exam_list_endpoint_exists(self):
        """GET /api/admin/exams endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/admin/exams")
        assert response.status_code != 404, f"Endpoint returned 404 - not found"
        print("✓ GET /api/admin/exams endpoint exists")
    
    def test_certificate_templates_endpoint_exists(self):
        """GET /api/admin/certificate-templates endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/admin/certificate-templates")
        assert response.status_code != 404, f"Endpoint returned 404 - not found"
        print("✓ GET /api/admin/certificate-templates endpoint exists")
    
    def test_issued_certificates_endpoint_exists(self):
        """GET /api/admin/issued-certificates endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/admin/issued-certificates")
        assert response.status_code != 404, f"Endpoint returned 404 - not found"
        print("✓ GET /api/admin/issued-certificates endpoint exists")


class TestPublicEndpoints:
    """Test public endpoints that don't require authentication"""
    
    def test_certifications_public_access(self):
        """GET /api/certifications is publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of certifications"
        assert len(data) > 0, "Expected at least one certification"
        print(f"✓ GET /api/certifications returns {len(data)} certifications")
    
    def test_api_root_accessible(self):
        """GET /api/ is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Expected message in response"
        print("✓ GET /api/ returns API info")


class TestExamAdminValidation:
    """Test validation and error handling for exam admin endpoints"""
    
    def test_question_bank_get_nonexistent(self):
        """GET /api/admin/question-bank/{id} for non-existent question"""
        response = requests.get(f"{BASE_URL}/api/admin/question-bank/q_nonexistent123")
        # Should return 401 (auth required) before 404
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
        print("✓ GET /api/admin/question-bank/{id} handles non-existent question")
    
    def test_exam_get_nonexistent(self):
        """GET /api/admin/exams/{id} for non-existent exam"""
        response = requests.get(f"{BASE_URL}/api/admin/exams/exam_nonexistent123")
        # Should return 401 (auth required) before 404
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
        print("✓ GET /api/admin/exams/{id} handles non-existent exam")
    
    def test_certificate_template_get_nonexistent(self):
        """GET /api/admin/certificate-templates/{id} for non-existent template"""
        response = requests.get(f"{BASE_URL}/api/admin/certificate-templates/tmpl_nonexistent123")
        # Should return 401 (auth required) before 404
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
        print("✓ GET /api/admin/certificate-templates/{id} handles non-existent template")


class TestExamAdminBulkOperations:
    """Test bulk operations for exam admin"""
    
    def test_bulk_import_questions_requires_auth(self):
        """POST /api/admin/question-bank/bulk-import requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/question-bank/bulk-import", json=[
            {
                "cert_id": "aws-saa-c03",
                "domain": "Test",
                "topic": "Test",
                "question_text": "Q1?",
                "options": ["A", "B"],
                "correct_answer": "A"
            }
        ])
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/question-bank/bulk-import requires auth (401)")
    
    def test_add_questions_to_exam_requires_auth(self):
        """POST /api/admin/exams/{id}/add-questions requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/exams/exam_test123/add-questions", json=["q_1", "q_2"])
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/exams/{id}/add-questions requires auth (401)")
    
    def test_remove_questions_from_exam_requires_auth(self):
        """POST /api/admin/exams/{id}/remove-questions requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/exams/exam_test123/remove-questions", json=["q_1"])
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/admin/exams/{id}/remove-questions requires auth (401)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
