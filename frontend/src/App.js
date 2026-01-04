import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "sonner";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import CertificationHub from "./pages/CertificationHub";
import CertificationPath from "./pages/CertificationPath";
import CertificationRoadmap from "./pages/CertificationRoadmap";
import CloudLabs from "./pages/CloudLabs";
import LabsCatalog from "./pages/LabsCatalog";
import LabDetail from "./pages/LabDetail";
import ActiveLab from "./pages/ActiveLab";
import Assessments from "./pages/Assessments";
import AssessmentsCatalog from "./pages/AssessmentsCatalog";
import AssessmentTake from "./pages/AssessmentTake";
import AssessmentResults from "./pages/AssessmentResults";
import AssessmentReview from "./pages/AssessmentReview";
import Projects from "./pages/Projects";
import ProjectsCatalog from "./pages/ProjectsCatalog";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Profile from "./pages/Profile";
import CertificateView from "./pages/CertificateView";
import Leaderboard from "./pages/Leaderboard";
import Discussions from "./pages/Discussions";
import DiscussionPost from "./pages/DiscussionPost";
import Videos from "./pages/Videos";
import Badges from "./pages/Badges";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminContent from "./pages/Admin/AdminContent";
import AdminLabs from "./pages/Admin/AdminLabs";
import AdminExams from "./pages/Admin/AdminExams";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const location = useLocation();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate("/login");
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        
        navigate("/hub", { state: { user: response.data } });
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">Authenticating...</p>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is suspended
  if (user.is_suspended) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-4">Account Suspended</h2>
          <p className="text-zinc-300">{user.suspended_reason || 'Your account has been suspended. Please contact support.'}</p>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  const adminRoles = ['super_admin', 'content_admin', 'lab_admin', 'finance_admin', 'support_admin'];
  const userRole = user.role || 'learner';

  // Super admin has access to everything
  if (userRole === 'super_admin') {
    return children;
  }

  // If specific roles are required, check if user has one
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-zinc-300">You don't have permission to access this area.</p>
          </div>
        </div>
      );
    }
  } else {
    // No specific roles required, just check if user is any type of admin
    if (!adminRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-4">Admin Access Required</h2>
            <p className="text-zinc-300">You need admin privileges to access this area.</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

// App Router Component
const AppRouter = () => {
  const location = useLocation();

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check for session_id in URL fragment synchronously during render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/hub" element={<ProtectedRoute><CertificationHub /></ProtectedRoute>} />
      <Route path="/certification/:certId" element={<ProtectedRoute><CertificationPath /></ProtectedRoute>} />
      <Route path="/certification/:certId/roadmap" element={<ProtectedRoute><CertificationRoadmap /></ProtectedRoute>} />
      <Route path="/certification/:certId/labs" element={<ProtectedRoute><CloudLabs /></ProtectedRoute>} />
      <Route path="/labs" element={<ProtectedRoute><LabsCatalog /></ProtectedRoute>} />
      <Route path="/lab/:labId" element={<ProtectedRoute><LabDetail /></ProtectedRoute>} />
      <Route path="/lab/:labId/active" element={<ProtectedRoute><ActiveLab /></ProtectedRoute>} />
      <Route path="/certification/:certId/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
      <Route path="/assessments" element={<ProtectedRoute><AssessmentsCatalog /></ProtectedRoute>} />
      <Route path="/assessment/:assessmentId" element={<ProtectedRoute><AssessmentTake /></ProtectedRoute>} />
      <Route path="/assessment/:assessmentId/results" element={<ProtectedRoute><AssessmentResults /></ProtectedRoute>} />
      <Route path="/assessment/:assessmentId/review" element={<ProtectedRoute><AssessmentReview /></ProtectedRoute>} />
      <Route path="/certification/:certId/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsCatalog /></ProtectedRoute>} />
      <Route path="/project/:projectId" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
      <Route path="/certification/:certId/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
      <Route path="/certification/:certId/discussions" element={<ProtectedRoute><Discussions /></ProtectedRoute>} />
      <Route path="/discussions/post/:postId" element={<ProtectedRoute><DiscussionPost /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/certificate/:certificateId" element={<CertificateView />} />
      <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="labs" element={<AdminLabs />} />
        <Route path="exams" element={<AdminExams />} />
      </Route>
    </Routes>
  );
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'hsl(240 10% 8%)',
              border: '1px solid hsl(240 3.7% 15.9%)',
              color: 'hsl(0 0% 98%)',
            },
          }}
        />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
