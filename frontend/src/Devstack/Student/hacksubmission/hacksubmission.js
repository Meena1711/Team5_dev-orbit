import React, { useState, useEffect } from 'react';
import { Upload, FileText, Github, Link2, Loader2, CheckCircle, AlertCircle, Users, Info, ArrowLeft } from 'lucide-react';

export default function HackathonSubmissionForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [hackathonData, setHackathonData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [selectedProblemStatement, setSelectedProblemStatement] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  
  const [formData, setFormData] = useState({
    memberContributions: {},
    projectDescription: '',
    githubRepo: '',
    liveDemoLink: '',
    documents: []
  });
  const [hasDocuments, setHasDocuments] = useState(false); // Track document upload separately

  const API_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') + '/hacksubmission';

  const selectedHackathonId = localStorage.getItem("selectedHackathonId");
  const studentId = localStorage.getItem("student");
  let myTeamId = localStorage.getItem('myTeamId');
  
  // console.log('🔑 Initial localStorage:', { selectedHackathonId, studentId, myTeamId });

  useEffect(() => {
    fetchTeamAndInitialData();
  }, []);

  const fetchTeamAndInitialData = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!selectedHackathonId || !studentId) {
        setError('Missing hackathon or student information. Please go back and select a hackathon.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token') || '';
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // ✅ Fetch team ID from student ID if not in localStorage
      if (!myTeamId) {
        console.log('🔍 Fetching team ID for student:', studentId);
        const teamLookupRes = await fetch(
          `${API_URL}/student/${studentId}/team?hackathonId=${selectedHackathonId}`,
          { headers }
        );
        
        if (!teamLookupRes.ok) {
          throw new Error('Failed to fetch team information');
        }
        
        const teamLookupJson = await teamLookupRes.json();
        
        if (!teamLookupJson.hasTeam) {
          setError('You are not part of any team yet. Please join or create a team first.');
          setLoading(false);
          return;
        }
        
        myTeamId = teamLookupJson.teamId;
        localStorage.setItem('myTeamId', myTeamId);
        console.log('✅ Team ID saved to localStorage:', myTeamId);
      }

      // Fetch hackathon details
      const hackathonRes = await fetch(`${API_URL}/lookup/hackathon/${selectedHackathonId}`, { headers });
      if (!hackathonRes.ok) throw new Error('Failed to fetch hackathon details');
      const hackathonJson = await hackathonRes.json();
      setHackathonData(hackathonJson);

      // Fetch team details
      const teamRes = await fetch(`${API_URL}/lookup/team/${myTeamId}`, { headers });
      if (!teamRes.ok) throw new Error('Failed to fetch team details');
      const teamJson = await teamRes.json();
      setTeamData(teamJson);

      // Fetch selected problem statement
      const selectedPSRes = await fetch(`${API_URL}/team/${myTeamId}/selected-problem`, { headers });
      if (!selectedPSRes.ok) throw new Error('Failed to fetch selected problem statement');
      const selectedPSJson = await selectedPSRes.json();
      
      if (selectedPSJson.hasSelected) {
        setSelectedProblemStatement(selectedPSJson.problemStatement);
      }

      // Check submission status
      const statusRes = await fetch(`${API_URL}/team/${myTeamId}/submission-status`, { headers });
      if (!statusRes.ok) throw new Error('Failed to fetch submission status');
      const statusJson = await statusRes.json();
      setSubmissionStatus(statusJson);

      // If already submitted, fetch the submission details
      if (statusJson.hasSubmitted) {
        const submissionRes = await fetch(`${API_URL}/team/${myTeamId}/submission`, { headers });
        if (submissionRes.ok) {
          const submissionJson = await submissionRes.json();
          if (submissionJson.hasSubmission) {
            setExistingSubmission(submissionJson.submission);
          }
        }
      }

      // Initialize contributions for ALL members
      const contributions = {};
      (teamJson.students || []).forEach(student => {
        contributions[student.studentId] = '';
      });
      setFormData(prev => ({ ...prev, memberContributions: contributions }));

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberContributionChange = (studentId, value) => {
    setFormData(prev => ({
      ...prev,
      memberContributions: {
        ...prev.memberContributions,
        [studentId]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) {
      setFormData(prev => ({ ...prev, documents: [] }));
      return;
    }
    
    if (files.length > 5) {
      setError('Maximum 5 files allowed');
      e.target.value = ''; // Clear the input
      return;
    }
    
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Some files exceed 10MB limit');
      e.target.value = ''; // Clear the input
      return;
    }
    
    setFormData(prev => ({ ...prev, documents: files }));
    setError('');
    console.log('✅ Files uploaded:', files.length, files); // Debug log
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedProblemStatement) {
        throw new Error('Please wait for your team lead to select a problem statement before submitting.');
      }

      if (!formData.projectDescription.trim()) {
        throw new Error('Please provide project description');
      }
      if (formData.projectDescription.trim().length < 10) {
        throw new Error('Project description must be at least 10 characters');
      }
      if (!formData.githubRepo.trim()) {
        throw new Error('GitHub repository link is required');
      }

      // ✅ NEW: Validate that at least one document is uploaded
      if (!formData.documents || formData.documents.length === 0) {
        throw new Error('At least one document must be uploaded (PDF, PPT, DOC, or ZIP)');
      }

      // Validate ALL member contributions
      const allMembers = teamData.students || [];
      for (const member of allMembers) {
        if (!formData.memberContributions[member.studentId]?.trim()) {
          throw new Error(`Please describe contribution for ${member.name}`);
        }
      }

      const teamLeadId = teamData.teamLead?.studentId;
      const teamLeadContribution = formData.memberContributions[teamLeadId] || '';

      const teamMembers = allMembers
        .filter(member => member.studentId !== teamLeadId)
        .map(member => ({
          student: member.studentId,
          contribution: formData.memberContributions[member.studentId]
        }));

      const submitFormData = new FormData();
      submitFormData.append('hackathon', selectedHackathonId);
      submitFormData.append('team', myTeamId);
      submitFormData.append('problemStatement', selectedProblemStatement._id);
      submitFormData.append('teamLead', teamLeadId);
      submitFormData.append('teamLeadContribution', teamLeadContribution);
      submitFormData.append('projectDescription', formData.projectDescription);
      submitFormData.append('githubRepo', formData.githubRepo);
      submitFormData.append('liveDemoLink', formData.liveDemoLink || '');
      submitFormData.append('submittedBy', teamData.teamLead.registrationId);
      submitFormData.append('teamMembers', JSON.stringify(teamMembers));

      formData.documents.forEach(file => {
        submitFormData.append('documents', file);
      });

      const response = await fetch(`${API_URL}/submit`, {
        method: 'POST',
        body: submitFormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      setSuccess('Project submitted successfully! 🎉');
      
      // Refresh submission status
      await fetchTeamAndInitialData();
      
      // Reset form
      const resetContributions = {};
      allMembers.forEach(student => {
        resetContributions[student.studentId] = '';
      });
      
      setFormData({
        memberContributions: resetContributions,
        projectDescription: '',
        githubRepo: '',
        liveDemoLink: '',
        documents: []
      });

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading submission form...</p>
        </div>
      </div>
    );
  }

  // Show existing submission if already submitted
  if (submissionStatus?.hasSubmitted && existingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <CheckCircle className="w-8 h-8" />
                Submission Completed
              </h1>
              <p className="text-green-100">Your team has already submitted the project</p>
            </div>

            <div className="px-8 py-6 space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Submission Details</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>Submitted:</strong> {new Date(existingSubmission.submittedAt).toLocaleString()}</p>
                  <p><strong>Team:</strong> {existingSubmission.team?.name}</p>
                  <p><strong>Hackathon:</strong> {existingSubmission.hackathon?.hackathonname}</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">No Multiple Submissions Allowed</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your team can only submit one project per hackathon. The submission cannot be modified after submission.
                    </p>
                  </div>
                </div>
              </div>

              {existingSubmission.problemSub && (
                <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-2">Problem Statement</h3>
                  <h4 className="font-semibold text-gray-800">{existingSubmission.problemSub.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{existingSubmission.problemSub.description}</p>
                  {existingSubmission.problemSub.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {existingSubmission.problemSub.technologies.map((tech, idx) => (
                        <span key={idx} className="text-xs bg-white text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Project Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {existingSubmission.projectDescription}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub Repository
                  </h3>
                  <a 
                    href={existingSubmission.githubRepo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline break-all text-sm"
                  >
                    {existingSubmission.githubRepo}
                  </a>
                </div>
                {existingSubmission.liveDemoLink && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Live Demo
                    </h3>
                    <a 
                      href={existingSubmission.liveDemoLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline break-all text-sm"
                    >
                      {existingSubmission.liveDemoLink}
                    </a>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Contributions
                </h3>
                
                {existingSubmission.teamLead && (
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {existingSubmission.teamLead.student?.name}
                      </h4>
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Team Lead</span>
                    </div>
                    <p className="text-sm text-gray-600">{existingSubmission.teamLead.student?.rollNo}</p>
                    <p className="text-sm text-gray-700 mt-2">{existingSubmission.teamLead.contribution}</p>
                  </div>
                )}

                {existingSubmission.teamMembers?.map((member, idx) => (
                  <div key={idx} className="mb-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-800">{member.student?.name}</h4>
                    <p className="text-sm text-gray-600">{member.student?.rollNo}</p>
                    <p className="text-sm text-gray-700 mt-2">{member.contribution}</p>
                  </div>
                ))}
              </div>

              {existingSubmission.documents?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Uploaded Documents ({existingSubmission.documents.length})
                  </h3>
                  <div className="space-y-2">
                    {existingSubmission.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span className="flex-1 text-sm text-gray-700">{doc.filename}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Project Submission</h1>
            <p className="text-indigo-100">Submit your hackathon project</p>
          </div>

          <div className="px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Hackathon</h3>
                <p className="text-xl font-bold text-gray-800">{hackathonData?.hackathonname || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Team</h3>
                <p className="text-xl font-bold text-gray-800">{teamData?.name || 'N/A'}</p>
              </div>
            </div>

            {teamData?.teamLead && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                <h4 className="text-sm font-semibold text-indigo-600 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Lead
                </h4>
                <p className="text-gray-800 font-medium">{teamData.teamLead.name}</p>
                <p className="text-sm text-gray-600">{teamData.teamLead.email}</p>
                <p className="text-xs text-gray-500 mt-1">{teamData.teamLead.rollNo} • {teamData.teamLead.branch}</p>
              </div>
            )}

            {teamData?.students && teamData.students.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                <h4 className="text-sm font-semibold text-indigo-600 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Team Members ({teamData.students.length})
                </h4>
                <div className="space-y-2">
                  {teamData.students.map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-gray-800 font-medium">
                          {student.name}
                          {student.studentId === teamData.teamLead?.studentId && (
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Lead</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600">{student.rollNo} • {student.branch}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <div className="px-8 py-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Problem Statement <span className="text-red-500">*</span>
              </label>

              {!selectedProblemStatement ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">No problem statement selected</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your team lead needs to select a problem statement before you can submit. Please contact your team lead.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{selectedProblemStatement.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{selectedProblemStatement.description}</p>
                      {selectedProblemStatement.mentor && (
                        <p className="text-xs text-gray-500 mb-2">
                          <strong>Mentor:</strong> {selectedProblemStatement.mentor.name} ({selectedProblemStatement.mentor.email})
                        </p>
                      )}
                      {selectedProblemStatement.technologies && selectedProblemStatement.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedProblemStatement.technologies.map((tech, idx) => (
                            <span key={idx} className="text-xs bg-white text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-3" />
                  </div>
                </div>
              )}
            </div>

            {submissionStatus && !submissionStatus.canSubmit && !submissionStatus.hasSubmitted && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">{submissionStatus.message}</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Team Member Contributions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Describe what each team member contributed to the project
              </p>

              <div className="space-y-4">
                {teamData?.students && teamData.students.map((member) => {
                  const isTeamLead = member.studentId === teamData.teamLead?.studentId;
                  return (
                    <div key={member.studentId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {member.name}'s Contribution
                        {isTeamLead && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Team Lead</span>
                        )}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        {member.rollNo} • {member.branch}
                      </p>
                      <textarea
                        value={formData.memberContributions[member.studentId] || ''}
                        onChange={(e) => handleMemberContributionChange(member.studentId, e.target.value)}
                        required
                        rows={3}
                        placeholder={`Describe what ${member.name} contributed to the project...`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleInputChange}
                required
                rows={6}
                placeholder="Provide a detailed description of your project (minimum 10 characters)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.projectDescription.length} characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Github className="inline w-4 h-4 mr-1" />
                GitHub Repository <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="githubRepo"
                value={formData.githubRepo}
                onChange={handleInputChange}
                required
                placeholder="https://github.com/username/repo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Link2 className="inline w-4 h-4 mr-1" />
                Live Demo Link (Optional)
              </label>
              <input
                type="url"
                name="liveDemoLink"
                value={formData.liveDemoLink}
                onChange={handleInputChange}
                placeholder="https://your-demo-link.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Upload className="inline w-4 h-4 mr-1" />
                Upload Documents <span className="text-red-500">*</span>
              </label>

              <input
                type="file"
                onChange={handleFileChange}
                multiple
                required
                accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
              />
              <p className="text-xs text-gray-500 mt-1">
                <strong>Required:</strong> At least 1 file must be uploaded. Max 5 files. Allowed: PDF, PPT, DOC, ZIP (max 10MB each)
              </p>

              {formData.documents && formData.documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {formData.documents.length} file{formData.documents.length > 1 ? 's' : ''} selected
                  </p>
                  {formData.documents.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="flex-1">{file.name}</span>
                      <span className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(!formData.documents || formData.documents.length === 0) && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    No documents uploaded yet. You must upload at least one document to submit your project.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting || 
                  !selectedProblemStatement || 
                  submissionStatus?.hasSubmitted || 
                  !formData.documents || 
                  formData.documents.length === 0
                }
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Project
                  </>
                )}
              </button>
              
           
              {!selectedProblemStatement && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Button will be enabled once your team selects a problem statement
                </p>
              )}
              {selectedProblemStatement && (!formData.documents || formData.documents.length === 0) && (
                <p className="text-center text-sm text-red-500 mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Please upload at least one document to enable submission
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}