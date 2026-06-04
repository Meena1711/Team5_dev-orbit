import React, { useState, useEffect, useRef } from 'react';
import { Layout} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  LockOutlined,         
  CheckCircleOutlined,     
  CloudUploadOutlined,       
  PlusOutlined,              
  HomeOutlined,              
  UserOutlined,            
  SwapOutlined,              
  ApartmentOutlined,         
  CalendarOutlined,         
  PieChartOutlined,         
  StarOutlined,              
  BellOutlined,              
  MenuOutlined, 
  LogoutOutlined,         
} from '@ant-design/icons';
import './header.css';

const { Header } = Layout;

const AdminHeader = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { key: '/', icon: <LockOutlined />, label: 'Full Access' },
    // { key: '/admin/calendar', icon: <CalendarOutlined />, label: 'Calendar' },
    {
      key: '/',
      icon: <CheckCircleOutlined/>,
      label: 'Approvals',
    },
    { key: '/hackadmin/csv', icon: <CloudUploadOutlined />, label: 'Bulk Student Registation' },
    { key: '/hackadmin/create', icon: <PlusOutlined />, label: 'Create Hackathon' },
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Winners',
    },
    { key: '/hackadmin/register-coordinator', icon: <UserOutlined />, label: 'Assign Coordinators' },
     { key: '/hackadmin/schedule', icon: <UserOutlined />, label: 'schedule' },
    {
      key: '/hackadmin/roomallocation',
      icon: <ApartmentOutlined/>,
      label: 'Room Allocation',
    },
    { key: '/hackadmin/schedule', icon: <CalendarOutlined />, label: 'Schedule' },
    { key: '/', icon: <PieChartOutlined />, label: 'Visual Representation' },
    // { key: '/', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/hackadmin/hackfeedback', icon: <StarOutlined />, label: 'Mentor Feedback' },
    {
      key: '/hackadmin/notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
    }, // Changed icon
    {
      key: '/hackadmin/mentorapprovals',
      icon: <CheckCircleOutlined />,
      label: 'Mentor Hackathon Requests',
    },
        {
      key: '/hackadmin/resourceapprovals',
      icon: <CheckCircleOutlined />,
      label: 'Resource Approval',
    }, 
    {
      key: '/admin',
      icon: <SwapOutlined />,
      label: 'Switch To Dev-Orbit',
    }, // Changed icon
    {
      key: '/adminlogin',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
    // {
    //   key: '/admin/mentor-feedbacks',
    //   icon: <StarOutlined />,
    //   label: 'Mentor Feedbacks',
    // },
    // {
    //   key: '/admin/resource-approval',
    //   icon: <CheckCircleOutlined />,
    //   label: 'Resource Approval',
    // }, // Add this line
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMenuVisible(false);
  };

  return (
    <Header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-logo">DevStack Admin</div>
        <div className="admin-header-menu-container" ref={menuRef}>
          <MenuOutlined
            className="admin-header-menu-trigger"
            onClick={() => setMenuVisible(!menuVisible)}
          />
          {menuVisible && (
            <div className="admin-header-menu-dropdown">
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className="admin-header-menu-item"
                  onClick={() => handleMenuClick({ key: item.key })}
                >
                  <span className="admin-header-menu-icon">{item.icon}</span>
                  <span className="admin-header-menu-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Header>
  );
};

export default AdminHeader;
