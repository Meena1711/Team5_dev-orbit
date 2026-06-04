import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import UserNavbar from './CoordinatorHeader/CoordinatorHeader';
import HackathonNotifications from './Notification'
import UserRoomAllocationBatch from './room allocation/roomallocation';
import FeeVerificationDashboard from './hack-reg/hack-reg';
import ResourcePage from '../HackResource';
import TeamFormation from './teams/hackteam';
import HackathonSubmissionApp from './hacksubmission/hacksubmission';
import MentorTeamTabs from './teams/assignedteams';
import MentorFeedbackDashboard from './mentorfeedback/hackmentorfeedback';
import HackathonAttendanceManager from './hackathonattendance/hackathonattendance';
import AttendanceHistoryViewer from './hackathonattendance/hackattendancehistory';


function Coordinator() {
    
  return (
    <div>
     <UserNavbar/>
    <Routes>
        <Route path="/" element={<Navigate to="fee-verification" replace />} />
        <Route path="/notifications" element={<HackathonNotifications />} />
        <Route path="/roomallocation" element={<UserRoomAllocationBatch />} />
        <Route path="/fee-verification" element={<FeeVerificationDashboard />} />
        <Route path="/resource" element={<ResourcePage />} />
        <Route path="/hackteam" element={<TeamFormation />} />
        <Route path="/hacksubmission" element={<HackathonSubmissionApp />} />
        <Route path="/assignmentor" element={<MentorTeamTabs />} />
        <Route path="/hackfeedback" element={<MentorFeedbackDashboard />} />
        <Route path="/hackattendance" element={<HackathonAttendanceManager />} />
        <Route path="/hackattendancehistory" element={<AttendanceHistoryViewer />} />
    </Routes>
    </div>
  );
}

export default Coordinator;