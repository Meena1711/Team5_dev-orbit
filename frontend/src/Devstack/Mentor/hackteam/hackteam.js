import React, { useState, useEffect } from 'react';
import { Search, Users, Trophy, Calendar, MessageSquare, Github, ExternalLink, AlertCircle, Linkedin, Mail } from 'lucide-react';

const MentorHackathonTeams = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auth state - Get from localStorage or your auth context
  const [authState] = useState(() => ({
    token: localStorage.getItem('token') || null,
    userId:localStorage.getItem('mentor') || null,
    selectedHackathonId: localStorage.getItem('selectedHackathonId') || null
  }));

  const API_BASE = (process.env.REACT_APP_BACKEND_URL || (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') + '');

  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  };

  // Fetch all hackathons
  const fetchHackathons = async () => {
    try {
      const data = await apiCall('/hackathon/all');
      const activeHackathons = data.filter(h => h.status !== 'completed');
      setHackathons(activeHackathons);
      
      // Auto-select hackathon from localStorage if available
      if (authState.selectedHackathonId && activeHackathons.length > 0) {
        const savedHackathon = activeHackathons.find(h => h._id === authState.selectedHackathonId);
        if (savedHackathon) {
          setSelectedHackathon(savedHackathon);
        } else if (activeHackathons.length > 0) {
          setSelectedHackathon(activeHackathons[0]);
        }
      } else if (activeHackathons.length > 0 && !selectedHackathon) {
        setSelectedHackathon(activeHackathons[0]);
      }
    } catch (err) {
      setError('Failed to fetch hackathons: ' + err.message);
      console.error('Fetch hackathons error:', err);
    }
  };

  // Fetch mentor's assigned teams only
  const fetchMyTeams = async () => {
    if (!selectedHackathon || !authState.userId) return;
    
    try {
      // Fetch all teams for the hackathon and filter for mentor's teams
      const allTeamsData = await apiCall(`/hackteams/teams?hackathonId=${selectedHackathon._id}`);
      const mentorTeams = allTeamsData.filter(team => 
        team.mentor && team.mentor._id === authState.userId
      );
      setMyTeams(mentorTeams);
    } catch (err) {
      setError('Failed to fetch your teams: ' + err.message);
      console.error('Fetch my teams error:', err);
    }
  };

  // Save selected hackathon to localStorage when it changes
  useEffect(() => {
    if (selectedHackathon && window.localStorage) {
      window.localStorage.setItem('selectedHackathonId', selectedHackathon._id);
    }
  }, [selectedHackathon]);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      if (!authState.token || !authState.userId) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await fetchHackathons();
      } catch (err) {
        setError('Failed to initialize data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Fetch teams when hackathon changes
  useEffect(() => {
    if (selectedHackathon) {
      fetchMyTeams();
    }
  }, [selectedHackathon]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    if (!selectedHackathon) return;

    const interval = setInterval(() => {
      fetchMyTeams();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedHackathon]);

  const filteredMyTeams = myTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.students.some(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (!authState.token || !authState.userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view your mentored teams.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Mentored Teams</h1>
          <p className="text-gray-600">View and track the teams you're mentoring</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button 
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900 ml-2 text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* Hackathon Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Hackathon</h2>
          {hackathons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No active hackathons available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hackathons.map(hackathon => (
                <div
                  key={hackathon._id}
                  onClick={() => setSelectedHackathon(hackathon)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedHackathon?._id === hackathon._id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{hackathon.hackathonname}</h3>
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{hackathon.college}</p>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(hackathon.startdate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Team: {hackathon.minteam}-{hackathon.maxteam}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      hackathon.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      hackathon.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {hackathon.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teams Section */}
        {selectedHackathon && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">Your Teams</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {myTeams.length} {myTeams.length === 1 ? 'Team' : 'Teams'}
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teams, students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Teams List */}
            <div className="space-y-4">
              {filteredMyTeams.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium mb-1">
                    {searchTerm ? 'No teams match your search' : 'No teams assigned yet'}
                  </p>
                  <p className="text-sm">
                    {searchTerm ? 'Try a different search term' : 'Teams will appear here once assigned to you'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredMyTeams.map(team => (
                    <div key={team._id} className="border-2 border-green-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-green-50">
                      {/* Team Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{team.name}</h3>
                          <p className="text-sm text-gray-500">
                            Registered: {new Date(team.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Mentoring
                        </span>
                      </div>

                      {/* Team Lead */}
                      {team.teamLead && (
                        <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Lead</span>
                              <div className="mt-1">
                                <p className="font-semibold text-gray-900">{team.teamLead.name}</p>
                                <p className="text-sm text-gray-600">{team.teamLead.rollNo}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {team.teamLead.email && (
                                <a 
                                  href={`mailto:${team.teamLead.email}`}
                                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                  title={`Email ${team.teamLead.email}`}
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              )}
                              {team.teamLead.github && (
                                <a 
                                  href={team.teamLead.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                  title="GitHub Profile"
                                >
                                  <Github className="h-4 w-4" />
                                </a>
                              )}
                              {team.teamLead.linkedin && (
                                <a 
                                  href={team.teamLead.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                  title="LinkedIn Profile"
                                >
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Team Members */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Team Members ({team.students.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {team.students.map(student => (
                            <div key={student._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.rollNo}</p>
                                {student.branch && (
                                  <p className="text-xs text-gray-400">{student.branch}</p>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                {student.email && (
                                  <a 
                                    href={`mailto:${student.email}`}
                                    className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                    title={`Email ${student.email}`}
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {student.github && (
                                  <a 
                                    href={student.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-colors"
                                    title="GitHub Profile"
                                  >
                                    <Github className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {student.linkedin && (
                                  <a 
                                    href={student.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                    title="LinkedIn Profile"
                                  >
                                    <Linkedin className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Project Submission */}
                      {team.projectSubmission && (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Project Submitted
                            </span>
                            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                              {new Date(team.projectSubmission.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{team.projectSubmission.title}</h4>
                          <p className="text-sm text-gray-700 mb-3">{team.projectSubmission.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {team.projectSubmission.githubLink && (
                              <a
                                href={team.projectSubmission.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                <Github className="h-4 w-4" />
                                View Code
                              </a>
                            )}
                            {team.projectSubmission.demoLink && (
                              <a
                                href={team.projectSubmission.demoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Live Demo
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorHackathonTeams;