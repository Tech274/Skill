import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FlaskConical,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Content', href: '/admin/content', icon: BookOpen },
    { name: 'Labs', href: '/admin/labs', icon: FlaskConical },
    { name: 'Finance', href: '/admin/finance', icon: DollarSign },
    { name: 'Support', href: '/admin/support', icon: MessageSquare },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-gray-900 text-white" data-testid="admin-sidebar">
          <div className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-xs text-gray-400">SkillTrack365</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 px-3" data-testid="admin-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  data-testid={`admin-nav-${item.name.toLowerCase()}`}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm">Back to Learner View</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
