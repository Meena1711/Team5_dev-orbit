import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FaAngleDown } from 'react-icons/fa';
import './StudentHeader.css';
// removed Devstack logo import (logo no longer shown in student header)
import notification from '../../../assests/notificationicon.png';
import DevstackLogo from '../../../assests/heroheadericon.png';
import chart from '../../../assests/messageicon.png';
import profile from '../../../assests/userprofileicon.png';
import config from '../../../config';
import { FiAlignJustify } from "react-icons/fi";

let socket;

const UserNavbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [isAssignmentsDropdownOpen, setAssignmentsDropdownOpen] = useState(false);
  const [isMobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [isMobileAssignmentsOpen, setMobileAssignmentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  

  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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
    if (!token) {
      console.error('No token available for socket connection');
      return;
    }
    socket = io(`${config.backendUrl}`, {
      auth: { token },
      forceNew: true,
      transports: ['websocket', 'polling'],
    });

    fetchInitialNotifications();

    socket.on('newHackNotification', (newNotification) => {
      const notificationWithReadStatus = { ...newNotification, read: false };
      setNotifications((prev) => [notificationWithReadStatus, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('hackNotificationRead', ({ hackNotificationId }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === hackNotificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socket) {
        socket.off('newHackNotification');
        socket.off('hackNotificationRead');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('error');
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/hacknotifications/markAsRead`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
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
    navigate('/hackstudent/notifications');
    setDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  // Hamburger and dropdown toggles
  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const toggleResourcesDropdown = () => setResourcesDropdownOpen(!isResourcesDropdownOpen);
  const toggleAssignmentsDropdown = () => setAssignmentsDropdownOpen(!isAssignmentsDropdownOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileResourcesDropdown = () => setMobileResourcesOpen(!isMobileResourcesOpen);
  const toggleMobileAssignmentsDropdown = () => setMobileAssignmentsOpen(!isMobileAssignmentsOpen);


  const getNotificationIcon = (notification) => {
    const title = notification.title?.toLowerCase() || '';
    if (title.includes('team') || title.includes('registration')) return <span className="team-icon">👥</span>;
    if (title.includes('mentor') || title.includes('assignment') || title.includes('reminder') || title.includes('deadline')) return <span className="warning-icon">⚠️</span>;
    if (title.includes('submission') || title.includes('project')) return <span className="success-icon">✅</span>;
    if (title.includes('hackathon') || title.includes('created')) return <span className="info-icon">ℹ️</span>;
    return <span>🔔</span>;
  };

  return (
    <nav className="user-navbar">
      <div
        className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
        id="user-nav-icon3"
      >
        <span></span><span></span><span></span><span></span>
      </div>

      <div className="user-header-navbar-left">
  <div className="user-header-logo">
    <button
      className="menu-button"
      aria-label="Toggle menu"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      <FiAlignJustify className="menu-icon" />
    </button>
    <img src={DevstackLogo} alt="Devstack" className="devstack-logo" />
    {/* Devstack logo removed as requested */}
  </div>

  {menuOpen && (
    <ul className="dropdown-menu">

      <li><a href="/hackstudent/team-formation">My Team</a></li>
      <li><a href="/hackstudent/hackathon">Hackathon</a></li>
      <li><a href="/hackstudent/schedule">Schedule</a></li>
      <li><a href="/hackstudent/roomallocation">Room allocation</a></li>
      <li><a href="/hackstudent/problemstatements">Problem Statements</a></li>
      <li><a href="/hackstudent/view-certificate">Certificate</a></li>
      <li><a href="/hackstudent/teamprogress">Team Progress</a></li>
      <li><a href="/hackstudent/feedback">Mentor Feedback</a></li>
      <li><a href="/user">Switch to Devorbit</a></li>
      <li onClick={handleLogout} className="logout">Logout</li>
    </ul>
  )}
  

        <ul className="nav-links">
          <li><a href="/hackstudent">Home</a></li>
          <li><a href='/hackstudent/resources'>Resources</a></li>
          {/* <li className="dropdown">
            <a onClick={toggleResourcesDropdown}>
              Resources <FaAngleDown className="down-arrow" />
            </a>
            <ul className={`user-dropdown-menu ${isResourcesDropdownOpen ? 'show' : ''}`}>
              <li><a href="/hackstudent/videos">Videos</a></li>
              <li><a href="/hackstudent/notes">Notes</a></li>
              <li><a href="/hackstudent/sources">Sources</a></li>
            </ul>
          </li> */}
          {/* <li className="dropdown">
            <a onClick={toggleAssignmentsDropdown}>
              Assignments <FaAngleDown className="down-arrow" />
            </a>
            <ul className={`user-dropdown-menu ${isAssignmentsDropdownOpen ? 'show' : ''}`}>
              <li><a href="/user/assignments">Quizzes</a></li>
              <li><a href="/user/tasks">Tasks</a></li>
            </ul>
          </li> */}
        </ul>
      </div>

      <div className="nav-icons">
        <div className="notification-icon-wrapper" onClick={toggleDropdown} ref={dropdownRef}>
          <div className="icon">
            <img src={notification} alt="Notification Icon" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
          {isDropdownOpen && (
            <div className="notification-dropdown" onClick={handleDropdownClick}>
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
                    <div
                      key={n._id}
                      className={`dropdown-item ${n.read ? 'read' : 'unread'}`}
                    >
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
                <div
                  style={{
                    padding: '12px 20px',
                    textAlign: 'center',
                    borderTop: '1px solid #f1f3f4',
                  }}
                >
                  <button
                    onClick={handleViewAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <a href="/hackstudent/chat" className="icon">
          <img src={chart} alt="Chat Icon" />
        </a>
<div
  className="profile-icon"
  onClick={() => navigate('/hackstudent/profile')}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/hackstudent/profile');
    }
  }}
  aria-label="Profile"
>
  <img src={profile} alt="Profile Icon" />
</div>

      </div>

      {/* Sidebar for small screens */}
      {isMobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={closeMobileMenu}>
          <div className="mobile-sidebar" onClick={e => e.stopPropagation()}>
            <button className="close-sidebar-btn" onClick={closeMobileMenu}>&times;</button>
            <ul className="mobile-sidebar-menu">
            
              <li><a href="/hackstudent" onClick={closeMobileMenu}>Home</a></li>
              <li><a href="/hackstudent/resources" onClick={closeMobileMenu}>Resources</a></li>
              <li><a href="/hackstudent/profile" onClick={closeMobileMenu}>Profile</a></li>
              <li><a href="/hackstudent/team-formation" onClick={closeMobileMenu}>My Team</a></li>
              <li><a href="/hackstudent/hackathon" onClick={closeMobileMenu}>Hackathon</a></li>
              <li><a href="/hackstudent/schedule" onClick={closeMobileMenu}>Schedule</a></li>
              <li><a href="/hackstudent/roomallocation" onClick={closeMobileMenu}>Room allocation</a></li>
              <li><a href="/hackstudent/problemstatements" onClick={closeMobileMenu}>Problem Statements</a></li>
              <li><a href="/hackstudent/view-certificate" onClick={closeMobileMenu}>Certificate</a></li>
              <li><a href="/hackstudent/teamprogress" onClick={closeMobileMenu}>Team Progress</a></li>
              <li><a href="/hackstudent/feedback" onClick={closeMobileMenu}>Mentor Feedback</a></li>
              <li><a href="/user" onClick={closeMobileMenu}>Switch to Devorbit</a></li>
              <li onClick={handleLogout} className="logout">Logout</li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;
