import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Award, TrendingUp, UserCheck, UserX, Crown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL || window.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        withCredentials: true
      });
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, roles, content, learning, engagement, revenue } = stats;

  return (
    <div className="p-8 space-y-8" data-testid="admin-dashboard">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-dashboard-title">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your learning platform</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_users}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{overview.new_users_7d} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users (7d)</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.active_users_7d}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((overview.active_users_7d / overview.total_users) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.premium_users}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((overview.premium_users / overview.total_users) * 100).toFixed(1)}% premium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Suspended Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.suspended_users}</div>
            <p className="text-xs text-gray-500 mt-1">Moderation required</p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>User roles across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(roles).map(([role, count]) => (
              <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600 mt-1 capitalize">
                  {role.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content & Learning Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Library</CardTitle>
            <CardDescription>Available learning resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Certifications</span>
                <span className="font-bold">{content.certifications}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Labs</span>
                <span className="font-bold">{content.labs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Assessments</span>
                <span className="font-bold">{content.assessments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Projects</span>
                <span className="font-bold">{content.projects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Videos</span>
                <span className="font-bold">{content.videos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>Platform-wide achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Enrollments</span>
                <span className="font-bold">{learning.total_enrollments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg. Readiness</span>
                <span className="font-bold">{learning.avg_readiness_percentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Certificates Issued</span>
                <span className="font-bold">{learning.total_certificates_issued}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Badges Earned</span>
                <span className="font-bold">{learning.total_badges_earned}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Community Engagement</CardTitle>
            <CardDescription>User interaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Discussions</span>
                <span className="font-bold">{engagement.total_discussions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Discussions (7d)</span>
                <span className="font-bold">{engagement.new_discussions_7d}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {revenue && Object.keys(revenue).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Financial metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-bold">{revenue.total_transactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Paid Transactions</span>
                  <span className="font-bold">{revenue.paid_transactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-bold text-green-600">${(revenue.total_revenue / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
