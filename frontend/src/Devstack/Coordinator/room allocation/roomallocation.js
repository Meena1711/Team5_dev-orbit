import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../../config';

const UserRoomAllocationBatch = () => {
  const submittedBy = localStorage.getItem("coordinatorname") || 'Anonymous';
  const coordinatorYear = localStorage.getItem("coordinatoryear") || '';
  const coordinatorCollege = localStorage.getItem("coordinatordetails") || '';
  
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [mentors, setMentors] = useState([]);
  const [allocations, setAllocations] = useState([{ campusName: '', branch: '', mentor: '', roomNumber: '' }]);
  const [batches, setBatches] = useState([]);
  const [hackathonBatches, setHackathonBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editBatchId, setEditBatchId] = useState(null);
  const [loadingMentors, setLoadingMentors] = useState(false);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const hackathonParams = new URLSearchParams();
        if (coordinatorYear) hackathonParams.append('coordinatorYear', coordinatorYear);
        if (coordinatorCollege) hackathonParams.append('coordinatordetails', coordinatorCollege);
        
        const [hackRes, batchRes] = await Promise.all([
          axios.get(`${config.backendUrl}/roomallocation/hackathons?${hackathonParams.toString()}`),
          axios.get(`${config.backendUrl}/roomallocation/user/${submittedBy}`)
        ]);
        
        setHackathons(hackRes.data.data);
        setBatches(batchRes.data.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
      }
    }
    fetchInitialData();
  }, [submittedBy, coordinatorYear, coordinatorCollege]);

  // Fetch mentors when hackathon is selected
  useEffect(() => {
    async function fetchMentorsForHackathon() {
      if (!selectedHackathon) {
        setMentors([]);
        return;
      }
      
      try {
        setLoadingMentors(true);
        setError('');
        
        const mentorRes = await axios.get(
          `${config.backendUrl}/hackteams/mentors/search?hackathonId=${selectedHackathon}`
        );
        
        setMentors(mentorRes.data || []);
        
        if (!mentorRes.data || mentorRes.data.length === 0) {
          setError('No approved mentors found for this hackathon');
        }
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setMentors([]);
        setError('Failed to load mentors for selected hackathon');
      } finally {
        setLoadingMentors(false);
      }
    }
    
    fetchMentorsForHackathon();
  }, [selectedHackathon]);

  // Fetch batches for selected hackathon
  useEffect(() => {
    async function fetchHackathonBatches() {
      if (!selectedHackathon) {
        setHackathonBatches([]);
        return;
      }
      try {
        const res = await axios.get(`${config.backendUrl}/roomallocation/hackathon/${selectedHackathon}`);
        setHackathonBatches(res.data.data);
      } catch {
        setHackathonBatches([]);
        setError('Failed to load batches for selected hackathon');
      }
    }
    fetchHackathonBatches();
  }, [selectedHackathon]);

  const handleAllocationChange = (index, e) => {
    const newAllocs = [...allocations];
    newAllocs[index][e.target.name] = e.target.value;
    setAllocations(newAllocs);
  };

  const addAllocation = () => {
    setAllocations([...allocations, { campusName: '', branch: '', mentor: '', roomNumber: '' }]);
  };

  const removeAllocation = (index) => {
    const newAllocs = [...allocations];
    newAllocs.splice(index, 1);
    setAllocations(newAllocs);
  };

  const validateForm = () => {
    if (!selectedHackathon) {
      setError('Please select a hackathon');
      return false;
    }
    if (mentors.length === 0) {
      setError('No mentors available for this hackathon');
      return false;
    }
    for (const alloc of allocations) {
      if (!alloc.campusName || !alloc.branch || !alloc.mentor || !alloc.roomNumber) {
        setError('Please fill all allocation fields');
        return false;
      }
    }
    return true;
  };

  const resetForm = () => {
    setSelectedHackathon('');
    setAllocations([{ campusName: '', branch: '', mentor: '', roomNumber: '' }]);
    setEditBatchId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    const allocationsWithHackathon = allocations.map(a => ({ ...a, hackathon: selectedHackathon }));
    try {
      if (editBatchId) {
        await axios.put(`${config.backendUrl}/roomallocation/edit/${editBatchId}`, { allocations: allocationsWithHackathon });
        alert('Batch updated successfully');
      } else {
        await axios.post(`${config.backendUrl}/roomallocation/create`, {
          allocations: allocationsWithHackathon,
          submittedBy,
        });
        alert('Batch created successfully');
      }
      const batchRes = await axios.get(`${config.backendUrl}/roomallocation/user/${submittedBy}`);
      setBatches(batchRes.data.data);
      if (selectedHackathon) {
        const res = await axios.get(`${config.backendUrl}/roomallocation/hackathon/${selectedHackathon}`);
        setHackathonBatches(res.data.data);
      }
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch) => {
    if (batch.submittedBy !== submittedBy) {
      alert("You can only edit batches you submitted.");
      return;
    }
    setEditBatchId(batch._id);
    setSelectedHackathon(batch.allocations[0]?.hackathon?._id || '');
    const allocs = batch.allocations.map(({ campusName, branch, mentor, roomNumber }) => ({
      campusName, branch, mentor, roomNumber
    }));
    setAllocations(allocs);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const batch = hackathonBatches.find(b => b._id === id);
    if (!batch || batch.submittedBy !== submittedBy) {
      alert("You can only delete batches you submitted.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await axios.delete(`${config.backendUrl}/roomallocation/delete/${id}`);
      alert('Batch deleted successfully');
      const batchRes = await axios.get(`${config.backendUrl}/roomallocation/user/${submittedBy}`);
      setBatches(batchRes.data.data);
      if (selectedHackathon) {
        const res = await axios.get(`${config.backendUrl}/roomallocation/hackathon/${selectedHackathon}`);
        setHackathonBatches(res.data.data);
      }
      if (editBatchId === id) resetForm();
    } catch {
      alert('Failed to delete batch');
    }
  };

  return (
    <div style={{ paddingTop: 90 }}>
      <div style={{ marginBottom: 20, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 5 }}>
        <p><strong>Coordinator:</strong> {submittedBy}</p>
        <p><strong>Year:</strong> {coordinatorYear}</p>
        <p><strong>College:</strong> {coordinatorCollege}</p>
        <p><em>Showing hackathons matching your year and college</em></p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Select Hackathon to view batches:</strong>
        </label>
        <select
          value={selectedHackathon}
          onChange={e => setSelectedHackathon(e.target.value)}
        >
          <option value="">Select Hackathon</option>
          {hackathons.map(h => (
            <option key={h._id} value={h._id}>{h.hackathonname} ({h.year}) - Colleges: {h.colleges?.join(', ')}</option>
          ))}
        </select>
        {hackathons.length === 0 && (
          <p style={{ color: 'orange' }}>No hackathons found matching your year and college.</p>
        )}
        {loadingMentors && <p style={{ color: 'blue' }}>Loading mentors...</p>}
      </div>

      {(editBatchId || hackathonBatches.length === 0) && selectedHackathon && (
        <>
          <h2>{editBatchId ? 'Edit' : 'Create'} Room Allocation Batch</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label>
                <strong>Note: Hackathon is selected above for the entire batch.</strong>
              </label>
              {mentors.length > 0 && (
                <p style={{ color: 'green' }}>{mentors.length} approved mentor(s) available</p>
              )}
            </div>
            {allocations.map((alloc, i) => (
              <div key={i} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
                <div>
                  <label>Campus Name</label>
                  <input
                    type="text"
                    name="campusName"
                    value={alloc.campusName}
                    onChange={e => handleAllocationChange(i, e)}
                    required
                  />
                </div>
                <div>
                  <label>Branch</label>
                  <input
                    type="text"
                    name="branch"
                    value={alloc.branch}
                    onChange={e => handleAllocationChange(i, e)}
                    required
                  />
                </div>
                <div>
                  <label>Mentor</label>
                  <select
                    name="mentor"
                    value={alloc.mentor}
                    onChange={e => handleAllocationChange(i, e)}
                    required
                    disabled={loadingMentors || mentors.length === 0}
                  >
                    <option value="">
                      {loadingMentors ? 'Loading...' : mentors.length === 0 ? 'No mentors available' : 'Select'}
                    </option>
                    {mentors.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.email})
                        {m.github && ` - GitHub: ${m.github}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Room Number</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={alloc.roomNumber}
                    onChange={e => handleAllocationChange(i, e)}
                    required
                  />
                </div>
                {allocations.length > 1 && (
                  <button type="button" onClick={() => removeAllocation(i)}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addAllocation}>Add Another Allocation</button>
            <br />
            <button type="submit" disabled={loading || loadingMentors || mentors.length === 0}>
              {loading ? 'Submitting...' : (editBatchId ? 'Update Batch' : 'Submit Batch')}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {editBatchId && <button type="button" onClick={resetForm} style={{ marginLeft: 10 }}>Cancel Edit</button>}
          </form>
        </>
      )}

      <h2>Batches for Selected Hackathon</h2>
      {!selectedHackathon && <p>Please select a hackathon to view batches.</p>}
      {selectedHackathon && hackathonBatches.length === 0 && !editBatchId && (
        <p>No batches submitted for this hackathon yet. You can create one above.</p>
      )}
      {hackathonBatches.map(batch => (
        <div key={batch._id} style={{ border: '1px solid #999', margin: 10, padding: 10 }}>
          <div><strong>Status:</strong> {batch.status}</div>
          <div><strong>Submitted By:</strong> {batch.submittedBy}</div>
          <div><strong>Submitted At:</strong> {new Date(batch.createdAt).toLocaleString()}</div>
          <div><strong>Rejection Reason:</strong> {batch.rejectionReason || '-'}</div>
          <h4>Allocations:</h4>
          <ul>
            {batch.allocations.map((alloc, i) => (
              <li key={i}>
                Hackathon: {alloc.hackathon?.hackathonname || 'N/A'} | 
                Campus: {alloc.campusName} | 
                Branch: {alloc.branch} | 
                Mentor: {alloc.mentor?.name || 'N/A'} | 
                Room: {alloc.roomNumber}
              </li>
            ))}
          </ul>
          {batch.submittedBy === submittedBy && !editBatchId ? (
            <>
              <button onClick={() => handleEdit(batch)}>Edit</button>
              <button onClick={() => handleDelete(batch._id)} style={{ marginLeft: 8, color: 'red' }}>Delete</button>
            </>
          ) : (
            <em>You can only view this batch.</em>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserRoomAllocationBatch;