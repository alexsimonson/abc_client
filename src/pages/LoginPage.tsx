import { useState } from "react";
import { useAuth } from "../auth/authProvider";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@abc.com");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  if (user?.isAdmin) {
    navigate("/admin/items");
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      // Redirect to admin items page after successful login
      navigate("/admin/items");
    } catch (e: any) {
      setErr(e?.message ?? "LOGIN_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>ABC Admin Login</h1>
      <p style={{ opacity: 0.8 }}>Login to access admin features.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            type="password"
            autoComplete="current-password"
          />
        </label>

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button disabled={busy} style={{ padding: 10 }}>
          {busy ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
