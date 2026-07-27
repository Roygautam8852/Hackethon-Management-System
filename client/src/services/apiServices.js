import api from "./api";

// Auth
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/update-profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// Users (admin)
export const userAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateRole: (id, role) => api.put(`/users/${id}`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
  toggleBlock: (id) => api.patch(`/users/${id}/block`),
  toggleApprove: (id) => api.patch(`/users/${id}/approve`),
  getAnalytics: () => api.get("/users/analytics"),
};

// Hackathons
export const hackathonAPI = {
  getAll: (params) => api.get("/hackathons", { params }),
  getAllAdmin: (params) => api.get("/hackathons/admin/all", { params }),
  getById: (id) => api.get(`/hackathons/${id}`),
  getMy: () => api.get("/hackathons/organizer/my"),
  create: (data) => api.post("/hackathons", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, data) => api.put(`/hackathons/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id) => api.delete(`/hackathons/${id}`),
  toggleRegistration: (id) => api.patch(`/hackathons/${id}/registration`),
  assignJudge: (id, judgeId) => api.post(`/hackathons/${id}/assign-judge`, { judgeId }),
  removeJudge: (id, judgeId) => api.delete(`/hackathons/${id}/assign-judge/${judgeId}`),
  publishResults: (id, data) => api.patch(`/hackathons/${id}/publish-results`, data),
  findJudgeByEmail: (email) => api.get("/hackathons/find-judge", { params: { email } }),
  getAllJudges: () => api.get("/hackathons/judges/all"),
  getMyAssigned: () => api.get("/hackathons/judge/assigned"),
};

// Teams
export const teamAPI = {
  create: (data) => api.post("/teams", data),
  getByHackathon: (hackathonId, params) => api.get(`/teams/hackathon/${hackathonId}`, { params }),
  getMy: (hackathonId) => api.get(`/teams/my/${hackathonId}`),
  getPendingInvitations: () => api.get("/teams/invitations/pending"),
  getById: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  invite: (id, data) => api.post(`/teams/${id}/invite`, data),
  respondInvitation: (id, action) => api.patch(`/teams/${id}/invitation`, { action }),
  updateMemberEmail: (id, userId, email) => api.patch(`/teams/${id}/members/${userId}/email`, { email }),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
  transferLeader: (id, newLeaderId) => api.patch(`/teams/${id}/transfer-leader`, { newLeaderId }),
  leave: (id) => api.delete(`/teams/${id}/leave`),
  delete: (id) => api.delete(`/teams/${id}`),
  getAllAdmin: () => api.get("/teams/admin/all"),
};

// Registrations
export const registrationAPI = {
  register: (data) => api.post("/registrations", data),
  getMy: () => api.get("/registrations/my"),
  getByHackathon: (hackathonId, params) => api.get(`/registrations/hackathon/${hackathonId}`, { params }),
  approve: (id) => api.patch(`/registrations/${id}/approve`),
  reject: (id, reason) => api.patch(`/registrations/${id}/reject`, { reason }),
  cancel: (id) => api.delete(`/registrations/${id}`),
};

// Submissions
export const submissionAPI = {
  create: (data) => api.post("/submissions", data),
  update: (id, data) => api.put(`/submissions/${id}`, data),
  getMySubmission: (hackathonId) => api.get(`/submissions/my/${hackathonId}`),
  getMyAll: (hackathonIds) => Promise.all(hackathonIds.map((id) => api.get(`/submissions/my/${id}`))),
  getByHackathon: (hackathonId, params) => api.get(`/submissions/hackathon/${hackathonId}`, { params }),
  getById: (id) => api.get(`/submissions/${id}`),
  updateStatus: (id, status) => api.patch(`/submissions/${id}/status`, { status }),
  assignJudges: (id, judgeIds) => api.patch(`/submissions/${id}/assign-judges`, { judgeIds }),
};

// Reviews
export const reviewAPI = {
  submit: (data) => api.post("/reviews", data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  getMy: () => api.get("/reviews/my"),
  getBySubmission: (submissionId) => api.get(`/reviews/submission/${submissionId}`),
  getByJudge: (judgeId) => api.get(`/reviews/judge/${judgeId}`),
  getJudgeDashboard: (hackathonId) => api.get(`/reviews/hackathon/${hackathonId}/judge`),
};

// Leaderboard
export const leaderboardAPI = {
  get: (hackathonId) => api.get(`/leaderboard/${hackathonId}`),
};

// Messages & Direct Chat
export const messageAPI = {
  send: (data) => api.post("/messages", data),
  get: (hackathonId) => api.get(`/messages${hackathonId ? `?hackathonId=${hackathonId}` : ""}`),
  getContacts: () => api.get("/messages/contacts"),
  getDirect: (userId) => api.get(`/messages/direct/${userId}`),
  sendDirect: (data) => api.post("/messages/direct", data),
};
