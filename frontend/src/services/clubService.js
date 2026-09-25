import API from "../components/Auth/axios";

// ================= CLUB SERVICES =================
export const getMyClubs = async () => {
  const res = await API.get("/clubs/my-clubs");
  return res.data;
};

export const getActiveClubs = async () => {
  const res = await API.get("/clubs/active");
  return res.data;
};

export const requestJoinClub = async (clubId) => {
  const res = await API.post(`/clubs/${clubId}/join`);
  return res.data;
};

export const cancelJoinRequest = async (clubId) => {
  const res = await API.delete(`/clubs/${clubId}/join-request`);
  return res.data;
};

export const getJoinStatus = async (clubId) => {
  const res = await API.get(`/clubs/${clubId}/join-status`);
  return res.data;
};

export const getClubDashboard = async (clubId) => {
  const res = await API.get(`/clubs/${clubId}/dashboard`);
  return res.data;
};

export const getClubById = async (clubId) => {
  const res = await API.get(`/clubs/${clubId}`);
  return res.data;
};

export const updateClubProfile = async (clubId, payload) => {
  const res = await API.put(`/clubs/${clubId}`, payload);
  return res.data;
};

export const uploadClubConstitution = async (clubId, formData) => {
  const res = await API.post(`/clubs/${clubId}/constitution`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateClubLogo = async (clubId, formData) => {
  const res = await API.put(`/clubs/${clubId}/logo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const getAllJoinRequests = async (clubId, status = "all") => {
  const res = await API.get(`/clubs/${clubId}/join-requests/all`, {
    params: { status },
  });
  return res.data;
};

export const approveJoinRequest = async (clubId, requestId) => {
  const res = await API.put(
    `/clubs/${clubId}/join-requests/${requestId}/approve`
  );
  return res.data;
};

export const rejectJoinRequest = async (clubId, requestId, reason) => {
  const res = await API.put(
    `/clubs/${clubId}/join-requests/${requestId}/reject`,
    { reason }
  );
  return res.data;
};

// ================= MEMBERSHIP SERVICES =================

export const getClubMembers = async (clubId) => {
  const res = await API.get(`/membership/${clubId}/members`);
  return res.data;
};

export const getPendingMembershipRequests = async (clubId) => {
  const res = await API.get(`/membership/${clubId}/requests`);
  return res.data;
};

export const requestMembershipToClub = async (clubId) => {
  const res = await API.post(`/membership/${clubId}/request`);
  return res.data;
};

export const getMembershipJoinStatus = async (clubId) => {
  const res = await API.get(`/membership/${clubId}/status`);
  return res.data;
};

export const approveMembershipRequest = async (clubId, membershipId) => {
  const res = await API.put(
    `/membership/${clubId}/members/${membershipId}/approve`
  );
  return res.data;
};

export const rejectMembershipRequest = async (clubId, membershipId) => {
  const res = await API.put(
    `/membership/${clubId}/members/${membershipId}/reject`
  );
  return res.data;
};

export const removeClubMember = async (clubId, membershipId) => {
  const res = await API.delete(
    `/membership/${clubId}/members/${membershipId}`
  );
  return res.data;
};

export const updateClubMemberRole = async (clubId, membershipId, role) => {
  const res = await API.put(
    `/membership/${clubId}/members/${membershipId}/role`,
    { role }
  );
  return res.data;
};