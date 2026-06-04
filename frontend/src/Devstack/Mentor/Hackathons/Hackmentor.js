import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Empty,
  Segmented,
  Tag,
  Modal,
  message,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  GiftOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import config from "../../../config";
import "../../Admin/Hackathon/Viewhackathon.css"; 

const { Title, Text } = Typography;

const MentorHackathonPage = () => {
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [filter, setFilter] = useState("ongoing");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [mentorRequests, setMentorRequests] = useState({}); // Track mentor requests by hackathon ID

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.backendUrl}/hackathon/all`);
      setHackathons(res.data || []);
      
      // Fetch mentor request status for each hackathon
      await fetchMentorRequestsStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch hackathons");
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorRequestsStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const mentorId = getUserIdFromToken();
      
      if (!mentorId) {
        console.log("No mentor ID found, skipping request status fetch");
        return;
      }

      console.log("Fetching mentor requests for:", mentorId);
      console.log("Using endpoint:", `${config.backendUrl}/hackathonrequests/mentor/${mentorId}`);

      // Fetch all mentor requests for this mentor using correct endpoint
      const res = await axios.get(
        `${config.backendUrl}/hackathonrequests/mentor/${mentorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log("Mentor requests response:", res.data);
      
      // Create a mapping of hackathon ID to request status
      const requestsStatus = {};
      
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(item => {
          if (item.hackathon && item.mentorRequest) {
            requestsStatus[item.hackathon._id] = item.mentorRequest.status;
          }
        });
      }
      
      console.log("Processed mentor requests:", requestsStatus);
      setMentorRequests(requestsStatus);
    } catch (error) {
      console.error("Error fetching mentor requests:", error);
      if (error.response?.status === 404) {
        console.error("Route not found - check if /hackmentor routes are properly mounted in your backend");
      }
      setMentorRequests({});
    }
  };

  // Helper function to extract user ID from token
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  const handleRequestMentor = (hackathon) => {
    setSelectedHackathon(hackathon);
    setShowConfirmModal(true);
  };

  const confirmMentorRequest = async () => {
    if (!selectedHackathon) return;

    setRequestingId(selectedHackathon._id);
    try {
      const token = localStorage.getItem("token");
      const mentorId = getUserIdFromToken();
      
      if (!mentorId) {
        toast.error("Please login to request mentoring");
        return;
      }

      console.log("Submitting mentor request:", {
        hackathonId: selectedHackathon._id,
        mentorId,
        endpoint: `${config.backendUrl}/hackathonrequests/${selectedHackathon._id}/request`
      });

      // Use correct endpoint for mentor request
      await axios.post(
        `${config.backendUrl}/hackathonrequests/${selectedHackathon._id}/request`,
        {
          mentorId: mentorId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Mentor request submitted successfully! Waiting for admin approval.");
      
      // Update local state to reflect the pending status
      setMentorRequests(prev => ({
        ...prev,
        [selectedHackathon._id]: 'pending'
      }));
      
      setShowConfirmModal(false);
      setSelectedHackathon(null);
    } catch (error) {
      console.error("Error submitting mentor request:", error);
      if (error.response?.status === 404) {
        console.error("Route not found - check if /hackmentor routes are properly mounted");
        toast.error("Server configuration error. Please contact support.");
      } else {
        toast.error(error.response?.data?.message || "Failed to submit mentor request");
      }
    } finally {
      setRequestingId(null);
    }
  };

  // Add a function to refresh mentor request status
  const refreshMentorRequestStatus = async () => {
    await fetchMentorRequestsStatus();
  };

  const getFilteredHackathons = () => hackathons.filter((hack) => hack.status === filter);

  useEffect(() => {
    fetchHackathons();
    
    // Set up polling to check for status updates every 30 seconds
    const interval = setInterval(() => {
      refreshMentorRequestStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const renderStatusTag = (status) => {
    if (status === "ongoing") return <Tag color="green">LIVE</Tag>;
    if (status === "upcoming") return <Tag color="blue">UPCOMING</Tag>;
    if (status === "completed") return <Tag color="red">COMPLETED</Tag>;
    return null;
  };

  const renderMentorRequestStatus = (hackathonId) => {
    const status = mentorRequests[hackathonId];
    if (status === 'pending') return <Tag color="orange">REQUEST PENDING</Tag>;
    if (status === 'approved') return <Tag color="green">MENTOR APPROVED</Tag>;
    if (status === 'rejected') return <Tag color="red">REQUEST REJECTED</Tag>;
    return null;
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr)
      .toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  };

  const canRequestMentor = (hackathon) => {
    const requestStatus = mentorRequests[hackathon._id];
    const isNotCompleted = hackathon.status !== "completed";
    const hasNoRequest = !requestStatus;
    
    return isNotCompleted && hasNoRequest;
  };

  const getRequestButtonText = (hackathon) => {
    const requestStatus = mentorRequests[hackathon._id];
    if (requestStatus === 'pending') return "Request Pending";
    if (requestStatus === 'approved') return "Approved";
    if (requestStatus === 'rejected') return "Request Rejected";
    return "Request to Mentor";
  };

  const getRequestButtonStyle = (hackathon) => {
    const requestStatus = mentorRequests[hackathon._id];
    if (requestStatus === 'approved') {
      return { 
        backgroundColor: '#52c41a', 
        borderColor: '#52c41a',
        color: 'white'
      };
    } else if (requestStatus === 'pending') {
      return { 
        backgroundColor: '#faad14', 
        borderColor: '#faad14',
        color: 'white'
      };
    } else if (requestStatus === 'rejected') {
      return { 
        backgroundColor: '#ff4d4f', 
        borderColor: '#ff4d4f',
        color: 'white'
      };
    }
    return undefined;
  };

  // Extract card rendering for clarity
  const renderHackathonCard = (hack) => {
    const posterUrl = `${config.backendUrl}/hackathon/poster/${hack._id}`;
    const requestStatus = mentorRequests[hack._id];
    
    return (
      <Col
        xs={24}
        sm={12}
        md={8}
        lg={6}
        key={hack._id}
        style={{ display: "flex" }}
      >
        <Card className="hackathon-card" hoverable>
          <div
            className="hackathon-poster"
            style={{
              backgroundImage: hack.hackathonposter ? `url(${posterUrl})` : undefined,
              backgroundColor: !hack.hackathonposter ? "#f5f5f5" : undefined,
            }}
            aria-label={hack.hackathonname}
          >
            {renderStatusTag(hack.status)}
            {renderMentorRequestStatus(hack._id)}
          </div>
          <div className="hackathon-content">
            <h2 className="hackathon-name">{hack.hackathonname}</h2>
            <p className="hackathon-date">
              <CalendarOutlined /> {formatDateTime(hack.startdate)} - {formatDateTime(hack.enddate)}
            </p>
            <p className="hackathon-location">
              <EnvironmentOutlined /> {hack.location}
            </p>
            <p className="hackathon-description">{hack.description}</p>
            <p className="hackathon-entry">
              <DollarOutlined /> Entry Fee: <b>{hack.entryfee === 0 ? "Free" : `₹${hack.entryfee}`}</b>
            </p>
            <div className="hackathon-info">
              <Text type="secondary">
                <TeamOutlined /> Team Size: {hack.minteam}-{hack.maxteam}
              </Text>
              <br />
              <Text type="secondary">
                <UserOutlined /> Technology: {hack.technology}
              </Text>
              <br />
              <Text type="secondary">
                College: {hack.college} | Year: {hack.year}
              </Text>
            </div>
            <div className="hackathon-prizes">
              <Tag icon={<GiftOutlined />} color="gold">
                1st: {hack.firstprize || "-"}
              </Tag>
              <Tag icon={<GiftOutlined />} color="silver">
                2nd: {hack.secondprize || "-"}
              </Tag>
              <Tag icon={<GiftOutlined />} color="#cd7f32">
                3rd: {hack.thirdprize || "-"}
              </Tag>
            </div>
            
            {/* Show Request Button and Registration End only if NOT completed */}
            {hack.status !== "completed" && (
              <>
                <p className="hackathon-regend">
                  Registration Ends: {formatDateTime(hack.regend)}
                </p>
                <div className="hackathon-actions">
                  <Button
                    type="primary"
                    block
                    disabled={!canRequestMentor(hack) || requestingId === hack._id}
                    loading={requestingId === hack._id}
                    onClick={() => handleRequestMentor(hack)}
                    style={getRequestButtonStyle(hack)}
                  >
                    {getRequestButtonText(hack)}
                  </Button>
                  
                  {/* Add refresh button for manual status check */}
                  {requestStatus && (
                    <Button
                      type="link"
                      size="small"
                      onClick={refreshMentorRequestStatus}
                      style={{ padding: 0, marginTop: 4, height: 'auto' }}
                    >
                      Refresh Status
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div>
      <ToastContainer />
      <div className="viewhackathons-container">
        <div className="page-header">
        </div>
        <div className="filter-container">
          <Segmented
            options={[
              { label: "Ongoing", value: "ongoing" },
              { label: "Upcoming", value: "upcoming" },
              { label: "Completed", value: "completed" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        {loading ? (
          <div className="loading">
            <Spin size="large" />
          </div>
        ) : getFilteredHackathons().length === 0 ? (
          <Empty
            description={
              <span>
                No hackathons available for{" "}
                <b>{filter.charAt(0).toUpperCase() + filter.slice(1)}</b>
              </span>
            }
            style={{ marginTop: 40 }}
          />
        ) : (
          <Row gutter={[16, 16]} justify="start">
            {getFilteredHackathons().map(renderHackathonCard)}
          </Row>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Mentor Request"
        open={showConfirmModal}
        onOk={confirmMentorRequest}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedHackathon(null);
        }}
        okText="Send Request"
        cancelText="Cancel"
        confirmLoading={requestingId === selectedHackathon?._id}
      >
        {selectedHackathon && (
          <div>
            <p>
              Are you sure you want to request to mentor <strong>{selectedHackathon.hackathonname}</strong>?
            </p>
            <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f0f2ff', borderRadius: 6 }}>
              <Text type="secondary">
                <strong>Event Details:</strong>
              </Text>
              <br />
              <Text type="secondary">
                📅 {formatDateTime(selectedHackathon.startdate)} - {formatDateTime(selectedHackathon.enddate)}
              </Text>
              <br />
              <Text type="secondary">
                💻 Technology: {selectedHackathon.technology}
              </Text>
              <br />
              <Text type="secondary">
                📍 Location: {selectedHackathon.location}
              </Text>
              <br />
              <Text type="secondary">
                🏫 College: {selectedHackathon.college} | Year: {selectedHackathon.year}
              </Text>
              <br />
              <Text type="secondary">
                👥 Team Size: {selectedHackathon.minteam}-{selectedHackathon.maxteam}
              </Text>
            </div>
            <p style={{ marginTop: 16 }}>
              Your request will be sent to the admin for approval. You'll be notified once it's reviewed.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MentorHackathonPage;