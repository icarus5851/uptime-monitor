import { useState, useEffect } from "react";
import { Card } from "./ui/Card";
import { Globe, Activity, Clock, Trash2, PauseCircle, PlayCircle, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

export default function MonitorCard({ monitor, refresh, onEdit }) {
  const navigate = useNavigate();
  const [localActive, setLocalActive] = useState(monitor.is_active);

  useEffect(() => {
    setLocalActive(monitor.is_active);
  }, [monitor.is_active]);

  const handleDelete = async (e) => {
    e.stopPropagation(); 
    if(!confirm("Delete this monitor?")) return;
    try {
        await api.delete(`/monitors/${monitor.id}`);
        toast.success("Monitor deleted");
        refresh();
    } catch (err) {
        toast.error("Failed to delete");
    }
  };

  const handleToggle = async (e) => {
    e.stopPropagation();
    const newState = !localActive;
    setLocalActive(newState); 

    try {
        await api.post(`/monitors/${monitor.id}/pause`);
        refresh(); 
    } catch (err) {
        setLocalActive(!newState);
        toast.error("Failed to update status");
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(monitor);
  };

  const isUp = monitor.last_status >= 200 && monitor.last_status < 400;
  const isPaused = !localActive; 

  return (
    <Card 
      onClick={() => navigate(`/monitor/${monitor.id}`)}
      className="p-5 flex flex-col gap-4 relative group cursor-pointer hover:border-primary/50 transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-border"
    >
      {/* Header */}
      <div className="flex justify-between items-start h-8">
        <div className="flex gap-3 items-center">
          <div className={`p-2 rounded-lg transition-colors ${
            isPaused ? 'bg-secondary text-muted-foreground' : 
            !isUp ? 'bg-destructive/10 text-destructive' : 
            'bg-green-500/10 text-green-500'
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{monitor.name || "Unknown"}</h3>
            <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
              {monitor.url}
            </span>
          </div>
        </div>

        <div className="relative flex items-center">
            <div className={`transition-opacity duration-200 ${
                isPaused ? "opacity-100" : "opacity-100" 
            } md:group-hover:opacity-0`}>
                <div className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                    isPaused ? "bg-secondary text-muted-foreground" : 
                    isUp ? "bg-green-500/10 text-green-500" : 
                    "bg-red-500/10 text-red-500"
                }`}>
                    {isPaused ? "PAUSED" : isUp ? "UP" : "DOWN"}
                </div>
            </div>

            <div className="absolute right-0 top-[-4px] flex gap-1 bg-background/95 backdrop-blur-md p-1 rounded-md shadow-sm border border-border/50 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button 
                    onClick={handleToggle}
                    className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                    title={isPaused ? "Resume" : "Pause"}
                >
                    {isPaused ? <PlayCircle className="w-4 h-4"/> : <PauseCircle className="w-4 h-4"/>}
                </button>
                <button 
                    onClick={handleEdit}
                    className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Edit"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button 
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-secondary/50 p-2 rounded-lg flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" /> Latency
            </span>
            <span className={`font-mono font-bold text-lg ${
                !monitor.last_latency ? 'text-muted-foreground' : 
                monitor.last_latency > 500 ? 'text-destructive' : 'text-primary'
            }`}>
                {monitor.last_latency ? `${monitor.last_latency}ms` : '--'}
            </span>
        </div>
        <div className="bg-secondary/50 p-2 rounded-lg flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Frequency
            </span>
            <span className="font-mono font-bold text-foreground">
                {monitor.frequency}s
            </span>
        </div>
      </div>
    </Card>
  );
}