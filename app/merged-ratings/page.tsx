import { useEffect, useState } from 'react';
import pfClient from '../path/to/pfClient';

const MergedRatingsPage = () => {
    const [meetings, setMeetings] = useState([]);
    useEffect(() => {
        const fetchMeetings = async () => {
            // Updated line
            const today = new Date();  // Assuming we want today's date
            const fetchedMeetings = await pfClient.getMeetingsByDate(new Date());
            setMeetings(fetchedMeetings);
        };
        fetchMeetings();
    }, []);

    return (
        <div>
            <h1>Merged Ratings</h1>
            {meetings.map(meeting => (
                <div key={meeting.id}>{meeting.title}</div>
            ))}
        </div>
    );
};

export default MergedRatingsPage;
