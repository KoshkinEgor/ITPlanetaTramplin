import { useEffect, useSyncExternalStore } from "react";
import { getCandidateApplications } from "../api/candidate";
import { ApiError } from "../lib/http";

const initialSnapshot = {
  status: "idle",
  applications: [],
  error: null,
};

let candidateApplicationsSnapshot = initialSnapshot;
let candidateApplicationsRequest = null;

const candidateApplicationsListeners = new Set();

function emitCandidateApplicationsChange() {
  candidateApplicationsListeners.forEach((listener) => listener());
}

function setCandidateApplicationsSnapshot(nextSnapshot) {
  candidateApplicationsSnapshot = nextSnapshot;
  emitCandidateApplicationsChange();
}

function sortApplications(items) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left?.appliedAt ?? "") || 0;
    const rightTime = Date.parse(right?.appliedAt ?? "") || 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return Number(right?.id ?? 0) - Number(left?.id ?? 0);
  });
}

function mergeApplicationRecord(applications, nextApplication) {
  const withoutCurrent = applications.filter((item) => String(item.id) !== String(nextApplication.id));
  return sortApplications([nextApplication, ...withoutCurrent]);
}

export function getCandidateApplicationsSnapshot() {
  return candidateApplicationsSnapshot;
}

export function subscribeCandidateApplications(listener) {
  candidateApplicationsListeners.add(listener);

  return () => {
    candidateApplicationsListeners.delete(listener);
  };
}

export function resetCandidateApplicationsStore() {
  candidateApplicationsRequest = null;
  setCandidateApplicationsSnapshot(initialSnapshot);
}

export async function refreshCandidateApplications({ force = false } = {}) {
  if (!force) {
    if (candidateApplicationsSnapshot.status === "ready") {
      return candidateApplicationsSnapshot.applications;
    }

    if (candidateApplicationsRequest) {
      return candidateApplicationsRequest;
    }
  } else if (candidateApplicationsRequest) {
    return candidateApplicationsRequest;
  }

  const previousApplications = candidateApplicationsSnapshot.applications;

  setCandidateApplicationsSnapshot({
    status: "loading",
    applications: previousApplications,
    error: null,
  });

  candidateApplicationsRequest = (async () => {
    try {
      const response = await getCandidateApplications();
      const applications = sortApplications(Array.isArray(response) ? response : []);

      setCandidateApplicationsSnapshot({
        status: "ready",
        applications,
        error: null,
      });

      return applications;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setCandidateApplicationsSnapshot({
          status: "unauthorized",
          applications: [],
          error,
        });
      } else {
        setCandidateApplicationsSnapshot({
          status: "error",
          applications: previousApplications,
          error,
        });
      }

      throw error;
    } finally {
      candidateApplicationsRequest = null;
    }
  })();

  return candidateApplicationsRequest;
}

export function upsertCandidateApplication(nextApplication) {
  if (!nextApplication || typeof nextApplication !== "object") {
    return null;
  }

  const applications = mergeApplicationRecord(candidateApplicationsSnapshot.applications, nextApplication);

  setCandidateApplicationsSnapshot({
    status: "ready",
    applications,
    error: null,
  });

  return nextApplication;
}

export function useCandidateApplications({ autoRefresh = true } = {}) {
  const snapshot = useSyncExternalStore(
    subscribeCandidateApplications,
    getCandidateApplicationsSnapshot,
    getCandidateApplicationsSnapshot
  );

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    void refreshCandidateApplications().catch(() => {});
  }, [autoRefresh]);

  return snapshot;
}
