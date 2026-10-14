import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";

export function Home() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const bootstrap = useSession((s) => s.bootstrap);

  const { data: stateData } = useQuery({
    queryKey: ["line-state"],
    queryFn: async () => {
      // In production: call state API
      return { lines: bootstrap?.filling_lines || [] };
    },
    refetchInterval: 30000,
  });

  const lines = stateData?.lines || bootstrap?.filling_lines || [];

  return (
    <div className="page">
      <header className="app-header">
        <h1>Island Chill MES</h1>
        <span className="user-badge">{user?.name}</span>
      </header>

      <main className="home-grid">
        <section className="card actions">
          <h3>Quick Actions</h3>
          <button className="btn-primary" onClick={() => navigate("/workorders/new")}>
            + New Work Order
          </button>
          <button onClick={() => navigate("/incidents")}>Incidents</button>
          <button onClick={() => navigate("/warehouse")}>Warehouse</button>
        </section>

        <section className="card lines">
          <h3>Filling Lines</h3>
          {lines.length === 0 && <p>No active lines configured</p>}
          {lines.map((line) => (
            <div key={line.name} className="line-row">
              <div className="line-info">
                <strong>{line.line_name}</strong>
                <span className="badge">{line.line_code}</span>
              </div>
              <div className="line-status idle">Idle</div>
            </div>
          ))}
        </section>

        <section className="card queue">
          <h3>Active Work Orders</h3>
          <p>No active work orders</p>
        </section>
      </main>
    </div>
  );
}
