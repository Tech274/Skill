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
  LuCircleCheck,
  LuLock,
  LuFilter,
  LuX,
  LuChevronLeft,
  LuChevronRight,
  LuCode,
} from "react-icons/lu";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";

const difficultyColors = {
  Beginner: "bg-emerald-500/20 text-emerald-400",
  Intermediate: "bg-amber-500/20 text-amber-400",
  Advanced: "bg-rose-500/20 text-rose-400",
};

const vendorIcons = {
  AWS: <FaAws className="w-4 h-4 text-[#FF9900]" />,
  Azure: <VscAzure className="w-4 h-4 text-[#0078D4]" />,
  GCP: <SiGooglecloud className="w-4 h-4 text-[#4285F4]" />,
};

export default function ProjectsCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Filter states from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCert, setSelectedCert] = useState(searchParams.get("certification") || "");
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get("vendor") || "");
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get("difficulty") || "");
  const [selectedTech, setSelectedTech] = useState(searchParams.get("technology") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCert) params.append("certification", selectedCert);
      if (selectedVendor) params.append("vendor", selectedVendor);
      if (selectedDifficulty) params.append("difficulty", selectedDifficulty);
      if (selectedTech) params.append("technology", selectedTech);
      params.append("page", page.toString());
      params.append("limit", "12");

      const response = await axios.get(`${API}/catalog/projects?${params.toString()}`, { withCredentials: true });
      setProjects(response.data.projects);
      setFilters(response.data.filters);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        totalPages: response.data.total_pages
      });
    } catch (error) {
      console.error("Error fetching projects catalog:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, selectedCert, selectedVendor, selectedDifficulty, selectedTech]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCert) params.set("certification", selectedCert);
    if (selectedVendor) params.set("vendor", selectedVendor);
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
    if (selectedTech) params.set("technology", selectedTech);
    if (page > 1) params.set("page", page.toString());
    setSearchParams(params);
  }, [search, selectedCert, selectedVendor, selectedDifficulty, selectedTech, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCert("");
    setSelectedVendor("");
    setSelectedDifficulty("");
    setSelectedTech("");
    setPage(1);
  };

  const activeFiltersCount = [selectedCert, selectedVendor, selectedDifficulty, selectedTech, search].filter(Boolean).length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Projects Catalog</h1>
          <p className="text-zinc-400">
            Build real-world projects to prove your cloud skills
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
                  placeholder="Search projects by title or scenario..."
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

              <Select value={selectedDifficulty} onValueChange={(v) => { setSelectedDifficulty(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full lg:w-[140px] bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {filters?.difficulties?.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTech} onValueChange={(v) => { setSelectedTech(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full lg:w-[160px] bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technologies</SelectItem>
                  {filters?.technologies?.map((t) => (
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
            Showing {projects.length} of {pagination.total} projects
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {projects.map((project) => (
                <div
                  key={project.project_id}
                  className={`bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all relative flex flex-col ${
                    project.is_locked ? 'opacity-80' : ''
                  }`}
                  data-testid={`project-card-${project.project_id}`}
                >
                  {project.is_locked && (
                    <div className="absolute top-3 right-3">
                      <LuLock className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}

                  {/* Vendor & Certification */}
                  <div className="flex items-center gap-2 mb-3">
                    {vendorIcons[project.vendor] || null}
                    <span className="text-xs text-zinc-500">{project.certification_name}</span>
                  </div>

                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {project.status === "completed" ? (
                        <LuCircleCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <LuCode className="w-5 h-5 text-cyan-400 shrink-0" />
                      )}
                      <h3 className="font-semibold text-base leading-tight">{project.title}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{project.description}</p>

                  {/* Business Scenario Preview */}
                  <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-zinc-400 line-clamp-2">{project.business_scenario}</p>
                  </div>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.technologies?.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies?.length > 4 && (
                      <Badge variant="outline" className="text-xs">+{project.technologies.length - 4}</Badge>
                    )}
                  </div>

                  {/* Difficulty Badge */}
                  <div className="mb-4">
                    <Badge className={difficultyColors[project.difficulty]}>
                      {project.difficulty}
                    </Badge>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end mt-auto pt-3 border-t border-zinc-800">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/project/${project.project_id}`, { state: { certId: project.cert_id } })}
                      disabled={project.is_locked}
                      className={project.status === "completed" 
                        ? "bg-zinc-800 hover:bg-zinc-700" 
                        : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                      }
                    >
                      {project.is_locked ? "Locked" : project.status === "completed" ? "Review" : "View Project"}
                      {!project.is_locked && <LuArrowRight className="ml-1 w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-400">No projects found matching your criteria.</p>
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
