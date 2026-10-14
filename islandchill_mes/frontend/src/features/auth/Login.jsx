import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";

export function Login() {
  const navigate = useNavigate();
  const setSession = useSession((s) => s.setSession);
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // Frappe login
      const loginRes = await fetch("/api/method/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usr, pwd }),
        credentials: "same-origin",
      });
      if (!loginRes.ok) throw new Error("Login failed");

      // Bootstrap MES data
      const bootstrapRes = await fetch(
        "/api/method/islandchill_mes.api.auth.bootstrap",
        { credentials: "same-origin" }
      );
      const bootstrapData = await bootstrapRes.json();
      const bootstrap = bootstrapData.message || bootstrapData;

      setSession({ name: usr, full_name: bootstrap.user }, bootstrap);
      navigate("/");
    } catch (e2) {
      setErr("Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form onSubmit={submit} className="login-card">
        <div className="logo">Island Chill</div>
        <h2>Manufacturing Execution System</h2>
        <input
          placeholder="Username"
          value={usr}
          onChange={(e) => setUsr(e.target.value)}
          autoComplete="username"
        />
        <input
          placeholder="Password"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
        {err && <p className="error">{err}</p>}
      </form>
    </div>
  );
}
