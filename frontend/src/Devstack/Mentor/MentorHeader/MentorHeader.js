import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FaAngleDown } from 'react-icons/fa';
import './MentorHeader.css';
import userheader from '../../../assests/headerlogo.png';
import notification from '../../../assests/notificationicon.png';
import chart from '../../../assests/messageicon.png';
import profile from '../../../assests/userprofileicon.png';
import config from '../../../config';

let socket;

const UserNavbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const fetchInitialNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const response = await fetch(`${config.backendUrl}/hacknotifications/notification`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    socket = io(`${config.backendUrl}`, {
      auth: { token },
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    fetchInitialNotifications();

    socket.on('newHackNotification', (newNotification) => {
      const notificationWithReadStatus = {
        ...newNotification,
        read: false
      };
      setNotifications((prev) => [notificationWithReadStatus, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('hackNotificationRead', ({ hackNotificationId }) => {
      setNotifications((prev) => 
        prev.map(n => n._id === hackNotificationId ? { ...n, read: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    return () => {
      if (socket) {
        socket.off();
        socket.disconnect();
      }
    };
  }, []);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (dropdownRef.current && !dropdownRef.current.contains(event.target)) &&
        (profileRef.current && !profileRef.current.contains(event.target))
      ) {
        setDropdownOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/hacknotifications/markAsRead`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/hackmentor/notifications');
    setDropdownOpen(false);
  };

  const getNotificationIcon = (notification) => {
    const title = notification.title?.toLowerCase() || '';
    if (title.includes('team') || title.includes('registration')) return <span>👥</span>;
    if (title.includes('mentor') || title.includes('assignment') || title.includes('reminder') || title.includes('deadline')) return <span>⚠️</span>;
    if (title.includes('submission') || title.includes('project')) return <span>✅</span>;
    if (title.includes('hackathon') || title.includes('created')) return <span>ℹ️</span>;
    return <span>🔔</span>;
  };

  return (
    <nav className="user-navbar">
      {/* Hamburger for mobile */}
      <div className="hamburger-menu" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
        <span></span><span></span><span></span><span></span>
      </div>

      {/* Left Logo & Links */}
      <div className="user-header-navbar-left">
        <div className="user-header-logo">
          <img src={userheader} alt="Logo" />
        </div>
        <ul className="nav-links">
          <li><a href="/user">Home</a></li>
          <li><a href="/hackmentor/resource">Resource</a></li>
          <li><a>Certificates</a></li>
          <li><a href="/hackmentor/hackathons">Hackathons</a></li>
          <li><a>Winners</a></li>
        </ul>
      </div>

      {/* Right Icons */}
      <div className="nav-icons">
        {/* Notifications */}
        <div className="notification-icon-wrapper" onClick={() => setDropdownOpen(!isDropdownOpen)} ref={dropdownRef}>
          <div className="icon">
            <img src={notification} alt="Notification Icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          {isDropdownOpen && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <span>{unreadCount} unread</span>
                <div className="actions">
                  <button onClick={markAllAsRead}>Mark all as read</button>
                  <button onClick={handleViewAll}>View all</button>
                </div>
              </div>
              <div className="dropdown-list">
                {notifications.length === 0 ? (
                  <p className="no-notifications">No notifications yet</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n._id} className={`dropdown-item ${n.read ? 'read' : 'unread'}`}>
                      <div className="notif-icon">{getNotificationIcon(n)}</div>
                      <div className="notif-content">
                        <h4>{n.title}</h4>
                        <p>{n.description}</p>
                        <small>
                          {new Date(n.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 10 && (
                <div className="dropdown-footer">
                  <button onClick={handleViewAll}>View all notifications</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <a href="/user/chat" className="icon">
          <img src={chart} alt="Chat Icon" />
        </a>

        {/* Profile Dropdown */}
        <div className="profile-icon" ref={profileRef}>
          <img
            src={profile}
            alt="Profile Icon"
            onClick={() => setProfileOpen(!isProfileOpen)}
          />
          {isProfileOpen && (
            <div className="profile-dropdown">
              <ul>
                <li><a href="/profile">Profile</a></li>
                <li><a href="/hackmentor/hackteam">My Teams</a></li>
                <li><a href="/problem-statements">Problem Statements</a></li>
                <li><a href="/hackmentor/schedule">Schedule</a></li>
                <li><a href="/hackmentor/problemstatements">ProblemStatements</a></li>
                <li><a href="/hackmentor/hackathons">Hackathon Request</a></li>
                <li><a href="/evaluation">Evaluation</a></li>
                <li><a href="/hackmentor/roomallocation">Room Allocation</a></li>
                <li><a href="hackmentor/teamprogress">Teams Progress</a></li>
                <li><a href="/hackmentor/hacksubmission">Hackathon Submission</a></li>
                <li><a href="/hackmentor/uploadresource">Upload Resource</a></li>
                <li><a href="/mentor">Switch to Dev Orbit</a></li>
                <li><a href="/login">Logout</a></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar for small screens */}
      {isMobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-sidebar" onClick={e => e.stopPropagation()}>
            <button className="close-sidebar-btn" onClick={() => setMobileMenuOpen(false)}>&times;</button>
            <ul className="mobile-sidebar-menu">
              <li><a href="/user" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
              <li><a href="/hackmentor/resource" onClick={() => setMobileMenuOpen(false)}>Resource</a></li>
              <li><a onClick={() => setMobileMenuOpen(false)}>Certificates</a></li>
              <li><a href="/hackmentor/hackathons" onClick={() => setMobileMenuOpen(false)}>Hackathons</a></li>
              <li><a onClick={() => setMobileMenuOpen(false)}>Winners</a></li>
              <li><a href="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</a></li>
              <li><a href="/problem-statements" onClick={() => setMobileMenuOpen(false)}>Problem Statements</a></li>
              <li><a href="/hackmentor/schedule" onClick={() => setMobileMenuOpen(false)}>Schedule</a></li>
              <li><a href="/evaluation" onClick={() => setMobileMenuOpen(false)}>Evaluation</a></li>
              <li><a href="/hackmentor/roomallocation" onClick={() => setMobileMenuOpen(false)}>Room Allocation</a></li>
              <li><a href="/teams-progress" onClick={() => setMobileMenuOpen(false)}>Teams Progress</a></li>
              <li><a href="/hackmentor/uploadresource" onClick={() => setMobileMenuOpen(false)}>Upload Resource</a></li>
              <li><a href="/mentor" onClick={() => setMobileMenuOpen(false)}>Switch to Dev Orbit</a></li>
              <li><a href="/logout" onClick={() => setMobileMenuOpen(false)} className="logout">Logout</a></li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;
