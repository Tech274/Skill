import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileQuestion, BookOpen, Award, ClipboardList,
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, 
  Search, Filter, X, Check, AlertCircle, BarChart3,
  Upload, Download, Eye, EyeOff, Copy, ListChecks
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || window.REACT_APP_BACKEND_URL;

// Tab configurations
const TABS = {
  questions: { icon: FileQuestion, label: 'Question Bank', color: 'blue' },
  exams: { icon: ClipboardList, label: 'Exams', color: 'purple' },
  templates: { icon: Award, label: 'Certificate Templates', color: 'amber' },
  issued: { icon: BookOpen, label: 'Issued Certificates', color: 'green' }
};

const DIFFICULTIES = ['easy', 'intermediate', 'hard'];
const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'multi_select', label: 'Multi-Select' }
];
const EXAM_TYPES = [
  { value: 'practice', label: 'Practice Test' },
  { value: 'mock', label: 'Mock Exam' },
  { value: 'final', label: 'Final Exam' }
];

export default function AdminExams() {
  const [activeTab, setActiveTab] = useState('questions');
  const [stats, setStats] = useState({ questions: null, exams: null });
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertifications();
    fetchStats();
  }, []);

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

  const fetchStats = async () => {
    try {
      const [qStats, eStats] = await Promise.all([
        axios.get(`${API_URL}/api/admin/question-bank/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/exams/stats`, { withCredentials: true })
      ]);
      setStats({ questions: qStats.data, exams: eStats.data });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="admin-exams">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-exams-title">
            Exams & Certifications
          </h1>
          <p className="text-gray-600 mt-2">Manage question banks, exams, and certificate templates</p>
        </div>
      </div>

      {/* Stats Overview */}
      {!loading && stats.questions && stats.exams && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('questions')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="text-2xl font-bold">{stats.questions.total_questions}</p>
                  <p className="text-xs text-gray-400">{stats.questions.active_questions} active</p>
                </div>
                <FileQuestion className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('exams')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Exams</p>
                  <p className="text-2xl font-bold">{stats.exams.total_exams}</p>
                  <p className="text-xs text-gray-400">{stats.exams.published_exams} published</p>
                </div>
                <ClipboardList className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Exam Attempts</p>
                  <p className="text-2xl font-bold">{stats.exams.attempts?.total || 0}</p>
                  <p className="text-xs text-gray-400">{stats.exams.attempts?.pass_rate || 0}% pass rate</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('templates')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Templates</p>
                  <p className="text-2xl font-bold">{certifications.length}</p>
                  <p className="text-xs text-gray-400">per certification</p>
                </div>
                <Award className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {Object.entries(TABS).map(([key, config]) => {
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

      {/* Tab Content */}
      {activeTab === 'questions' && (
        <QuestionBankTab certifications={certifications} onRefresh={fetchStats} />
      )}
      {activeTab === 'exams' && (
        <ExamsTab certifications={certifications} onRefresh={fetchStats} />
      )}
      {activeTab === 'templates' && (
        <CertificateTemplatesTab certifications={certifications} />
      )}
      {activeTab === 'issued' && (
        <IssuedCertificatesTab certifications={certifications} />
      )}
    </div>
  );
}

// Question Bank Tab
function QuestionBankTab({ certifications, onRefresh }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cert_id: '', difficulty: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    fetchQuestions();
  }, [filters.cert_id, filters.difficulty]);

  useEffect(() => {
    if (filters.cert_id) {
      fetchDomains(filters.cert_id);
    }
  }, [filters.cert_id]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.cert_id) params.append('cert_id', filters.cert_id);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);
      
      const response = await axios.get(`${API_URL}/api/admin/question-bank?${params}`, {
        withCredentials: true
      });
      setQuestions(response.data.questions || []);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async (certId) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/certifications/${certId}/domains`, {
        withCredentials: true
      });
      setDomains(response.data.domains || []);
    } catch (err) {
      console.error('Failed to fetch domains');
    }
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setShowModal(true);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    if (question.cert_id) {
      fetchDomains(question.cert_id);
    }
    setShowModal(true);
  };

  const handleDelete = async (question) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/question-bank/${question.question_id}`, {
        withCredentials: true
      });
      toast.success('Question deleted');
      fetchQuestions();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete question');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingQuestion) {
        await axios.put(
          `${API_URL}/api/admin/question-bank/${editingQuestion.question_id}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Question updated');
      } else {
        await axios.post(
          `${API_URL}/api/admin/question-bank`,
          formData,
          { withCredentials: true }
        );
        toast.success('Question created');
      }
      setShowModal(false);
      fetchQuestions();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save question');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filters.cert_id}
            onChange={(e) => setFilters({ ...filters, cert_id: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="question-cert-filter"
          >
            <option value="">All Certifications</option>
            {certifications.map(cert => (
              <option key={cert.cert_id} value={cert.cert_id}>
                {cert.vendor} - {cert.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
            data-testid="question-difficulty-filter"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(d => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              data-testid="question-search"
            />
          </div>
          
          <Button variant="outline" onClick={fetchQuestions}>
            <Filter className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
        
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700" data-testid="create-question-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions found</p>
              <Button onClick={handleCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first question
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map((question) => (
                <QuestionItem
                  key={question.question_id}
                  question={question}
                  certifications={certifications}
                  onEdit={() => handleEdit(question)}
                  onDelete={() => handleDelete(question)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Modal */}
      {showModal && (
        <QuestionModal
          question={editingQuestion}
          certifications={certifications}
          domains={domains}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onCertChange={(certId) => fetchDomains(certId)}
        />
      )}
    </div>
  );
}

// Question Item Component
function QuestionItem({ question, certifications, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  
  const getCertName = (certId) => {
    const cert = certifications.find(c => c.cert_id === certId);
    return cert ? `${cert.vendor} - ${cert.name}` : certId;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50" data-testid={`question-item-${question.question_id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 mt-1">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                {question.difficulty}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {question.question_type?.replace('_', ' ')}
              </span>
              {!question.is_active && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-gray-900 font-medium line-clamp-2">{question.question_text}</p>
            <p className="text-sm text-gray-500 mt-1">
              {getCertName(question.cert_id)} • {question.domain || 'No domain'} • {question.topic || 'No topic'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit} data-testid={`edit-question-${question.question_id}`}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 ml-7 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Options:</p>
            <ul className="space-y-1">
              {question.options?.map((opt, i) => (
                <li key={i} className={`text-sm flex items-center gap-2 ${
                  opt === question.correct_answer ? 'text-green-700 font-medium' : 'text-gray-600'
                }`}>
                  {opt === question.correct_answer && <Check className="h-3 w-3" />}
                  {opt}
                </li>
              ))}
            </ul>
          </div>
          
          {question.explanation && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Explanation:</p>
              <p className="text-sm text-gray-600">{question.explanation}</p>
            </div>
          )}
          
          {question.tags?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Tags:</p>
              <div className="flex flex-wrap gap-1">
                {question.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-gray-200 rounded">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Question Modal Component
function QuestionModal({ question, certifications, domains, onSave, onClose, onCertChange }) {
  const [formData, setFormData] = useState({
    cert_id: question?.cert_id || '',
    domain: question?.domain || '',
    topic: question?.topic || '',
    question_text: question?.question_text || '',
    question_type: question?.question_type || 'multiple_choice',
    options: question?.options || ['', '', '', ''],
    correct_answer: question?.correct_answer || '',
    explanation: question?.explanation || '',
    difficulty: question?.difficulty || 'intermediate',
    tags: question?.tags?.join(', ') || '',
    is_active: question?.is_active !== false
  });

  const handleSubmit = () => {
    if (!formData.cert_id || !formData.question_text || !formData.correct_answer) {
      toast.error('Please fill in required fields');
      return;
    }
    
    const data = {
      ...formData,
      options: formData.options.filter(o => o.trim()),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="question-modal">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">{question ? 'Edit Question' : 'Create Question'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certification *</label>
              <select
                value={formData.cert_id}
                onChange={(e) => {
                  setFormData({ ...formData, cert_id: e.target.value, domain: '' });
                  onCertChange(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Domain</option>
                {domains.map((d, i) => (
                  <option key={i} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
              <select
                value={formData.question_type}
                onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {QUESTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., IAM, VPC"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="form-question-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
            <div className="space-y-2">
              {formData.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={formData.correct_answer === opt && opt !== ''}
                    onChange={() => setFormData({ ...formData, correct_answer: opt })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...formData.options];
                      newOpts[i] = e.target.value;
                      setFormData({ ...formData, options: newOpts });
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {formData.options.length > 2 && (
                    <button
                      onClick={() => {
                        const newOpts = formData.options.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, options: newOpts });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {formData.options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Option
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select the correct answer by clicking the radio button</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Explain why the correct answer is correct..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="security, networking, storage"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active (available for use in exams)</label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" data-testid="save-question-btn">
            {question ? 'Save Changes' : 'Create Question'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Exams Tab Component
function ExamsTab({ certifications, onRefresh }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cert_id: '', exam_type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.cert_id) params.append('cert_id', filters.cert_id);
      if (filters.exam_type) params.append('exam_type', filters.exam_type);
      
      const response = await axios.get(`${API_URL}/api/admin/exams?${params}`, {
        withCredentials: true
      });
      setExams(response.data);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingExam(null);
    setShowModal(true);
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setShowModal(true);
  };

  const handleDelete = async (exam) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/exams/${exam.exam_id}`, {
        withCredentials: true
      });
      toast.success('Exam deleted');
      fetchExams();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete exam');
    }
  };

  const handleTogglePublish = async (exam) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/exams/${exam.exam_id}`,
        { is_published: !exam.is_published },
        { withCredentials: true }
      );
      toast.success(exam.is_published ? 'Exam unpublished' : 'Exam published');
      fetchExams();
    } catch (err) {
      toast.error('Failed to update exam');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingExam) {
        await axios.put(
          `${API_URL}/api/admin/exams/${editingExam.exam_id}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Exam updated');
      } else {
        await axios.post(
          `${API_URL}/api/admin/exams`,
          formData,
          { withCredentials: true }
        );
        toast.success('Exam created');
      }
      setShowModal(false);
      fetchExams();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save exam');
    }
  };

  const getCertName = (certId) => {
    const cert = certifications.find(c => c.cert_id === certId);
    return cert ? `${cert.vendor} - ${cert.name}` : certId;
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={filters.cert_id}
            onChange={(e) => setFilters({ ...filters, cert_id: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
            data-testid="exam-cert-filter"
          >
            <option value="">All Certifications</option>
            {certifications.map(cert => (
              <option key={cert.cert_id} value={cert.cert_id}>
                {cert.vendor} - {cert.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.exam_type}
            onChange={(e) => setFilters({ ...filters, exam_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Types</option>
            {EXAM_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700" data-testid="create-exam-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Exams List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exams found</p>
              <Button onClick={handleCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first exam
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {exams.map((exam) => (
                <div key={exam.exam_id} className="p-4 hover:bg-gray-50" data-testid={`exam-item-${exam.exam_id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{exam.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          exam.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {exam.is_published ? 'Published' : 'Draft'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {exam.exam_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {getCertName(exam.cert_id)} • {exam.duration_minutes} min • {exam.total_questions} questions • {exam.pass_percentage}% to pass
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {exam.attempt_count || 0} attempts • {exam.pass_count || 0} passed
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(exam)}
                        title={exam.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {exam.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(exam)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(exam)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exam Modal */}
      {showModal && (
        <ExamModal
          exam={editingExam}
          certifications={certifications}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Exam Modal Component
function ExamModal({ exam, certifications, onSave, onClose }) {
  const [formData, setFormData] = useState({
    cert_id: exam?.cert_id || '',
    title: exam?.title || '',
    description: exam?.description || '',
    exam_type: exam?.exam_type || 'practice',
    duration_minutes: exam?.duration_minutes || 90,
    pass_percentage: exam?.pass_percentage || 70,
    total_questions: exam?.total_questions || 50,
    question_selection: exam?.question_selection || 'random',
    is_timed: exam?.is_timed !== false,
    show_answers_after: exam?.show_answers_after !== false,
    max_attempts: exam?.max_attempts || 0,
    is_published: exam?.is_published || false
  });

  const handleSubmit = () => {
    if (!formData.cert_id || !formData.title) {
      toast.error('Please fill in required fields');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="exam-modal">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">{exam ? 'Edit Exam' : 'Create Exam'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certification *</label>
            <select
              value={formData.cert_id}
              onChange={(e) => setFormData({ ...formData, cert_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="form-exam-cert"
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., AWS SAA Practice Exam 1"
              data-testid="form-exam-title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select
                value={formData.exam_type}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {EXAM_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 90 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pass %</label>
              <input
                type="number"
                value={formData.pass_percentage}
                onChange={(e) => setFormData({ ...formData, pass_percentage: parseInt(e.target.value) || 70 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions</label>
              <input
                type="number"
                value={formData.total_questions}
                onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Selection</label>
              <select
                value={formData.question_selection}
                onChange={(e) => setFormData({ ...formData, question_selection: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="random">Random from Bank</option>
                <option value="fixed">Fixed Questions</option>
                <option value="weighted">Weighted by Domain</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
              <input
                type="number"
                value={formData.max_attempts}
                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0 = unlimited"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_timed}
                onChange={(e) => setFormData({ ...formData, is_timed: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Timed exam</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_answers_after}
                onChange={(e) => setFormData({ ...formData, show_answers_after: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show answers after submission</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700" data-testid="save-exam-btn">
            {exam ? 'Save Changes' : 'Create Exam'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Certificate Templates Tab
function CertificateTemplatesTab({ certifications }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/certificate-templates`, {
        withCredentials: true
      });
      setTemplates(response.data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = async (template) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/certificate-templates/${template.template_id}`, {
        withCredentials: true
      });
      toast.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete template');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingTemplate) {
        await axios.put(
          `${API_URL}/api/admin/certificate-templates/${editingTemplate.template_id}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Template updated');
      } else {
        await axios.post(
          `${API_URL}/api/admin/certificate-templates`,
          formData,
          { withCredentials: true }
        );
        toast.success('Template created');
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save template');
    }
  };

  const getCertName = (certId) => {
    const cert = certifications.find(c => c.cert_id === certId);
    return cert ? `${cert.vendor} - ${cert.name}` : certId;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700" data-testid="create-template-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certificate templates found</p>
              <Button onClick={handleCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first template
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div key={template.template_id} className="p-4 hover:bg-gray-50" data-testid={`template-item-${template.template_id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg border-2 flex items-center justify-center"
                        style={{ 
                          backgroundColor: template.background_color || '#ffffff',
                          borderColor: template.accent_color || '#1e40af'
                        }}
                      >
                        <Award className="h-6 w-6" style={{ color: template.accent_color || '#1e40af' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          {template.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{getCertName(template.cert_id)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Signed by: {template.signatory_name} • {template.signatory_title}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(template)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Modal */}
      {showModal && (
        <TemplateModal
          template={editingTemplate}
          certifications={certifications}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Template Modal Component
function TemplateModal({ template, certifications, onSave, onClose }) {
  const [formData, setFormData] = useState({
    cert_id: template?.cert_id || '',
    name: template?.name || '',
    description: template?.description || '',
    background_color: template?.background_color || '#ffffff',
    accent_color: template?.accent_color || '#1e40af',
    logo_url: template?.logo_url || '',
    signature_url: template?.signature_url || '',
    signatory_name: template?.signatory_name || 'Platform Director',
    signatory_title: template?.signatory_title || 'SkillTrack365',
    include_badge: template?.include_badge !== false,
    include_qr: template?.include_qr !== false,
    custom_text: template?.custom_text || '',
    is_default: template?.is_default || false
  });

  const handleSubmit = () => {
    if (!formData.cert_id || !formData.name) {
      toast.error('Please fill in required fields');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="template-modal">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">{template ? 'Edit Template' : 'Create Template'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certification *</label>
              <select
                value={formData.cert_id}
                onChange={(e) => setFormData({ ...formData, cert_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Classic Blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="h-10 w-14 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="h-10 w-14 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="text"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature Image URL</label>
              <input
                type="text"
                value={formData.signature_url}
                onChange={(e) => setFormData({ ...formData, signature_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Name</label>
              <input
                type="text"
                value={formData.signatory_name}
                onChange={(e) => setFormData({ ...formData, signatory_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Title</label>
              <input
                type="text"
                value={formData.signatory_title}
                onChange={(e) => setFormData({ ...formData, signatory_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Text</label>
            <textarea
              value={formData.custom_text}
              onChange={(e) => setFormData({ ...formData, custom_text: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Additional text to display on the certificate..."
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.include_badge}
                onChange={(e) => setFormData({ ...formData, include_badge: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include certification badge</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.include_qr}
                onChange={(e) => setFormData({ ...formData, include_qr: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include verification QR code</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Set as default template</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700" data-testid="save-template-btn">
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Issued Certificates Tab
function IssuedCertificatesTab({ certifications }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cert_id: '' });

  useEffect(() => {
    fetchCertificates();
  }, [filters]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.cert_id) params.append('cert_id', filters.cert_id);
      
      const response = await axios.get(`${API_URL}/api/admin/issued-certificates?${params}`, {
        withCredentials: true
      });
      setCertificates(response.data.certificates || []);
    } catch (err) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (cert) => {
    const reason = window.prompt('Enter reason for revoking this certificate:');
    if (!reason) return;
    
    try {
      await axios.post(
        `${API_URL}/api/admin/issued-certificates/${cert.certificate_id}/revoke`,
        null,
        { params: { reason }, withCredentials: true }
      );
      toast.success('Certificate revoked');
      fetchCertificates();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to revoke certificate');
    }
  };

  const getCertName = (certId) => {
    const cert = certifications.find(c => c.cert_id === certId);
    return cert ? `${cert.vendor} - ${cert.name}` : certId;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={filters.cert_id}
          onChange={(e) => setFilters({ ...filters, cert_id: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg"
          data-testid="issued-cert-filter"
        >
          <option value="">All Certifications</option>
          {certifications.map(cert => (
            <option key={cert.cert_id} value={cert.cert_id}>
              {cert.vendor} - {cert.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certificates issued yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {certificates.map((cert) => (
                <div key={cert.certificate_id} className="p-4 hover:bg-gray-50" data-testid={`issued-cert-${cert.certificate_id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{getCertName(cert.cert_id)}</h3>
                        {cert.is_revoked && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Issued to: {cert.user?.name || 'Unknown'} ({cert.user?.email || 'No email'})
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Certificate ID: {cert.certificate_id} • Issued: {new Date(cert.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!cert.is_revoked && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRevoke(cert)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
