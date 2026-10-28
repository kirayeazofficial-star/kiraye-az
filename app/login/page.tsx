import LoginForm from "../components/LoginForm";
import { safeLoginDestination } from "../../lib/auth-messages";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const mode =
    params.mode === "signup" || params.mode === "reset" ? params.mode : "login";
  return (
    <LoginForm
      key={mode}
      initialMode={mode}
      next={safeLoginDestination(
        typeof params.next === "string" ? params.next : null,
      )}
    />
  );
}
