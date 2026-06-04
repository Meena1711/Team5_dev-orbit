import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Spin,
  Typography,
  Row,
  Col,
  Select,
  Input,
  Button,
  Tag,
  Progress,
  Statistic,
  Space,
  Tabs,
  Badge,
  Tooltip,
  Empty,
  Divider,
} from "antd";
import {
  TrophyOutlined,
  TeamOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  CrownOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const AllTeamsProgressPage = () => {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [selectedBranch, setBranch] = useState(null);
  const [selectedCollege, setCollege] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("progress");
  const [sortOrder, setSortOrder] = useState("desc");

  const API_URL = (process.env.REACT_APP_BACKEND_URL || (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000') + '');
  const token = localStorage.getItem("token");

  const branches = [
    'Artificial Intelligence (AI)',
    'Artificial Intelligence and Machine Learning (CSM)',
    'Artificial Intelligence and Data Science (AID)',
    'Cyber Security (CSC)',
    'Data Science (CSD)'
  ];

  const colleges = ['KIET', 'KIET+', 'KIEW'];

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    if (selectedHackathon) {
      if (activeTab === "all") {
        fetchAllTeams();
      } else if (activeTab === "leaderboard") {
        fetchLeaderboard();
      } else if (activeTab === "statistics") {
        fetchStatistics();
      }
    }
  }, [
    selectedHackathon,
    selectedBranch,
    selectedCollege,
    sortBy,
    sortOrder,
    activeTab
  ]);

  const fetchHackathons = async () => {
    try {
      const res = await fetch(`${API_URL}/hackteams/hackathons/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHackathons(data);
        if (data.length > 0) {
          setSelectedHackathon(data[0]._id);
        }
      }
    } catch (error) {
      console.error("[FRONTEND] Error fetching hackathons:", error);
    }
  };

  const fetchAllTeams = async () => {
    if (!selectedHackathon) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        hackathonId: selectedHackathon,
        sortBy,
        sortOrder,
      });

      if (selectedBranch) params.append('branch', selectedBranch);
      if (selectedCollege) params.append('college', selectedCollege);

      const res = await fetch(`${API_URL}/teamprogress/teams/progress/all?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch teams");
      }

      const data = await res.json();
      console.log("[FRONTEND] Teams data:", data);
      // backend returns { success, stats, teams }
      setTeams(data.teams || data.progresses || []);
      setStatistics(data.stats || data.statistics || null);
    } catch (error) {
      console.error("[FRONTEND] Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedHackathon) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        hackathonId: selectedHackathon,
        limit: 20,
      });

      if (selectedBranch) params.append('branch', selectedBranch);
      if (selectedCollege) params.append('college', selectedCollege);

      const res = await fetch(`${API_URL}/teamprogress/teams/progress/leaderboard?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await res.json();
      console.log("[FRONTEND] Leaderboard data:", data);
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("[FRONTEND] Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!selectedHackathon) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/teamprogress/teams/progress/statistics?hackathonId=${selectedHackathon}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await res.json();
      console.log("[FRONTEND] Statistics data:", data);
      // backend returns { success, totalTeams, teamsWithProgress, byBranch, byCollege, byYear }
      setStatistics({
        totalTeams: data.totalTeams,
        teamsWithProgress: data.teamsWithProgress,
        completedTeams: data.completedTeams || 0,
        averageProgress: data.averageProgress || 0,
        byBranch: data.byBranch,
        byCollege: data.byCollege,
        byYear: data.byYear
      });
    } catch (error) {
      console.error("[FRONTEND] Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setBranch(null);
    setCollege(null);
    setSearchText("");
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

  const getProgressColor = (percentage) => {
    if (percentage === 0) return "#d9d9d9";
    if (percentage < 30) return "#ff4d4f";
    if (percentage < 70) return "#faad14";
    if (percentage < 100) return "#1890ff";
    return "#52c41a";
  };

  const getRankMedal = (rank) => {
    switch (rank) {
      case 1:
        return <CrownOutlined style={{ color: "#FFD700", fontSize: 24 }} />;
      case 2:
        return <CrownOutlined style={{ color: "#C0C0C0", fontSize: 22 }} />;
      case 3:
        return <CrownOutlined style={{ color: "#CD7F32", fontSize: 20 }} />;
      default:
        return <Text strong style={{ fontSize: 18 }}>#{rank}</Text>;
    }
  };

  const columns = [
    {
      title: "Rank",
      key: "rank",
      width: 80,
      render: (_, __, index) => (
        <Text strong style={{ fontSize: 16 }}>#{index + 1}</Text>
      ),
    },
    {
      title: "Team Name",
      dataIndex: "name",
      key: "name",
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 16 }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            {name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.studentCount} member{record.studentCount !== 1 ? 's' : ''}
          </Text>
        </Space>
      ),
    },
    {
      title: "Team Lead",
      key: "teamLead",
      render: (record) => (
        record.teamLead ? (
          <Space direction="vertical" size={0}>
            <Text>{record.teamLead.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.teamLead.branch}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.teamLead.college}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">No lead assigned</Text>
        )
      ),
    },
    {
      title: "Progress",
      key: "progress",
      sorter: (a, b) => a.progress.percentage - b.progress.percentage,
      render: (record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Progress
            percent={record.progress.percentage}
            strokeColor={getProgressColor(record.progress.percentage)}
            size="small"
          />
          <Tag color={getStatusColor(record.progress.status)}>
            {record.progress.status}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Mentor",
      key: "mentor",
      render: (record) => (
        record.mentor ? (
          <Text>{record.mentor.name}</Text>
        ) : (
          <Text type="secondary">No mentor</Text>
        )
      ),
    },
    {
      title: "Last Updated",
      key: "lastUpdated",
      render: (record) => (
        record.progress.updatedAt ? (
          <Tooltip title={new Date(record.progress.updatedAt).toLocaleString()}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(record.progress.updatedAt).toLocaleDateString()}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">Never</Text>
        )
      ),
    },
  ];

  const leaderboardColumns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 100,
      render: (rank) => (
        <div style={{ textAlign: 'center' }}>
          {getRankMedal(rank)}
        </div>
      ),
    },
    {
      title: "Team",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 16 }}>
            {record.rank <= 3 && <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
            {name}
          </Text>
          {record.teamLead && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Lead: {record.teamLead.name}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Progress",
      key: "progress",
      width: 300,
      render: (record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={record.progress.percentage}
              strokeColor={getProgressColor(record.progress.percentage)}
              size="small"
              style={{ flex: 1 }}
            />
            <Text strong style={{ fontSize: 16 }}>
              {record.progress.percentage}%
            </Text>
          </div>
          <Tag color={getStatusColor(record.progress.status)}>
            {record.progress.status}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Members",
      dataIndex: "studentCount",
      key: "studentCount",
      width: 100,
      render: (count) => (
        <Badge count={count} showZero color="#1890ff" />
      ),
    },
  ];

  const renderFilters = () => (
    <Card style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Hackathon
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select Hackathon"
            value={selectedHackathon}
            onChange={setSelectedHackathon}
          >
            {hackathons.map((h) => (
              <Option key={h._id} value={h._id}>
                {h.hackathonname}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Branch
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="All Branches"
            value={selectedBranch}
            onChange={setBranch}
            allowClear
          >
            {branches.map((b) => (
              <Option key={b} value={b}>
                {b}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            College
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="All Colleges"
            value={selectedCollege}
            onChange={setCollege}
            allowClear
          >
            {colleges.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
        </Col>

        {/* {activeTab === "all" && (
          <>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Sort Order
              </Text>
              <Select
                style={{ width: '100%' }}
                value={sortOrder}
                onChange={setSortOrder}
              >
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
              </Select>
              
            </Col>
          </>
        )} */}

        <Col xs={24}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                if (activeTab === "all") fetchAllTeams();
                else if (activeTab === "leaderboard") fetchLeaderboard();
                else if (activeTab === "statistics") fetchStatistics();
              }}
            >
              Refresh
            </Button>
            <Button
              icon={<FilterOutlined />}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const renderStatistics = () => {
    if (!statistics) return <Empty description="No statistics available" />;

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Teams"
                value={statistics.totalTeams}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Teams with Progress"
                value={statistics.teamsWithProgress}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Completed Teams"
                value={statistics.completedTeams || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Progress"
                value={statistics.averageProgress || 0}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {statistics.byBranch && (
          <Card title="Statistics by Branch" style={{ marginBottom: 16 }}>
            <Table
              dataSource={statistics.byBranch}
              columns={[
                {
                  title: 'Branch',
                  dataIndex: 'category',
                  key: 'category',
                },
                {
                  title: 'Teams',
                  dataIndex: 'teamCount',
                  key: 'teamCount',
                },
                {
                  title: 'Average Progress',
                  dataIndex: 'averageProgress',
                  key: 'averageProgress',
                  render: (val) => `${val}%`,
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        )}

        {statistics.byCollege && (
          <Card title="Statistics by College" style={{ marginBottom: 16 }}>
            <Table
              dataSource={statistics.byCollege}
              columns={[
                {
                  title: 'College',
                  dataIndex: 'category',
                  key: 'category',
                },
                {
                  title: 'Teams',
                  dataIndex: 'teamCount',
                  key: 'teamCount',
                },
                {
                  title: 'Average Progress',
                  dataIndex: 'averageProgress',
                  key: 'averageProgress',
                  render: (val) => `${val}%`,
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        )}
      </div>
    );
  };

  if (!selectedHackathon && hackathons.length === 0) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        <Empty
          description="No hackathons available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Title level={2}>
        <TrophyOutlined style={{ marginRight: 8 }} />
        Teams Progress Dashboard
      </Title>

      {renderFilters()}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Loading teams data..." />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: (
                <span>
                  <TeamOutlined />
                  All Teams ({teams.length})
                </span>
              ),
              children: (
                <Card>
                  {statistics && (
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Total Teams"
                          value={statistics.totalTeams}
                          prefix={<TeamOutlined />}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="In Progress"
                          value={statistics.inProgressTeams}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Completed"
                          value={statistics.completedTeams}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Avg Progress"
                          value={statistics.averageProgress}
                          suffix="%"
                          prefix={<RiseOutlined />}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Col>
                    </Row>
                  )}

                  <Divider />

                  <div style={{ marginBottom: 16 }}>
                    <Input
                      placeholder="Search team name..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ maxWidth: 400 }}
                    />
                  </div>

                  <Table
                    dataSource={teams}
                    columns={columns}
                    rowKey="_id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} teams`,
                    }}
                    scroll={{ x: 1000 }}
                  />
                </Card>
              ),
            },
            {
              key: 'leaderboard',
              label: (
                <span>
                  <CrownOutlined />
                  Leaderboard
                </span>
              ),
              children: (
                <Card>
                  {leaderboard.length === 0 ? (
                    <Empty
                      description="No teams with progress yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <>
                      <div style={{ marginBottom: 24 }}>
                        <Title level={4}>
                          <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                          Top Performing Teams
                        </Title>
                        <Text type="secondary">
                          Showing top {leaderboard.length} teams ranked by progress
                        </Text>
                      </div>

                      {leaderboard.slice(0, 3).length > 0 && (
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                          {leaderboard.slice(0, 3).map((team, index) => (
                            <Col xs={24} sm={8} key={team._id}>
                              <Card
                                style={{
                                  background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
                                              index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' :
                                              'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                                  color: 'white',
                                }}
                              >
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 48, marginBottom: 8 }}>
                                    {getRankMedal(team.rank)}
                                  </div>
                                  <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
                                    {team.name}
                                  </Title>
                                  <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 8 }}>
                                    {team.progress.percentage}%
                                  </div>
                                  <Tag color={index === 0 ? 'gold' : index === 1 ? 'default' : 'volcano'}>
                                    {team.progress.status}
                                  </Tag>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      )}

                      <Table
                        dataSource={leaderboard}
                        columns={leaderboardColumns}
                        rowKey="_id"
                        pagination={false}
                        scroll={{ x: 800 }}
                      />
                    </>
                  )}
                </Card>
              ),
            },
            {
              key: 'statistics',
              label: (
                <span>
                  <RiseOutlined />
                  Statistics
                </span>
              ),
              children: renderStatistics(),
            },
          ]}
        />
      )}
    </div>
  );
};

export default AllTeamsProgressPage;