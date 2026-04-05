 import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AboutUs from './pages/AboutUs.jsx';
// Layout
import Layout from './components/layout/Layout.jsx';
// Pages
import Landing from './pages/Landing.jsx'; // <--- 1. IMPORT LANDING
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import DataInput from './pages/DataInput.jsx';
import Analytics from './pages/Analytics.jsx';
import SmartInsights from './pages/SmartInsights.jsx';
import GoalsAndGaming from './pages/GoalsAndGaming.jsx';
import Leetcode from './pages/Leetcode.jsx';

/* ... (The PrivateLayout component remains the same) ... */
const PrivateLayout = () => {
  const { user } = useAuth();
  return user ? <Layout /> : <Navigate to="/" replace />; // <-- Redirect to /
};

/* ... (The PublicRoute component remains the same) ... */
const PublicRoute = ({ element }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : element;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={<PublicRoute element={<Login />} />}
      />
      <Route
        path="/register"
        element={<PublicRoute element={<Register />} />}
      />
      
      {/* --- 2. UPDATE THIS ROUTE --- */}
      <Route
        path="/"
        element={<PublicRoute element={<Landing />} />} // Was <Login />, now <Landing />
      />

      {/* Private Routes */}
      <Route element={<PrivateLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/data-input" element={<DataInput />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/smart-insights" element={<SmartInsights />} />
        <Route path="/goals" element={<GoalsAndGaming />} />
        <Route path="/leetcode" element={<Leetcode />} />
      </Route>

      {/* Fallback for any other route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;