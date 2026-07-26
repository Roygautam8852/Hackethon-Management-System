import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Public pages
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/public/LoginPage";
import SignupPage from "./pages/public/SignupPage";
import HackathonsPage from "./pages/public/HackathonsPage";
import HackathonDetailsPage from "./pages/public/HackathonDetailsPage";
import LeaderboardPage from "./pages/public/LeaderboardPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminOrganizersPage from "./pages/admin/AdminOrganizersPage";
import AdminJudgesPage from "./pages/admin/AdminJudgesPage";
import AdminParticipantsPage from "./pages/admin/AdminParticipantsPage";
import AdminTeamsPage from "./pages/admin/AdminTeamsPage";
import AdminHackathonsPage from "./pages/admin/AdminHackathonsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";

// Organizer pages
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import OrganizerHackathonsPage from "./pages/organizer/OrganizerHackathonsPage";
import CreateHackathonPage from "./pages/organizer/CreateHackathonPage";
import ManageHackathonPage from "./pages/organizer/ManageHackathonPage";
import OrganizerRegistrationsPage from "./pages/organizer/OrganizerRegistrationsPage";
import OrganizerSubmissionsPage from "./pages/organizer/OrganizerSubmissionsPage";
import OrganizerTeamsPage from "./pages/organizer/OrganizerTeamsPage";
import OrganizerJudgesPage from "./pages/organizer/OrganizerJudgesPage";
import OrganizerAnnounceWinnersPage from "./pages/organizer/OrganizerAnnounceWinnersPage";

// Participant pages
import ParticipantDashboard from "./pages/participant/ParticipantDashboard";
import ParticipantTeamPage from "./pages/participant/ParticipantTeamPage";
import ParticipantSubmissionPage from "./pages/participant/ParticipantSubmissionPage";
import ParticipantResultsPage from "./pages/participant/ParticipantResultsPage";

// Judge pages
import JudgeDashboard from "./pages/judge/JudgeDashboard";
import JudgeProjectsPage from "./pages/judge/JudgeProjectsPage";
import JudgeHackathonsPage from "./pages/judge/JudgeHackathonsPage";
import ReviewSubmissionPage from "./pages/judge/ReviewSubmissionPage";
import JudgeCompletedPage from "./pages/judge/JudgeCompletedPage";

// Profile
import ProfilePage from "./pages/ProfilePage";

// Error pages
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#18181b",
                color: "#f4f4f5",
                border: "1px solid #27272a",
                fontSize: "13px",
              },
            }}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/hackathons" element={
            <ProtectedRoute><HackathonsPage /></ProtectedRoute>
          } />
          <Route path="/hackathons/:id" element={
            <ProtectedRoute><HackathonDetailsPage /></ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute><LeaderboardPage /></ProtectedRoute>
          } />

          {/* Profile (any authenticated user) */}
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/organizers" element={
            <ProtectedRoute roles={["admin"]}><AdminOrganizersPage /></ProtectedRoute>
          } />
          <Route path="/admin/judges" element={
            <ProtectedRoute roles={["admin"]}><AdminJudgesPage /></ProtectedRoute>
          } />
          <Route path="/admin/participants" element={
            <ProtectedRoute roles={["admin"]}><AdminParticipantsPage /></ProtectedRoute>
          } />
          <Route path="/admin/teams" element={
            <ProtectedRoute roles={["admin"]}><AdminTeamsPage /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={["admin"]}><AdminUsersPage /></ProtectedRoute>
          } />
          <Route path="/admin/hackathons" element={
            <ProtectedRoute roles={["admin"]}><AdminHackathonsPage /></ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute roles={["admin"]}><AdminAnalyticsPage /></ProtectedRoute>
          } />

          {/* Organizer routes */}
          <Route path="/organizer" element={
            <ProtectedRoute roles={["organizer"]}><OrganizerDashboard /></ProtectedRoute>
          } />
          <Route path="/organizer/hackathons" element={
            <ProtectedRoute roles={["organizer"]}><OrganizerHackathonsPage /></ProtectedRoute>
          } />
          <Route path="/organizer/hackathons/create" element={
            <ProtectedRoute roles={["organizer"]}><CreateHackathonPage /></ProtectedRoute>
          } />
          <Route path="/organizer/hackathons/:id" element={
            <ProtectedRoute roles={["organizer"]}><ManageHackathonPage /></ProtectedRoute>
          } />
          <Route path="/organizer/hackathons/:id/manage" element={
            <ProtectedRoute roles={["organizer"]}><ManageHackathonPage /></ProtectedRoute>
          } />
          <Route path="/organizer/registrations" element={
            <ProtectedRoute roles={["organizer"]}><OrganizerRegistrationsPage /></ProtectedRoute>
          } />
          <Route path="/organizer/submissions" element={
            <ProtectedRoute roles={["organizer"]}><OrganizerSubmissionsPage /></ProtectedRoute>
          } />
          <Route path="/organizer/teams" element={
            <ProtectedRoute roles={["organizer"]}><OrganizerTeamsPage /></ProtectedRoute>
          } />
          <Route path="/organizer/judges" element={
            <ProtectedRoute roles={["organizer"]}><OrganizerJudgesPage /></ProtectedRoute>
          } />
          <Route path="/organizer/announce-winners" element={
            <ProtectedRoute roles={["organizer"]}><OrganizerAnnounceWinnersPage /></ProtectedRoute>
          } />

          {/* Participant routes */}
          <Route path="/participant" element={
            <ProtectedRoute roles={["participant"]}><ParticipantDashboard /></ProtectedRoute>
          } />
          <Route path="/participant/team" element={
            <ProtectedRoute roles={["participant"]}><ParticipantTeamPage /></ProtectedRoute>
          } />
          <Route path="/participant/submission" element={
            <ProtectedRoute roles={["participant"]}><ParticipantSubmissionPage /></ProtectedRoute>
          } />
          <Route path="/participant/results" element={
            <ProtectedRoute roles={["participant"]}><ParticipantResultsPage /></ProtectedRoute>
          } />

          {/* Judge routes */}
          <Route path="/judge" element={
            <ProtectedRoute roles={["judge"]}><JudgeDashboard /></ProtectedRoute>
          } />
          <Route path="/judge/projects" element={
            <ProtectedRoute roles={["judge"]}><JudgeProjectsPage /></ProtectedRoute>
          } />
          <Route path="/judge/hackathons" element={
            <ProtectedRoute roles={["judge"]}><JudgeHackathonsPage /></ProtectedRoute>
          } />
          <Route path="/judge/projects/:submissionId/review" element={
            <ProtectedRoute roles={["judge"]}><ReviewSubmissionPage /></ProtectedRoute>
          } />
          <Route path="/judge/completed" element={
            <ProtectedRoute roles={["judge"]}><JudgeCompletedPage /></ProtectedRoute>
          } />

          {/* Error pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
