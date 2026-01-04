import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserPlus, Shield, Ban, CheckCircle, Trash2, Crown, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || window.REACT_APP_BACKEND_URL;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`${API_URL}/api/admin/users?${params}`, {
        withCredentials: true
      });
      setUsers(response.data.users);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/role`, 
        { role: newRole },
        { withCredentials: true }
      );
      fetchUsers();
      setShowRoleModal(false);
      alert('Role updated successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleSuspend = async (userId) => {
    if (!suspendReason.trim()) {
      alert('Please provide a suspension reason');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/suspend?reason=${encodeURIComponent(suspendReason)}`,
        {},
        { withCredentials: true }
      );
      fetchUsers();
      setShowSuspendModal(false);
      setSuspendReason('');
      alert('User suspended successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to suspend user');
    }
  };

  const handleRestore = async (userId) => {
    if (!window.confirm('Are you sure you want to restore this user?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/restore`,
        {},
        { withCredentials: true }
      );
      fetchUsers();
      alert('User restored successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to restore user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone!')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        withCredentials: true
      });
      fetchUsers();
      alert('User deleted successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-purple-100 text-purple-800',
      content_admin: 'bg-blue-100 text-blue-800',
      lab_admin: 'bg-green-100 text-green-800',
      finance_admin: 'bg-yellow-100 text-yellow-800',
      support_admin: 'bg-orange-100 text-orange-800',
      learner: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || badges.learner;
  };

  return (
    <div className="p-8 space-y-6" data-testid="admin-users">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-users-title">User Management</h1>
        <p className="text-gray-600 mt-2">Manage platform users and permissions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="learner">Learner</option>
              <option value="super_admin">Super Admin</option>
              <option value="content_admin">Content Admin</option>
              <option value="lab_admin">Lab Admin</option>
              <option value="finance_admin">Finance Admin</option>
              <option value="support_admin">Support Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="premium">Premium</option>
            </select>

            <Button onClick={() => fetchUsers()} className="bg-blue-600 hover:bg-blue-700">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="h-10 w-10 rounded-full" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">{user.name[0]}</span>
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {user.is_suspended ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                          {user.subscription_status === 'premium' && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Premium
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {user.total_xp || 0}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Change Role"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          {user.is_suspended ? (
                            <button
                              onClick={() => handleRestore(user.user_id)}
                              className="text-green-600 hover:text-green-900"
                              title="Restore User"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowSuspendModal(true);
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="Suspend User"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user.user_id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Change User Role</h3>
            <p className="text-gray-600 mb-4">
              Change role for <strong>{selectedUser.name}</strong>
            </p>
            <div className="space-y-2">
              {['learner', 'super_admin', 'content_admin', 'lab_admin', 'finance_admin', 'support_admin'].map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(selectedUser.user_id, role)}
                  className={`w-full px-4 py-2 text-left rounded-lg border ${
                    selectedUser.role === role ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {role.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowRoleModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Suspend User</h3>
            <p className="text-gray-600 mb-4">
              Suspend <strong>{selectedUser.name}</strong>
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowSuspendModal(false);
                setSuspendReason('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleSuspend(selectedUser.user_id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Suspend User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
