import React, { useState, useEffect } from 'react';
import './studentschedule.css';
import config from '../../../config';

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [hackathonName, setHackathonName] = useState('');

  // Fetch schedules from API
  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const selectedHackathonId = localStorage.getItem("selectedHackathonId");
      
      if (!selectedHackathonId) {
        setError('No hackathon selected');
        setLoading(false);
        return;
      }

      // Fetch only approved schedules for the specific hackathon
      const response = await fetch(`${config.backendUrl}/schedule/approved/${selectedHackathonId}`);
      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.data);
        if (data.data.length > 0) {
          setSelectedSchedule(data.data[0]); // Set first schedule as default
          console.log(data);
          setHackathonName(data.data[0].hackathon?.hackathonname || 'Unknown Hackathon');
        } else {
          // If no schedules found, try to get hackathon name
          fetchHackathonName(selectedHackathonId);
        }
      } else {
        setError('Failed to fetch schedules');
      }
    } catch (err) {
      setError('Error fetching schedules: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hackathon name when no schedules are available
  const fetchHackathonName = async (hackathonId) => {
    try {
      const response = await fetch(`${config.backendUrl}/hackathon/${hackathonId}`);
      const data = await response.json();
      if (data) {
        setHackathonName(data.hackathonname || 'Unknown Hackathon');
      } else {
        setHackathonName('Unknown Hackathon');
      }
    } catch (err) {
      console.error('Error fetching hackathon name:', err);
      setHackathonName('Unknown Hackathon');
    }
  };

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
  };

  if (loading) {
    return (
      <div className="schedule-container">
        <div className="loading">Loading schedules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="schedule-container">
        <div className="no-schedules">
          <h3>No Schedule Available</h3>
          <p>No approved schedule found for <strong>{hackathonName}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <h2 className="schedule-main-header">Approved Hackathon Schedules</h2>
      
      {/* Schedule Selector - only show if multiple schedules exist */}
      {schedules.length > 1 && (
        <div className="schedule-selector">
          <h3>Select Schedule:</h3>
          <select 
            value={selectedSchedule?._id || ''} 
            onChange={(e) => {
              const selected = schedules.find(s => s._id === e.target.value);
              handleScheduleSelect(selected);
            }}
            className="schedule-dropdown"
          >
            {schedules.map((schedule) => (
              <option key={schedule._id} value={schedule._id}>
                {schedule.hackathon?.hackathonname} - {schedule.hackathonYear}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Schedule Display */}
      {selectedSchedule && (
        <div className="schedule-wrapper">
          <div className="schedule-header">
            <h2>Schedule</h2>
            <div className="schedule-info">
              <span className="hackathon-name">
                {selectedSchedule.hackathon?.hackathonname}
              </span>
              <span className="hackathon-year">
                Year: {selectedSchedule.hackathonYear}
              </span>
            </div>
          </div>

          <div className="schedule-table-container">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="time-header">Time</th>
                  {selectedSchedule.days?.map((day, index) => (
                    <th key={index} className="day-header">
                      {day.day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generateTimeSlots(selectedSchedule.days).map((timeSlot, timeIndex) => (
                  <tr key={timeIndex}>
                    <td className="time-cell">{timeSlot.time}</td>
                    {selectedSchedule.days?.map((day, dayIndex) => (
                      <td key={dayIndex} className="session-cell">
                        {getSessionForTime(day.sessions, timeSlot.time)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to generate all unique time slots
const generateTimeSlots = (days) => {
  const allTimes = new Set();
  
  days?.forEach(day => {
    day.sessions?.forEach(session => {
      allTimes.add(session.time);
    });
  });
  
  return Array.from(allTimes)
    .sort((a, b) => {
      // Sort times chronologically
      const timeA = convertTimeToMinutes(a);
      const timeB = convertTimeToMinutes(b);
      return timeA - timeB;
    })
    .map(time => ({ time }));
};

// Helper function to convert time string to minutes for sorting
const convertTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const parts = timeStr.split(' - ')[0]; // Take start time
  const [time, period] = parts.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + (minutes || 0);
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  
  return totalMinutes;
};

// Helper function to get session for specific time
const getSessionForTime = (sessions, time) => {
  const session = sessions?.find(s => s.time === time);
  return session ? session.session : '';
};

export default Schedule;