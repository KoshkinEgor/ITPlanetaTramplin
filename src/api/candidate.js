import { apiRequest } from "../lib/http";

export function getCandidateProfile(signal) {
  return apiRequest("/candidate/me", { signal });
}

export function updateCandidateProfile(body) {
  return apiRequest("/candidate/me", {
    method: "PUT",
    body,
  });
}

export function getCandidateEducation(signal) {
  return apiRequest("/candidate/me/education", { signal });
}

export function createCandidateEducation(body) {
  return apiRequest("/candidate/me/education", {
    method: "POST",
    body,
  });
}

export function updateCandidateEducation(educationId, body) {
  return apiRequest(`/candidate/me/education/${educationId}`, {
    method: "PUT",
    body,
  });
}

export function deleteCandidateEducation(educationId) {
  return apiRequest(`/candidate/me/education/${educationId}`, {
    method: "DELETE",
  });
}

export function getCandidateAchievements(signal) {
  return apiRequest("/candidate/me/achievements", { signal });
}

export function createCandidateAchievement(body) {
  return apiRequest("/candidate/me/achievements", {
    method: "POST",
    body,
  });
}

export function updateCandidateAchievement(achievementId, body) {
  return apiRequest(`/candidate/me/achievements/${achievementId}`, {
    method: "PUT",
    body,
  });
}

export function deleteCandidateAchievement(achievementId) {
  return apiRequest(`/candidate/me/achievements/${achievementId}`, {
    method: "DELETE",
  });
}

export function getCandidateProjects(signal) {
  return apiRequest("/candidate/me/projects", { signal });
}

export function createCandidateProject(body) {
  return apiRequest("/candidate/me/projects", {
    method: "POST",
    body,
  });
}

export function updateCandidateProject(projectId, body) {
  return apiRequest(`/candidate/me/projects/${projectId}`, {
    method: "PUT",
    body,
  });
}

export function deleteCandidateProject(projectId) {
  return apiRequest(`/candidate/me/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function getCandidateApplications(signal) {
  return apiRequest("/candidate/me/applications", { signal });
}

export function getCandidateContacts(signal) {
  return apiRequest("/candidate/me/contacts", { signal });
}

export function createCandidateContact(body) {
  return apiRequest("/candidate/me/contacts", {
    method: "POST",
    body,
  });
}

export function deleteCandidateContact(contactId) {
  return apiRequest(`/candidate/me/contacts/${contactId}`, {
    method: "DELETE",
  });
}

export function getCandidateRecommendations(signal) {
  return apiRequest("/candidate/me/recommendations", { signal });
}
