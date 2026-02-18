import { NextPage } from 'next';
import { useEffect, useState } from 'react';

const RatingsPage: NextPage = () => {
    const [meetings, setMeetings] = useState([]);

    useEffect(() => {
        const fetchMeetings = async () => {
            const today = new Date().toISOString().split('T')[0];
            // Change this line to use new Date() instead of the string
            const result = await pfClient.getMeetingsByDate(new Date());
            setMeetings(result);
        };
        fetchMeetings();
    }, []);

    return (
        <div>
            {/* Your component JSX goes here */}
        </div>
    );
};

export default RatingsPage;