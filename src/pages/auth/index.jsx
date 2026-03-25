import { useSearchParams } from "react-router-dom";
import { AuthApp } from "../../auth/AuthApp";

export function AuthLoginPage() {
  const [searchParams] = useSearchParams();
  const page = searchParams.get("step") === "details" ? "login-details" : "login";

  return <AuthApp page={page} />;
}

export function CandidateRegistrationPage() {
  return <AuthApp page="register" />;
}

export function CompanyQuickRegistrationPage() {
  return <AuthApp page="company-quick" />;
}

export function CompanyExtendedRegistrationPage() {
  return <AuthApp page="company-extended" />;
}

export function ConfirmEmailPage() {
  return <AuthApp page="confirm" />;
}

export function ForgotPasswordPage() {
  return <AuthApp page="forgot-password" />;
}

export function ResetPasswordPage() {
  return <AuthApp page="reset-password" />;
}
