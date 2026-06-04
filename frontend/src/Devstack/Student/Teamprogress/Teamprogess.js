import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  message,
  Progress,
  Slider,
  Input,
  Alert,
  Tag,
  Statistic,
  Space,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  SaveOutlined,
  TeamOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  RocketOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TeamProgressPage = () => {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [team, setTeam] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [progress, setProgress] = useState(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [nextUpdateTime, setNextUpdateTime] = useState(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editPercentage, setEditPercentage] = useState(0);
  const [editDescription, setEditDescription] = useState("");

  const API_URL = "http://localhost:5000";
  const token = localStorage.getItem("token");
  
  const userIdRaw = localStorage.getItem("student") || localStorage.getItem("userId");
  const userId = userIdRaw ? userIdRaw.toString() : null;

  // Countdown timer
  useEffect(() => {
    if (remainingCooldown > 0) {
      const interval = setInterval(() => {
        setRemainingCooldown((prev) => {
          const newValue = prev - 1000;
          if (newValue <= 0) {
            setCanUpdate(isTeamLead);
            return 0;
          }
          return newValue;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [remainingCooldown, isTeamLead]);

  useEffect(() => {
    console.log("[FRONTEND] Team Progress Page mounted");
    console.log("[FRONTEND] Token:", token ? "Present" : "Missing");
    console.log("[FRONTEND] User ID:", userId);

    if (!userId) {
      message.error("User ID not found. Please log in again.");
      return;
    }

    fetchTeamAndProgress();
  }, []);

  const fetchTeamAndProgress = async () => {
    try {
      setLoading(true);
      console.log("[FRONTEND] Fetching team data...");
      // Prefer backend consolidated "myteam" progress endpoint first.
      // Attempt to use selectedHackathonId from localStorage (set at login) if available.
      const selectedHackathonId = localStorage.getItem('selectedHackathonId');
      if (selectedHackathonId) {
        try {
          const myTeamProgressRes = await fetch(
            `${API_URL}/teamprogress/teamprogress/myteam/${selectedHackathonId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (myTeamProgressRes.ok) {
            const myData = await myTeamProgressRes.json();
            console.log('[FRONTEND] My team progress (preferred myteam endpoint):', myData);

            // Use backend-provided team info where available
            if (myData.team) setTeam(myData.team);
            setProgress(myData.progress || (myData.progress === null ? null : myData));
            setCanUpdate(myData.canUpdate || false);
            setIsTeamLead(Boolean(myData.isTeamLead));
            setRemainingCooldown(myData.remainingCooldown || 0);
            setNextUpdateTime(myData.nextUpdateAvailable || null);

            setEditPercentage((myData.progress && myData.progress.percentage) || 0);
            setEditDescription((myData.progress && myData.progress.description) || "");

            // Fetch hackathon details if back-end returned hackathon id in progress
            if (myData.progress && myData.progress.hackathonId) {
              await fetchHackathonDetails(myData.progress.hackathonId);
            }

            setLoading(false);
            return; // done — avoid fallback calls that may overwrite isTeamLead
          }
          console.log('[FRONTEND] Preferred myteam progress endpoint returned', myTeamProgressRes.status);
        } catch (err) {
          console.error('[FRONTEND] Preferred myteam progress endpoint error, will fallback:', err);
        }
      }

      // If preferred endpoint not available or failed, fall back to previous flow
      // Fetch team (populated) to show rich team details in UI
      const teamRes = await fetch(`${API_URL}/hackteams/myteam`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (teamRes.status === 404) {
        message.info("You are not in any team yet");
        setLoading(false);
        return;
      }

      if (!teamRes.ok) {
        throw new Error("Failed to fetch team");
      }

      const teamData = await teamRes.json();
      console.log("[FRONTEND] Team data:", teamData);
      setTeam(teamData);

      // Fetch hackathon details
      if (teamData.hackathon) {
        await fetchHackathonDetails(teamData.hackathon);
      }

      // Try the team-specific progress endpoint; will set isTeamLead appropriately
      await fetchProgress(teamData.hackathon, teamData._id);

      setLoading(false);
    } catch (error) {
      console.error("[FRONTEND] Error:", error);
      message.error(error.message);
      setLoading(false);
    }
  };

  const fetchHackathonDetails = async (hackathonId) => {
    try {
      const res = await fetch(`${API_URL}/hackathon/${hackathonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHackathon(data);
      }
    } catch (error) {
      console.error("[FRONTEND] Error fetching hackathon:", error);
    }
  };

  const fetchProgress = async (hackathonId, teamId) => {
    try {
      console.log("[FRONTEND] Fetching progress...");
      
      const res = await fetch(
        `${API_URL}/teamprogress/teamprogress/${hackathonId}/${teamId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch progress");
      }

      const data = await res.json();
      console.log("[FRONTEND] Progress data:", data);

      setProgress(data);
      setCanUpdate(data.canUpdate || false);

      // Some backend responses (when no progress exists yet) don't include isTeamLead.
      // In that case, query the consolidated myteam endpoint to get accurate role/permissions.
      if (typeof data.isTeamLead === 'undefined') {
        try {
          const myTeamProgressRes = await fetch(`${API_URL}/teamprogress/teamprogress/myteam/${hackathonId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (myTeamProgressRes.ok) {
            const myData = await myTeamProgressRes.json();
            console.log('[FRONTEND] myteam fallback response for role:', myData);
            setIsTeamLead(Boolean(myData.isTeamLead));
            setCanUpdate(myData.canUpdate || false);
            setRemainingCooldown(myData.remainingCooldown || 0);
            setNextUpdateTime(myData.nextUpdateAvailable || null);
          } else {
            console.log('[FRONTEND] myteam fallback returned', myTeamProgressRes.status);
            setIsTeamLead(false);
            setRemainingCooldown(data.remainingCooldown || 0);
            setNextUpdateTime(data.nextUpdateAvailable || null);
          }
        } catch (err) {
          console.error('[FRONTEND] Error fetching myteam fallback:', err);
          setIsTeamLead(false);
          setRemainingCooldown(data.remainingCooldown || 0);
          setNextUpdateTime(data.nextUpdateAvailable || null);
        }
      } else {
        setIsTeamLead(data.isTeamLead || false);
        setRemainingCooldown(data.remainingCooldown || 0);
        setNextUpdateTime(data.nextUpdateAvailable);
      }

      // Set initial edit values
      setEditPercentage(data.percentage || 0);
      setEditDescription(data.description || "");
    } catch (error) {
      console.error("[FRONTEND] Error fetching progress:", error);
      message.error(error.message);
    }
  };

  const handleStartEdit = () => {
    if (!canUpdate) {
      if (!isTeamLead) {
        message.warning("Only the team lead can update progress");
      } else {
        message.warning("Please wait for the cooldown to end");
      }
      return;
    }

    setEditPercentage(progress?.percentage || 0);
    setEditDescription(progress?.description || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditPercentage(progress?.percentage || 0);
    setEditDescription(progress?.description || "");
  };

  const handleSaveProgress = async () => {
    if (!team || !team.hackathon) {
      message.error("Team information not available");
      return;
    }

    if (editPercentage < 0 || editPercentage > 100) {
      message.error("Percentage must be between 0 and 100");
      return;
    }

    try {
      setUpdating(true);
      console.log("[FRONTEND] Updating progress...");

      const requestBody = {
        hackathonId: team.hackathon._id || team.hackathon,
        teamId: team._id,
        percentage: editPercentage,
        description: editDescription.trim(),
      };

      console.log("[FRONTEND] Request body:", requestBody);

      const res = await fetch(`${API_URL}/teamprogress/teamprogress`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("[FRONTEND] Response:", data);

      if (!res.ok) {
        if (data.error === "COOLDOWN_ACTIVE") {
          message.warning(data.message);
          setRemainingCooldown(data.remainingTime);
          setCanUpdate(false);
        } else if (data.error === "NOT_TEAM_LEAD") {
          message.error(data.message);
          setIsTeamLead(false);
          setCanUpdate(false);
        } else {
          throw new Error(data.message || "Failed to update progress");
        }
        setUpdating(false);
        setIsEditing(false);
        return;
      }

      message.success("Progress updated successfully!");
      
      // Update state
      setProgress(data.progress);
      setCanUpdate(false);
      setRemainingCooldown(30 * 60 * 1000); // 30 minutes
      setNextUpdateTime(data.nextUpdateAvailable);
      setIsEditing(false);

      // Refresh after a short delay
      setTimeout(() => {
        fetchProgress(team.hackathon._id || team.hackathon, team._id);
      }, 1000);

    } catch (error) {
      console.error("[FRONTEND] Error updating progress:", error);
      message.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatCooldownTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getProgressColor = (percentage) => {
    if (percentage === 0) return "#d9d9d9";
    if (percentage < 30) return "#ff4d4f";
    if (percentage < 70) return "#faad14";
    if (percentage < 100) return "#1890ff";
    return "#52c41a";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Not Started":
        return "default";
      case "In Progress":
        return "processing";
      case "Completed":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f0f2f5",
        }}
      >
        <Spin size="large" tip="Loading team progress..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        <Alert
          message="Not in a Team"
          description="You need to join a team to track progress"
          type="info"
          showIcon
          icon={<TeamOutlined />}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Title level={2}>
        <RocketOutlined style={{ marginRight: 8 }} />
        Team Progress Tracker
      </Title>

      {/* Team Info Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Team Name"
              value={team.name}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 18 }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Hackathon"
              value={hackathon?.hackathonname || "Loading..."}
              prefix={<TrophyOutlined />}
              valueStyle={{ fontSize: 18 }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Role"
              value={isTeamLead ? "Team Lead" : "Team Member"}
              valueStyle={{ fontSize: 18, color: isTeamLead ? "#1890ff" : "#8c8c8c" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                STATUS
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={getStatusColor(progress?.status)} style={{ fontSize: 14 }}>
                  {progress?.status || "Not Started"}
                </Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Cooldown Alert */}
      {!canUpdate && isTeamLead && remainingCooldown > 0 && (
        <Alert
          message="Update Cooldown Active"
          description={
            <Space direction="vertical" size="small">
              <Text>
                You can update progress again in:{" "}
                <Text strong>{formatCooldownTime(remainingCooldown)}</Text>
              </Text>
              {nextUpdateTime && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Next update available at:{" "}
                  {new Date(nextUpdateTime).toLocaleTimeString()}
                </Text>
              )}
            </Space>
          }
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Not Team Lead Alert */}
      {!isTeamLead && (
        <Alert
          message="Team Member View"
          description="Only the team lead can update progress. You can view the current progress below."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Progress Card */}
      <Card
        title={
          <Space>
            <RocketOutlined />
            <span>Current Progress</span>
          </Space>
        }
        extra={
          !isEditing && isTeamLead ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleStartEdit}
              disabled={!canUpdate}
            >
              Update Progress
            </Button>
          ) : null
        }
      >
        {!isEditing ? (
          <div>
            <Row gutter={[16, 24]}>
              <Col span={24}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <Progress
                    type="circle"
                    percent={progress?.percentage || 0}
                    strokeColor={getProgressColor(progress?.percentage || 0)}
                    width={200}
                    format={(percent) => (
                      <div>
                        <div style={{ fontSize: 48, fontWeight: "bold" }}>{percent}%</div>
                        <div style={{ fontSize: 14, color: "#8c8c8c" }}>
                          {progress?.status || "Not Started"}
                        </div>
                      </div>
                    )}
                  />
                </div>
              </Col>
              
              {progress?.description && (
                <Col span={24}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      Progress Description:
                    </Text>
                    <Paragraph style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                      {progress.description}
                    </Paragraph>
                  </div>
                </Col>
              )}

              {progress?.updatedAt && (
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Last updated: {new Date(progress.updatedAt).toLocaleString()}
                  </Text>
                </Col>
              )}
            </Row>
          </div>
        ) : (
          <div>
            <Row gutter={[16, 24]}>
              <Col span={24}>
                <div>
                  <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
                    Progress Percentage: {editPercentage}%
                  </Text>
                  <Slider
                    min={0}
                    max={100}
                    value={editPercentage}
                    onChange={setEditPercentage}
                    marks={{
                      0: "0%",
                      25: "25%",
                      50: "50%",
                      75: "75%",
                      100: "100%",
                    }}
                    tooltip={{
                      formatter: (value) => `${value}%`,
                    }}
                  />
                  <Progress
                    percent={editPercentage}
                    strokeColor={getProgressColor(editPercentage)}
                    style={{ marginTop: 16 }}
                  />
                </div>
              </Col>

              <Col span={24}>
                <div>
                  <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
                    Progress Description (Optional)
                  </Text>
                  <TextArea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Describe what your team has accomplished, current challenges, or next steps..."
                    rows={6}
                    maxLength={1000}
                    showCount
                  />
                </div>
              </Col>

              <Col span={24}>
                <Alert
                  message="Important: 30-Minute Update Limit"
                  description="After updating, you will need to wait 30 minutes before making another update. Make sure your progress information is accurate."
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                />
              </Col>

              <Col span={24}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveProgress}
                    loading={updating}
                    size="large"
                  >
                    Save Progress
                  </Button>
                  <Button onClick={handleCancelEdit} disabled={updating} size="large">
                    Cancel
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Progress History Info */}
      <Card 
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Progress Tracking Guidelines</span>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                Team Lead Responsibilities:
              </Text>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>Update team progress regularly</li>
                <li>Provide accurate percentage estimates</li>
                <li>Describe completed milestones and challenges</li>
                <li>Updates are limited to once every 30 minutes</li>
              </ul>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                <ClockCircleOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                Progress Milestones:
              </Text>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>0-30%: Initial planning and setup</li>
                <li>30-70%: Active development phase</li>
                <li>70-99%: Testing and refinement</li>
                <li>100%: Project completed</li>
              </ul>
            </div>
          </Col>

          <Col span={24}>
            <Alert
              message="Note"
              description="All team members can view the progress, but only the team lead can make updates. This ensures coordinated communication about your team's status."
              type="info"
              showIcon
            />
          </Col>
        </Row>
      </Card>

      {/* Team Statistics */}
      {progress && (
        <Card 
          title="Progress Statistics"
          style={{ marginTop: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Current Progress"
                value={progress.percentage}
                suffix="%"
                valueStyle={{ color: getProgressColor(progress.percentage) }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Status"
                value={progress.status}
                valueStyle={{ 
                  fontSize: 18,
                  color: progress.status === "Completed" ? "#52c41a" : 
                         progress.status === "In Progress" ? "#1890ff" : "#8c8c8c"
                }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Last Updated"
                value={progress.updatedAt ? new Date(progress.updatedAt).toLocaleDateString() : "Not yet"}
                valueStyle={{ fontSize: 18 }}
              />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default TeamProgressPage;