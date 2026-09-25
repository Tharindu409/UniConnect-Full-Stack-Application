import API from "../components/Auth/axios";

export const createMentorProfile = async (clubId, payload) => {
  const res = await API.post(`/mentorships/club/${clubId}/mentor-profile`, payload);
  return res.data;
};

export const getMyMentorProfile = async (clubId) => {
  const res = await API.get(`/mentorships/club/${clubId}/my-mentor-profile`);
  return res.data;
};

export const updateMyMentorProfile = async (clubId, payload) => {
  const res = await API.put(`/mentorships/club/${clubId}/mentor-profile`, payload);
  return res.data;
};

export const deleteMyMentorProfile = async (clubId) => {
  const res = await API.delete(`/mentorships/club/${clubId}/mentor-profile`);
  return res.data;
};

export const getClubMentors = async (clubId) => {
  const res = await API.get(`/mentorships/club/${clubId}/mentors`);
  return res.data;
};

export const getRecommendedMentors = async (clubId, payload) => {
  const res = await API.post(`/mentorships/club/${clubId}/recommend`, payload);
  return res.data;
};

export const createMentorshipRequest = async (clubId, payload) => {
  const res = await API.post(`/mentorships/club/${clubId}/request`, payload);
  return res.data;
};

export const getMyMentorshipRequests = async () => {
  const res = await API.get("/mentorships/my-requests");
  return res.data;
};

export const getMyMentorships = async () => {
  const res = await API.get("/mentorships/my-mentorships");
  return res.data;
};

export const getMentorRequests = async () => {
  const res = await API.get("/mentorships/mentor-requests");
  return res.data;
};

export const getMentorMentorships = async () => {
  const res = await API.get("/mentorships/mentor-mentorships");
  return res.data;
};

export const updateMentorshipRequestStatus = async (requestId, payload) => {
  const normalizedPayload = {
    ...payload,
    status: String(payload?.status || "").trim().toLowerCase(),
  };

  const res = await API.put(
    `/mentorships/request/${requestId}/status`,
    normalizedPayload
  );
  return res.data;
};