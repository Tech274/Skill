import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  LuLayoutDashboard,
  LuGraduationCap,
  LuTerminal,
  LuFileText,
  LuFolderKanban,
  LuUser,
  LuLogOut,
  LuMenu,
  LuX,
  LuBell,
  LuSearch,
  LuChevronDown,
  LuTrophy,
  LuAward,
} from "react-icons/lu";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const navItems = [
  { icon: LuGraduationCap, label: "Certification Hub", path: "/hub" },
  { icon: LuTerminal, label: "Cloud Labs", path: "/labs", badge: null },
  { icon: LuFileText, label: "Assessments", path: "/assessments" },
  { icon: LuFolderKanban, label: "Projects", path: "/projects" },
  { icon: LuTrophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: LuAward, label: "Badges", path: "/badges" },
  { icon: LuLayoutDashboard, label: "Skilltrack Dashboard", path: "/dashboard" },
  { icon: LuUser, label: "Profile", path: "/profile" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? <LuX className="w-5 h-5" /> : <LuMenu className="w-5 h-5" />}
          </button>
          
          <Link to="/hub" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S3</span>
            </div>
            <span className="font-bold text-lg hidden sm:block">SkillTrack<span className="text-cyan-400">365</span></span>
          </Link>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search certifications, labs..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              data-testid="global-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.subscription_status === "premium" ? (
            <Badge className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-0">Premium</Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/checkout")}
              className="hidden sm:flex border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              data-testid="upgrade-btn"
            >
              Upgrade
            </Button>
          )}
          
          <button className="p-2 hover:bg-white/5 rounded-lg relative" data-testid="notifications-btn">
            <LuBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg" data-testid="user-menu-trigger">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback className="bg-zinc-800 text-sm">{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <LuChevronDown className="w-4 h-4 text-zinc-500 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
              <div className="px-3 py-2">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-zinc-500">{user?.email}</p>
                {user?.role && user.role !== 'learner' && (
                  <p className="text-xs text-cyan-400 mt-1 capitalize">{user.role.replace('_', ' ')}</p>
                )}
              </div>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                <LuUser className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                <LuLayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              {/* Show Admin Panel link for admin users */}
              {user?.role && ['super_admin', 'content_admin', 'lab_admin', 'finance_admin', 'support_admin'].includes(user.role) && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer text-cyan-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Panel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400">
                <LuLogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 z-40 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/hub" && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <p className="text-xs text-zinc-500 mb-2">Quick Access</p>
          <div className="flex gap-2">
            <button className="p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors" title="AWS">
              <FaAws className="w-5 h-5 text-[#FF9900]" />
            </button>
            <button className="p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors" title="Azure">
              <VscAzure className="w-5 h-5 text-[#0078D4]" />
            </button>
            <button className="p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors" title="GCP">
              <SiGooglecloud className="w-5 h-5 text-[#4285F4]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
