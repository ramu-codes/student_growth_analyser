import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <p>
        &copy; {currentYear} GrowthTracker. All Rights Reserved.
      </p>
      <p>
        A B.Tech Project
      </p>
    </footer>
  );
};

export default Footer;