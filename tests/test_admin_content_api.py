"""
Admin Content Management API Tests for Phase 2 - Content & Learning Governance
Tests CRUD operations for certifications, labs, assessments, and projects
Tests content statistics, filtering, and reordering endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://codeinsight-admin.preview.emergentagent.com')


class TestAdminContentStatsAPI:
    """Test admin content statistics endpoint"""
    
    def test_content_stats_requires_auth(self):
        """Content stats should return 401 for unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/admin/content/stats")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
        print("✓ Content stats endpoint correctly requires authentication")


class TestAdminCertificationsAPI:
    """Test admin certifications CRUD endpoints"""
    
    def test_list_certifications_requires_auth(self):
        """GET /api/admin/certifications should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/certifications")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
        print("✓ Admin list certifications requires authentication")
    
    def test_create_certification_requires_auth(self):
        """POST /api/admin/certifications should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certifications",
            json={
                "vendor": "AWS",
                "name": "Test Certification",
                "code": "TEST-001",
                "difficulty": "Intermediate",
                "description": "Test description",
                "job_roles": ["Test Role"],
                "exam_domains": []
            }
        )
        assert response.status_code == 401
        print("✓ Admin create certification requires authentication")
    
    def test_update_certification_requires_auth(self):
        """PUT /api/admin/certifications/{cert_id} should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/certifications/test-cert-id",
            json={
                "vendor": "AWS",
                "name": "Updated Certification",
                "code": "TEST-001",
                "difficulty": "Advanced",
                "description": "Updated description",
                "job_roles": [],
                "exam_domains": []
            }
        )
        assert response.status_code == 401
        print("✓ Admin update certification requires authentication")
    
    def test_delete_certification_requires_auth(self):
        """DELETE /api/admin/certifications/{cert_id} should return 401 without auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/certifications/test-cert-id")
        assert response.status_code == 401
        print("✓ Admin delete certification requires authentication")


class TestAdminLabsAPI:
    """Test admin labs CRUD endpoints"""
    
    def test_list_labs_requires_auth(self):
        """GET /api/admin/labs should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/labs")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
        print("✓ Admin list labs requires authentication")
    
    def test_list_labs_with_cert_filter_requires_auth(self):
        """GET /api/admin/labs?cert_id=xxx should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/labs?cert_id=aws-saa-c03")
        assert response.status_code == 401
        print("✓ Admin list labs with cert filter requires authentication")
    
    def test_create_lab_requires_auth(self):
        """POST /api/admin/labs should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/labs",
            json={
                "cert_id": "aws-saa-c03",
                "title": "Test Lab",
                "description": "Test lab description",
                "skill_trained": "Test Skill",
                "exam_domain": "Test Domain",
                "duration_minutes": 30,
                "difficulty": "Intermediate",
                "instructions": [],
                "prerequisites": []
            }
        )
        assert response.status_code == 401
        print("✓ Admin create lab requires authentication")
    
    def test_update_lab_requires_auth(self):
        """PUT /api/admin/labs/{lab_id} should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/labs/test-lab-id",
            json={
                "cert_id": "aws-saa-c03",
                "title": "Updated Lab",
                "description": "Updated description",
                "skill_trained": "Updated Skill",
                "exam_domain": "Updated Domain",
                "duration_minutes": 45,
                "difficulty": "Advanced",
                "instructions": [],
                "prerequisites": []
            }
        )
        assert response.status_code == 401
        print("✓ Admin update lab requires authentication")
    
    def test_delete_lab_requires_auth(self):
        """DELETE /api/admin/labs/{lab_id} should return 401 without auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/labs/test-lab-id")
        assert response.status_code == 401
        print("✓ Admin delete lab requires authentication")


class TestAdminAssessmentsAPI:
    """Test admin assessments CRUD endpoints"""
    
    def test_list_assessments_requires_auth(self):
        """GET /api/admin/assessments should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/assessments")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
        print("✓ Admin list assessments requires authentication")
    
    def test_list_assessments_with_cert_filter_requires_auth(self):
        """GET /api/admin/assessments?cert_id=xxx should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/assessments?cert_id=aws-saa-c03")
        assert response.status_code == 401
        print("✓ Admin list assessments with cert filter requires authentication")
    
    def test_create_assessment_requires_auth(self):
        """POST /api/admin/assessments should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/assessments",
            json={
                "cert_id": "aws-saa-c03",
                "title": "Test Assessment",
                "description": "Test assessment description",
                "type": "domain",
                "topics": ["Topic 1", "Topic 2"],
                "time_minutes": 30,
                "pass_threshold": 70,
                "questions": []
            }
        )
        assert response.status_code == 401
        print("✓ Admin create assessment requires authentication")
    
    def test_update_assessment_requires_auth(self):
        """PUT /api/admin/assessments/{assessment_id} should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/assessments/test-assessment-id",
            json={
                "cert_id": "aws-saa-c03",
                "title": "Updated Assessment",
                "description": "Updated description",
                "type": "full_exam",
                "topics": ["Updated Topic"],
                "time_minutes": 60,
                "pass_threshold": 75,
                "questions": []
            }
        )
        assert response.status_code == 401
        print("✓ Admin update assessment requires authentication")
    
    def test_delete_assessment_requires_auth(self):
        """DELETE /api/admin/assessments/{assessment_id} should return 401 without auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/assessments/test-assessment-id")
        assert response.status_code == 401
        print("✓ Admin delete assessment requires authentication")


class TestAdminProjectsAPI:
    """Test admin projects CRUD endpoints"""
    
    def test_list_projects_requires_auth(self):
        """GET /api/admin/projects should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/projects")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
        print("✓ Admin list projects requires authentication")
    
    def test_list_projects_with_cert_filter_requires_auth(self):
        """GET /api/admin/projects?cert_id=xxx should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/projects?cert_id=aws-saa-c03")
        assert response.status_code == 401
        print("✓ Admin list projects with cert filter requires authentication")
    
    def test_create_project_requires_auth(self):
        """POST /api/admin/projects should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/projects",
            json={
                "cert_id": "aws-saa-c03",
                "title": "Test Project",
                "description": "Test project description",
                "business_scenario": "Test scenario",
                "technologies": ["AWS", "EC2"],
                "difficulty": "Intermediate",
                "skills_validated": ["Skill 1"],
                "tasks": [],
                "deliverables": ["Deliverable 1"]
            }
        )
        assert response.status_code == 401
        print("✓ Admin create project requires authentication")
    
    def test_update_project_requires_auth(self):
        """PUT /api/admin/projects/{project_id} should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/projects/test-project-id",
            json={
                "cert_id": "aws-saa-c03",
                "title": "Updated Project",
                "description": "Updated description",
                "business_scenario": "Updated scenario",
                "technologies": ["AWS", "Lambda"],
                "difficulty": "Advanced",
                "skills_validated": ["Updated Skill"],
                "tasks": [],
                "deliverables": ["Updated Deliverable"]
            }
        )
        assert response.status_code == 401
        print("✓ Admin update project requires authentication")
    
    def test_delete_project_requires_auth(self):
        """DELETE /api/admin/projects/{project_id} should return 401 without auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/projects/test-project-id")
        assert response.status_code == 401
        print("✓ Admin delete project requires authentication")


class TestAdminContentReorderingAPI:
    """Test admin content reordering endpoints"""
    
    def test_reorder_certifications_requires_auth(self):
        """POST /api/admin/certifications/reorder should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certifications/reorder",
            json={"items": [{"id": "cert-1", "order": 0}, {"id": "cert-2", "order": 1}]}
        )
        assert response.status_code == 401
        print("✓ Admin reorder certifications requires authentication")
    
    def test_reorder_labs_requires_auth(self):
        """POST /api/admin/labs/reorder should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/labs/reorder",
            json={"items": [{"id": "lab-1", "order": 0}, {"id": "lab-2", "order": 1}]}
        )
        assert response.status_code == 401
        print("✓ Admin reorder labs requires authentication")
    
    def test_reorder_assessments_requires_auth(self):
        """POST /api/admin/assessments/reorder should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/assessments/reorder",
            json={"items": [{"id": "assess-1", "order": 0}, {"id": "assess-2", "order": 1}]}
        )
        assert response.status_code == 401
        print("✓ Admin reorder assessments requires authentication")
    
    def test_reorder_projects_requires_auth(self):
        """POST /api/admin/projects/reorder should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/projects/reorder",
            json={"items": [{"id": "proj-1", "order": 0}, {"id": "proj-2", "order": 1}]}
        )
        assert response.status_code == 401
        print("✓ Admin reorder projects requires authentication")


class TestPublicContentEndpoints:
    """Test that public content endpoints still work"""
    
    def test_public_certifications_accessible(self):
        """Public certifications endpoint should be accessible"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public certifications accessible, {len(data)} certifications found")
        
        # Verify certification structure
        if len(data) > 0:
            cert = data[0]
            assert "cert_id" in cert
            assert "name" in cert
            assert "vendor" in cert
            assert "difficulty" in cert
            print(f"  - First cert: {cert['vendor']} - {cert['name']}")
    
    def test_public_labs_for_certification(self):
        """Public labs endpoint should be accessible"""
        # Get a certification first
        certs_response = requests.get(f"{BASE_URL}/api/certifications")
        if certs_response.status_code == 200 and len(certs_response.json()) > 0:
            cert_id = certs_response.json()[0]["cert_id"]
            response = requests.get(f"{BASE_URL}/api/certifications/{cert_id}/labs")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Public labs accessible for {cert_id}, {len(data)} labs found")
    
    def test_public_assessments_for_certification(self):
        """Public assessments endpoint should be accessible"""
        certs_response = requests.get(f"{BASE_URL}/api/certifications")
        if certs_response.status_code == 200 and len(certs_response.json()) > 0:
            cert_id = certs_response.json()[0]["cert_id"]
            response = requests.get(f"{BASE_URL}/api/certifications/{cert_id}/assessments")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Public assessments accessible for {cert_id}, {len(data)} assessments found")
    
    def test_public_projects_for_certification(self):
        """Public projects endpoint should be accessible"""
        certs_response = requests.get(f"{BASE_URL}/api/certifications")
        if certs_response.status_code == 200 and len(certs_response.json()) > 0:
            cert_id = certs_response.json()[0]["cert_id"]
            response = requests.get(f"{BASE_URL}/api/certifications/{cert_id}/projects")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Public projects accessible for {cert_id}, {len(data)} projects found")


class TestAPIEndpointValidation:
    """Test API endpoint validation and error handling"""
    
    def test_certification_not_found(self):
        """Non-existent certification should return 404"""
        response = requests.get(f"{BASE_URL}/api/certifications/non-existent-cert-id")
        assert response.status_code == 404
        print("✓ Non-existent certification returns 404")
    
    def test_lab_not_found(self):
        """Non-existent lab should return 404"""
        response = requests.get(f"{BASE_URL}/api/labs/non-existent-lab-id")
        assert response.status_code == 404
        print("✓ Non-existent lab returns 404")
    
    def test_assessment_not_found(self):
        """Non-existent assessment should return 404"""
        response = requests.get(f"{BASE_URL}/api/assessments/non-existent-assessment-id")
        assert response.status_code == 404
        print("✓ Non-existent assessment returns 404")
    
    def test_project_not_found(self):
        """Non-existent project should return 404"""
        response = requests.get(f"{BASE_URL}/api/projects/non-existent-project-id")
        assert response.status_code == 404
        print("✓ Non-existent project returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
