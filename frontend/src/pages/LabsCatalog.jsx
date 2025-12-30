import { useEffect, useState, useMemo } from "react";
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

export default function LabsCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Filter states from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCert, setSelectedCert] = useState(searchParams.get("certification") || "");
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get("vendor") || "");
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get("difficulty") || "");
  const [selectedDomain, setSelectedDomain] = useState(searchParams.get("domain") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCert) params.append("certification", selectedCert);
      if (selectedVendor) params.append("vendor", selectedVendor);
      if (selectedDifficulty) params.append("difficulty", selectedDifficulty);
      if (selectedDomain) params.append("domain", selectedDomain);
      params.append("page", page.toString());
      params.append("limit", "12");

      const response = await axios.get(`${API}/catalog/labs?${params.toString()}`, { withCredentials: true });
      setLabs(response.data.labs);
      setFilters(response.data.filters);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        totalPages: response.data.total_pages
      });
    } catch (error) {
      console.error("Error fetching labs catalog:", error);
      toast.error("Failed to load labs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [page, selectedCert, selectedVendor, selectedDifficulty, selectedDomain]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCert) params.set("certification", selectedCert);
    if (selectedVendor) params.set("vendor", selectedVendor);
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
    if (selectedDomain) params.set("domain", selectedDomain);
    if (page > 1) params.set("page", page.toString());
    setSearchParams(params);
  }, [search, selectedCert, selectedVendor, selectedDifficulty, selectedDomain, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLabs();
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCert("");
    setSelectedVendor("");
    setSelectedDifficulty("");
    setSelectedDomain("");
    setPage(1);
  };

  const activeFiltersCount = [selectedCert, selectedVendor, selectedDifficulty, selectedDomain, search].filter(Boolean).length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cloud Labs Catalog</h1>
          <p className="text-zinc-400">
            Browse and explore hands-on labs across all certifications
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
                  placeholder="Search labs by title or description..."
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

              <Select value={selectedDomain} onValueChange={(v) => { setSelectedDomain(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-full lg:w-[180px] bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {filters?.domains?.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
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
            Showing {labs.length} of {pagination.total} labs
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Labs Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {labs.map((lab) => (
                <div
                  key={lab.lab_id}
                  className={`bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all relative group ${
                    lab.is_locked ? 'opacity-80' : ''
                  }`}
                  data-testid={`lab-card-${lab.lab_id}`}
                >
                  {lab.is_locked && (
                    <div className="absolute top-3 right-3">
                      <LuLock className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}

                  {/* Vendor & Certification */}
                  <div className="flex items-center gap-2 mb-3">
                    {vendorIcons[lab.vendor] || null}
                    <span className="text-xs text-zinc-500">{lab.certification_name}</span>
                  </div>

                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-base leading-tight">{lab.title}</h3>
                    {lab.status === "completed" && (
                      <LuCircleCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{lab.description}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={difficultyColors[lab.difficulty]}>
                      {lab.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {lab.exam_domain}
                    </Badge>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <LuClock className="w-3 h-3" />
                      {lab.duration_minutes} min
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/lab/${lab.lab_id}`)}
                      disabled={lab.is_locked}
                      className={lab.status === "completed" 
                        ? "bg-zinc-800 hover:bg-zinc-700" 
                        : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                      }
                    >
                      {lab.is_locked ? "Locked" : lab.status === "completed" ? "Review" : "View Lab"}
                      {!lab.is_locked && <LuArrowRight className="ml-1 w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {labs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-400">No labs found matching your criteria.</p>
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
