import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";

// Components
import UserNavbar from "./StudentHeader/StudentHeader";
import HackathonNotifications from "./Notification";
import ScheduleDisplay from "./schedule/studentschedule";
import HackathonsByStatus from "./hackathon/hackathon";
import ResourcePage from "../HackResource";
import ApprovedScheduleViewer from "./roomallocation/roomallocation";
import TeamManagementDashboard from "./hackteamformation/hackteam";
import TeamProblemStatementsPage from "./Problem Statements/Problemstatements";
import HackathonSubmissionForm from "./hacksubmission/hacksubmission";
import TeamProgressForm from "./Teamprogress/Teamprogess";
import AllTeamsProgressPage from "./Teamprogress/TeamsProgress";

function HackStudent() {
  const [hackathonId, setHackathonId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOngoingHackathon = async () => {
      try {
        const studentId = localStorage.getItem("student");
        if (!studentId) {
          console.warn("⚠️ No studentId found in localStorage.");
          setIsLoading(false);
          return;
        }

        console.log("🔍 Fetching ongoing approved hackathon for student:", studentId);

        const { data } = await axios.get(
          `${config.backendUrl}/hackreg/student/${studentId}/ongoing-approved`
        );

        if (data?.hackathon) {
          const hackId = data.hackathon._id;
          setHackathonId(hackId);
          localStorage.setItem("selectedHackathonId", hackId);
          console.log("✅ Ongoing approved hackathon stored:", data.hackathon.hackathonname);
        } else {
          setHackathonId(null);
          localStorage.removeItem("selectedHackathonId");
          console.log("ℹ️ No ongoing approved hackathon found.");
        }
      } catch (error) {
        console.error("❌ Error fetching ongoing hackathon:", error);
        setHackathonId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOngoingHackathon();
  }, []);

  // Show loading state while fetching hackathon
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your hackathon data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <UserNavbar />
      <Routes>
        <Route path="/" element={<Navigate to="hackathon" replace />} />
        <Route path="/notifications" element={<HackathonNotifications />} />
        <Route path="/schedule" element={<ScheduleDisplay />} />
        <Route path="/hackathon" element={<HackathonsByStatus />} />
        <Route path="/resources" element={<ResourcePage />} />
        <Route path="/roomallocation" element={<ApprovedScheduleViewer />} />
        <Route path="/team-formation" element={<TeamManagementDashboard />} />
        <Route path="/problemstatements" element={<TeamProblemStatementsPage />} />
        <Route 
          path="/hacksubmission" 
          element={<HackathonSubmissionForm hackathonId={hackathonId} />} 
        />
        <Route path="/teamprogress" element={<TeamProgressForm />} />
        <Route path="/allteamsprogress" element={<AllTeamsProgressPage />} />
      </Routes>
    </div>
  );
}

export default HackStudent;