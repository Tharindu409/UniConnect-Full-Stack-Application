import APIClient from "../components/Auth/axios";

// GET all projects
export const getProjects = () =>
  APIClient.get("/projects");

// CREATE project
export const createProject = (data) =>
  APIClient.post("/projects/create", data);

// LIKE project
export const likeProject = (id) =>
  APIClient.put(`/projects/like/${id}`);

// DELETE project
export const deleteProject = (id) =>
  APIClient.delete(`/projects/${id}`);

// UPDATE project
export const updateProject = (id, data) =>
  APIClient.put(`/projects/${id}`, data);

// ADD comment
export const addComment = (id, data) =>
  APIClient.post(`/projects/comment/${id}`, data);

// GET comments
export const getComments = (id) =>
  APIClient.get(`/projects/comments/${id}`);

// DELETE comment
export const deleteComment = (commentId) =>
  APIClient.delete(`/projects/comment/${commentId}`);