import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, FlaskConical, FileText, FolderKanban, Video,
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, 
  GripVertical, Eye, EyeOff, Search, Filter, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || window.REACT_APP_BACKEND_URL;

// Content type configurations
const CONTENT_TYPES = {
  certifications: { icon: BookOpen, label: 'Certifications', color: 'blue' },
  labs: { icon: FlaskConical, label: 'Labs', color: 'green' },
  assessments: { icon: FileText, label: 'Assessments', color: 'purple' },
  projects: { icon: FolderKanban, label: 'Projects', color: 'orange' }
};

const VENDORS = ['AWS', 'Azure', 'GCP', 'DevOps', 'Kubernetes', 'Other'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function AdminContent() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('certifications');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certifications, setCertifications] = useState([]);
  const [selectedCert, setSelectedCert] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchStats();
    fetchCertifications();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [activeTab, selectedCert]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/content/stats`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchCertifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/certifications`, {
        withCredentials: true
      });
      setCertifications(response.data);
    } catch (err) {
      console.error('Error fetching certifications:', err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/admin/${activeTab}`;
      if (activeTab !== 'certifications' && selectedCert) {
        url += `?cert_id=${selectedCert}`;
      }
      
      const response = await axios.get(url, { withCredentials: true });
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData(getDefaultFormData());
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    const idField = getIdField();
    const itemId = item[idField];
    
    if (!window.confirm(`Are you sure you want to delete "${item.title || item.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/admin/${activeTab}/${itemId}`, {
        withCredentials: true
      });
      toast.success('Item deleted successfully');
      fetchItems();
      fetchStats();
      if (activeTab === 'certifications') {
        fetchCertifications();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete item');
    }
  };

  const handleSave = async () => {
    try {
      const idField = getIdField();
      
      if (editingItem) {
        await axios.put(
          `${API_URL}/api/admin/${activeTab}/${editingItem[idField]}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Item updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/admin/${activeTab}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Item created successfully');
      }
      
      setShowModal(false);
      fetchItems();
      fetchStats();
      if (activeTab === 'certifications') {
        fetchCertifications();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save item');
    }
  };

  const getIdField = () => {
    switch (activeTab) {
      case 'certifications': return 'cert_id';
      case 'labs': return 'lab_id';
      case 'assessments': return 'assessment_id';
      case 'projects': return 'project_id';
      default: return 'id';
    }
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case 'certifications':
        return {
          vendor: 'AWS', name: '', code: '', difficulty: 'Intermediate',
          description: '', job_roles: [], exam_domains: [], image_url: '',
          order: 0, is_published: true
        };
      case 'labs':
        return {
          cert_id: selectedCert || '', title: '', description: '',
          skill_trained: '', exam_domain: '', duration_minutes: 30,
          difficulty: 'Intermediate', instructions: [], prerequisites: [],
          order: 0, is_published: true
        };
      case 'assessments':
        return {
          cert_id: selectedCert || '', title: '', description: '',
          type: 'domain', topics: [], time_minutes: 30, pass_threshold: 70,
          questions: [], order: 0, is_published: true
        };
      case 'projects':
        return {
          cert_id: selectedCert || '', title: '', description: '',
          business_scenario: '', technologies: [], difficulty: 'Intermediate',
          skills_validated: [], tasks: [], deliverables: [],
          order: 0, is_published: true
        };
      default:
        return {};
    }
  };

  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const name = item.name || item.title || '';
    return name.toLowerCase().includes(searchLower);
  });

  return (
    <div className="p-8 space-y-6" data-testid="admin-content">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-content-title">
            Content Management
          </h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage learning content</p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="create-content-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {CONTENT_TYPES[activeTab]?.label.slice(0, -1)}
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.counts).map(([key, count]) => {
            const config = CONTENT_TYPES[key] || { icon: BookOpen, label: key, color: 'gray' };
            const Icon = config.icon;
            return (
              <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => key !== 'videos' && setActiveTab(key)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 capitalize">{config.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Icon className={`h-8 w-8 text-${config.color}-500 opacity-50`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Content Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {Object.entries(CONTENT_TYPES).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                data-testid={`tab-${key}`}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="content-search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {activeTab !== 'certifications' && (
          <select
            value={selectedCert}
            onChange={(e) => setSelectedCert(e.target.value)}
            data-testid="cert-filter"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Certifications</option>
            {certifications.map(cert => (
              <option key={cert.cert_id} value={cert.cert_id}>
                {cert.vendor} - {cert.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {activeTab} found</p>
              <Button onClick={handleCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first {activeTab.slice(0, -1)}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <ContentItem 
                  key={item[getIdField()]}
                  item={item}
                  type={activeTab}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                  certifications={certifications}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <ContentModal
          type={activeTab}
          item={editingItem}
          formData={formData}
          setFormData={setFormData}
          certifications={certifications}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Content Item Component
function ContentItem({ item, type, onEdit, onDelete, certifications }) {
  const [expanded, setExpanded] = useState(false);
  
  const getCertName = (certId) => {
    const cert = certifications.find(c => c.cert_id === certId);
    return cert ? `${cert.vendor} - ${cert.name}` : certId;
  };

  const getStatusBadge = (isPublished) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      isPublished !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
    }`}>
      {isPublished !== false ? 'Published' : 'Draft'}
    </span>
  );

  return (
    <div className="p-4 hover:bg-gray-50" data-testid={`content-item-${item.cert_id || item.lab_id || item.assessment_id || item.project_id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-gray-900">
                {item.name || item.title}
              </h3>
              {getStatusBadge(item.is_published)}
              {item.difficulty && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                  item.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.difficulty}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {type === 'certifications' ? (
                <>
                  {item.vendor} • {item.code} • {item.actual_labs_count || 0} labs, {item.actual_assessments_count || 0} assessments, {item.actual_projects_count || 0} projects
                </>
              ) : (
                <>
                  {getCertName(item.cert_id)}
                  {item.duration_minutes && ` • ${item.duration_minutes} min`}
                  {item.time_minutes && ` • ${item.time_minutes} min`}
                  {item.questions && ` • ${item.questions.length} questions`}
                  {item.tasks && ` • ${item.tasks.length} tasks`}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            data-testid={`edit-btn-${item.cert_id || item.lab_id || item.assessment_id || item.project_id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid={`delete-btn-${item.cert_id || item.lab_id || item.assessment_id || item.project_id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{item.description}</p>
          
          {item.job_roles && item.job_roles.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Job Roles:</p>
              <div className="flex flex-wrap gap-1">
                {item.job_roles.map((role, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {item.technologies && item.technologies.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Technologies:</p>
              <div className="flex flex-wrap gap-1">
                {item.technologies.map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.topics && item.topics.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Topics:</p>
              <div className="flex flex-wrap gap-1">
                {item.topics.map((topic, i) => (
                  <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Content Modal Component
function ContentModal({ type, item, formData, setFormData, certifications, onSave, onClose }) {
  const isEdit = !!item;

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData({ ...formData, [field]: items });
  };

  const renderCertificationForm = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
          <select
            value={formData.vendor || ''}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="form-vendor"
          >
            {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <input
            type="text"
            value={formData.code || ''}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., SAA-C03"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="form-code"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Solutions Architect Associate"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
        <select
          value={formData.difficulty || 'Intermediate'}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-difficulty"
        >
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Job Roles (comma-separated)</label>
        <input
          type="text"
          value={(formData.job_roles || []).join(', ')}
          onChange={(e) => handleArrayInput('job_roles', e.target.value)}
          placeholder="Solutions Architect, Cloud Engineer"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-job-roles"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
        <input
          type="text"
          value={formData.image_url || ''}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-image-url"
        />
      </div>
    </>
  );

  const renderLabForm = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Certification *</label>
        <select
          value={formData.cert_id || ''}
          onChange={(e) => setFormData({ ...formData, cert_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-cert-id"
        >
          <option value="">Select Certification</option>
          {certifications.map(cert => (
            <option key={cert.cert_id} value={cert.cert_id}>
              {cert.vendor} - {cert.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-title"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={formData.duration_minutes || 30}
            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="form-duration"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={formData.difficulty || 'Intermediate'}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Trained</label>
        <input
          type="text"
          value={formData.skill_trained || ''}
          onChange={(e) => setFormData({ ...formData, skill_trained: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Domain</label>
        <input
          type="text"
          value={formData.exam_domain || ''}
          onChange={(e) => setFormData({ ...formData, exam_domain: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites (comma-separated)</label>
        <input
          type="text"
          value={(formData.prerequisites || []).join(', ')}
          onChange={(e) => handleArrayInput('prerequisites', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </>
  );

  const renderAssessmentForm = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Certification *</label>
        <select
          value={formData.cert_id || ''}
          onChange={(e) => setFormData({ ...formData, cert_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-cert-id"
        >
          <option value="">Select Certification</option>
          {certifications.map(cert => (
            <option key={cert.cert_id} value={cert.cert_id}>
              {cert.vendor} - {cert.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-title"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type || 'domain'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="domain">Domain Test</option>
            <option value="full_exam">Full Exam</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time (min)</label>
          <input
            type="number"
            value={formData.time_minutes || 30}
            onChange={(e) => setFormData({ ...formData, time_minutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pass %</label>
          <input
            type="number"
            value={formData.pass_threshold || 70}
            onChange={(e) => setFormData({ ...formData, pass_threshold: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma-separated)</label>
        <input
          type="text"
          value={(formData.topics || []).join(', ')}
          onChange={(e) => handleArrayInput('topics', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Questions can be added after creating the assessment by editing it.
          Current questions: {(formData.questions || []).length}
        </p>
      </div>
    </>
  );

  const renderProjectForm = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Certification *</label>
        <select
          value={formData.cert_id || ''}
          onChange={(e) => setFormData({ ...formData, cert_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-cert-id"
        >
          <option value="">Select Certification</option>
          {certifications.map(cert => (
            <option key={cert.cert_id} value={cert.cert_id}>
              {cert.vendor} - {cert.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
        <select
          value={formData.difficulty || 'Intermediate'}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="form-description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Scenario *</label>
        <textarea
          value={formData.business_scenario || ''}
          onChange={(e) => setFormData({ ...formData, business_scenario: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Technologies (comma-separated)</label>
        <input
          type="text"
          value={(formData.technologies || []).join(', ')}
          onChange={(e) => handleArrayInput('technologies', e.target.value)}
          placeholder="EC2, S3, Lambda"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skills Validated (comma-separated)</label>
        <input
          type="text"
          value={(formData.skills_validated || []).join(', ')}
          onChange={(e) => handleArrayInput('skills_validated', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Deliverables (comma-separated)</label>
        <input
          type="text"
          value={(formData.deliverables || []).join(', ')}
          onChange={(e) => handleArrayInput('deliverables', e.target.value)}
          placeholder="Architecture diagram, Working application"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </>
  );

  const renderForm = () => {
    switch (type) {
      case 'certifications': return renderCertificationForm();
      case 'labs': return renderLabForm();
      case 'assessments': return renderAssessmentForm();
      case 'projects': return renderProjectForm();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="content-modal">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Edit' : 'Create'} {CONTENT_TYPES[type]?.label.slice(0, -1)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {renderForm()}
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published !== false}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_published" className="text-sm text-gray-700">
              Publish immediately
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700" data-testid="save-content-btn">
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
