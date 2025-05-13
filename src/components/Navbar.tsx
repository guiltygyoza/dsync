import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

function Navbar() {
  // Basic navbar structure with links
  return (
    <nav style={styles.navbar}>
      <span style={styles.brand}>Improvement Chambers</span>
      <div style={styles.linksContainer}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/chamber/new" style={styles.link}>Create Chamber</Link>
      </div>
    </nav>
  );
}

// Basic inline styles for the navbar
const styles: { [key: string]: React.CSSProperties } = {
  navbar: {
    background: '#333', // Darker background
    padding: '10px 20px', 
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  },
  brand: {
    fontWeight: 'bold',
    fontSize: '1.2em',
  },
  linksContainer: {
    display: 'flex',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    marginLeft: '15px',
    padding: '5px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
  },
};

export default Navbar; 