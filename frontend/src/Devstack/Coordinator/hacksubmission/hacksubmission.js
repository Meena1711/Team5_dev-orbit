import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, Trash2, Filter, Calendar, Users, FileText, Github, ExternalLink, AlertCircle, X, CheckCircle } from 'lucide-react';

const CoordinatorSubmissionDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filters, setFilters] = useState({
    hackathon: '',
    branch: '',
    search: ''
  });
  const [hackathons, setHackathons] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [branchStats, setBranchStats] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, submissionId: null });
  const [coordinatorYear] = useState(localStorage.getItem('coordinatoryear') || '');
const [coordinatorCollege] = useState(localStorage.getItem('coordinatordetails') || '');
  
  // IMPORTANT: Replace with actual coordinator ID from your auth system
  // For testing, you can use any valid MongoDB ObjectId from your coordinators collection
  // Example: const [coordinatorId, setCoordinatorId] = useState('507f1f77bcf86cd799439011');
  const [coordinatorId, setCoordinatorId] = useState(localStorage.getItem('coordinatorid') || null);
  const [useCoordinatorRoutes, setUseCoordinatorRoutes] = useState(false); // Toggle for coordinator-specific routes

  // API base URL - update this to match your backend
  const API_BASE = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') + '/hacksubmission';
  const HACKATHON_API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') + '/hackathon';

  useEffect(() => {
    fetchHackathons();
    fetchStats();
    setLoading(false); // Set loading to false initially
  }, []);

  useEffect(() => {
    if (filters.hackathon) {
      fetchSubmissions();
      fetchBranchStats();
    } else {
      setSubmissions([]);
      setBranchStats(null);
      setLoading(false);
    }
  }, [filters.hackathon]);

const fetchSubmissions = async () => {
  if (!filters.hackathon) {
    setSubmissions([]);
    return;
  }

  try {
    setLoading(true);
    console.log('Fetching submissions for hackathon:', filters.hackathon);
    console.log('With coordinator filters:', { coordinatorYear, coordinatorCollege });
    
    let response;
    if (coordinatorId && coordinatorId.match(/^[0-9a-fA-F]{24}$/)) {
      // Build query params
      const params = new URLSearchParams();
      if (coordinatorYear) params.append('coordinatorYear', coordinatorYear);
      if (coordinatorCollege) params.append('coordinatorCollege', coordinatorCollege);
      
      const url = `${API_BASE}/coordinator/${coordinatorId}/hackathon/${filters.hackathon}?${params.toString()}`;
      console.log('Fetching from:', url);
      response = await fetch(url);
    } else {
      // Fallback to regular endpoint
      const params = new URLSearchParams();
      params.append('hackathon', filters.hackathon);
      response = await fetch(`${API_BASE}?${params}`);
    }
    
    console.log('Submission response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch submissions');
    }
    
    const data = await response.json();
    console.log('Submissions data:', data);
    console.log(`Found ${data.count} submissions matching ${coordinatorCollege} - ${coordinatorYear}`);
    
    setSubmissions(data.submissions || []);
    setError(null);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    setError(err.message);
    setSubmissions([]);
  } finally {
    setLoading(false);
  }
};

const fetchHackathons = async () => {
  try {
    console.log('Fetching hackathons');
    console.log('With coordinator filters:', { coordinatorYear, coordinatorCollege });
    
    let response;
    if (coordinatorId && coordinatorId.match(/^[0-9a-fA-F]{24}$/)) {
      // Build query params
      const params = new URLSearchParams();
      if (coordinatorYear) params.append('coordinatorYear', coordinatorYear);
      if (coordinatorCollege) params.append('coordinatorCollege', coordinatorCollege);
      
      const url = `${API_BASE}/coordinator/${coordinatorId}/hackathons?${params.toString()}`;
      console.log('Fetching hackathons from:', url);
      response = await fetch(url);
    } else {
      // Fallback to general hackathon API
      response = await fetch(HACKATHON_API);
    }
    
    console.log('Hackathon response status:', response.status);
    
    if (!response.ok) {
      console.error('Failed to fetch hackathons');
      setError('Failed to load hackathons. Please check your API connection.');
      return;
    }
    
    const data = await response.json();
    console.log('Hackathons data:', data);
    
    const hackathonList = data.hackathons || data || [];
    console.log(`Loaded ${hackathonList.length} hackathons for ${coordinatorCollege} - ${coordinatorYear}`);
    
    setHackathons(hackathonList);
  } catch (err) {
    console.error('Error fetching hackathons:', err);
    setError('Failed to load hackathons. Please check your API connection.');
  }
};

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/by-hackathon`);
      if (!response.ok) {
        console.error('Failed to fetch stats');
        return;
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchBranchStats = async () => {
  if (!filters.hackathon) return;
  
  try {
    if (!coordinatorId || !coordinatorId.match(/^[0-9a-fA-F]{24}$/)) {
      return;
    }
    
    // Build query params
    const params = new URLSearchParams();
    if (coordinatorYear) params.append('coordinatorYear', coordinatorYear);
    if (coordinatorCollege) params.append('coordinatorCollege', coordinatorCollege);
    
    const url = `${API_BASE}/coordinator/hackathon/${filters.hackathon}/stats/by-branch?${params.toString()}`;
    console.log('Fetching branch stats from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch branch stats');
      return;
    }
    
    const data = await response.json();
    console.log('Branch stats:', data);
    setBranchStats(data);
  } catch (err) {
    console.error('Error fetching branch stats:', err);
  }
};

// Add validation check at the beginning of component render
if (!coordinatorYear || !coordinatorCollege) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-4">
          <AlertCircle className="mx-auto text-red-600" size={48} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Missing Coordinator Information
        </h2>
        <p className="text-gray-600 mb-4">
          Coordinator year or college information is missing from your session.
        </p>
        <p className="text-sm text-gray-500">
          Please log in again to access the submission dashboard.
        </p>
      </div>
    </div>
  );
}

// Add coordinator info banner after the header (before filters section)
// Insert this after the {/* Header */} section and before {/* Filters Section */}
{/* Coordinator Info Banner */}
<div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <div className="flex items-center gap-3 text-white">
      <CheckCircle size={24} />
      <div>
        <div className="text-sm opacity-90">Viewing submissions for:</div>
        <div className="text-lg font-semibold">
          {coordinatorCollege} • {coordinatorYear}
        </div>
      </div>
    </div>
  </div>
</div>

  const viewSubmission = async (id) => {
    try {
      console.log('Viewing submission:', id);
      const response = await fetch(`${API_BASE}/${id}`);
      console.log('View submission response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to fetch submission details');
      
      const data = await response.json();
      console.log('Submission details:', data);
      setSelectedSubmission(data);
    } catch (err) {
      console.error('Error viewing submission:', err);
      setError('Error viewing submission: ' + err.message);
    }
  };

  const downloadDocument = async (submissionId, docIndex, filename) => {
    try {
      const response = await fetch(`${API_BASE}/${submissionId}/document/${docIndex}`);
      if (!response.ok) throw new Error('Failed to download document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Error downloading document: ' + err.message);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ show: true, submissionId: id });
  };

  const confirmDelete = async () => {
    const { submissionId } = deleteModal;
    
    try {
      const response = await fetch(`${API_BASE}/${submissionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete submission');
      
      setError(null);
      fetchSubmissions();
      setSelectedSubmission(null);
      setDeleteModal({ show: false, submissionId: null });
    } catch (err) {
      setError('Error deleting submission: ' + err.message);
      setDeleteModal({ show: false, submissionId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, submissionId: null });
  };

  const clearFilters = () => {
    setFilters({
      hackathon: '',
      branch: '',
      search: ''
    });
    setSubmissions([]);
  };

  // Get unique branches from submissions
  const branches = [...new Set(
    submissions.flatMap(sub => 
      [
        sub.teamLead?.student?.branch,
        ...(sub.teamMembers?.map(m => m.student?.branch) || [])
      ].filter(Boolean)
    )
  )].sort();

  // Filter submissions by branch and search
  const filteredSubmissions = submissions.filter(sub => {
    // Branch filter
    if (filters.branch) {
      const teamBranches = [
        sub.teamLead?.student?.branch,
        ...(sub.teamMembers?.map(m => m.student?.branch) || [])
      ].filter(Boolean);
      
      if (!teamBranches.includes(filters.branch)) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        sub.team?.name?.toLowerCase().includes(searchLower) ||
        sub.problemSub?.title?.toLowerCase().includes(searchLower) ||
        sub.teamLead?.student?.name?.toLowerCase().includes(searchLower) ||
        sub.teamLead?.student?.rollNo?.toLowerCase().includes(searchLower) ||
        sub.projectDescription?.toLowerCase().includes(searchLower) ||
        sub.teamMembers?.some(m => 
          m.student?.name?.toLowerCase().includes(searchLower) ||
          m.student?.rollNo?.toLowerCase().includes(searchLower)
        )
      );
    }

    return true;
  });

  if (loading && filters.hackathon && submissions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submission Management</h1>
              <p className="mt-1 text-sm text-gray-500">View and manage hackathon submissions</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter size={20} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Stats Cards */}
          {/* {stats && stats.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.slice(0, 3).map((stat, idx) => (
                <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 truncate">{stat.hackathonName}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.totalSubmissions}</p>
                      <p className="text-xs text-gray-500">submissions</p>
                    </div>
                    <FileText className="text-blue-600" size={32} />
                  </div>
                </div>
              ))}
            </div>
          )} */}
          {/* Stats Card - Selected Hackathon Only */}
          {filters.hackathon && hackathons.length > 0 && (
            <div className="mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Selected Hackathon</p>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {hackathons.find(h => h._id === filters.hackathon)?.hackathonname || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-3xl font-bold text-blue-600">{filteredSubmissions.length}</p>
                        <p className="text-xs text-gray-500">submissions for {coordinatorCollege} - {coordinatorYear}</p>
                      </div>
                      {branchStats && branchStats.branchStats && (
                        <div className="ml-auto">
                          <p className="text-sm text-gray-600">{branchStats.branchStats.length} branches</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <FileText className="text-blue-600 flex-shrink-0 ml-4" size={40} />
                </div>
              </div>
            </div>
          )}

          {/* Branch Statistics for Selected Hackathon */}
          {branchStats && branchStats.branchStats && branchStats.branchStats.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Submissions by Branch</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {branchStats.branchStats.map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600">{stat.branch}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.submissionCount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hackathon <span className="text-red-500">*</span>
                </label>
                <select
                  value={filters.hackathon}
                  onChange={(e) => setFilters({...filters, hackathon: e.target.value, branch: '', search: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Hackathon</option>
                  {hackathons.map(h => (
                    <option key={h._id} value={h._id}>{h.hackathonname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({...filters, branch: e.target.value})}
                  disabled={!filters.hackathon}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Team, student, roll no..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    disabled={!filters.hackathon}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Active Filter Tags */}
            {(filters.hackathon || filters.branch || filters.search) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.hackathon && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <span>
                      {hackathons.find(h => h._id === filters.hackathon)?.hackathonname || 'Hackathon'}
                    </span>
                  </div>
                )}
                {filters.branch && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <span>Branch: {filters.branch}</span>
                    <button 
                      onClick={() => setFilters({...filters, branch: ''})}
                      className="hover:text-green-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {filters.search && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    <span>Search: "{filters.search}"</span>
                    <button 
                      onClick={() => setFilters({...filters, search: ''})}
                      className="hover:text-purple-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              {/* <h2 className="text-xl font-semibold text-gray-900">
                Submissions ({filteredSubmissions.length})
              </h2> */}
              {filters.hackathon && branches.length > 0 && (
                <div className="text-sm text-gray-600">
                  {branches.length} branch{branches.length !== 1 ? 'es' : ''} found
                </div>
              )}
            </div>

            {!filters.hackathon ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Filter className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 font-medium">Select a Hackathon</p>
                <p className="text-sm text-gray-500 mt-2">Please select a hackathon from the filters above to view submissions</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No submissions found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {filters.branch || filters.search ? 'Try adjusting your filters' : 'No submissions yet for this hackathon'}
                </p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission._id}
                  className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all hover:shadow-md ${
                    selectedSubmission?._id === submission._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => viewSubmission(submission._id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {submission.team?.name || 'Unknown Team'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {submission.problemSub?.title || 'Problem Statement'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {(submission.teamMembers?.length || 0) + 1} members
                        </span>
                        {submission.teamLead?.student?.branch && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                            {submission.teamLead.student.branch}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewSubmission(submission._id);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(submission._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {submission.projectDescription}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    {submission.githubRepo && (
                      <a
                        href={submission.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Github size={14} />
                        GitHub Repo
                      </a>
                    )}
                    {submission.liveDemoLink && (
                      <a
                        href={submission.liveDemoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Live Demo
                      </a>
                    )}
                    {submission.documents && submission.documents.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <FileText size={14} />
                        {submission.documents.length} document{submission.documents.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            {selectedSubmission ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Team</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedSubmission.team?.name}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Team Lead</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedSubmission.teamLead?.student?.name}
                    </p>
                    <p className="text-xs text-gray-600">{selectedSubmission.teamLead?.student?.email}</p>
                    <p className="text-xs text-gray-600">
                      Roll No: {selectedSubmission.teamLead?.student?.rollNo} | {selectedSubmission.teamLead?.student?.branch}
                    </p>
                    {selectedSubmission.teamLead?.contribution && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                        <strong>Contribution:</strong> {selectedSubmission.teamLead.contribution}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Problem Statement</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedSubmission.problemSub?.title}
                    </p>
                    {selectedSubmission.problemSub?.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedSubmission.problemSub.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Project Description</label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {selectedSubmission.projectDescription}
                    </p>
                  </div>

                  {selectedSubmission.problemSub?.technologies?.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Technologies</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedSubmission.problemSub.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.teamMembers?.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Team Members</label>
                      <div className="mt-2 space-y-2">
                        {selectedSubmission.teamMembers.map((member, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <p className="text-sm font-medium text-gray-900">
                              {member.student?.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {member.student?.email}
                            </p>
                            <p className="text-xs text-gray-600">
                              Roll No: {member.student?.rollNo} | {member.student?.branch}
                            </p>
                            {member.contribution && (
                              <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700">
                                <strong>Contribution:</strong> {member.contribution}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedSubmission.githubRepo || selectedSubmission.liveDemoLink) && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Links</label>
                      <div className="mt-2 space-y-2">
                        {selectedSubmission.githubRepo && (
                          <a
                            href={selectedSubmission.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Github size={16} className="text-gray-600" />
                            <span className="text-sm text-blue-600 hover:underline flex-1 truncate">
                              {selectedSubmission.githubRepo}
                            </span>
                            <ExternalLink size={14} className="text-gray-400" />
                          </a>
                        )}
                        {selectedSubmission.liveDemoLink && (
                          <a
                            href={selectedSubmission.liveDemoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                          >
                            <ExternalLink size={16} className="text-gray-600" />
                            <span className="text-sm text-blue-600 hover:underline flex-1 truncate">
                              {selectedSubmission.liveDemoLink}
                            </span>
                            <ExternalLink size={14} className="text-gray-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.documents?.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Documents ({selectedSubmission.documents.length})</label>
                      <div className="mt-2 space-y-2">
                        {selectedSubmission.documents.map((doc, idx) => (
                          <button
                            key={idx}
                            onClick={() => downloadDocument(selectedSubmission._id, idx, doc.filename)}
                            className="w-full flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-left"
                          >
                            <Download size={16} className="text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{doc.filename}</p>
                              <p className="text-xs text-gray-500">{doc.fileType}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => handleDeleteClick(selectedSubmission._id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Submission
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center sticky top-6">
                <Eye className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorSubmissionDashboard;