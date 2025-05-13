import React from 'react';
import { Link } from 'react-router-dom';
import { useEthereum } from '../ethereum/EthereumContext';

function Navbar() {
  const { isConnected, address, ensName, connect, disconnect } = useEthereum();
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav style={styles.navbar}>
      <span style={styles.brand}>Improvement Chambers</span>
      <div style={styles.linksContainer}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/chamber/new" style={styles.link}>Create Chamber</Link>
      </div>
      <div style={styles.walletContainer}>
        {isConnected ? (
          <div style={styles.walletInfo}>
            <span style={styles.walletAddress}>
              {ensName || formatAddress(address || '')}
            </span>
            <button 
              style={styles.disconnectButton}
              onClick={disconnect}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            style={styles.connectButton}
            onClick={connect}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}

// Basic inline styles for the navbar
const styles: { [key: string]: React.CSSProperties } = {
  navbar: {
    background: '#333',
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
  walletContainer: {
    marginLeft: 'auto',
  },
  connectButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  disconnectButton: {
    background: '#f44336',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '10px',
  },
  walletInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: '14px',
    fontFamily: 'monospace',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '6px 10px',
    borderRadius: '4px',
  },
};

export default Navbar; 