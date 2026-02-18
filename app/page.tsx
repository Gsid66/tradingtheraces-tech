import { FaCrown, FaGlobeAsia, FaGlobeEurope, FaChartLine } from 'react-icons/fa';

const ComingSoonCards = () => {
  return (
    <div>
      <div className="card">
        <FaGlobeAsia />
        <h3>AU Data Base</h3>
      </div>
      <div className="card">
        <FaGlobeEurope />
        <h3>UK Data Base</h3>
      </div>
      <div className="card">
        <FaChartLine />
        <h3>Trading Desk</h3>
      </div>
    </div>
  );
};

export default ComingSoonCards;