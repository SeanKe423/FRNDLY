// frontend/src/components/Matches.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Matches.css';
import ReportModal from './ReportModal';

const Matches = () => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found');
                    navigate('/login');
                    return;
                }

                console.log('Starting matches fetch...');
                const response = await axios.get('http://localhost:5000/api/auth/matches', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log('Matches response:', response.data);
                setMatches(response.data);
                setLoading(false);

            } catch (error) {
                console.error('Matches fetch error:', error);
                const errorMessage = error.response?.data?.message || 'Failed to load matches';
                setError(errorMessage);
                setLoading(false);

                if (error.response?.status === 401) {
                    console.log('Unauthorized - redirecting to login');
                    navigate('/login');
                }
            }
        };

        fetchMatches();
    }, [navigate]);

    const handleReport = (match) => {
        setSelectedUser(match);
        setReportModalOpen(true);
    };

    // Show loading state
    if (loading) {
        return (
            <div className="matches-container">
                <div className="loading-message">Loading matches...</div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="matches-container">
                <div className="error-message">
                    Error: {error}
                    <button 
                        onClick={() => window.location.reload()} 
                        className="retry-button"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Show empty state
    if (!matches || matches.length === 0) {
        return (
            <div className="matches-container">
                <h2 className="matches-title">Your Matches</h2>
                <div className="no-matches">
                    <p>No matches found yet 😢</p>
                    <p>Try updating your profile with more interests!</p>
                    <button 
                        onClick={() => navigate('/profile')} 
                        className="update-profile-btn"
                    >
                        Update Profile
                    </button>
                </div>
            </div>
        );
    }

    // Show matches
    return (
        <div className="matches-container">
            <div className="matches-header">
                <button 
                    onClick={() => navigate('/')} 
                    className="back-home-button"
                >
                    ← Back to Home
                </button>
                <h2 className="matches-title">Your Matches</h2>
            </div>
            <div className="matches-grid">
                {matches.map((match) => (
                    <div key={match._id} className="match-card">
                        <div className="match-photo">
                            {match.profilePicture ? (
                                <img 
                                    src={match.profilePicture} 
                                    alt={`${match.username}'s profile`}
                                    className="profile-image"
                                />
                            ) : (
                                <div className="profile-placeholder">
                                    <i className="fas fa-user"></i>
                                </div>
                            )}
                        </div>
                        <div className="match-info">
                            <h3>{match.username}</h3>
                            <p className="match-age">{match.age} years old</p>
                            <div className="match-actions">
                                <button 
                                    onClick={() => navigate(`/chat/${match._id}`)} 
                                    className="chat-button"
                                >
                                    Chat Now
                                </button>
                                <button 
                                    onClick={() => handleReport(match)} 
                                    className="report-button"
                                >
                                    Report
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ReportModal 
                isOpen={reportModalOpen}
                onClose={() => {
                    setReportModalOpen(false);
                    setSelectedUser(null);
                }}
                reportedUserId={selectedUser?._id}
                reportedUsername={selectedUser?.username}
            />
        </div>
    );
};

export default Matches;
