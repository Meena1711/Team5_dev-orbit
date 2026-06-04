import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, X, Send, Loader2, CheckCircle, AlertCircle, User, Mail, Github, Linkedin } from 'lucide-react';

const API_BASE = 'http://localhost:5000/studenthackteam';
const API_BASEs = 'http://localhost:5000/hackmentorfeedback';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Mentor Feedback Modal Component
const MentorFeedbackModal = ({ isOpen, onClose, mentor, team, hackathonId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && mentor && hackathonId) {
      fetchExistingFeedback();
      
    }
  }, [isOpen, mentor, hackathonId]);

  const fetchExistingFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASEs}/feedback/mentor/${mentor._id}?hackathonId=${hackathonId}`,
        authHeaders()
      );
      
      if (response.data) {
        setExistingFeedback(response.data);
        setRating(response.data.rating);
        setFeedback(response.data.feedback || '');
      }
    } catch (error) {
      console.error('Error fetching existing feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (!rating) {
      setMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      const response = await axios.post(
        `${API_BASEs}/feedback/mentor`,
        {
          mentorId: mentor._id,
          hackathonId: hackathonId,
          rating: rating,
          feedback: feedback
        },
        authHeaders()
      );

      setMessage({
        type: 'success',
        text: response.data.message || 'Feedback submitted successfully!'
      });

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to submit feedback'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Star
              size={36}
              fill={star <= (hoverRating || rating) ? '#fbbf24' : 'none'}
              color={star <= (hoverRating || rating) ? '#fbbf24' : '#d1d5db'}
              style={{ transition: 'all 0.2s' }}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
          padding: '24px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} color="white" />
          </button>
          <h2 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            Rate Your Mentor
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '8px 0 0 0', fontSize: '14px' }}>
            Team: {team?.name || 'N/A'}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Loader2 size={40} color="#4f46e5" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading...</p>
          </div>
        ) : (
          <>
            {/* Mentor Info */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={32} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                    {mentor?.name || 'N/A'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '12px' }}>
                    <Mail size={16} />
                    <span style={{ fontSize: '14px' }}>{mentor?.email || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {mentor?.github && (
                      <a
                        href={mentor.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: '#374151',
                          fontSize: '13px'
                        }}
                      >
                        <Github size={16} />
                        GitHub
                      </a>
                    )}
                    {mentor?.linkedin && (
                      <a
                        href={mentor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#dbeafe',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: '#1e40af',
                          fontSize: '13px'
                        }}
                      >
                        <Linkedin size={16} />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {existingFeedback && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#d1fae5',
                  border: '1px solid #6ee7b7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={16} color="#059669" />
                  <span style={{ fontSize: '14px', color: '#065f46' }}>
                    You've already submitted feedback. You can update it below.
                  </span>
                </div>
              )}
            </div>

            {/* Feedback Form */}
            <form onSubmit={handleSubmitFeedback} style={{ padding: '24px' }}>
              {/* Star Rating */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  Overall Rating *
                </label>
                {renderStars()}
                {rating > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                    You rated: {rating} out of 5 stars
                  </p>
                )}
              </div>

              {/* Feedback Text */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Your Feedback *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience with this mentor..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '13px', color: '#9ca3af' }}>
                  {feedback.length} characters
                </p>
              </div>

              {/* Message Display */}
              {message.text && (
                <div style={{
                  marginBottom: '24px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                  border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
                  color: message.type === 'success' ? '#065f46' : '#991b1b'
                }}>
                  {message.type === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span style={{ fontSize: '14px' }}>{message.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !rating || feedback.length<0}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  color: 'white',
                  border: 'none',
                  cursor: submitting || !rating ? 'not-allowed' : 'pointer',
                  background: submitting || !rating ? '#9ca3af' : '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!submitting && rating) {
                    e.currentTarget.style.background = '#4338ca';
                  }
                }}
                onMouseOut={(e) => {
                  if (!submitting && rating) {
                    e.currentTarget.style.background = '#4f46e5';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default function TeamManagementPage() {
  const selectedHackathonId = localStorage.getItem('selectedHackathonId');
  const studentBranch = localStorage.getItem('studentbranch') || '';
  const studentId = localStorage.getItem('student');

  const [myTeam, setMyTeam] = useState(null);
  const [myTeamLoading, setMyTeamLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [incomingInvitations, setIncomingInvitations] = useState([]);
  const [outgoingInvitations, setOutgoingInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [sentJoinRequests, setSentJoinRequests] = useState([]);
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  
  const [viewMode, setViewMode] = useState('available');

  // Mentor Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Load My Team
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/myteam`, authHeaders())
      .then(res => {
        console.log('✅ My Team Response:', res.data);
        localStorage.setItem('myTeamId', res.data ? res.data._id : '');
        console.log('🔑 Stored myTeamId:', localStorage.getItem('myTeamId'));
        setMyTeam(res.data);
      })
      .catch(() => setMyTeam(null))
      .finally(() => setMyTeamLoading(false));
  }, [studentId]);

  // Load all students based on view mode
  const loadAllStudents = () => {
    if (!selectedHackathonId) return;
    
    setShowSearchResults(true);
    setStudentsLoading(true);
    
    const params = {
      hackathonId: selectedHackathonId,
      branch: studentBranch,
      search: ''
    };
    
    if (viewMode === 'inTeams') {
      params.showTeamMembers = 'true';
    } else if (viewMode === 'available') {
      params.showTeamMembers = 'false';
    }
    
    axios.get(`${API_BASE}/students/search`, { ...authHeaders(), params })
    .then(res => {
      console.log('Fetched students:', res.data);
      setStudents(res.data);
    })
    .catch(err => {
      console.error('Error fetching students:', err);
      setStudents([]);
    })
    .finally(() => setStudentsLoading(false));
  };

  // Reload students when view mode changes
  useEffect(() => {
    if (showSearchResults) {
      loadAllStudents();
    }
  }, [viewMode]);

  // Filter students on client side
  const filteredStudents = students.filter(student => {
    const query = searchTerm.trim().toLowerCase();
    
    if (query === '') return true;
    
    const studentName = (student.name || '').toLowerCase();
    const studentRollNo = (student.rollNo || '').toLowerCase();
    
    return studentName.includes(query) || studentRollNo.includes(query);
  });

  // Load incoming invitations
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/invitations/incoming`, authHeaders())
      .then(res => setIncomingInvitations(res.data))
      .catch(() => setIncomingInvitations([]));
  }, [studentId]);

  // Load outgoing invitations
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/invitations/outgoing`, authHeaders())
      .then(res => setOutgoingInvitations(res.data))
      .catch(() => setOutgoingInvitations([]));
  }, [studentId]);

  // Load join requests (received by me as team lead)
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/join-requests`, authHeaders())
      .then(res => setJoinRequests(res.data))
      .catch(() => setJoinRequests([]));
  }, [studentId]);

  // Load sent join requests (sent by me to teams)
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/join-requests/sent`, authHeaders())
      .then(res => setSentJoinRequests(res.data))
      .catch(() => setSentJoinRequests([]));
  }, [studentId]);

  const toggleStudentSelection = (student) => {
    const isSelected = selectedStudents.some(s => s.studentId === student.studentId);
    if (isSelected) {
      setSelectedStudents(selectedStudents.filter(s => s.studentId !== student.studentId));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const createTeam = () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }
    if (!selectedHackathonId) {
      alert('No hackathon selected');
      return;
    }

    setCreatingTeam(true);

    axios.post(
      `${API_BASE}/teams/create-with-invites`,
      {
        teamName: teamName.trim(),
        hackathonId: selectedHackathonId,
        studentIds: selectedStudents.map(s => s.studentId),
        mentorId: null
      },
      authHeaders()
    )
    .then(res => {
      alert(`Team created successfully! Invitations sent to ${selectedStudents.length} student(s).`);
      setTeamName('');
      setSelectedStudents([]);
      axios.get(`${API_BASE}/myteam`, authHeaders())
        .then(res => setMyTeam(res.data))
        .catch(() => setMyTeam(null));
      axios.get(`${API_BASE}/invitations/outgoing`, authHeaders())
        .then(res => setOutgoingInvitations(res.data))
        .catch(() => setOutgoingInvitations([]));
      loadAllStudents();
    })
    .catch(err => {
      alert(`Failed to create team: ${err.response?.data?.error || err.message}`);
    })
    .finally(() => setCreatingTeam(false));
  };

  const sendInvitesToTeam = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to invite');
      return;
    }
    if (!myTeam) {
      alert('You need to be in a team to send invitations');
      return;
    }

    setSendingInvites(true);

    axios.post(
      `${API_BASE}/teams/${myTeam._id}/send-invites`,
      {
        studentIds: selectedStudents.map(s => s.studentId)
      },
      authHeaders()
    )
    .then(res => {
      alert(res.data.message);
      setSelectedStudents([]);
      axios.get(`${API_BASE}/invitations/outgoing`, authHeaders())
        .then(res => setOutgoingInvitations(res.data))
        .catch(() => setOutgoingInvitations([]));
      loadAllStudents();
    })
    .catch(err => {
      alert(`Failed to send invitations: ${err.response?.data?.error || err.message}`);
    })
    .finally(() => setSendingInvites(false));
  };

  const sendJoinRequest = (teamId, teamName) => {
    if (!teamId) {
      alert('Invalid team');
      return;
    }

    axios.post(
      `${API_BASE}/teams/${teamId}/join-requests`,
      {},
      authHeaders()
    )
    .then(() => {
      alert(`Join request sent to team "${teamName}"!`);
      axios.get(`${API_BASE}/join-requests/sent`, authHeaders())
        .then(res => setSentJoinRequests(res.data))
        .catch(() => setSentJoinRequests([]));
      loadAllStudents();
    })
    .catch(err => {
      alert(`Failed to send join request: ${err.response?.data?.error || err.message}`);
    });
  };

  const respondToInvitation = (id, response) => {
    axios.post(
      `${API_BASE}/teams/invitations/${id}/respond`,
      { response },
      authHeaders()
    )
    .then(res => {
      setIncomingInvitations(incomingInvitations.filter(i => i._id !== id));
      alert(res.data.message || `Invitation ${response}`);
      if (response === 'accepted') {
        axios.get(`${API_BASE}/myteam`, authHeaders())
          .then(res => setMyTeam(res.data))
          .catch(() => setMyTeam(null));
      }
      loadAllStudents();
    })
    .catch(err => alert(`Failed to respond: ${err.response?.data?.error || err.message}`));
  };

  const respondToJoinRequest = (id, response) => {
    axios.post(
      `${API_BASE}/teams/join-requests/${id}/respond`,
      { response },
      authHeaders()
    )
    .then(res => {
      setJoinRequests(joinRequests.filter(r => r._id !== id));
      alert(res.data.message || `Join request ${response}`);
      if (response === 'accepted') {
        axios.get(`${API_BASE}/myteam`, authHeaders())
          .then(res => setMyTeam(res.data))
          .catch(() => setMyTeam(null));
      }
      loadAllStudents();
    })
    .catch(err => alert(`Failed to respond: ${err.response?.data?.error || err.message}`));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Team Management</h1>

      {!selectedHackathonId && (
        <div style={{ padding: '15px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '20px' }}>
          <strong>⚠️ No Hackathon Selected</strong>
          <p>Please select a hackathon to manage teams.</p>
        </div>
      )}

      {/* My Team Section */}
      <section style={{ marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>My Team</h2>
          {myTeam && myTeam.mentor && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              style={{
                padding: '10px 20px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Star size={18} />
              Rate Mentor
            </button>
          )}
        </div>
        {myTeamLoading ? <p>Loading your team...</p> : (
          myTeam ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ marginBottom: '8px' }}><strong>Team Name:</strong> {myTeam.name}</p>
                <p style={{ marginBottom: '8px' }}><strong>Team Lead:</strong> {myTeam.teamLead?.name || 'N/A'}</p>
                <p style={{ marginBottom: '8px' }}><strong>Mentor:</strong> {myTeam.mentor?.name || 'Not assigned'}</p>
              </div>
              <div>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Team Members ({myTeam.students?.length || 0}):</p>
                {myTeam.students && myTeam.students.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {myTeam.students.map((s, index) => (
                      <li key={s._id || index} style={{ 
                        padding: '10px', 
                        marginBottom: '8px', 
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}>
                        <strong>{s.name || 'Name not available'}</strong> - {s.rollNo || 'N/A'}
                        <br/>
                        <small style={{ color: '#666' }}>
                          {s.college || 'College N/A'} - {s.branch || 'Branch N/A'}
                        </small>
                        <br/>
                        <small style={{ color: '#007bff' }}>
                          {s.email || 'Email N/A'}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No members found in the team</p>
                )}
              </div>
            </>
          ) : <p>You are not in a team yet for this hackathon.</p>
        )}
      </section>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Search & Select Students Section */}
        <section style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h2>
            {myTeam ? 'Find Students' : 'Search Students'}
          </h2>
          
          {/* View Mode Toggle - Only show when NOT in a team */}
          {!myTeam && (
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setViewMode('available');
                  setSelectedStudents([]);
                }}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'available' ? '#007bff' : '#e9ecef',
                  color: viewMode === 'available' ? 'white' : '#495057',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'available' ? 'bold' : 'normal'
                }}
              >
                Available Students (Create Team)
              </button>
              <button
                onClick={() => {
                  setViewMode('inTeams');
                  setSelectedStudents([]);
                }}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'inTeams' ? '#28a745' : '#e9ecef',
                  color: viewMode === 'inTeams' ? 'white' : '#495057',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'inTeams' ? 'bold' : 'normal'
                }}
              >
                Students in Teams (Join Team)
              </button>
            </div>
          )}

          <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
            {myTeam 
              ? `Showing approved students from ${studentBranch || 'all branches'} (not in teams)`
              : viewMode === 'inTeams' 
                ? 'Showing students who are already in teams' 
                : `Showing available students from ${studentBranch || 'all branches'}`
            }
          </p>
          
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={loadAllStudents}
              style={{ 
                padding: '10px', 
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          {showSearchResults && (
            <>
              {studentsLoading ? (
                <p>Loading students...</p>
              ) : (
                <>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                    Found {filteredStudents.length} student(s)
                    {searchTerm && <span> matching your search</span>}
                  </p>
                  {filteredStudents.length === 0 ? (
                    <p>No students found matching your criteria.</p>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px', background: 'white' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {filteredStudents.map(s => {
                          const isSelected = selectedStudents.some(sel => sel.studentId === s.studentId);
                          
                          return (
                            <li key={s._id} style={{ 
                              padding: '10px', 
                              marginBottom: '8px', 
                              background: isSelected ? '#e7f3ff' : s.inTeam ? '#fff3cd' : '#f8f9fa', 
                              border: isSelected ? '2px solid #007bff' : s.inTeam ? '1px solid #ffc107' : '1px solid #28a745',
                              borderLeft: `4px solid ${isSelected ? '#007bff' : s.inTeam ? '#ffc107' : '#28a745'}`,
                              borderRadius: '4px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>
                                  <strong>{s.name}</strong> - {s.rollNo}<br/>
                                  <small style={{ color: '#666' }}>{s.college} ({s.email})</small>
                                  <br/>
                                  {s.inTeam ? (
                                    <>
                                      <small style={{ color: '#ffc107', fontWeight: 'bold' }}>
                                        📋 Team: {s.teamName}
                                      </small>
                                      <br/>
                                      {s.isTeamLead && (
                                        <>
                                          <small style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                            👑 Team Lead
                                          </small>
                                          <br/>
                                        </>
                                      )}
                                      {s.hasPendingJoinRequest && (
                                        <small style={{ color: '#6c757d', fontWeight: 'bold' }}>
                                          ⏳ Request Sent
                                        </small>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <small style={{ color: '#28a745', fontWeight: 'bold' }}>
                                        ✓ Available {isSelected && '• Selected'}
                                      </small>
                                      {s.hasPendingInvitation && (
                                        <>
                                          <br/>
                                          <small style={{ color: '#007bff', fontWeight: 'bold' }}>
                                            📨 Invitation Sent
                                          </small>
                                        </>
                                      )}
                                    </>
                                  )}
                                </span>
                                <div>
                                  {!myTeam && viewMode === 'inTeams' ? (
                                    <button 
                                      onClick={() => sendJoinRequest(s.teamId, s.teamName)}
                                      disabled={s.hasPendingJoinRequest}
                                      style={{
                                        padding: '6px 12px',
                                        background: s.hasPendingJoinRequest ? '#6c757d' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: s.hasPendingJoinRequest ? 'not-allowed' : 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      {s.hasPendingJoinRequest ? '⏳ Request Sent' : 'Request to Join'}
                                    </button>
                                  ) : (
                                    !s.inTeam && (
                                      <button 
                                        onClick={() => toggleStudentSelection(s)}
                                        disabled={s.hasPendingInvitation}
                                        style={{
                                          padding: '6px 12px',
                                          background: s.hasPendingInvitation ? '#6c757d' : (isSelected ? '#dc3545' : '#007bff'),
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: s.hasPendingInvitation ? 'not-allowed' : 'pointer'
                                        }}
                                        title={s.hasPendingInvitation ? 'Invitation already sent to this student' : ''}
                                      >
                                        {s.hasPendingInvitation ? '📨 Invited' : (isSelected ? 'Deselect' : 'Select')}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Create Team OR Invite Section - Only show in 'available' mode */}
        {(myTeam || viewMode === 'available') && (
          <section style={{ 
            padding: '15px', 
            background: myTeam ? '#e8f5e9' : '#e7f3ff', 
            borderRadius: '8px', 
            border: myTeam ? '2px solid #28a745' : '2px solid #007bff'
          }}>
            <h2>{myTeam ? 'Invite Friends to Your Team' : 'Create New Team'}</h2>
            
            {myTeam && (
              <div style={{ padding: '10px', background: '#d1f2d4', borderRadius: '4px', marginBottom: '15px', border: '1px solid #28a745' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  ✓ You're in team <strong>{myTeam.name}</strong>. Select friends to invite!
                </p>
              </div>
            )}
            
            {!myTeam && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Team Name:
                </label>
                <input
                  type="text"
                  placeholder="Enter team name..."
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  style={{ 
                    padding: '10px', 
                    width: '100%',
                    border: '1px solid #007bff',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}

            <h3>Selected Students ({selectedStudents.length})</h3>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px' }}>
              {myTeam ? 'Invitations will be sent to join your team' : 'Invitations will be sent to these students'}
            </p>
            {selectedStudents.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No students selected yet. Select students from the left panel.</p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '20px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {selectedStudents.map(s => (
                    <li key={s._id} style={{ 
                      padding: '10px', 
                      marginBottom: '8px', 
                      background: 'white',
                      border: `1px solid ${myTeam ? '#28a745' : '#007bff'}`,
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>
                        <strong>{s.name}</strong> - {s.rollNo}<br/>
                        <small style={{ color: '#666' }}>{s.college} ({s.branch})</small>
                      </span>
                      <button 
                        onClick={() => toggleStudentSelection(s)}
                        style={{
                          padding: '4px 8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {myTeam ? (
              <button 
                onClick={sendInvitesToTeam}
                disabled={sendingInvites || selectedStudents.length === 0}
                style={{
                  padding: '12px 24px',
                  background: selectedStudents.length === 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer',
                  width: '100%',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {sendingInvites ? 'Sending Invitations...' : 'Send Invitations to Selected Students'}
              </button>
            ) : (
              <button 
                onClick={createTeam}
                disabled={creatingTeam || !teamName.trim() || selectedStudents.length === 0}
                style={{
                  padding: '12px 24px',
                  background: (!teamName.trim() || selectedStudents.length === 0) ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!teamName.trim() || selectedStudents.length === 0) ? 'not-allowed' : 'pointer',
                  width: '100%',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {creatingTeam ? 'Creating Team & Sending Invites...' : 'Create Team & Send Invitations'}
              </button>
            )}
          </section>
        )}
      </div>

      {/* Sent Join Requests - Only show if not in a team */}
      {!myTeam && sentJoinRequests.length > 0 && (
        <section style={{ marginBottom: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <h2>My Join Requests (Waiting for Team Lead Response)</h2>
          {sentJoinRequests.map(req => (
            <div key={req._id} style={{ 
              marginBottom: '10px', 
              padding: '12px', 
              background: 'white', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <p>
                <strong>Request to join: {req.teamId?.name || 'Unknown Team'}</strong>
              </p>
              <small style={{ color: '#ffc107' }}>⏳ Status: {req.status}</small>
            </div>
          ))}
        </section>
      )}

      {/* Outgoing Invitations */}
      {outgoingInvitations.length > 0 && (
        <section style={{ marginBottom: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <h2>Sent Invitations (Waiting for Response)</h2>
          {outgoingInvitations.map(inv => (
            <div key={inv._id} style={{ 
              marginBottom: '10px', 
              padding: '12px', 
              background: 'white', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <p>
                <strong>{inv.recipient?.name || 'A student'}</strong> - 
                <span style={{ color: '#666', fontSize: '14px' }}> Invitation to join team <strong>{inv.teamId?.name}</strong></span>
              </p>
              <small style={{ color: '#ffc107' }}>⏳ Status: {inv.status}</small>
            </div>
          ))}
        </section>
      )}

      {/* Incoming Invitations */}
      {incomingInvitations.length > 0 && (
        <section style={{ marginBottom: '30px', padding: '15px', background: '#e7f3ff', borderRadius: '8px', border: '2px solid #007bff' }}>
          <h2>Incoming Invitations</h2>
          {incomingInvitations.map(inv => (
            <div key={inv._id} style={{ 
              marginBottom: '10px', 
              padding: '12px', 
              background: 'white', 
              border: '1px solid #007bff',
              borderRadius: '4px'
            }}>
              <p><strong>{inv.teamId?.name || 'A team'}</strong> invited you to join their team.</p>
              <p style={{ fontSize: '14px', color: '#666' }}>Invited by: {inv.sender?.name || 'Team Lead'}</p>
              <button 
                onClick={() => respondToInvitation(inv._id, 'accepted')}
                style={{ padding: '6px 12px', marginRight: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Accept
              </button>
              <button 
                onClick={() => respondToInvitation(inv._id, 'rejected')}
                style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Reject
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Join Requests to My Team */}
      {joinRequests.length > 0 && (
        <section style={{ marginBottom: '30px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '2px solid #28a745' }}>
          <h2>Join Requests to My Team</h2>
          <p style={{ fontSize: '14px', color: '#666' }}>Students requesting to join teams you lead</p>
          {joinRequests.map(r => (
            <div key={r._id} style={{ 
              marginBottom: '10px', 
              padding: '12px', 
              background: 'white', 
              border: '1px solid #28a745',
              borderRadius: '4px'
            }}>
              <p>
                <strong>{r.sender?.name || 'A student'}</strong> wants to join <strong>{r.teamId?.name || 'your team'}</strong>.
              </p>
              <button 
                onClick={() => respondToJoinRequest(r._id, 'accepted')}
                style={{ padding: '6px 12px', marginRight: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Accept
              </button>
              <button 
                onClick={() => respondToJoinRequest(r._id, 'rejected')}
                style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Reject
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Mentor Feedback Modal */}
      <MentorFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        mentor={myTeam?.mentor}
        team={myTeam}
        hackathonId={selectedHackathonId}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}