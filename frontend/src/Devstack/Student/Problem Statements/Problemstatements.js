import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Empty,
  Tag,
  message,
  Modal,
  Alert,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  LockOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const TeamProblemStatementsPage = () => {
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [problemStatements, setProblemStatements] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [notInTeam, setNotInTeam] = useState(false);

  const API_URL = "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Get userId from localStorage
  const userIdRaw = localStorage.getItem("student") || localStorage.getItem("userId");
  const userId = userIdRaw ? userIdRaw.toString() : null;

  useEffect(() => {
    console.log("[FRONTEND] Component mounted");
    console.log("[FRONTEND] Token:", token ? "Present" : "Missing");
    console.log("[FRONTEND] User ID from localStorage:", userId);

    if (!userId) {
      console.error("[FRONTEND] No user ID found in localStorage");
      message.error("User ID not found. Please log in again.");
      return;
    }

    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      console.log("[FRONTEND] Fetching team data...");

      const teamRes = await fetch(`${API_URL}/hackteams/myteam`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[FRONTEND] Team response status:", teamRes.status);

      if (teamRes.status === 404) {
        console.log("[FRONTEND] User not in any team");
        setNotInTeam(true);
        setLoading(false);
        return;
      }

      if (!teamRes.ok) {
        const errorData = await teamRes.json();
        console.error("[FRONTEND] Team fetch error:", errorData);
        throw new Error(errorData.message || "Failed to fetch team");
      }

      const teamData = await teamRes.json();
      console.log("[FRONTEND] Team data received:", {
        teamId: teamData._id,
        teamName: teamData.name,
        teamLeadId: teamData.teamLead?._id,
        selectedProblem: teamData.selectedProblemStatement,
      });

      // Normalize teamLead to ensure _id is a string
      if (teamData.teamLead) {
        if (typeof teamData.teamLead === "string") {
          teamData.teamLead = { _id: teamData.teamLead.toString() };
        } else if (teamData.teamLead._id) {
          teamData.teamLead._id = teamData.teamLead._id.toString();
        }
      }

      setTeam(teamData);
      setNotInTeam(false);

      if (teamData.hackathon) {
        await fetchHackathonDetails(teamData.hackathon);
      }

      if (!teamData.mentor || !teamData.mentor._id) {
        console.log("[FRONTEND] No mentor assigned to team");
        setLoading(false);
        return;
      }

      await fetchProblemStatements(teamData._id);
      setLoading(false);
    } catch (error) {
      console.error("[FRONTEND] Error fetching team:", error);
      message.error(error.message || "Failed to fetch team details");
      setLoading(false);
    }
  };

  const fetchHackathonDetails = async (hackathonId) => {
    try {
      console.log("[FRONTEND] Fetching hackathon details:", hackathonId);
      const res = await fetch(`${API_URL}/hackathon/${hackathonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch hackathon details");
      }

      const data = await res.json();
      console.log("[FRONTEND] Hackathon data:", data.hackathonname);
      setHackathon(data);
    } catch (error) {
      console.error("[FRONTEND] Error fetching hackathon:", error);
    }
  };

  const fetchProblemStatements = async (teamId) => {
    try {
      console.log("[FRONTEND] Fetching problem statements for team:", teamId);
      const res = await fetch(`${API_URL}/problemstatements/${teamId}/problem-statements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[FRONTEND] Problem statements response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("[FRONTEND] Problem statements error:", errorData);
        throw new Error(errorData.message || "Failed to fetch problem statements");
      }

      const data = await res.json();
      console.log("[FRONTEND] Problem statements received:", data.problemStatements?.length || 0);
      console.log("[FRONTEND] Team lead from backend:", data.teamLead);
      console.log("[FRONTEND] Team selection status:", {
        hasSelection: !!data.team?.selectedProblemStatement,
        selectedProblem: data.team?.selectedProblemStatement,
        selectedSubId: data.team?.selectedProblemStatementSubId,
      });

      // Normalize team selection IDs to strings to avoid object/string mismatches
      const teamSelectedParent = data.team?.selectedProblemStatement ? String(data.team.selectedProblemStatement) : null;
      const teamSelectedSub = data.team?.selectedProblemStatementSubId ? String(data.team.selectedProblemStatementSubId) : null;

      // Normalize teamLead _id
      if (data.teamLead && data.teamLead._id) {
        data.teamLead._id = String(data.teamLead._id);
      }

      // Process problem statements to ensure proper selection state (use string compares)
      const processedStatements = (data.problemStatements || []).map(ps => {
        const psId = ps._id ? String(ps._id) : null;
        const psParent = ps.parentId ? String(ps.parentId) : null;
        const psSelectedBy = ps.selectedBy ? String(ps.selectedBy) : null;

        const isSelectedByTeam = teamSelectedParent && teamSelectedSub && teamSelectedParent === psParent && teamSelectedSub === psId;
        const isSelectedByOther = ps.isSelected && psSelectedBy && psSelectedBy !== String(teamId);

        return {
          ...ps,
          _id: psId,
          parentId: psParent,
          selectedBy: psSelectedBy,
          isSelected: isSelectedByTeam || isSelectedByOther,
        };
      });

      // Set problem statements with processed selection state
      setProblemStatements(processedStatements);

      // Update team state with latest data from backend (use normalized ids)
      if (data.team) {
        setTeam(prevTeam => ({
          ...prevTeam,
          ...data.team,
          teamLead: data.teamLead || prevTeam.teamLead,
          selectedProblemStatement: teamSelectedParent,
          selectedProblemStatementSubId: teamSelectedSub,
        }));
      } else {
        setProblemStatements([]);
      }
    } catch (error) {
      console.error("[FRONTEND] Error fetching problem statements:", error);
      message.error(error.message || "Failed to fetch problem statements");
      setProblemStatements([]);
    }
  };

  const handleSelectClick = (problem) => {
    console.log("[FRONTEND] Select button clicked");
    console.log("[FRONTEND] Problem:", problem._id);
    console.log("[FRONTEND] Current user ID:", userId);
    console.log("[FRONTEND] Team lead ID:", team?.teamLead?._id);

    if (!team || !team.teamLead) {
      message.error("Team lead information not available.");
      return;
    }

    const teamLeadId = team.teamLead._id?.toString();
    const currentUserId = userId?.toString();
    const isTeamLead = teamLeadId === currentUserId;

    console.log("[FRONTEND] Team lead check:", {
      teamLeadId,
      currentUserId,
      isTeamLead,
    });

    if (!isTeamLead) {
      message.error("Only the team lead can select a problem statement.");
      return;
    }

    if (team.selectedProblemStatement) {
      message.error("Your team has already selected a problem statement.");
      return;
    }

    setSelectedProblem(problem);
    setIsModalVisible(true);
  };

  const handleConfirmSelection = async () => {
    if (!selectedProblem || !team || !team.hackathon) {
      message.error("Missing required information");
      return;
    }

    try {
      setModalLoading(true);

      const requestBody = {
        parentId: selectedProblem.parentId,
        problemStatementSubId: selectedProblem._id,
        hackathonId: team.hackathon._id || team.hackathon,
      };

      console.log("[FRONTEND] ▶ Submitting problem selection");
      console.log("[FRONTEND] Request body:", requestBody);
      console.log("[FRONTEND] Team ID:", team._id);
      console.log("[FRONTEND] API URL:", `${API_URL}/problemstatements/${team._id}/select-problem`);

      const res = await fetch(`${API_URL}/problemstatements/${team._id}/select-problem`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[FRONTEND] Response status:", res.status);

      const data = await res.json();
      console.log("[FRONTEND] Response data:", data);

      if (!res.ok) {
        console.error("[FRONTEND] Error response:", data);
        throw new Error(data.message || data.error || "Failed to select problem statement");
      }

      console.log("[FRONTEND] ✓ Problem statement selected successfully!");
      console.log("[FRONTEND] Selected IDs:", {
        parentId: data.selectedProblemStatement,
        subId: data.selectedProblemStatementSubId,
      });

      message.success(data.message || "Problem statement selected successfully!");

      // CRITICAL: Update team state with selection
      setTeam((prevTeam) => {
        console.log("[FRONTEND] Updating team state from:", {
          oldSelection: prevTeam.selectedProblemStatement,
          oldSubId: prevTeam.selectedProblemStatementSubId,
        });
        console.log("[FRONTEND] Updating team state to:", {
          newSelection: data.selectedProblemStatement,
          newSubId: data.selectedProblemStatementSubId,
        });

        return {
          ...prevTeam,
          selectedProblemStatement: data.selectedProblemStatement,
          selectedProblemStatementSubId: data.selectedProblemStatementSubId,
        };
      });

      // Update all problem statements to reflect the new selection
      setProblemStatements((prevStatements) =>
        prevStatements.map((ps) => ({
          ...ps,
          isSelected: ps._id === selectedProblem._id || (ps.isSelected && ps.selectedBy !== team._id),
          selectedBy: ps._id === selectedProblem._id ? team._id : ps.selectedBy
        }))
      );

      // Refresh problem statements from server to ensure consistent state
      await fetchProblemStatements(team._id);

      // Close modal
      setIsModalVisible(false);
      setSelectedProblem(null);

      // Force re-render check
      console.log("[FRONTEND] State update complete, hasSelectedProblem should now be true");

    } catch (error) {
      console.error("[FRONTEND] ✗ Error selecting problem:", error);
      message.error(error.message || "Failed to select problem statement");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelSelection = () => {
    console.log("[FRONTEND] Selection cancelled");
    setIsModalVisible(false);
    setSelectedProblem(null);
  };

  // Determine if current user is team lead
  const isTeamLead = React.useMemo(() => {
    if (!team || !team.teamLead || !userId) return false;
    
    const teamLeadId = (team.teamLead._id || team.teamLead).toString();
    const currentUserId = userId.toString();
    
    return teamLeadId === currentUserId;
  }, [team, userId]);

  const hasSelectedProblem = !!(team && team.selectedProblemStatement);

  console.log("[FRONTEND] Render state:", {
    isTeamLead,
    hasSelectedProblem,
    problemCount: problemStatements.length,
    loading,
    teamName: team?.name,
  });

  const renderProblemCard = (problem) => {
    // Check if this problem is selected by the current team
    const isSelectedByTeam =
      hasSelectedProblem &&
      team.selectedProblemStatementSubId?.toString() === problem._id.toString() &&
      team.selectedProblemStatement?.toString() === problem.parentId?.toString();

    // Check if problem is selected by another team
    const isSelectedByOther = 
      problem.isSelected && 
      problem.selectedBy && 
      problem.selectedBy.toString() !== team._id.toString();
    
    // Can only select if:
    // 1. User is team lead
    // 2. Team hasn't selected any problem yet
    // 3. This problem isn't selected by another team
    const canSelect = isTeamLead && !hasSelectedProblem && !isSelectedByOther;

    return (
      <Col xs={24} sm={24} md={12} lg={8} key={problem._id}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, fontWeight: isSelectedByTeam ? 600 : 400 }}>
                {problem.title}
              </span>
              {isSelectedByTeam && (
                <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
              )}
              {isSelectedByOther && (
                <LockOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
              )}
            </div>
          }
          extra={
            isSelectedByTeam ? (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>
                Your Selection
              </Tag>
            ) : isSelectedByOther ? (
              <Tag color="error" icon={<LockOutlined />}>
                Unavailable
              </Tag>
            ) : (
              <Tag color="blue">Available</Tag>
            )
          }
          style={{
            marginBottom: 16,
            border: isSelectedByTeam
              ? "3px solid #52c41a"
              : isSelectedByOther
              ? "2px solid #ff4d4f"
              : "1px solid #d9d9d9",
            boxShadow: isSelectedByTeam 
              ? "0 6px 16px rgba(82, 196, 26, 0.25)" 
              : isSelectedByOther
              ? "0 2px 8px rgba(255, 77, 79, 0.1)"
              : undefined,
            backgroundColor: isSelectedByTeam ? "#f6ffed" : "white",
            transition: "all 0.3s ease",
          }}
        >
          <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
            {problem.description}
          </Paragraph>

          {problem.technologies && problem.technologies.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Text strong>Technologies: </Text>
              <div style={{ marginTop: 8 }}>
                {problem.technologies.map((tech, idx) => (
                  <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                    {tech}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* Button - different states based on selection */}
          {isSelectedByTeam ? (
            <Button
              type="primary"
              disabled
              block
              style={{ 
                marginTop: 12, 
                backgroundColor: '#52c41a', 
                borderColor: '#52c41a',
                height: 40,
                fontWeight: 600
              }}
              icon={<CheckCircleOutlined />}
            >
              ✓ Your Team's Selected Problem
            </Button>
          ) : isSelectedByOther ? (
            // Other team's selection: show concise unavailable state
            <Button
              type="default"
              disabled
              block
              style={{ marginTop: 12, borderColor: '#ff4d4f', color: '#ff4d4f', height: 40 }}
              icon={<LockOutlined />}
            >
              Selected by Another Team
            </Button>
          ) : hasSelectedProblem ? (
            // Current team already selected a problem: concise locked state for other problems
            <Button
              type="default"
              disabled
              block
              style={{ marginTop: 12, color: '#8c8c8c', height: 40, fontWeight: 600 }}
              icon={<InfoCircleOutlined />}
            >
              Selection Locked
            </Button>
          ) : !isTeamLead ? (
            <Tooltip title="Only the team lead can select problem statements">
              <Button
                type="default"
                disabled
                block
                style={{ marginTop: 12, height: 40 }}
                icon={<UserOutlined />}
              >
                Team Lead Only
              </Button>
            </Tooltip>
          ) : (
            <Button
              type="primary"
              onClick={() => handleSelectClick(problem)}
              block
              style={{ marginTop: 12, height: 40 }}
              icon={<TrophyOutlined />}
            >
              Select This Problem
            </Button>
          )}

          {/* Alert messages */}
          {/* {isSelectedByTeam && (
            <Alert
              // message="✓ Your Team's Selection"
              // description="This is the problem statement your team has successfully selected for the hackathon"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginTop: 12, fontWeight: 500 }}
            />
          )} */}
        </Card>
      </Col>
    );
  };

  if (notInTeam) {
    return (
      <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
        <div style={{ maxWidth: 800, margin: "50px auto" }}>
          <Alert
            message="Not in a Team"
            description="You are not currently part of any team. Please join or create a team to view and select problem statements."
            type="warning"
            showIcon
            icon={<TeamOutlined />}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f2f5",
        }}
      >
        <Spin size="large" tip="Loading team data..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Empty description="No team found for your registration." />
        </div>
      </div>
    );
  }

  if (!team.mentor || !team.mentor._id) {
    return (
      <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
        <div style={{ maxWidth: 800, margin: "50px auto" }}>
          <Alert
            message="No Mentor Assigned"
            description="Your team does not have a mentor assigned yet. A mentor must be assigned before you can view problem statements."
            type="info"
            showIcon
            icon={<UserOutlined />}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Title level={2}>
        <TrophyOutlined style={{ marginRight: 8 }} />
        Problem Statements
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: "#8c8c8c", fontSize: 12 }}>
                TEAM NAME
              </Text>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                <TeamOutlined style={{ marginRight: 8 }} />
                {team.name}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: "#8c8c8c", fontSize: 12 }}>
                MENTOR
              </Text>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                <UserOutlined style={{ marginRight: 8 }} />
                {team.mentor.name}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: "#8c8c8c", fontSize: 12 }}>
                HACKATHON
              </Text>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                {hackathon?.hackathonname || "Loading..."}
                {hackathon?.status === "ongoing" && (
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    Ongoing
                  </Tag>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            {isTeamLead && (
              <Tag color="blue" icon={<UserOutlined />} style={{ fontSize: 14, padding: "6px 12px" }}>
                You are the Team Lead
              </Tag>
            )}

            {!isTeamLead && team.teamLead && (
              <Tag
                color="default"
                icon={<TeamOutlined />}
                style={{ fontSize: 14, padding: "6px 12px" }}
              >
                Team Member {team.teamLead.name ? `(Lead: ${team.teamLead.name})` : ''}
              </Tag>
            )}

            {hasSelectedProblem && (
              <Tag
                color="success"
                icon={<CheckCircleOutlined />}
                style={{ marginLeft: 8, fontSize: 14, padding: "6px 12px" }}
              >
                Problem Statement Selected
              </Tag>
            )}

            {!hasSelectedProblem && isTeamLead && (
              <Tag
                color="warning"
                icon={<InfoCircleOutlined />}
                style={{ marginLeft: 8, fontSize: 14, padding: "6px 12px" }}
              >
                Please select a problem statement
              </Tag>
            )}
          </Col>
        </Row>
      </Card>

      {problemStatements.length === 0 ? (
        <Card>
          <Empty
            description="No problem statements available from your mentor for this hackathon."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <>
          {/* Show selected problem statement at the very top if exists */}
          {hasSelectedProblem && (
            <>
              <Title level={4} style={{ marginBottom: 12, color: '#52c41a' }}>
                ✓ Your Selected Problem Statement
              </Title>
              <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                {problemStatements
                  .filter(ps => 
                    team.selectedProblemStatementSubId?.toString() === ps._id.toString() &&
                    team.selectedProblemStatement?.toString() === ps.parentId?.toString()
                  )
                  .map(renderProblemCard)}
              </Row>
              <Title level={4} style={{ marginTop: 8, marginBottom: 16 }}>
                Remaining Problem Statements
              </Title>
            </>
          )}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Showing {problemStatements.length} problem statement
              {problemStatements.length !== 1 ? "s" : ""} from your mentor
            </Text>
          </div>
          <Row gutter={[16, 16]}>
            {problemStatements
              .filter(ps => {
                // Don't show the selected problem again in the list below
                if (!hasSelectedProblem) return true;
                return !(
                  team.selectedProblemStatementSubId?.toString() === ps._id.toString() &&
                  team.selectedProblemStatement?.toString() === ps.parentId?.toString()
                );
              })
              .map(renderProblemCard)}
          </Row>
        </>
      )}

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircleOutlined style={{ color: "#1890ff" }} />
            Confirm Problem Statement Selection
          </div>
        }
        open={isModalVisible}
        onOk={handleConfirmSelection}
        onCancel={handleCancelSelection}
        okText="Confirm Selection"
        cancelText="Cancel"
        confirmLoading={modalLoading}
        closable={!modalLoading}
        maskClosable={!modalLoading}
        width={600}
      >
        <div>
          <Alert
            message="Important: This action cannot be undone"
            description="Once you select a problem statement, you cannot change it. Make sure this is the right choice for your team."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {selectedProblem && (
            <div>
              <Title level={5} style={{ marginTop: 16 }}>
                {selectedProblem.title}
              </Title>
              <Paragraph>{selectedProblem.description}</Paragraph>

              {selectedProblem.technologies && selectedProblem.technologies.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Technologies: </Text>
                  <div style={{ marginTop: 8 }}>
                    {selectedProblem.technologies.map((tech, idx) => (
                      <Tag key={idx} color="blue">
                        {tech}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {hackathon && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 4,
                  }}
                >
                  <Text strong>Hackathon: </Text>
                  <Text>{hackathon.hackathonname}</Text>
                </div>
              )}
            </div>
          )}

          <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
            Are you sure you want to select this problem statement for your team?
          </Paragraph>
        </div>
      </Modal>
    </div>
  );
};

export default TeamProblemStatementsPage;