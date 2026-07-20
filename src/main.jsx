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

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/welcome" replace /> },
  {
    path: '/welcome',
    element: (
      <Layout currentPageName="Welcome">
        <Welcome />
      </Layout>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Layout currentPageName="Dashboard">
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/safenavigation',
    element: (
      <Layout currentPageName="SafeNavigation">
        <SafeNavigation />
      </Layout>
    ),
  },
  {
    path: '/emergency',
    element: (
      <Layout currentPageName="Emergency">
        <Emergency />
      </Layout>
    ),
  },
  {
    path: '/safetyreports',
    element: (
      <Layout currentPageName="SafetyReports">
        <SafetyReports />
      </Layout>
    ),
  },
  {
    path: '/profile',
    element: (
      <Layout currentPageName="Profile">
        <Profile />
      </Layout>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <Layout currentPageName="Onboarding">
        <Onboarding />
      </Layout>
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
  { path: '*', element: <Navigate to="/welcome" replace /> },
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
    <RouterProvider router={router} />
  </React.StrictMode>
);


