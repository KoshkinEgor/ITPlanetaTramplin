import { routes } from "../../app/routes";
import { getCandidateEducation, getCandidateProfile } from "../../api/candidate";
import { getCurrentAuthUser } from "../../auth/api";
import { isCandidateOnboardingComplete } from "../../candidate-portal/onboarding";

function isUnauthorized(error) {
  return error?.status === 401;
}

export async function loadCandidateCareerContext(signal) {
  try {
    const authUser = await getCurrentAuthUser();

    switch (authUser?.role) {
      case "candidate": {
        const [profile, education] = await Promise.all([
          getCandidateProfile(signal),
          getCandidateEducation(signal),
        ]);
        const educationItems = Array.isArray(education) ? education : [];

        return {
          kind: "candidate",
          authUser,
          profile,
          education: educationItems,
          onboardingComplete: isCandidateOnboardingComplete(profile, educationItems),
        };
      }
      case "company":
        return { kind: "company", authUser, redirectTo: routes.company.dashboard };
      case "moderator":
        return { kind: "moderator", authUser, redirectTo: routes.moderator.dashboard };
      default:
        return { kind: "guest", authUser: null };
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return { kind: "guest", authUser: null };
    }

    throw error;
  }
}
