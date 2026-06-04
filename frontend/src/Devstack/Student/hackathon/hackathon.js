import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import config from "../../../config";
import "./hackathon.css";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const HackathonsByStatus = () => {
  const [hackathons, setHackathons] = useState([]);
  const [statusFilter, setStatusFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [registrationStatuses, setRegistrationStatuses] = useState({});
  const [posterImages, setPosterImages] = useState({}); // Store poster images separately
  const navigate = useNavigate();

  const [transactionId, setTransactionId] = useState("");
  const [upiUtrNumber, setUpiUtrNumber] = useState("");
  const [feeReceipt, setFeeReceipt] = useState(null);
  const [preview, setPreview] = useState("");
  const [registering, setRegistering] = useState(false);

  const [amount, setAmount] = useState("");
  const [upiUrl, setUpiUrl] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);

  const storeSelectedHackathonId = useCallback((hackathonId) => {
    localStorage.setItem("selectedHackathonId", hackathonId);
  }, []);

  const storeDefaultOngoingHackathonId = useCallback((hackathonsData, registrationStatusesData) => {
    const studentYear = localStorage.getItem("studentYear");
    const studentCollege = localStorage.getItem("studentColleage");
    
    if (!studentYear || !studentCollege) return;

    const ongoingApprovedHackathon = hackathonsData.find(hackathon => 
      hackathon.status === "ongoing" && 
      hackathon.year === studentYear &&
      hackathon.college === studentCollege &&
      registrationStatusesData[hackathon._id] === "approved"
    );

    if (ongoingApprovedHackathon) {
      storeSelectedHackathonId(ongoingApprovedHackathon._id);
    }
  }, [storeSelectedHackathonId]);

  // Fetch hackathons WITHOUT poster images first
  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      setError("");
      
      try {
        const studentYear = localStorage.getItem("studentYear");
        const studentCollege = localStorage.getItem("studentColleage");
        
        const params = {};
        if (studentYear) params.year = studentYear;
        if (studentCollege) params.college = studentCollege;

        const response = await axios.get(`${config.backendUrl}/hackreg/hackathons/all`, {
          params,
          // timeout: 10000
        });

        if (response.data.success) {
          // Store hackathons without poster data
          const hackathonsData = response.data.hackathons.map(h => ({
            ...h,
            hackathonposter: null // Don't include poster initially
          }));
          
          setHackathons(hackathonsData);
          
          // Fetch registration statuses in parallel
          const statusesData = await checkRegistrationStatuses(hackathonsData);
          storeDefaultOngoingHackathonId(hackathonsData, statusesData);
          
          // Lazy load poster images after main data is displayed
          loadPosterImages(response.data.hackathons);
        }
      } catch (err) {
        console.error("Error fetching hackathons:", err);
        setError("Failed to load hackathons. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  // Lazy load poster images one by one
  const loadPosterImages = useCallback((hackathonsData) => {
    hackathonsData.forEach((hackathon, index) => {
      if (hackathon.hackathonposter) {
        // Stagger image loading to avoid overwhelming the browser
        setTimeout(() => {
          const imageUrl = getImageUrl(hackathon.hackathonposter);
          if (imageUrl) {
            setPosterImages(prev => ({
              ...prev,
              [hackathon._id]: imageUrl
            }));
          }
        }, index * 100); // Load each image 100ms apart
      }
    });
  }, []);

  const checkRegistrationStatuses = useCallback(async (hackathonsData) => {
    const studentData = localStorage.getItem("student");
    if (!studentData || !hackathonsData.length) return {};

    let studentId;
    try {
      const parsedStudentData = JSON.parse(studentData);
      studentId = parsedStudentData._id || parsedStudentData.id;
    } catch (error) {
      studentId = studentData;
    }

    if (!studentId) return {};

    try {
      const statusPromises = hackathonsData.map(async (hackathon) => {
        try {
          const response = await axios.get(
            `${config.backendUrl}/hackreg/hackathon/${hackathon._id}/student/${studentId}/status`,
            { timeout: 5000 }
          );
          return { hackathonId: hackathon._id, status: response.data.status };
        } catch (error) {
          return { hackathonId: hackathon._id, status: null };
        }
      });

      const results = await Promise.allSettled(statusPromises);
      const statusMap = {};
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { hackathonId, status } = result.value;
          statusMap[hackathonId] = status;
        }
      });
      
      setRegistrationStatuses(statusMap);
      return statusMap;
    } catch (error) {
      console.error("Error fetching registration statuses:", error);
      return {};
    }
  }, []);

  const renderActionButton = useCallback((hackathon) => {
    if (hackathon.status === "completed") {
      return null;
    }

    const registrationStatus = registrationStatuses[hackathon._id];
    
    if (hackathon.status === "upcoming") {
      if (registrationStatus === "pending") {
        return (
          <button 
            className="status-btn pending-btn"
            // onClick={() => storeSelectedHackathonId(hackathon._id)}
          >
            Fee Verification Pending
          </button>
        );
      } else if (registrationStatus === "approved") {
        return (
          <button className="status-btn approved-btn" disabled>
            Registered - Event Starting Soon
          </button>
        );
      } else if (registrationStatus === "rejected") {
        return (
          <button className="status-btn rejected-btn" disabled>
            Registration Rejected
          </button>
        );
      } else {
        return (
          <button className="status-btn upcoming-btn" disabled>
            Registration Not Available
          </button>
        );
      }
    }

    if (hackathon.status === "ongoing") {
      if (registrationStatus === "pending") {
        return (
          <button 
            className="status-btn pending-btn"
            // onClick={() => storeSelectedHackathonId(hackathon._id)}
          >
            Fee Verification Pending
          </button>
        );
      } else if (registrationStatus === "approved") {
        return (
          <button 
            className="status-btn approved-btn"
            onClick={() => {
              // storeSelectedHackathonId(hackathon._id);
              alert(`Redirecting to create team for ${hackathon.hackathonname}`);
              navigate("/hackstudent/team-formation");
            }}
          >
            Create a Team
          </button>
        );
      } else if (registrationStatus === "rejected") {
        return (
          <button className="status-btn rejected-btn" disabled>
            Registration Rejected
          </button>
        );
      } else {
        return (
          <button 
            className="register-btn"
            onClick={() => {
              // storeSelectedHackathonId(hackathon._id);
              openRegistrationModal(hackathon);
            }}
          >
            Register Now
          </button>
        );
      }
    }

    return null;
  }, [registrationStatuses, storeSelectedHackathonId]);

  const filteredHackathons = hackathons.filter(
    (hackathon) => hackathon.status === statusFilter
  );

  const getImageUrl = useCallback((imageData) => {
    if (!imageData || !imageData.data) return null;
    
    if (typeof imageData.data === 'string') {
      return `data:${imageData.contentType};base64,${imageData.data}`;
    }
    
    if (imageData.data.type === 'Buffer' && imageData.data.data) {
      const base64String = btoa(
        new Uint8Array(imageData.data.data).reduce(
          (data, byte) => data + String.fromCharCode(byte), ''
        )
      );
      return `data:${imageData.contentType};base64,${base64String}`;
    }
    
    if (imageData.data instanceof ArrayBuffer) {
      const base64String = btoa(
        new Uint8Array(imageData.data).reduce(
          (data, byte) => data + String.fromCharCode(byte), ''
        )
      );
      return `data:${imageData.contentType};base64,${base64String}`;
    }
    
    return null;
  }, []);

  const openRegistrationModal = (hackathon) => {
    const studentData = localStorage.getItem("student");
    if (!studentData) {
      alert("Please login first to register for hackathons");
      navigate("/login");
      return;
    }

    setSelectedHackathon(hackathon);
    setShowRegistrationModal(true);
    setTransactionId("");
    setUpiUtrNumber("");
    setFeeReceipt(null);
    setPreview("");
    setAmount(hackathon.entryfee || "");
    setUpiUrl("");
    setShowQRCode(false);
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setSelectedHackathon(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Calculate file size in MB
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    if (file.size > 10 * 1024 * 1024) {
      alert(`File size is ${fileSizeMB}MB. Please upload an image smaller than 5MB.`);
      e.target.value = ''; // Clear the file input
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file");
      e.target.value = '';
      return;
    }
    
    setFeeReceipt(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      setFeeReceipt(null);
      setPreview("");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateUPILink = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    try {
      const response = await axios.post(
        `${config.backendUrl}/hackreg/upi/generate`,
        { amount: Number(amount) },
        { timeout: 5000 }
      );
      setUpiUrl(response.data.upiUrl);
      setShowQRCode(true);
    } catch (err) {
      setShowQRCode(false);
      setUpiUrl("");
      alert("Failed to generate UPI payment link");
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    const studentData = localStorage.getItem("student");
    if (!studentData) {
      alert("Please login first to register");
      navigate("/login");
      return;
    }

    let studentId;
    try {
      const parsedStudentData = JSON.parse(studentData);
      studentId = parsedStudentData._id || parsedStudentData.id;
    } catch (error) {
      studentId = studentData;
    }

    if (!studentId || !transactionId || !upiUtrNumber || !feeReceipt) {
      alert("Please fill all required fields");
      return;
    }

    setRegistering(true);

    try {
      const fileReader = new FileReader();
      fileReader.onloadend = async () => {
        const base64Data = fileReader.result.split(',')[1];

        const registrationData = {
          hackathonId: selectedHackathon._id,
          students: [{
            studentId: studentId,
            transactionId: transactionId,
            upiUtrNumber: upiUtrNumber,
            feeReceipt: {
              data: base64Data,
              contentType: feeReceipt.type,
              filename: feeReceipt.name
            }
          }]
        };

        try {
          await axios.post(
            `${config.backendUrl}/hackreg/register`,
            registrationData,
            {
              headers: { "Content-Type": "application/json" },
              // timeout: 30000
            }
          );
          alert("Registration successful ✅");
          closeRegistrationModal();
          
          const statusesData = await checkRegistrationStatuses(hackathons);
          storeDefaultOngoingHackathonId(hackathons, statusesData);
        } catch (err) {
          console.error(err);
          alert(err.response?.data?.error || "Error while registering ❌");
        } finally {
          setRegistering(false);
        }
      };
      fileReader.readAsDataURL(feeReceipt);
    } catch (err) {
      console.error(err);
      alert("Error while registering ❌");
      setRegistering(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="hackathons-container">
      <div className="hackathons-header">
        <div className="header-content">
          <h1 className="page-title">
            Hackathons - {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </h1>
        </div>
      </div>

      <div className="status-filter">
        <button
          className={`filter-btn ${statusFilter === "upcoming" ? "active" : ""}`}
          onClick={() => setStatusFilter("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`filter-btn ${statusFilter === "ongoing" ? "active" : ""}`}
          onClick={() => setStatusFilter("ongoing")}
        >
          Ongoing
        </button>
        <button
          className={`filter-btn ${statusFilter === "completed" ? "active" : ""}`}
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </button>
      </div>

      {loading && <div className="loading">Loading hackathons...</div>}
      {error && (
        <div className="error">
          {error}
          <button onClick={handleRetry} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      )}

      {!loading && filteredHackathons.length === 0 && (
        <div className="no-hackathons">
          <p>No {statusFilter} hackathons found for your college and year.</p>
        </div>
      )}

      <div className="hackathons-grid">
        {filteredHackathons.map((hackathon) => (
          <div key={hackathon._id} className="hackathon-card">
            <div className="hackathon-content">
              <div className="hackathon-details">
                <h2 className="hackathon-title">{hackathon.hackathonname}</h2>
                <p className="hackathon-info">College: {hackathon.college}</p>
                <p className="hackathon-info">Year: {hackathon.year}</p>
                <p className="hackathon-info">Technology: {hackathon.technology}</p>
                <p className="hackathon-info">Entry Fee: ₹{hackathon.entryfee}</p>
                <p className="hackathon-info">First Prize: ₹{hackathon.firstprize}</p>
                <p className="hackathon-info">Second Prize: ₹{hackathon.secondprize}</p>
                <p className="hackathon-info">Third Prize: ₹{hackathon.thirdprize}</p>
                <p className="hackathon-info">Description: {hackathon.description}</p>

                <div className="date-info">
                  <p>Start: {new Date(hackathon.startdate).toLocaleDateString()}</p>
                  <p>End: {new Date(hackathon.enddate).toLocaleDateString()}</p>
                </div>

                <div className="date-info">
                  <p>Registration: {new Date(hackathon.regstart).toLocaleDateString()} - {new Date(hackathon.regend).toLocaleDateString()}</p>
                </div>

                <p className="hackathon-info">Team Size: {hackathon.minteam}-{hackathon.maxteam}</p>
                <p className="hackathon-info">Location: {hackathon.location}</p>

                {hackathon.virtualeventlink && (
                  <div className="virtual-link">
                    <strong>Virtual Link:</strong>
                    <a href={hackathon.virtualeventlink} target="_blank" rel="noopener noreferrer">
                      Join Event
                    </a>
                  </div>
                )}
                
                {hackathon.rules && hackathon.rules.length > 0 && (
                  <div className="rules-section">
                    <strong>Rules:</strong>
                    <ul>
                      {hackathon.rules.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className="hackathon-status">Status: {hackathon.status}</p>
                
                {renderActionButton(hackathon)}
              </div>
            </div>

            {/* Lazy loaded poster image */}
            {posterImages[hackathon._id] && (
              <div className="hackathon-poster">
                <img 
                  src={posterImages[hackathon._id]}
                  alt={`${hackathon.hackathonname} poster`}
                  loading="lazy"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            {!posterImages[hackathon._id] && (
              <div className="hackathon-poster" style={{ 
                minHeight: '200px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f0f0f0',
                borderRadius: '8px'
              }}>
                <span style={{ color: '#999' }}>Loading poster...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showRegistrationModal && (
        <div className="modal-overlay" onClick={closeRegistrationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register for {selectedHackathon?.hackathonname}</h2>
              <button className="close-btn" onClick={closeRegistrationModal}>×</button>
            </div>
            <form onSubmit={handleRegistrationSubmit}>
              <div className="form-group">
                <label>Transaction ID *</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter Transaction ID"
                  required
                />
              </div>
              <div className="form-group">
                <label>UPI UTR Reference Number *</label>
                <input
                  type="text"
                  value={upiUtrNumber}
                  onChange={(e) => setUpiUtrNumber(e.target.value)}
                  placeholder="Enter UPI UTR number"
                  required
                />
              </div>
              <div className="form-group">
                <label>Upload Fee Receipt * (Max 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {preview && (
                  <div className="image-preview">
                    <img 
                      src={preview} 
                      alt="Receipt preview" 
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginTop: '10px'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="registration-info">
                <p><strong>Entry Fee:</strong> ₹{selectedHackathon?.entryfee}</p>
                <p><strong>Registration Ends:</strong> {new Date(selectedHackathon?.regend).toLocaleDateString()}</p>
              </div>
              <div className="upi-payment-section" style={{ margin: "20px 0" }}>
                <button
                  type="button"
                  onClick={handleGenerateUPILink}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}
                >
                  Generate UPI Payment Link
                </button>
                {showQRCode && upiUrl && (
                  <div className="upi-info" style={{ textAlign: "center", marginTop: "10px" }}>
                    <p>Scan the QR code or use the UPI ID:</p>
                    <QRCodeCanvas value={upiUrl} size={180} />
                    <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>UPI Link: {upiUrl}</p>
                    <p>UPI ID: 9492113371@ybl</p>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeRegistrationModal}>Cancel</button>
                <button type="submit" disabled={registering}>
                  {registering ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HackathonsByStatus;