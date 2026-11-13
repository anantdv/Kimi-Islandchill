import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../stores/session";

export function Warehouse() {
  const navigate = useNavigate();
  const bootstrap = useSession((s) => s.bootstrap);
  const zones = bootstrap?.warehouse_zones || [];

  const { data: storageData } = useQuery({
    queryKey: ["storage-readings"],
    queryFn: async () => {
      // Would call storage API
      return { readings: [] };
    },
    refetchInterval: 60000,
  });

  return (
    <div className="page">
      <header className="app-header">
        <button onClick={() => navigate("/")}>&larr; Back</button>
        <h2>Warehouse</h2>
      </header>

      <div className="warehouse-grid">
        <section className="card">
          <h3>Zones</h3>
          {zones.length === 0 && <p>No zones configured</p>}
          {zones.map((z) => (
            <div key={z.name} className="zone-row">
              <strong>{z.zone_code}</strong>
              <span className="badge">{z.zone_type}</span>
            </div>
          ))}
        </section>

        <section className="card">
          <h3>Storage Conditions</h3>
          {(storageData?.readings || []).length === 0 && <p>No recent readings</p>}
        </section>

        <section className="card">
          <h3>Quick Actions</h3>
          <button>Record Reading</button>
          <button>Put-away</button>
          <button>Container Check</button>
        </section>
      </div>
    </div>
  );
}
