import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/dashboard" className="navbar-logo" onClick={closeMobileMenu}>
          GrowthTracker
        </NavLink>

        <div className="menu-icon" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={isMobileMenuOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <NavLink to="/dashboard" className="nav-links" onClick={closeMobileMenu}>
              Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/data-input" className="nav-links" onClick={closeMobileMenu}>
              Input Marks
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/analytics" className="nav-links" onClick={closeMobileMenu}>
              Analytics
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/smart-insights" className="nav-links" onClick={closeMobileMenu}>
              AI Insights
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/goals" className="nav-links" onClick={closeMobileMenu}>
              Goals
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/leetcode" className="nav-links" onClick={closeMobileMenu}>
              LeetCode
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/profile" className="nav-links" onClick={closeMobileMenu}>
              Profile
            </NavLink>
          </li>

          {/* Mobile user/logout */}
          <li className="nav-item-mobile">
            <div className="nav-user-info-mobile">
              <FaUserCircle size={20} />
              <span>{user?.name}</span>
            </div>
            <button className="logout-button-mobile" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>

        <div className="nav-user-desktop">
          <FaUserCircle size={22} />
          <span>{user?.name}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;