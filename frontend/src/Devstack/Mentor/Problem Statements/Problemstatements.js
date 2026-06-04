import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Empty,
  Modal,
  Input,
  Tag,
  Form,
  Space,
  message,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import axios from "axios";
import config from "../../../config";

const { Title, Text } = Typography;
const { TextArea } = Input;

const MentorProblemStatementsPage = () => {
  const [loading, setLoading] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [problemStatements, setProblemStatements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [techInput, setTechInput] = useState("");
  const [technologies, setTechnologies] = useState([]);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const token = localStorage.getItem("token");
  const mentorId = localStorage.getItem("mentor"); // ✅ make sure this key is correct

  // ✅ Fetch approved hackathons
  const fetchApprovedHackathons = async () => {
    if (!mentorId) {
      message.error("Mentor ID not found in localStorage");
      console.error("Mentor ID missing. localStorage.getItem('mentor'):", mentorId);
      return;
    }
  const url = `${config.backendUrl}/hackathonrequests/mentor/${mentorId}`;
    console.log("Fetching hackathons for mentorId:", mentorId, "URL:", url);
    try {
      setLoading(true);
      const res = await axios.get(
        url,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Only include approved hackathons
      const approved = res.data.filter(
        (h) => h.mentorRequest?.status === "approved"
      );
      setHackathons(approved);
      // Store approved hackathon IDs in localStorage
      const ids = approved.map((h) => h.hackathon?._id);
      localStorage.setItem("approvedHackathonIds", JSON.stringify(ids));
      // If only one approved hackathon, select it by default
      if (approved.length === 1) {
        setSelectedHackathon(approved[0]);
        fetchProblemStatements(approved[0].hackathon._id);
      }
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      message.error("Failed to fetch hackathons");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch problem statements for selected hackathon
  const fetchProblemStatements = async (hackathonId) => {
    try {
      const res = await axios.get(
        `${config.backendUrl}/problemstatements/mentor/${mentorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const hackathonData = res.data.find(
        (p) => p.hackathon?._id === hackathonId
      );
      setProblemStatements(hackathonData?.problemStatements || []);
    } catch (error) {
      console.error("Error fetching problem statements:", error);
      setProblemStatements([]);
      message.error("Failed to fetch problem statements");
    }
  };

  useEffect(() => {
  fetchApprovedHackathons();
  }, []);

  // ✅ Add Problem Statement
  const handleAddProblem = async (values) => {
    if (!selectedHackathon) return;
    try {
      const payload = { ...values, technologies };
      const res = await axios.post(
        `${config.backendUrl}/problemstatements/${selectedHackathon.hackathon._id}/add`,
        { problemStatements: [payload] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Problem statement added!");
      setProblemStatements(res.data.problemDoc.problemStatements);
      setModalVisible(false);
      addForm.resetFields();
      setTechnologies([]);
      setTechInput("");
    } catch (error) {
      console.error("Add problem error:", error);
      message.error(
        error.response?.data?.message || "Failed to add problem statement."
      );
    }
  };

  // ✅ Edit Problem
  const handleEditProblem = async (values) => {
    if (!selectedHackathon || !currentProblem) return;
    try {
      const payload = { ...values, technologies };
      await axios.put(
        `${config.backendUrl}/problemstatements/${selectedHackathon.hackathon._id}/${currentProblem._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Problem updated successfully!");
      setEditModalVisible(false);
      setCurrentProblem(null);
      editForm.resetFields();
      setTechnologies([]);
      setTechInput("");
      fetchProblemStatements(selectedHackathon.hackathon._id);
    } catch (error) {
      console.error("Edit problem error:", error);
      message.error(
        error.response?.data?.message || "Failed to update problem statement."
      );
    }
  };

  // ✅ Delete Problem
  const handleDeleteProblem = async (problemId) => {
    if (!selectedHackathon) return;
    try {
      await axios.delete(
        `${config.backendUrl}/problemstatements/${selectedHackathon.hackathon._id}/${problemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Problem statement deleted!");
      fetchProblemStatements(selectedHackathon.hackathon._id);
    } catch (error) {
      console.error("Delete problem error:", error);
      message.error(
        error.response?.data?.message || "Failed to delete problem statement."
      );
    }
  };

  // ✅ Manage Technologies
  const handleAddTech = () => {
    if (techInput && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  // ✅ UI Rendering
  const renderProblemCard = (problem) => (
    <Card key={problem._id} style={{ marginBottom: 12 }}>
      <Title level={5}>{problem.title}</Title>
      <Text>{problem.description}</Text>
      <div style={{ marginTop: 8 }}>
        {problem.technologies?.map((tech, idx) => (
          <Tag key={idx}>{tech}</Tag>
        ))}
      </div>
      <Space style={{ marginTop: 12 }}>
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            setCurrentProblem(problem);
            setTechnologies(problem.technologies || []);
            setTechInput("");
            setEditModalVisible(true);
          }}
        >
          Edit
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteProblem(problem._id)}
        >
          Delete
        </Button>
      </Space>
    </Card>
  );

  const renderHackathonCard = (hack) => {
    if (!hack.hackathon) return null;
    return (
      <Card
        key={hack.hackathon._id}
        title={hack.hackathon.hackathonname}
        extra={
          <Button
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHackathon(hack);
              setTechnologies([]);
              setTechInput("");
              setModalVisible(true);
              addForm.resetFields();
            }}
          >
            Add Problem
          </Button>
        }
        style={{ marginBottom: 20 }}
        onClick={() => {
          setSelectedHackathon(hack);
          fetchProblemStatements(hack.hackathon._id);
        }}
      >
        <p>{hack.hackathon.description}</p>
        {selectedHackathon?.hackathon._id === hack.hackathon._id && (
          <div style={{ marginTop: 20 }}>
            {problemStatements.length === 0 ? (
              <Empty description="No problem statements yet." />
            ) : (
              problemStatements.map(renderProblemCard)
            )}
          </div>
        )}
      </Card>
    );
  };


  // Only ongoing hackathons with valid hackathon object
  const ongoingHackathons = hackathons.filter(h => h.hackathon && h.hackathon.status === 'ongoing');

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>My Approved Hackathons</Title>
      {/* Hackathon Dropdown with Search (Ongoing only) */}
      <div style={{ marginBottom: 24 }}>
        <Select
          showSearch
          style={{ minWidth: 300 }}
          placeholder="Search or select an ongoing hackathon"
          value={selectedHackathon?.hackathon?._id || undefined}
          onChange={hackathonId => {
            const hack = ongoingHackathons.find(h => h.hackathon._id === hackathonId);
            setSelectedHackathon(hack);
            fetchProblemStatements(hackathonId);
          }}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
          optionFilterProp="children"
        >
          {ongoingHackathons.map(h => (
            <Select.Option key={h.hackathon._id} value={h.hackathon._id}>
              {h.hackathon.hackathonname}
            </Select.Option>
          ))}
        </Select>
      </div>
      {/* Show selected hackathon's problem statements */}
      {loading ? <Spin size="large" /> : selectedHackathon && renderHackathonCard(selectedHackathon)}

      {/* ✅ Add Problem Modal */}
      <Modal
        title={`Add Problem Statement - ${selectedHackathon?.hackathon.hackathonname || ""}`}
        open={modalVisible}
        footer={null}
        onCancel={() => {
          setModalVisible(false);
          addForm.resetFields();
          setTechnologies([]);
          setTechInput("");
        }}
      >
        <Form
          layout="vertical"
          onFinish={handleAddProblem}
          form={addForm}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Problem Title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <TextArea rows={4} placeholder="Describe the problem..." />
          </Form.Item>
          <Form.Item label="Technologies">
            <Input
              placeholder="Enter tech and press Enter or click Add"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault();
                handleAddTech();
              }}
            />
            <Button type="link" onClick={handleAddTech} style={{ padding: 0 }}>
              Add
            </Button>
            <div style={{ marginTop: 8 }}>
              {technologies.map((tech, idx) => (
                <Tag
                  key={idx}
                  closable
                  onClose={() => handleRemoveTech(tech)}
                >
                  {tech}
                </Tag>
              ))}
            </div>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  addForm.resetFields();
                  setTechnologies([]);
                  setTechInput("");
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ✅ Edit Problem Modal */}
      <Modal
        title={`Edit Problem Statement - ${selectedHackathon?.hackathon.hackathonname || ""}`}
        open={editModalVisible}
        footer={null}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setTechnologies([]);
          setTechInput("");
        }}
      >
        <Form
          layout="vertical"
          onFinish={handleEditProblem}
          form={editForm}
          initialValues={{
            title: currentProblem?.title,
            description: currentProblem?.description,
          }}
          key={currentProblem?._id || 'edit-form'}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Technologies">
            <Input
              placeholder="Enter tech and press Enter or click Add"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault();
                handleAddTech();
              }}
            />
            <Button type="link" onClick={handleAddTech} style={{ padding: 0 }}>
              Add
            </Button>
            <div style={{ marginTop: 8 }}>
              {technologies.map((tech, idx) => (
                <Tag
                  key={idx}
                  closable
                  onClose={() => handleRemoveTech(tech)}
                >
                  {tech}
                </Tag>
              ))}
            </div>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  editForm.resetFields();
                  setTechnologies([]);
                  setTechInput("");
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MentorProblemStatementsPage;
