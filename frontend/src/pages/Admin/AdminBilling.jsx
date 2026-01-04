import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  DollarSign, CreditCard, Users, TrendingUp,
  Plus, Pencil, Trash2, Eye, Search, Filter, X, Check,
  Calendar, RefreshCw, Ban, Clock, ArrowUpRight,
  Wallet, Receipt, PieChart, BarChart3, Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || window.REACT_APP_BACKEND_URL;

// Tab configurations
const TABS = {
  dashboard: { icon: BarChart3, label: 'Dashboard', color: 'blue' },
  plans: { icon: CreditCard, label: 'Pricing Plans', color: 'purple' },
  subscriptions: { icon: Users, label: 'Subscriptions', color: 'green' },
  transactions: { icon: Receipt, label: 'Transactions', color: 'amber' }
};

const BILLING_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one_time', label: 'One Time' }
];

const SUBSCRIPTION_STATUSES = [
  { value: 'premium', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'free', label: 'Free', color: 'bg-gray-100 text-gray-800' },
  { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-yellow-100 text-yellow-800' }
];

const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
];

export default function AdminBilling() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/billing/dashboard`, {
        withCredentials: true
      });
      setDashboard(response.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      toast.error('Failed to load billing dashboard');
    } finally {
      setLoading(false);
    }
  };

  const seedPlans = async () => {
    try {
      await axios.post(`${API_URL}/api/admin/billing/seed-plans`, {}, {
        withCredentials: true
      });
      toast.success('Default plans seeded');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to seed plans');
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="admin-billing">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-billing-title">
            Billing & Subscriptions
          </h1>
          <p className="text-gray-600 mt-2">Manage pricing plans, subscriptions, and transactions</p>
        </div>
        <Button onClick={seedPlans} variant="outline" data-testid="seed-plans-btn">
          <RefreshCw className="h-4 w-4 mr-2" />
          Seed Default Plans
        </Button>
      </div>

      {/* Stats Overview */}
      {!loading && dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('dashboard')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">${dashboard.total_revenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-green-600">+${dashboard.monthly_revenue?.toFixed(2) || '0.00'} this month</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('subscriptions')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Subs</p>
                  <p className="text-2xl font-bold">{dashboard.subscriptions?.active || 0}</p>
                  <p className="text-xs text-gray-400">{dashboard.subscriptions?.free || 0} free users</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('transactions')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="text-2xl font-bold">{dashboard.transactions?.successful || 0}</p>
                  <p className="text-xs text-gray-400">{dashboard.transactions?.pending || 0} pending</p>
                </div>
                <Receipt className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('plans')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Plans</p>
                  <p className="text-2xl font-bold">{dashboard.active_plans || 0}</p>
                  <p className="text-xs text-gray-400">pricing plans</p>
                </div>
                <CreditCard className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {Object.entries(TABS).map(([key, { icon: Icon, label }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            data-testid={`tab-${key}`}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <BillingDashboard data={dashboard} />}
      {activeTab === 'plans' && <PricingPlansTab onUpdate={fetchDashboard} />}
      {activeTab === 'subscriptions' && <SubscriptionsTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
    </div>
  );
}

// Dashboard Tab
function BillingDashboard({ data }) {
  if (!data) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Plan</CardTitle>
          <CardDescription>Breakdown of revenue by subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenue_by_plan?.length > 0 ? (
            <div className="space-y-4">
              {data.revenue_by_plan.map((plan, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      plan._id === 'yearly' ? 'bg-green-500' : 
                      plan._id === 'monthly' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <span className="font-medium capitalize">{plan._id || 'Unknown'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${plan.total?.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{plan.count} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No revenue data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenue_trend?.length > 0 ? (
            <div className="space-y-2">
              {data.revenue_trend.map((month, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <span className="w-20 text-sm text-gray-600">{month._id}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (month.total / Math.max(...data.revenue_trend.map(m => m.total))) * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="w-24 text-right font-medium">${month.total?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No trend data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Pricing Plans Tab
function PricingPlansTab({ onUpdate }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    plan_id: '',
    name: '',
    description: '',
    price: 0,
    currency: 'usd',
    billing_period: 'monthly',
    features: [],
    is_active: true,
    is_featured: false,
    trial_days: 0,
    max_users: null,
    order: 0
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/billing/plans`, {
        withCredentials: true
      });
      setPlans(response.data);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      plan_id: '',
      name: '',
      description: '',
      price: 0,
      currency: 'usd',
      billing_period: 'monthly',
      features: [],
      is_active: true,
      is_featured: false,
      trial_days: 0,
      max_users: null,
      order: plans.length
    });
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_id: plan.plan_id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency || 'usd',
      billing_period: plan.billing_period,
      features: plan.features || [],
      is_active: plan.is_active,
      is_featured: plan.is_featured || false,
      trial_days: plan.trial_days || 0,
      max_users: plan.max_users,
      order: plan.order || 0
    });
    setShowModal(true);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (idx) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await axios.put(`${API_URL}/api/admin/billing/plans/${editingPlan.plan_id}`, formData, {
          withCredentials: true
        });
        toast.success('Plan updated');
      } else {
        await axios.post(`${API_URL}/api/admin/billing/plans`, formData, {
          withCredentials: true
        });
        toast.success('Plan created');
      }
      setShowModal(false);
      fetchPlans();
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save plan');
    }
  };

  const deletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/billing/plans/${planId}`, {
        withCredentials: true
      });
      toast.success('Plan deleted');
      fetchPlans();
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete plan');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pricing Plans</h2>
        <Button onClick={openCreateModal} data-testid="create-plan-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.plan_id} className={`relative ${plan.is_featured ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.is_featured && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                Featured
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-500">/{plan.billing_period}</span>
              </div>
              
              <ul className="space-y-2">
                {plan.features?.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
                {plan.features?.length > 4 && (
                  <li className="text-sm text-gray-500">+{plan.features.length - 4} more features</li>
                )}
              </ul>

              {plan.trial_days > 0 && (
                <p className="text-sm text-blue-600 text-center">{plan.trial_days} day free trial</p>
              )}

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(plan)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => deletePlan(plan.plan_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No pricing plans yet</p>
          <p className="text-sm text-gray-500 mb-4">Click &quot;Seed Default Plans&quot; to create initial plans</p>
        </div>
      )}

      {/* Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan ID</label>
                  <input
                    type="text"
                    value={formData.plan_id}
                    onChange={e => setFormData({ ...formData, plan_id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., pro_monthly"
                    required
                    disabled={editingPlan}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full border rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Billing Period</label>
                    <select
                      value={formData.billing_period}
                      onChange={e => setFormData({ ...formData, billing_period: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      {BILLING_PERIODS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Features</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="flex-1 border rounded-md px-3 py-2"
                      placeholder="Add a feature"
                    />
                    <Button type="button" onClick={addFeature} variant="outline">Add</Button>
                  </div>
                  <div className="space-y-1">
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded">
                        <span className="text-sm">{feature}</span>
                        <button type="button" onClick={() => removeFeature(idx)} className="text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Trial Days</label>
                    <input
                      type="number"
                      value={formData.trial_days}
                      onChange={e => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Users (Team)</label>
                    <input
                      type="number"
                      value={formData.max_users || ''}
                      onChange={e => setFormData({ ...formData, max_users: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subscriptions Tab
function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [extendDays, setExtendDays] = useState(30);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`${API_URL}/api/admin/billing/subscriptions?${params}`, {
        withCredentials: true
      });
      setSubscriptions(response.data.subscriptions);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const openDetailModal = async (sub) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/billing/subscriptions/${sub.user_id}`, {
        withCredentials: true
      });
      setSelectedSub(response.data);
      setShowModal(true);
    } catch (err) {
      toast.error('Failed to load subscription details');
    }
  };

  const extendSubscription = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/admin/billing/subscriptions/${userId}/extend?days=${extendDays}`, {}, {
        withCredentials: true
      });
      toast.success(`Subscription extended by ${extendDays} days`);
      fetchSubscriptions();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to extend subscription');
    }
  };

  const cancelSubscription = async (userId) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/billing/subscriptions/${userId}/cancel`, {}, {
        withCredentials: true
      });
      toast.success('Subscription cancelled');
      fetchSubscriptions();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel subscription');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = SUBSCRIPTION_STATUSES.find(s => s.value === status) || SUBSCRIPTION_STATUSES[1];
    return <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>{statusConfig.label}</span>;
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="">All Statuses</option>
          {SUBSCRIPTION_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full" data-testid="subscriptions-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Expires</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Last Payment</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map(sub => (
                <tr key={sub.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{sub.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{sub.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(sub.subscription_status)}</td>
                  <td className="px-4 py-3 text-sm">
                    {sub.subscription_expires_at 
                      ? new Date(sub.subscription_expires_at).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.last_payment 
                      ? `$${sub.last_payment.amount} on ${new Date(sub.last_payment.created_at).toLocaleDateString()}`
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetailModal(sub)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {subscriptions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No subscriptions found</p>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Subscription Details</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{selectedSub.user?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{selectedSub.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      {getStatusBadge(selectedSub.user?.subscription_status)}
                    </div>
                    <div>
                      <p className="text-gray-500">Expires</p>
                      <p className="font-medium">
                        {selectedSub.user?.subscription_expires_at 
                          ? new Date(selectedSub.user.subscription_expires_at).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Extend by days</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={extendDays}
                        onChange={e => setExtendDays(parseInt(e.target.value) || 0)}
                        className="flex-1 border rounded-md px-3 py-2"
                      />
                      <Button onClick={() => extendSubscription(selectedSub.user?.user_id)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Extend
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">&nbsp;</label>
                    <Button 
                      variant="outline" 
                      className="text-red-600"
                      onClick={() => cancelSubscription(selectedSub.user?.user_id)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel Sub
                    </Button>
                  </div>
                </div>

                {/* Transaction History */}
                <div>
                  <h4 className="font-medium mb-2">Transaction History</h4>
                  {selectedSub.transactions?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSub.transactions.map((txn, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">${txn.amount} - {txn.plan}</p>
                            <p className="text-sm text-gray-500">{new Date(txn.created_at).toLocaleString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            txn.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {txn.payment_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No transactions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Transactions Tab
function TransactionsTab() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('plan', planFilter);
      
      const response = await axios.get(`${API_URL}/api/admin/billing/transactions?${params}`, {
        withCredentials: true
      });
      setTransactions(response.data.transactions);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, planFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openRefundModal = (txn) => {
    setSelectedTxn(txn);
    setRefundReason('');
    setShowRefundModal(true);
  };

  const processRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/billing/transactions/${selectedTxn.transaction_id}/refund`, {
        reason: refundReason
      }, {
        withCredentials: true
      });
      toast.success('Refund processed');
      setShowRefundModal(false);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process refund');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = PAYMENT_STATUSES.find(s => s.value === status) || PAYMENT_STATUSES[1];
    return <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>{statusConfig.label}</span>;
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="">All Statuses</option>
          {PAYMENT_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="">All Plans</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full" data-testid="transactions-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Transaction</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map(txn => (
                <tr key={txn.transaction_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm">{txn.transaction_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{txn.user?.email || txn.user_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize">{txn.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">${txn.amount?.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 uppercase">{txn.currency}</p>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(txn.payment_status)}
                    {txn.refund_status === 'refunded' && (
                      <span className="ml-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Refunded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(txn.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {txn.payment_status === 'paid' && txn.refund_status !== 'refunded' && (
                      <Button variant="ghost" size="sm" onClick={() => openRefundModal(txn)} className="text-orange-600">
                        Refund
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {transactions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No transactions found</p>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTxn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Process Refund</h3>
                <button onClick={() => setShowRefundModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Transaction</p>
                  <p className="font-mono text-sm">{selectedTxn.transaction_id}</p>
                  <p className="text-lg font-bold mt-2">${selectedTxn.amount?.toFixed(2)} {selectedTxn.currency?.toUpperCase()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Refund Reason *</label>
                  <textarea
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Enter reason for refund..."
                    required
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                  <strong>Note:</strong> Full refunds will revert the user&apos;s subscription to free tier.
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowRefundModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={processRefund} className="flex-1 bg-orange-600 hover:bg-orange-700">
                    Process Refund
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
