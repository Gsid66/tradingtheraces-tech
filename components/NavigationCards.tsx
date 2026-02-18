import { FaCodeBranch, FaChartBar, FaMagic } from 'react-icons/fa';

// Other component imports...

const NavigationCards = () => {
    return (
        <div>
            {/* Existing cards... */}

            <div className="card" style={{ borderColor: 'cyan' }}>
                <a href="/merged-ratings">Merged Ratings</a>
            </div>
            <div className="card" style={{ borderColor: 'pink', opacity: 0.6 }}>
                Advanced Analysis (coming soon)
            </div>
            <div className="card" style={{ borderColor: 'indigo', opacity: 0.6 }}>
                Sherlock Hooves (coming soon)
            </div>
        </div>
    );
};

export default NavigationCards;