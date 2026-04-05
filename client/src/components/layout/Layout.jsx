import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx';
import Navbar from './Navbar.jsx';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-main">
        <Outlet /> {/* This is where your pages (Dashboard, Profile) will render */}
        <Footer/>
      </main>
    </div>
  );
};

export default Layout;