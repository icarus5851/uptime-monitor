import { useEffect, useState } from "react";
import api from "../api";
import MonitorCard from "../components/MonitorCard";
import AddMonitorModal from "../components/AddMonitorModal";
import { MonitorSkeleton } from "../components/ui/Skeleton";
import { Plus, ServerCrash, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monitorToEdit, setMonitorToEdit] = useState(null);

  const fetchMonitors = async () => {
    try {
      const res = await api.get("/monitors");
      const sorted = res.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMonitors(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAdd = () => {
    setMonitorToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditMonitor = (monitor) => {
    setMonitorToEdit(monitor);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header Section */}
      <div className="bg-card border-b border-border/50 shadow-sm rounded-b-3xl mb-8">
        <div className="max-w-6xl mx-auto px-6 py-8 md:px-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="logo text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="relative flex items-center justify-center">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                        </div>
                        <span>Over<span className="text-primary">seer.</span></span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        System Status: <span className="text-green-500">Active</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => navigate('/profile')}
                        className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border text-foreground hover:text-primary"
                        title="My Profile"
                    >
                        <UserCircle className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={handleOpenAdd}
                        className="flex-1 md:flex-none group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                    >
                        <span className="mr-2"><Plus className="w-5 h-5" /></span>
                        <span>Add Monitor</span>
                    </button>
                </div>
            </header>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-10 pb-20">
        {loading ? (
          <MonitorSkeleton />
        ) : monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/60 rounded-3xl bg-card/30 h-[400px]">
            <div className="p-6 bg-muted/50 rounded-full mb-4 ring-8 ring-muted/20">
              <ServerCrash className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Active Monitors</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-sm">
              Your dashboard is empty. Add a URL to start tracking uptime and latency metrics.
            </p>
            <button 
              onClick={handleOpenAdd}
              className="text-primary hover:text-primary/80 hover:underline underline-offset-4 text-sm font-semibold transition-colors"
            >
              + Create your first monitor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitors.map((m) => (
              <MonitorCard 
                  key={m.id} 
                  monitor={m} 
                  refresh={fetchMonitors} 
                  onEdit={handleEditMonitor} 
              />
            ))}
          </div>
        )}
      </main>

      <AddMonitorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdded={fetchMonitors}
        monitorToEdit={monitorToEdit}
      />
    </div>
  );
}

export default Dashboard;