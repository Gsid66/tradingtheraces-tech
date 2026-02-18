import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-purple-800 p-4 flex justify-between items-center">
      <div className="text-white text-lg font-bold">Trading the Races</div>
      <div className="space-x-4">
        <Link to="/" className="text-white hover:text-gray-300">Home</Link>
        <Link to="/form-guide" className="text-white hover:text-gray-300">Form Guide</Link>
        <Link to="/trading-desk" className="text-white hover:text-gray-300">Trading Desk</Link>
        <Link to="/calculator" className="text-white hover:text-gray-300">Calculator</Link>
        <Link to="/discord" className="text-white hover:text-gray-300">Discord</Link>
      </div>
    </nav>
  );
};

export default Navbar;