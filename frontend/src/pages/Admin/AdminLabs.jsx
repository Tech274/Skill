import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Cloud, 
  Activity, 
  Users, 
  DollarSign,
  Play,
  Pause,
  StopCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Cpu,
  HardDrive,
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminLabs() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [instances, setInstances] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [providers, setProviders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [selectedQuota, setSelectedQuota] = useState(null);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaForm, setQuotaForm] = useState({});

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/dashboard`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  }, []);

  const fetchInstances = useCallback(async () => {
    try {
      let url = `${API_URL}/api/admin/lab-orchestration/instances`;
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (providerFilter !== 'all') params.append('provider', providerFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error);
    }
  }, [statusFilter, providerFilter]);

  const fetchQuotas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/quotas`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setQuotas(data);
      }
    } catch (error) {
      console.error('Failed to fetch quotas:', error);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/providers`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/metrics?period=24h`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchInstances(),
        fetchQuotas(),
        fetchProviders(),
        fetchMetrics()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchDashboard, fetchInstances, fetchQuotas, fetchProviders, fetchMetrics]);

  // Re-fetch instances when filters change
  useEffect(() => {
    if (activeTab === 'instances' && !loading) {
      fetchInstances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, providerFilter]);

  const handleInstanceAction = async (instanceId, action) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/instances/${instanceId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        toast.success(`Instance ${action}ed successfully`);
        fetchInstances();
        fetchDashboard();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Action failed');
      }
    } catch (error) {
      toast.error('Failed to perform action');
    }
  };

  const handleProviderToggle = async (providerId, enabled) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/providers/${providerId}?is_enabled=${enabled}`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (res.ok) {
        toast.success(`Provider ${enabled ? 'enabled' : 'disabled'}`);
        fetchProviders();
      }
    } catch (error) {
      toast.error('Failed to update provider');
    }
  };

  const openQuotaModal = (quota) => {
    setSelectedQuota(quota);
    setQuotaForm({
      max_concurrent_labs: quota?.max_concurrent_labs || 2,
      max_daily_lab_hours: quota?.max_daily_lab_hours || 4,
      max_monthly_lab_hours: quota?.max_monthly_lab_hours || 40,
      storage_limit_gb: quota?.storage_limit_gb || 10,
      allowed_providers: quota?.allowed_providers || ['aws', 'gcp', 'azure'],
      allowed_instance_types: quota?.allowed_instance_types || ['small', 'medium']
    });
    setQuotaModalOpen(true);
  };

  const handleQuotaSave = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/quotas/${selectedQuota.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quotaForm)
      });
      
      if (res.ok) {
        toast.success('Quota updated successfully');
        setQuotaModalOpen(false);
        fetchQuotas();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to update quota');
      }
    } catch (error) {
      toast.error('Failed to update quota');
    }
  };

  const handleQuotaReset = async (userId) => {
    if (!window.confirm('Reset this user\'s quota to defaults?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/lab-orchestration/quotas/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        toast.success('Quota reset to defaults');
        fetchQuotas();
      }
    } catch (error) {
      toast.error('Failed to reset quota');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      running: { bg: 'bg-green-100', text: 'text-green-700', icon: Play },
      suspended: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Pause },
      provisioning: { bg: 'bg-blue-100', text: 'text-blue-700', icon: RefreshCw },
      terminated: { bg: 'bg-gray-100', text: 'text-gray-700', icon: StopCircle },
      error: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle }
    };
    const badge = badges[status] || badges.terminated;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const getProviderIcon = (provider) => {
    const colors = { aws: 'text-orange-500', gcp: 'text-blue-500', azure: 'text-cyan-500' };
    return <Cloud className={`h-4 w-4 ${colors[provider] || 'text-gray-500'}`} />;
  };

  const filteredInstances = instances.filter(inst => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inst.instance_id.toLowerCase().includes(search) ||
      inst.user?.email?.toLowerCase().includes(search) ||
      inst.lab_title?.toLowerCase().includes(search)
    );
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'instances', label: 'Lab Instances', icon: Server },
    { id: 'quotas', label: 'Quotas', icon: Settings },
    { id: 'providers', label: 'Providers', icon: Cloud }
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" data-testid="admin-labs-loading">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="admin-labs-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lab Orchestration</h1>
        <p className="text-gray-500 mt-1">Manage cloud lab instances, quotas, and providers</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6" data-testid="lab-dashboard">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Running Instances</p>
                  <p className="text-3xl font-bold text-green-600">{dashboard.instances.running}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Suspended</p>
                  <p className="text-3xl font-bold text-yellow-600">{dashboard.instances.suspended}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Pause className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="text-3xl font-bold text-blue-600">{dashboard.active_users}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Est. Daily Cost</p>
                  <p className="text-3xl font-bold text-purple-600">${dashboard.resources.estimated_daily_cost}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resource Usage</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Total vCPUs</span>
                  </div>
                  <span className="font-semibold">{dashboard.resources.total_vcpu}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Total Memory</span>
                  </div>
                  <span className="font-semibold">{dashboard.resources.total_memory_gb} GB</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Provider Distribution</h3>
              <div className="space-y-3">
                {Object.entries(dashboard.providers).map(([provider, count]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(provider)}
                      <span className="text-sm text-gray-600 uppercase">{provider}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            provider === 'aws' ? 'bg-orange-500' : 
                            provider === 'gcp' ? 'bg-blue-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, (count / Math.max(1, dashboard.instances.running + dashboard.instances.suspended)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          {dashboard.recent_errors?.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Recent Errors
              </h3>
              <div className="space-y-3">
                {dashboard.recent_errors.map((err, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-700">{err.instance_id}</p>
                      <p className="text-xs text-red-500">{err.error_message || 'Unknown error'}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(err.started_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instances Tab */}
      {activeTab === 'instances' && (
        <div className="space-y-4" data-testid="lab-instances">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search instances, users, labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="instance-search"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('running')}>Running</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>Suspended</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('terminated')}>Terminated</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('error')}>Error</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Cloud className="h-4 w-4" />
                  Provider: {providerFilter === 'all' ? 'All' : providerFilter.toUpperCase()}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setProviderFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProviderFilter('aws')}>AWS</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProviderFilter('gcp')}>GCP</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProviderFilter('azure')}>Azure</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => fetchInstances()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Instances Table */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resources</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInstances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No lab instances found
                    </td>
                  </tr>
                ) : (
                  filteredInstances.map((inst) => (
                    <tr key={inst.instance_id} className="hover:bg-gray-50" data-testid={`instance-row-${inst.instance_id}`}>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{inst.instance_id}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{inst.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{inst.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{inst.lab_title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(inst.provider)}
                          <span className="text-sm uppercase">{inst.provider}</span>
                        </div>
                        <p className="text-xs text-gray-500">{inst.region}</p>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(inst.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p>{inst.resources?.vcpu || 0} vCPU</p>
                          <p>{inst.resources?.memory_gb || 0} GB RAM</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p>{new Date(inst.started_at).toLocaleDateString()}</p>
                          <p className="text-gray-500">{new Date(inst.started_at).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {inst.status === 'running' && (
                              <DropdownMenuItem onClick={() => handleInstanceAction(inst.instance_id, 'suspend')}>
                                <Pause className="h-4 w-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                            )}
                            {inst.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => handleInstanceAction(inst.instance_id, 'resume')}>
                                <Play className="h-4 w-4 mr-2" /> Resume
                              </DropdownMenuItem>
                            )}
                            {inst.status !== 'terminated' && (
                              <>
                                <DropdownMenuItem onClick={() => handleInstanceAction(inst.instance_id, 'extend')}>
                                  <Clock className="h-4 w-4 mr-2" /> Extend Time
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleInstanceAction(inst.instance_id, 'terminate')}
                                  className="text-red-600"
                                >
                                  <StopCircle className="h-4 w-4 mr-2" /> Terminate
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quotas Tab */}
      {activeTab === 'quotas' && (
        <div className="space-y-4" data-testid="lab-quotas">
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concurrent Labs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Storage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Providers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Now</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No custom quotas set. Users have default quotas.
                    </td>
                  </tr>
                ) : (
                  quotas.map((quota) => (
                    <tr key={quota.user_id} className="hover:bg-gray-50" data-testid={`quota-row-${quota.user_id}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{quota.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{quota.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{quota.max_concurrent_labs}</td>
                      <td className="px-4 py-3 text-sm">{quota.max_daily_lab_hours}h</td>
                      <td className="px-4 py-3 text-sm">{quota.max_monthly_lab_hours}h</td>
                      <td className="px-4 py-3 text-sm">{quota.storage_limit_gb} GB</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {quota.allowed_providers?.map(p => (
                            <span key={p} className="text-xs bg-gray-100 px-2 py-0.5 rounded uppercase">{p}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${quota.current_active_labs >= quota.max_concurrent_labs ? 'text-red-600' : 'text-green-600'}`}>
                          {quota.current_active_labs} / {quota.max_concurrent_labs}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openQuotaModal(quota)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleQuotaReset(quota.user_id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="lab-providers">
          {providers.map((provider) => (
            <div 
              key={provider.provider_id} 
              className={`bg-white rounded-xl border p-6 ${!provider.is_enabled ? 'opacity-60' : ''}`}
              data-testid={`provider-card-${provider.provider_id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider.provider_id)}
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-xs text-gray-500 uppercase">{provider.provider_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleProviderToggle(provider.provider_id, !provider.is_enabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    provider.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    provider.is_enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Regions</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.regions.slice(0, 4).map(r => (
                      <span key={r} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Instance Types</p>
                  <div className="space-y-1">
                    {Object.entries(provider.instance_types || {}).map(([type, config]) => (
                      <div key={type} className="flex justify-between text-xs">
                        <span className="capitalize">{type}</span>
                        <span className="text-gray-500">{config.vcpu} vCPU, {config.memory_gb}GB - ${config.cost_per_hour}/hr</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Resource Types</p>
                  <p className="text-xs">{provider.resource_types.join(', ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quota Edit Modal */}
      <Dialog open={quotaModalOpen} onOpenChange={setQuotaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Quota</DialogTitle>
            <DialogDescription>
              Configure resource limits for {selectedQuota?.user?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Max Concurrent Labs</label>
                <Input
                  type="number"
                  value={quotaForm.max_concurrent_labs}
                  onChange={(e) => setQuotaForm({...quotaForm, max_concurrent_labs: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Storage Limit (GB)</label>
                <Input
                  type="number"
                  value={quotaForm.storage_limit_gb}
                  onChange={(e) => setQuotaForm({...quotaForm, storage_limit_gb: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Daily Lab Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  value={quotaForm.max_daily_lab_hours}
                  onChange={(e) => setQuotaForm({...quotaForm, max_daily_lab_hours: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Lab Hours</label>
                <Input
                  type="number"
                  value={quotaForm.max_monthly_lab_hours}
                  onChange={(e) => setQuotaForm({...quotaForm, max_monthly_lab_hours: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Allowed Providers</label>
              <div className="flex gap-3">
                {['aws', 'gcp', 'azure'].map(p => (
                  <label key={p} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={quotaForm.allowed_providers?.includes(p)}
                      onChange={(e) => {
                        const providers = quotaForm.allowed_providers || [];
                        if (e.target.checked) {
                          setQuotaForm({...quotaForm, allowed_providers: [...providers, p]});
                        } else {
                          setQuotaForm({...quotaForm, allowed_providers: providers.filter(x => x !== p)});
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm uppercase">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Allowed Instance Types</label>
              <div className="flex gap-3">
                {['small', 'medium', 'large'].map(t => (
                  <label key={t} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={quotaForm.allowed_instance_types?.includes(t)}
                      onChange={(e) => {
                        const types = quotaForm.allowed_instance_types || [];
                        if (e.target.checked) {
                          setQuotaForm({...quotaForm, allowed_instance_types: [...types, t]});
                        } else {
                          setQuotaForm({...quotaForm, allowed_instance_types: types.filter(x => x !== t)});
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaModalOpen(false)}>Cancel</Button>
            <Button onClick={handleQuotaSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
