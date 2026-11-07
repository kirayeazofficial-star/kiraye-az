// One sign-out used by the account menu, the side menu, the cabinet and the profile page.
export async function signOut() {
  const response = await fetch("/api/auth/host", { method: "DELETE" });
  if (!response.ok) throw new Error("sign_out_failed");
  try { sessionStorage.removeItem("kiraye:pending-confirmation"); sessionStorage.removeItem("kiraye:login-email"); } catch {}
  window.location.href = "/";
}
