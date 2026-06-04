import React, { useState } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Github, Linkedin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import './coordinator.css';
import config from '../../../config';

const CoordinatorRegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    college: '',
    year: '',
    github: '',
    linkedin: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [errors, setErrors] = useState({});

  const colleges = ['KIET', 'KIET+', 'KIEW'];
  const years = ['first year', 'second year', 'third year', 'fourth year'];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    if (!formData.college) newErrors.college = 'College selection is required';
    if (!formData.year) newErrors.year = 'Year selection is required';
    if (!formData.github.trim()) newErrors.github = 'GitHub profile is required';
    if (!formData.linkedin.trim()) newErrors.linkedin = 'LinkedIn profile is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'error', content: 'Please fix the errors below.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      // Note: In a real application, you would get the token from your authentication system
      // For now, using a placeholder token retrieval method
      const token = getAuthToken(); // Replace with your actual token retrieval method
      
      const response = await fetch(`${config.backendUrl}/roles/admin/register-coordinator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          content: 'Coordinator registered successfully! Credentials have been sent via email.' 
        });
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          college: '',
          year: '',
          github: '',
          linkedin: ''
        });
        setErrors({});
      } else {
        setMessage({ type: 'error', content: data.error || 'Failed to register coordinator' });
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Placeholder function - replace with your actual token retrieval logic
  const getAuthToken = () => {
    // In a real application, you might get this from:
    // - Context API
    // - Redux store
    // - Session storage (if safe to do so)
    // - Cookie
    // - Authentication service
    return sessionStorage.getItem('token') || '';
  };

  return (
    <div className="coordinator-registration-container">
      <div className="form-wrapper">
        <div className="form-card">
          <div className="form-header">
            <h1 className="form-title">
              <User className="title-icon" />
              Register New Coordinator
            </h1>
            <p className="form-subtitle">
              Add a new coordinator to the platform. Credentials will be sent via email.
            </p>
          </div>

          <div className="form-content">
            {message.content && (
              <div className={`message ${message.type}`}>
                {message.type === 'success' ? (
                  <CheckCircle className="message-icon" />
                ) : (
                  <AlertCircle className="message-icon" />
                )}
                <span className="message-text">{message.content}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <User className="label-icon" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail className="label-icon" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone className="label-icon" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                  {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Building className="label-icon" />
                    College
                  </label>
                  <select
                    name="college"
                    value={formData.college}
                    onChange={handleInputChange}
                    className={`form-select ${errors.college ? 'error' : ''}`}
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                  {errors.college && <p className="error-text">{errors.college}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <GraduationCap className="label-icon" />
                    Academic Year
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className={`form-select ${errors.year ? 'error' : ''}`}
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year.charAt(0).toUpperCase() + year.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.year && <p className="error-text">{errors.year}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Github className="label-icon" />
                    GitHub Profile
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    className={`form-input ${errors.github ? 'error' : ''}`}
                    placeholder="Enter GitHub profile URL"
                  />
                  {errors.github && <p className="error-text">{errors.github}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Linkedin className="label-icon" />
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className={`form-input ${errors.linkedin ? 'error' : ''}`}
                    placeholder="Enter LinkedIn profile URL"
                  />
                  {errors.linkedin && <p className="error-text">{errors.linkedin}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <Send className="button-icon" />
                    Register Coordinator
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorRegistrationForm;