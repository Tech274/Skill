"""
Test Suite for Phase 3: Lab & Cloud Orchestration APIs
Tests both admin and user-facing lab orchestration endpoints

Endpoints tested:
- Admin: /api/admin/lab-orchestration/dashboard, instances, quotas, providers
- User: /api/lab-instances, /api/my-quota
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestLabOrchestrationAuthRequired:
    """Test that all lab orchestration endpoints require authentication"""
    
    def test_admin_dashboard_requires_auth(self):
        """GET /api/admin/lab-orchestration/dashboard requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_instances_requires_auth(self):
        """GET /api/admin/lab-orchestration/instances requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/instances")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_instances_with_status_filter_requires_auth(self):
        """GET /api/admin/lab-orchestration/instances?status=running requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/instances?status=running")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_instances_with_provider_filter_requires_auth(self):
        """GET /api/admin/lab-orchestration/instances?provider=aws requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/instances?provider=aws")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_instance_action_requires_auth(self):
        """POST /api/admin/lab-orchestration/instances/{id}/action requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/lab-orchestration/instances/test_inst_123/action",
            json={"action": "suspend"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_quotas_list_requires_auth(self):
        """GET /api/admin/lab-orchestration/quotas requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/quotas")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_quota_get_requires_auth(self):
        """GET /api/admin/lab-orchestration/quotas/{user_id} requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/quotas/test_user_123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_quota_update_requires_auth(self):
        """PUT /api/admin/lab-orchestration/quotas/{user_id} requires auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/lab-orchestration/quotas/test_user_123",
            json={"max_concurrent_labs": 5}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_quota_reset_requires_auth(self):
        """DELETE /api/admin/lab-orchestration/quotas/{user_id} requires auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/lab-orchestration/quotas/test_user_123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_providers_list_requires_auth(self):
        """GET /api/admin/lab-orchestration/providers requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/providers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_provider_toggle_requires_auth(self):
        """PUT /api/admin/lab-orchestration/providers/{provider_id} requires auth"""
        response = requests.put(f"{BASE_URL}/api/admin/lab-orchestration/providers/aws?is_enabled=true")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestUserLabInstancesAuthRequired:
    """Test that user-facing lab instance endpoints require authentication"""
    
    def test_user_lab_instances_list_requires_auth(self):
        """GET /api/lab-instances requires auth"""
        response = requests.get(f"{BASE_URL}/api/lab-instances")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_user_create_lab_instance_requires_auth(self):
        """POST /api/lab-instances requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/lab-instances",
            json={
                "lab_id": "test_lab_123",
                "provider": "aws",
                "region": "us-east-1",
                "instance_type": "small"
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_user_lab_instance_action_requires_auth(self):
        """POST /api/lab-instances/{id}/action requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/lab-instances/test_inst_123/action",
            json={"action": "suspend"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_user_get_lab_instance_requires_auth(self):
        """GET /api/lab-instances/{id} requires auth"""
        response = requests.get(f"{BASE_URL}/api/lab-instances/test_inst_123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_user_my_quota_requires_auth(self):
        """GET /api/my-quota requires auth"""
        response = requests.get(f"{BASE_URL}/api/my-quota")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAPIEndpointsExist:
    """Test that all API endpoints exist and return proper error codes (not 404)"""
    
    def test_admin_dashboard_endpoint_exists(self):
        """Admin dashboard endpoint should exist (401 not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/dashboard")
        assert response.status_code != 404, "Endpoint /api/admin/lab-orchestration/dashboard not found"
    
    def test_admin_instances_endpoint_exists(self):
        """Admin instances endpoint should exist (401 not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/instances")
        assert response.status_code != 404, "Endpoint /api/admin/lab-orchestration/instances not found"
    
    def test_admin_quotas_endpoint_exists(self):
        """Admin quotas endpoint should exist (401 not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/quotas")
        assert response.status_code != 404, "Endpoint /api/admin/lab-orchestration/quotas not found"
    
    def test_admin_providers_endpoint_exists(self):
        """Admin providers endpoint should exist (401 not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/lab-orchestration/providers")
        assert response.status_code != 404, "Endpoint /api/admin/lab-orchestration/providers not found"
    
    def test_user_lab_instances_endpoint_exists(self):
        """User lab instances endpoint should exist (401 not 404)"""
        response = requests.get(f"{BASE_URL}/api/lab-instances")
        assert response.status_code != 404, "Endpoint /api/lab-instances not found"
    
    def test_user_my_quota_endpoint_exists(self):
        """User my-quota endpoint should exist (401 not 404)"""
        response = requests.get(f"{BASE_URL}/api/my-quota")
        assert response.status_code != 404, "Endpoint /api/my-quota not found"


class TestPublicEndpoints:
    """Test public endpoints that don't require authentication"""
    
    def test_public_certifications(self):
        """Public certifications endpoint should be accessible"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of certifications"
    
    def test_public_catalog_labs(self):
        """Public catalog labs endpoint should be accessible"""
        response = requests.get(f"{BASE_URL}/api/catalog/labs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Catalog returns object with labs key
        assert "labs" in data, "Expected 'labs' key in response"
        assert isinstance(data["labs"], list), "Expected labs to be a list"


class TestInvalidInputs:
    """Test API behavior with invalid inputs"""
    
    def test_admin_instance_action_invalid_instance(self):
        """Admin action on non-existent instance should return 401 (auth first) or 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/lab-orchestration/instances/nonexistent_inst/action",
            json={"action": "suspend"}
        )
        # Should return 401 (auth required) before checking if instance exists
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
    
    def test_admin_provider_toggle_invalid_provider(self):
        """Toggle non-existent provider should return 401 (auth first) or 404"""
        response = requests.put(f"{BASE_URL}/api/admin/lab-orchestration/providers/invalid_provider?is_enabled=true")
        # Should return 401 (auth required) before checking if provider exists
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
    
    def test_user_instance_action_invalid_instance(self):
        """User action on non-existent instance should return 401 (auth first) or 404"""
        response = requests.post(
            f"{BASE_URL}/api/lab-instances/nonexistent_inst/action",
            json={"action": "suspend"}
        )
        # Should return 401 (auth required) before checking if instance exists
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"


class TestRequestValidation:
    """Test request body validation"""
    
    def test_create_lab_instance_missing_lab_id(self):
        """Creating lab instance without lab_id should fail validation"""
        response = requests.post(
            f"{BASE_URL}/api/lab-instances",
            json={
                "provider": "aws",
                "region": "us-east-1",
                "instance_type": "small"
            }
        )
        # Should return 401 (auth) or 422 (validation error)
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}"
    
    def test_instance_action_missing_action(self):
        """Instance action without action field should fail validation"""
        response = requests.post(
            f"{BASE_URL}/api/lab-instances/test_inst/action",
            json={}
        )
        # Should return 401 (auth) or 422 (validation error)
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
