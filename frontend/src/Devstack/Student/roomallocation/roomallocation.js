import React, { useState, useEffect } from 'react';

const API_BASE = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') + '/roomallocation';

const RoomAllocationTable = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    fetchApprovedSchedule();
  }, []);

  const fetchApprovedSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const selectedHackathonId = localStorage.getItem('selectedHackathonId'); // You can make this dynamic
      
      const response = await fetch(`${API_BASE}/schedule/approved/${selectedHackathonId}`);
      const result = await response.json();

      if (!result.success) {
        if (result.message === 'No approved room allocations found for this hackathon') {
          setScheduleData({ allocations: [], hackathon: null, totalAllocations: 0 });
          return;
        }
        throw new Error(result.message || 'Failed to fetch schedule');
      }

      setScheduleData(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching approved schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = () => {
    if (!scheduleData || !scheduleData.allocations) return { totalRooms: 0, uniqueMentors: 0, uniqueCampuses: 0 };
    
    const allocations = scheduleData.allocations;
    const uniqueMentors = new Set(allocations.map(a => a.mentor._id)).size;
    const uniqueCampuses = new Set(allocations.map(a => a.campusName)).size;
    
    return {
      totalRooms: allocations.length,
      uniqueMentors,
      uniqueCampuses
    };
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = scheduleData?.allocations?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((scheduleData?.allocations?.length || 0) / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading room allocations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Failed to Load Room Allocations</h3>
        <p>{error}</p>
        <button onClick={fetchApprovedSchedule} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (!scheduleData || scheduleData.allocations.length === 0) {
    return (
      <div className="no-data-container">
        <h3>No Room Allocations Found</h3>
        <p>There are currently no approved room allocations available.</p>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="room-allocation-container">
      <style jsx>{`
        .room-allocation-container {
          max-width: 1200px;
          margin: 0px auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f8fafc;
          min-height: 100vh;
          padding-top: 100px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #1e293b;
          font-size: 2.5rem;
          font-weight: 600;
          margin: 0;
        }

        .stats-container {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin: 20px 0 30px 0;
          flex-wrap: wrap;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
          border-radius: 12px;
          text-align: center;
          min-width: 150px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .stat-card p {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .table-wrapper {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .allocation-table {
          width: 100%;
          border-collapse: collapse;
        }

        .allocation-table thead {
          background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
          color: white;
        }

        .allocation-table th {
          padding: 18px 15px;
          text-align: left;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }

        .allocation-table th:last-child {
          border-right: none;
        }

        .allocation-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background-color 0.2s ease;
        }

        .allocation-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .allocation-table tbody tr:nth-child(even) {
          background-color: #f1f5f9;
        }

        .allocation-table tbody tr:nth-child(even):hover {
          background-color: #e2e8f0;
        }

        .allocation-table td {
          padding: 18px 15px;
          font-size: 0.95rem;
          color: #334155;
          border-right: 1px solid #e2e8f0;
        }

        .allocation-table td:last-child {
          border-right: none;
        }

        .sno-cell {
          font-weight: 600;
          color: #475569;
          text-align: center;
          width: 80px;
        }

        .room-cell {
          font-weight: 600;
          color: #1e40af;
          font-family: 'Courier New', monospace;
        }

        .mentor-cell {
          font-weight: 500;
          color: #059669;
        }

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 0 10px;
        }

        .entries-info {
          color: #64748b;
          font-size: 0.9rem;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pagination-btn {
          padding: 10px 15px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .loading-container, .error-container, .no-data-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .spinner {
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-btn {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 10px;
        }

        .retry-btn:hover {
          background: #2563eb;
        }

        @media (max-width: 768px) {
          .room-allocation-container {
            padding: 10px;
          }
          
          .header h1 {
            font-size: 2rem;
          }
          
          .stats-container {
            gap: 20px;
          }
          
          .stat-card {
            padding: 15px 20px;
            min-width: 120px;
          }
          
          .allocation-table th,
          .allocation-table td {
            padding: 12px 8px;
            font-size: 0.85rem;
          }
          
          .pagination-container {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>

      <div className="header">
        <h1>Room Allocation</h1>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Rooms</h3>
          <p>{stats.totalRooms}</p>
        </div>
        <div className="stat-card">
          <h3>Unique Mentors</h3>
          <p>{stats.uniqueMentors}</p>
        </div>
        <div className="stat-card">
          <h3>Campuses</h3>
          <p>{stats.uniqueCampuses}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="allocation-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Campus</th>
              <th>Branch</th>
              <th>Mentor Name</th>
              <th>Room No</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((allocation, index) => (
              <tr key={allocation._id}>
                <td className="sno-cell">{indexOfFirstItem + index + 1}</td>
                <td>{allocation.campusName}</td>
                <td>{allocation.branch}</td>
                <td className="mentor-cell">{allocation.mentor.name}</td>
                <td className="room-cell">{allocation.roomNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="entries-info">
          Showing {currentItems.length} entries
        </div>
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {[...Array(Math.min(totalPages, 3))].map((_, index) => {
            let pageNum;
            if (totalPages <= 3) {
              pageNum = index + 1;
            } else if (currentPage <= 2) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 1) {
              pageNum = totalPages - 2 + index;
            } else {
              pageNum = currentPage - 1 + index;
            }
            
            return (
              <button
                key={pageNum}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => paginate(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomAllocationTable;