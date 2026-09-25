import API from "../components/Auth/axios";

export const getClubMeetings = async (clubId) => {
  const res = await API.get(`/clubmeetings/club/${clubId}`);
  return res.data;
};

export const getPendingClubMeetings = async () => {
  const res = await API.get("/clubmeetings/pending/all");
  return res.data;
};

export const getClubMeetingById = async (meetingId) => {
  const res = await API.get(`/clubmeetings/${meetingId}`);
  return res.data;
};

export const createClubMeeting = async (formData) => {
  const res = await API.post("/clubmeetings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateClubMeeting = async (meetingId, formData) => {
  const res = await API.put(`/clubmeetings/${meetingId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const approveClubMeeting = async (meetingId, payload) => {
  const res = await API.put(`/clubmeetings/${meetingId}/approve`, payload);
  return res.data;
};

export const rejectClubMeeting = async (meetingId, payload) => {
  const res = await API.put(`/clubmeetings/${meetingId}/reject`, payload);
  return res.data;
};

export const deleteClubMeeting = async (meetingId) => {
  const res = await API.delete(`/clubmeetings/${meetingId}`);
  return res.data;
};