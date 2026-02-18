import React, { useState, useEffect } from 'react';
import { pfClient } from '../../api';

const RatingsPage = () => {
    const [meetings, setMeetings] = useState([]);

    useEffect(() => {
        const fetchMeetings = async () => {
            const today = new Date();
            const response = await pfClient.getMeetingsByDate(new Date());
            setMeetings(response);
        };
        fetchMeetings();
    }, []);

    return (
        <div>
            <h1>Ratings Page</h1>
            <ul>
                {meetings.map(meeting => (
                    <li key={meeting.id}>{meeting.title}</li>
                ))}
            </ul>
        </div>
    );
};

export default RatingsPage;