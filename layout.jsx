import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserEntity } from "@/entities/all";
import { supabase } from "./src/lib/supabase";
import { 
  Shield, 
  Navigation, 
  AlertTriangle, 
  User,
  Home,
  Bell,
  Search,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => UserEntity.isAuthenticated());

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data?.session;
      const isAuth = hasSession || UserEntity.isAuthenticated();
      setIsAuthenticated(isAuth);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await UserEntity.logout();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate("/login");
  };

  const navigationItems = [
    { name: "Dashboard", path: createPageUrl("Dashboard"), icon: Home },
    { name: "Navigation", path: createPageUrl("SafeNavigation"), icon: Navigation },
    { name: "Emergency", path: createPageUrl("Emergency"), icon: AlertTriangle },
    { name: "Safety Reports", path: createPageUrl("SafetyReports"), icon: Shield },
    { name: "Profile", path: createPageUrl("Profile"), icon: User },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen mesh-gradient selection:bg-emerald-500/30">
      {/* Premium Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-4 py-4 md:px-8">
        <nav className="max-w-7xl mx-auto glass rounded-[2rem] px-6 py-4 flex items-center justify-between border-white/40 shadow-2xl shadow-emerald-500/5 transition-all duration-500 hover:border-emerald-500/30">
          <div className="flex items-center gap-4">
            <Link to={isAuthenticated ? "/dashboard" : "/welcome"} className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">Safe Streets</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80">
                    {isAuthenticated ? "Active Guardian" : "Guest Mode"}
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation - Rendered only when Authenticated */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/5 p-1.5 rounded-2xl">
              {navigationItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-slate-900 rounded-xl shadow-lg -z-10"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                    <item.icon className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl hover:bg-white transition-colors text-slate-500 hover:text-emerald-600">
                  <Search className="w-5 h-5" />
                </button>
                <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors text-slate-500 hover:text-emerald-600">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
                <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
                <Link to="/profile" className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-transform duration-300">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex md:hidden items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="pt-28 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Glass Bottom Tab Bar - Rendered only when Authenticated */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
          <div className="glass rounded-[2rem] p-2 flex items-center justify-around border-white/40 shadow-2xl">
            {navigationItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
                    isActive ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 bg-emerald-500/10 rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={`w-6 h-6 ${isActive ? "scale-110 transition-transform" : ""}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.name.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
}
