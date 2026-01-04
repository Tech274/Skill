"""
Admin API Tests for SkillTrack365 Code-Insight Admin Intelligence System
Tests RBAC, admin dashboard, and user management endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lab-orchestrate.preview.emergentagent.com')


class TestAdminAPIAuthentication:
    """Test admin API authentication requirements"""
    
    def test_admin_dashboard_requires_auth(self):
        """Admin dashboard should return 401 for unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
        print("✓ Admin dashboard correctly requires authentication")
    
    def test_admin_users_requires_auth(self):
        """Admin users endpoint should return 401 for unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
        print("✓ Admin users endpoint correctly requires authentication")
    
    def test_admin_role_change_requires_auth(self):
        """Role change endpoint should return 401 for unauthenticated requests"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/test_user_id/role",
            json={"role": "learner"}
        )
        assert response.status_code == 401
        print("✓ Role change endpoint correctly requires authentication")
    
    def test_admin_suspend_requires_auth(self):
        """Suspend endpoint should return 401 for unauthenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/test_user_id/suspend?reason=test"
        )
        assert response.status_code == 401
        print("✓ Suspend endpoint correctly requires authentication")
    
    def test_admin_restore_requires_auth(self):
        """Restore endpoint should return 401 for unauthenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/test_user_id/restore"
        )
        assert response.status_code == 401
        print("✓ Restore endpoint correctly requires authentication")
    
    def test_admin_delete_requires_auth(self):
        """Delete endpoint should return 401 for unauthenticated requests"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/users/test_user_id"
        )
        assert response.status_code == 401
        print("✓ Delete endpoint correctly requires authentication")
    
    def test_admin_analytics_requires_auth(self):
        """Analytics endpoint should return 401 for unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 401
        print("✓ Analytics endpoint correctly requires authentication")
    
    def test_admin_user_activity_requires_auth(self):
        """User activity endpoint should return 401 for unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/admin/users/test_user_id/activity")
        assert response.status_code == 401
        print("✓ User activity endpoint correctly requires authentication")


class TestPublicAPIEndpoints:
    """Test that public endpoints still work"""
    
    def test_health_check(self):
        """Health check endpoint should be accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Health endpoint may or may not exist, but should not return 500
        assert response.status_code in [200, 404]
        print(f"✓ Health check returned status {response.status_code}")
    
    def test_certifications_public(self):
        """Certifications endpoint should be publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Certifications endpoint accessible, returned {len(data)} certifications")
    
    def test_auth_me_without_session(self):
        """Auth me endpoint should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth me correctly requires authentication")


class TestAdminAPIQueryParams:
    """Test admin API query parameter handling (without auth)"""
    
    def test_admin_users_with_search_param(self):
        """Admin users with search param should still require auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users?search=test")
        assert response.status_code == 401
        print("✓ Admin users with search param requires auth")
    
    def test_admin_users_with_role_filter(self):
        """Admin users with role filter should still require auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users?role=learner")
        assert response.status_code == 401
        print("✓ Admin users with role filter requires auth")
    
    def test_admin_users_with_status_filter(self):
        """Admin users with status filter should still require auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users?status=active")
        assert response.status_code == 401
        print("✓ Admin users with status filter requires auth")
    
    def test_admin_users_with_pagination(self):
        """Admin users with pagination should still require auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users?page=1&limit=10")
        assert response.status_code == 401
        print("✓ Admin users with pagination requires auth")


class TestAdminAPIInvalidRequests:
    """Test admin API handles invalid requests properly"""
    
    def test_role_change_invalid_role(self):
        """Role change with invalid role should return 401 (auth first)"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/test_user_id/role",
            json={"role": "invalid_role"}
        )
        # Should fail auth first before validation
        assert response.status_code == 401
        print("✓ Invalid role change requires auth first")
    
    def test_suspend_without_reason(self):
        """Suspend without reason should return 401 (auth first)"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/test_user_id/suspend"
        )
        # Should fail auth first
        assert response.status_code == 401
        print("✓ Suspend without reason requires auth first")


class TestExistingAPIEndpoints:
    """Test existing API endpoints still work"""
    
    def test_get_certifications(self):
        """Get certifications list"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            cert = data[0]
            assert "cert_id" in cert
            assert "name" in cert
            assert "vendor" in cert
        print(f"✓ Certifications endpoint working, {len(data)} certifications found")
    
    def test_get_certification_detail(self):
        """Get certification detail"""
        # First get list to get a valid cert_id
        response = requests.get(f"{BASE_URL}/api/certifications")
        if response.status_code == 200 and len(response.json()) > 0:
            cert_id = response.json()[0]["cert_id"]
            detail_response = requests.get(f"{BASE_URL}/api/certifications/{cert_id}")
            assert detail_response.status_code == 200
            data = detail_response.json()
            assert data["cert_id"] == cert_id
            print(f"✓ Certification detail endpoint working for {cert_id}")
        else:
            print("⚠ No certifications to test detail endpoint")
    
    def test_get_labs_for_certification(self):
        """Get labs for a certification"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        if response.status_code == 200 and len(response.json()) > 0:
            cert_id = response.json()[0]["cert_id"]
            labs_response = requests.get(f"{BASE_URL}/api/certifications/{cert_id}/labs")
            assert labs_response.status_code == 200
            data = labs_response.json()
            assert isinstance(data, list)
            print(f"✓ Labs endpoint working, {len(data)} labs found for {cert_id}")
        else:
            print("⚠ No certifications to test labs endpoint")
    
    def test_get_assessments_for_certification(self):
        """Get assessments for a certification"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        if response.status_code == 200 and len(response.json()) > 0:
            cert_id = response.json()[0]["cert_id"]
            assessments_response = requests.get(f"{BASE_URL}/api/certifications/{cert_id}/assessments")
            assert assessments_response.status_code == 200
            data = assessments_response.json()
            assert isinstance(data, list)
            print(f"✓ Assessments endpoint working, {len(data)} assessments found for {cert_id}")
        else:
            print("⚠ No certifications to test assessments endpoint")
    
    def test_get_projects_for_certification(self):
        """Get projects for a certification"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        if response.status_code == 200 and len(response.json()) > 0:
            cert_id = response.json()[0]["cert_id"]
            projects_response = requests.get(f"{BASE_URL}/api/certifications/{cert_id}/projects")
            assert projects_response.status_code == 200
            data = projects_response.json()
            assert isinstance(data, list)
            print(f"✓ Projects endpoint working, {len(data)} projects found for {cert_id}")
        else:
            print("⚠ No certifications to test projects endpoint")


class TestProtectedEndpoints:
    """Test that protected endpoints require authentication"""
    
    def test_dashboard_requires_auth(self):
        """User dashboard should require auth"""
        response = requests.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 401
        print("✓ User dashboard requires authentication")
    
    def test_lab_complete_requires_auth(self):
        """Lab complete should require auth"""
        response = requests.post(
            f"{BASE_URL}/api/labs/complete",
            json={"lab_id": "test", "cert_id": "test"}
        )
        assert response.status_code == 401
        print("✓ Lab complete requires authentication")
    
    def test_assessment_submit_requires_auth(self):
        """Assessment submit should require auth"""
        response = requests.post(
            f"{BASE_URL}/api/assessments/submit",
            json={"assessment_id": "test", "cert_id": "test", "answers": {}}
        )
        assert response.status_code == 401
        print("✓ Assessment submit requires authentication")
    
    def test_project_complete_requires_auth(self):
        """Project complete should require auth"""
        response = requests.post(
            f"{BASE_URL}/api/projects/complete",
            json={"project_id": "test", "cert_id": "test"}
        )
        assert response.status_code == 401
        print("✓ Project complete requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
