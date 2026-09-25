import API from "../components/Auth/axios";

export const getClubElections = async (clubId) => {
  const res = await API.get(`/elections/club/${clubId}`);
  return res.data;
};

export const getElectionById = async (electionId) => {
  const res = await API.get(`/elections/${electionId}`);
  return res.data;
};

export const createElection = async (payload) => {
  const res = await API.post("/elections", payload);
  return res.data;
};

export const updateElection = async (electionId, payload) => {
  const res = await API.put(`/elections/${electionId}`, payload);
  return res.data;
};

export const deleteElection = async (electionId) => {
  const res = await API.delete(`/elections/${electionId}`);
  return res.data;
};

export const voteElection = async (electionId, payload) => {
  const res = await API.post(`/elections/${electionId}/vote`, payload);
  return res.data;
};

export const getElectionResults = async (electionId) => {
  const res = await API.get(`/elections/${electionId}/results`);
  return res.data;
};

export const addElectionCandidate = async (electionId, payload) => {
  const res = await API.post(`/elections/${electionId}/candidates`, payload);
  return res.data;
};

export const removeElectionCandidate = async (electionId, candidateIndex) => {
  const res = await API.delete(
    `/elections/${electionId}/candidates/${candidateIndex}`
  );
  return res.data;
};