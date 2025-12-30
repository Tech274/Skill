import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, useAuth } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  LuSearch,
  LuArrowRight,
  LuClock,
  LuCircleCheck,
  LuLock,
  LuFilter,
  LuX,
  LuChevronLeft,
  LuChevronRight,
  LuTarget,
} from "react-icons/lu";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";

const typeColors = {
  domain: "bg-cyan-500/20 text-cyan-400",
  full_exam: "bg-indigo-500/20 text-indigo-400",
};

const typeLabels = {
  domain: "Domain Test",
  full_exam: "Full Exam",
};

const vendorIcons = {
  AWS: <FaAws className="w-4 h-4 text-[#FF9900]" />,
  Azure: <VscAzure className="w-4 h-4 text-[#0078D4]" />,
  GCP: <SiGooglecloud className="w-4 h-4 text-[#4285F4]" />,
};

export default function AssessmentsCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Filter states from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCert, setSelectedCert] = useState(searchParams.get("certification") || "");
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get("vendor") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get("topic") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCert) params.append("certification", selectedCert);
      if (selectedVendor) params.append("vendor", selectedVendor);
      if (selectedType) params.append("assessment_type", selectedType);
      if (selectedTopic) params.append("domain", selectedTopic);
      params.append("page", page.toString());
      params.append("limit", "12");

      const response = await axios.get(`${API}/assessments/catalog?${params.toString()}`, { withCredentials: true });
      setAssessments(response.data.assessments);
      setFilters(response.data.filters);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        totalPages: response.data.total_pages
      });
    } catch (error) {
      console.error("Error fetching assessments catalog:", error);
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [page, selectedCert, selectedVendor, selectedType, selectedTopic]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCert) params.set("certification", selectedCert);
    if (selectedVendor) params.set("vendor", selectedVendor);
    if (selectedType) params.set("type", selectedType);
    if (selectedTopic) params.set("topic", selectedTopic);
    if (page > 1) params.set("page", page.toString());
    setSearchParams(params);
  }, [search, selectedCert, selectedVendor, selectedType, selectedTopic, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAssessments();
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCert("");
    setSelectedVendor("");
    setSelectedType("");
    setSelectedTopic("");
    setPage(1);
  };

  const activeFiltersCount = [selectedCert, selectedVendor, selectedType, selectedTopic, search].filter(Boolean).length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Assessments Catalog</h1>
          <p className="text-zinc-400">
            Test your knowledge with domain tests and practice exams
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search assessments by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-800/50 border-zinc-700"
                  data-testid="search-input"
                />
              </div>
            </form>

            {/* Filter Toggle (Mobile) */}
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <LuFilter className="w-4 h-4 mr-2" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>

            {/* Filters (Desktop) */}
            <div className={`flex flex-col lg:flex-row gap-3 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
              <Select value={selectedVendor} onValueChange={(v) => { setSelectedVendor(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full lg:w-[140px] bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {filters?.vendors?.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCert} onValueChange={(v) => { setSelectedCert(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full lg:w-[200px] bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Certifications</SelectItem>
                  {filters?.certifications?.map((c) => (
                    <SelectItem key={c.cert_id} value={c.cert_id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={(v) => { setSelectedType(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full lg:w-[140px] bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {filters?.types?.map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTopic} onValueChange={(v) => { setSelectedTopic(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full lg:w-[160px] bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {filters?.topics?.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
                  <LuX className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-zinc-400">
            Showing {assessments.length} of {pagination.total} assessments
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Assessments Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {assessments.map((assessment) => (
                <div
                  key={assessment.assessment_id}
                  className={`bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all relative flex flex-col ${
                    assessment.is_locked ? 'opacity-80' : ''
                  }`}
                  data-testid={`assessment-card-${assessment.assessment_id}`}
                >
                  {assessment.is_locked && (
                    <div className="absolute top-3 right-3">
                      <LuLock className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}

                  {/* Vendor & Certification */}
                  <div className="flex items-center gap-2 mb-3">
                    {vendorIcons[assessment.vendor] || null}
                    <span className="text-xs text-zinc-500">{assessment.certification_name}</span>
                  </div>

                  {/* Title & Status */}
                  <div className="flex items-start gap-2 mb-2">
                    {assessment.status === "completed" ? (
                      <LuCircleCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <LuTarget className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    )}
                    <h3 className="font-semibold text-base leading-tight">{assessment.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{assessment.description}</p>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {assessment.topics?.slice(0, 3).map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {assessment.topics?.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{assessment.topics.length - 3}</Badge>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="mb-4">
                    <Badge className={typeColors[assessment.type] || "bg-zinc-500/20 text-zinc-400"}>
                      {typeLabels[assessment.type] || assessment.type}
                    </Badge>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800">
                    <div className="flex gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <LuClock className="w-3 h-3" />
                        {assessment.time_minutes} min
                      </span>
                      <span>Pass: {assessment.pass_threshold}%</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/assessment/${assessment.assessment_id}`, { state: { certId: assessment.cert_id } })}
                      disabled={assessment.is_locked}
                      className={assessment.status === "completed" 
                        ? "bg-zinc-800 hover:bg-zinc-700" 
                        : assessment.type === "full_exam"
                          ? "bg-indigo-600 hover:bg-indigo-500"
                          : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                      }
                    >
                      {assessment.is_locked ? "Locked" : assessment.status === "completed" ? "Retake" : "Start"}
                      {!assessment.is_locked && <LuArrowRight className="ml-1 w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {assessments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-400">No assessments found matching your criteria.</p>
                <Button variant="link" onClick={clearFilters} className="text-cyan-400 mt-2">
                  Clear all filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <LuChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-zinc-400">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  <LuChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
