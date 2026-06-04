import React from 'react';
import { Route, Routes } from 'react-router-dom';
import UserNavbar from './MentorHeader/MentorHeader';
import HackathonNotifications from './Notification'
import HackMentorResource from './Hackmentorresource';
import ResourcePage from '../HackResource';
import Schedule from '../Student/schedule/studentschedule';
import RoomAllocationTable from './roomallocation/roomallocation';
import MentorHackathonPage from './Hackathons/Hackmentor';
import MentorProblemStatementsPage from './Problem Statements/Problemstatements';
import MentorSubmissionDashboard from './hacksubmission/hacksubmission';
import MentorHackathonTeams from './hackteam/hackteam';
import MentorEvaluationPage from './Evaluation/Evaluation';

function HackMentor() {
    
  return (
    <div>
     <UserNavbar/>
    <div>
    <Routes>
        <Route path="/notifications" element={<HackathonNotifications />} />
        <Route path="/uploadresource" element={<HackMentorResource />} />
        <Route path="/resource" element={<ResourcePage />} />
        <Route path='/schedule' element={<Schedule />} />
        <Route path='/roomallocation' element={<RoomAllocationTable />} />
        <Route path='/hackathons' element={<MentorHackathonPage />} />
        <Route path='/problemstatements' element={<MentorProblemStatementsPage />} />
        <Route path='/hacksubmission' element={<MentorSubmissionDashboard />} />
        <Route path='/hackteam' element={<MentorHackathonTeams />} />
        <Route path='/evaluation' element={<MentorEvaluationPage/>} />

    </Routes>
    </div>
    </div>
  );
}

export default HackMentor;