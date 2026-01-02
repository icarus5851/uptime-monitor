import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Activity, Globe, Loader2, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "../api";
import { Badge } from "../components/ui/Card";
import { formatDistance } from "date-fns";

export default function MonitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState(null);
  const [history, setHistory] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchData = async (isBackground = false) => {
    try {
      const [monRes, histRes, incRes] = await Promise.all([
        api.get(`/monitors/${id}`),
        api.get(`/monitors/${id}/history`),
        api.get(`/monitors/${id}/incidents`)
      ]);
      setMonitor(monRes.data);
      
      const formattedHistory = histRes.data.map(log => {
        const isError = log.status_code === 0 || log.status_code >= 400;
        return {
          time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latencyUp: isError ? null : log.latency_ms,
          latencyDown: isError ? (log.latency_ms || 10) : null, 
          status: log.status_code
        };
      });
      
      setHistory(formattedHistory); 
      setIncidents(incRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [id]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="animate-pulse">Fetching...</p>
      </div>
    );
  }

  if (!monitor) return <div className="min-h-screen bg-background flex items-center justify-center text-destructive">Monitor Not Found</div>;

  const isUp = monitor.last_status >= 200 && monitor.last_status < 400;

  return (
    <div className="flex-1 bg-background text-foreground font-sans p-4 md:p-10 pb-20 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm w-full">
          <div className="space-y-1 w-full md:w-auto min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl md:text-3xl font-bold truncate" title={monitor.name}>{monitor.name}</h1>
              <Badge variant={monitor.is_active ? "default" : "secondary"}>
                {monitor.is_active ? "Monitoring" : "Paused"}
              </Badge>
            </div>
            <a href={monitor.url} target="_blank" rel="noopener noreferrer" className="text-sm md:text-base text-muted-foreground flex items-center gap-2 hover:underline truncate">
              <Globe className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="truncate">{monitor.url}</span>
            </a>
            <div className="pt-2 flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Clock className="w-3 h-3 md:w-4 md:h-4" /> Frequency: <span className="text-foreground font-mono font-bold">{monitor.frequency}s</span>
            </div>
          </div>
          
          <div className={`w-full md:w-auto flex items-center gap-4 px-5 py-3 md:px-6 md:py-4 rounded-xl border-2 ${
              isUp 
              ? "bg-green-500/5 border-green-500/20 text-green-500" 
              : "bg-red-500/5 border-red-500/20 text-red-500"
          }`}>
              {isUp ? <CheckCircle className="w-8 h-8 md:w-10 md:h-10 shrink-0" /> : <XCircle className="w-8 h-8 md:w-10 md:h-10 shrink-0" />}
              <div>
                  <h2 className="text-lg md:text-xl font-bold leading-none tracking-tight">{isUp ? "OPERATIONAL" : "DOWNTIME"}</h2>
                  <p className="text-[10px] md:text-xs opacity-70 font-mono mt-1 uppercase tracking-wide">
                      {isUp ? "System Normal" : `Code: ${monitor.last_status || "TIMEOUT"}`}
                  </p>
              </div>
          </div>
        </div>

        <div className="grid gap-6 w-full">
          
          {/* Graph Section */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm w-full min-w-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Latency History
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded border border-border/50">
                    <Info className="w-3 h-3" /> Last 50 pings
                </span>
            </div>
            
            {/* Graph Container */}
            <div className="h-[250px] md:h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={1}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  
                  <XAxis 
                    dataKey="time" 
                    stroke="#666" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30} 
                  />
                  
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} unit="ms" width={40} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="latencyUp" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorUp)" connectNulls={true} />
                  <Area type="monotone" dataKey="latencyDown" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDown)" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm w-full min-w-0">
            <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Recent Downtime
            </h3>
            
            {incidents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-secondary/5 rounded-lg border border-dashed border-border/50">
                    <p className="text-sm">No downtime recorded in the last 5 days. 🚀</p>
                </div>
            ) : (
                <div className="w-full overflow-hidden rounded-lg border border-border">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                            <thead className="bg-secondary/50 text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4 font-medium">Started At</th>
                                    <th className="py-3 px-4 font-medium">Duration</th>
                                    <th className="py-3 px-4 font-medium">Error Code</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {incidents.map((inc, i) => (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 font-mono text-foreground text-xs md:text-sm">
                                            <span className="md:hidden">
                                                {new Date(inc.start_time).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                            </span>
                                            <span className="hidden md:inline">
                                                {new Date(inc.start_time).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' })}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-foreground text-xs md:text-sm">
                                            {formatDistance(0, inc.duration_seconds * 1000, { includeSeconds: true })}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="error">
                                                {inc.error_code === 0 ? "Timeout" : `Err ${inc.error_code}`}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}