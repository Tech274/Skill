"""
Test suite for Admin Billing & Subscriptions API (Phase 5)
Tests: Dashboard, Pricing Plans CRUD, Subscriptions Management, Transactions, Refunds, Analytics
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBillingDashboard:
    """Admin Billing Dashboard endpoint tests"""
    
    def test_dashboard_requires_auth(self):
        """GET /api/admin/billing/dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard requires auth (401)")
    
    def test_dashboard_endpoint_exists(self):
        """Dashboard endpoint exists (not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/dashboard")
        assert response.status_code != 404, "Dashboard endpoint should exist"
        print("✓ Dashboard endpoint exists")


class TestPricingPlansCRUD:
    """Pricing Plans CRUD endpoint tests"""
    
    def test_get_plans_requires_auth(self):
        """GET /api/admin/billing/plans requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/plans")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET plans requires auth (401)")
    
    def test_get_single_plan_requires_auth(self):
        """GET /api/admin/billing/plans/{plan_id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/plans/monthly")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET single plan requires auth (401)")
    
    def test_create_plan_requires_auth(self):
        """POST /api/admin/billing/plans requires authentication"""
        plan_data = {
            "plan_id": f"test_plan_{uuid.uuid4().hex[:8]}",
            "name": "Test Plan",
            "description": "Test description",
            "price": 9.99,
            "billing_period": "monthly",
            "features": ["Feature 1", "Feature 2"],
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/admin/billing/plans", json=plan_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST create plan requires auth (401)")
    
    def test_update_plan_requires_auth(self):
        """PUT /api/admin/billing/plans/{plan_id} requires authentication"""
        update_data = {"name": "Updated Plan Name"}
        response = requests.put(f"{BASE_URL}/api/admin/billing/plans/monthly", json=update_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT update plan requires auth (401)")
    
    def test_delete_plan_requires_auth(self):
        """DELETE /api/admin/billing/plans/{plan_id} requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/admin/billing/plans/test_plan")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ DELETE plan requires auth (401)")
    
    def test_plans_endpoint_exists(self):
        """Plans endpoint exists (not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/plans")
        assert response.status_code != 404, "Plans endpoint should exist"
        print("✓ Plans endpoint exists")


class TestSeedPlans:
    """Seed Plans endpoint tests"""
    
    def test_seed_plans_requires_auth(self):
        """POST /api/admin/billing/seed-plans requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/billing/seed-plans")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Seed plans requires auth (401)")
    
    def test_seed_plans_endpoint_exists(self):
        """Seed plans endpoint exists (not 404)"""
        response = requests.post(f"{BASE_URL}/api/admin/billing/seed-plans")
        assert response.status_code != 404, "Seed plans endpoint should exist"
        print("✓ Seed plans endpoint exists")


class TestSubscriptionsManagement:
    """Subscriptions Management endpoint tests"""
    
    def test_get_subscriptions_requires_auth(self):
        """GET /api/admin/billing/subscriptions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/subscriptions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET subscriptions requires auth (401)")
    
    def test_get_subscriptions_with_filters_requires_auth(self):
        """GET /api/admin/billing/subscriptions with filters requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/subscriptions?status=active&search=test")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET subscriptions with filters requires auth (401)")
    
    def test_get_subscription_detail_requires_auth(self):
        """GET /api/admin/billing/subscriptions/{user_id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/subscriptions/user_test123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET subscription detail requires auth (401)")
    
    def test_update_subscription_requires_auth(self):
        """PUT /api/admin/billing/subscriptions/{user_id} requires authentication"""
        update_data = {"status": "premium"}
        response = requests.put(f"{BASE_URL}/api/admin/billing/subscriptions/user_test123", json=update_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT update subscription requires auth (401)")
    
    def test_extend_subscription_requires_auth(self):
        """POST /api/admin/billing/subscriptions/{user_id}/extend requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/billing/subscriptions/user_test123/extend?days=30")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST extend subscription requires auth (401)")
    
    def test_cancel_subscription_requires_auth(self):
        """POST /api/admin/billing/subscriptions/{user_id}/cancel requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/billing/subscriptions/user_test123/cancel")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST cancel subscription requires auth (401)")
    
    def test_subscriptions_endpoint_exists(self):
        """Subscriptions endpoint exists (not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/subscriptions")
        assert response.status_code != 404, "Subscriptions endpoint should exist"
        print("✓ Subscriptions endpoint exists")


class TestTransactionsManagement:
    """Transactions Management endpoint tests"""
    
    def test_get_transactions_requires_auth(self):
        """GET /api/admin/billing/transactions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/transactions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET transactions requires auth (401)")
    
    def test_get_transactions_with_filters_requires_auth(self):
        """GET /api/admin/billing/transactions with filters requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/transactions?status=paid&plan=monthly")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET transactions with filters requires auth (401)")
    
    def test_get_transaction_detail_requires_auth(self):
        """GET /api/admin/billing/transactions/{transaction_id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/transactions/txn_test123")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET transaction detail requires auth (401)")
    
    def test_refund_transaction_requires_auth(self):
        """POST /api/admin/billing/transactions/{transaction_id}/refund requires authentication"""
        refund_data = {"reason": "Test refund"}
        response = requests.post(f"{BASE_URL}/api/admin/billing/transactions/txn_test123/refund", json=refund_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST refund transaction requires auth (401)")
    
    def test_transactions_endpoint_exists(self):
        """Transactions endpoint exists (not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/transactions")
        assert response.status_code != 404, "Transactions endpoint should exist"
        print("✓ Transactions endpoint exists")


class TestBillingAnalytics:
    """Billing Analytics endpoint tests"""
    
    def test_analytics_requires_auth(self):
        """GET /api/admin/billing/analytics requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/analytics")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET analytics requires auth (401)")
    
    def test_analytics_with_params_requires_auth(self):
        """GET /api/admin/billing/analytics with params requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/analytics?period=monthly")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET analytics with params requires auth (401)")
    
    def test_analytics_endpoint_exists(self):
        """Analytics endpoint exists (not 404)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/analytics")
        assert response.status_code != 404, "Analytics endpoint should exist"
        print("✓ Analytics endpoint exists")


class TestPublicPricingPlans:
    """Public Pricing Plans endpoint tests (no auth required)"""
    
    def test_public_pricing_plans_accessible(self):
        """GET /api/pricing/plans is publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/pricing/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Public pricing plans accessible (200)")
    
    def test_public_pricing_plans_returns_list(self):
        """GET /api/pricing/plans returns a list"""
        response = requests.get(f"{BASE_URL}/api/pricing/plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Public pricing plans returns list (count: {len(data)})")


class TestAPIBasics:
    """Basic API health checks"""
    
    def test_api_root_accessible(self):
        """API root is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ API root accessible (200)")
    
    def test_certifications_public_accessible(self):
        """Public certifications endpoint accessible"""
        response = requests.get(f"{BASE_URL}/api/certifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Public certifications accessible (200)")


class TestNonExistentResources:
    """Test 401/404 responses for non-existent resources"""
    
    def test_get_nonexistent_plan(self):
        """GET non-existent plan returns 401 (auth required first)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/plans/nonexistent_plan_xyz")
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
        print(f"✓ GET non-existent plan returns {response.status_code}")
    
    def test_get_nonexistent_subscription(self):
        """GET non-existent subscription returns 401 (auth required first)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/subscriptions/nonexistent_user_xyz")
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
        print(f"✓ GET non-existent subscription returns {response.status_code}")
    
    def test_get_nonexistent_transaction(self):
        """GET non-existent transaction returns 401 (auth required first)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/transactions/nonexistent_txn_xyz")
        assert response.status_code in [401, 404], f"Expected 401 or 404, got {response.status_code}"
        print(f"✓ GET non-existent transaction returns {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
