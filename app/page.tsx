import { FaMerge, FaBrain, FaRobot } from 'react-icons/fa';

// ... existing imports

const ComingSoonCards = () => {
    return (
        <div>
            {/* Existing Card Elements */}
            <Card>
                <Link to="/merged-ratings">
                    <Icon><FaMerge /></Icon>
                    <Title>Available Now!</Title>
                    <Text>Merged Ratings (RVO + TTR)</Text>
                </Link>
            </Card>
            <Card>
                <Icon><FaBrain /></Icon>
                <Title>Coming Soon</Title>
                <Text>Advanced Analysis (Decoding The Data)</Text>
            </Card>
            <Card>
                <Icon><FaRobot /></Icon>
                <Title>Coming Soon</Title>
                <Text>Sherlock Hooves (AI Agent)</Text>
            </Card>
        </div>
    );
};

export default ComingSoonCards;