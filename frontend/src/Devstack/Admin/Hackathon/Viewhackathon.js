import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tooltip,
  Empty,
  Segmented,
  Tag,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  GiftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import config from "../../../config";
import { useNavigate } from "react-router-dom";
import "./Viewhackathon.css";

const { Title } = Typography;

const ViewHackathonsPage = () => {
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [filter, setFilter] = useState("ongoing");
  const navigate = useNavigate();

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.backendUrl}/hackathon/all`);
      setHackathons(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch hackathons");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${config.backendUrl}/hackathon/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Hackathon deleted successfully!");
      fetchHackathons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete hackathon");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`/hackadmin/edithackathon/${id}`);
  };

  const getFilteredHackathons = () => hackathons.filter((hack) => hack.status === filter);

  useEffect(() => {
    fetchHackathons();
  }, []);

  const renderStatusTag = (status) => {
    if (status === "ongoing") return <Tag color="green">LIVE</Tag>;
    if (status === "upcoming") return <Tag color="blue">UPCOMING</Tag>;
    if (status === "completed") return <Tag color="red">COMPLETED</Tag>;
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

  // Extract card rendering for clarity
  const renderHackathonCard = (hack) => {
    const posterUrl = `${config.backendUrl}/hackathon/poster/${hack._id}`;
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
              <DollarOutlined /> Entry Fee: <b>{hack.entryfee || "Free"}</b>
            </p>
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
            {/* Show Registration End + Actions only if NOT completed */}
            {hack.status !== "completed" && (
              <>
                <p className="hackathon-regend">
                  Registration Ends: {formatDateTime(hack.regend)}
                </p>
                <div className="hackathon-actions">
                  <Tooltip title="Edit Hackathon">
                    <Button
                      icon={<EditOutlined />}
                      type="primary"
                      onClick={() => handleEdit(hack._id)}
                    />
                  </Tooltip>
                  <Tooltip title="Delete Hackathon">
                    <Popconfirm
                      title="Are you sure to delete this hackathon?"
                      onConfirm={() => handleDelete(hack._id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="primary"
                        icon={<DeleteOutlined />}
                        danger
                        loading={deletingId === hack._id}
                      />
                    </Popconfirm>
                  </Tooltip>
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
          <Title level={3}>Manage Hackathons</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/hackadmin/create")}
          >
            Publish Hackathon
          </Button>
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
    </div>
  );
};

export default ViewHackathonsPage;
