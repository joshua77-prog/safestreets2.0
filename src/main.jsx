import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css';
import 'leaflet/dist/leaflet.css';

import Layout from '../layout.jsx';
import Welcome from '../pages/welcome.jsx';
import Dashboard from '../pages/dashboard.jsx';
import SafeNavigation from '../pages/safenavigation.jsx';
import Emergency from '../pages/emergency.jsx';
import SafetyReports from '../pages/safereports.jsx';
import Profile from '../pages/profile.jsx';
import Onboarding from '../pages/onboarding.jsx';
import UIShowcase from '../pages/ui.jsx';
import SignUp from '../pages/signup.jsx';
import Login from '../pages/login.jsx';
import { User as UserEntity } from '@/entities/all';

function ProtectedRoute({ children }) {
  const isAuth = UserEntity.isAuthenticated();
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const isAuth = UserEntity.isAuthenticated();
  if (isAuth) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

const router = createBrowserRouter([
  { 
    path: '/', 
    element: <Navigate to={UserEntity.isAuthenticated() ? "/dashboard" : "/login"} replace /> 
  },
  {
    path: '/welcome',
    element: (
      <Layout currentPageName="Welcome">
        <Welcome />
      </Layout>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicOnlyRoute>
        <Layout currentPageName="SignUp">
          <SignUp />
        </Layout>
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <Layout currentPageName="Login">
          <Login />
        </Layout>
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Layout currentPageName="Dashboard">
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/safenavigation',
    element: (
      <ProtectedRoute>
        <Layout currentPageName="SafeNavigation">
          <SafeNavigation />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/emergency',
    element: (
      <ProtectedRoute>
        <Layout currentPageName="Emergency">
          <Emergency />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/safetyreports',
    element: (
      <ProtectedRoute>
        <Layout currentPageName="SafetyReports">
          <SafetyReports />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Layout currentPageName="Profile">
          <Profile />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <Layout currentPageName="Onboarding">
          <Onboarding />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ui',
    element: (
      <Layout currentPageName="UI">
        <UIShowcase />
      </Layout>
    ),
  },
  { path: '*', element: <Navigate to={UserEntity.isAuthenticated() ? "/dashboard" : "/login"} replace /> },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found. Ensure index.html contains <div id="root"></div>');
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </React.StrictMode>
);
