import { useState, useEffect } from "react";
import { X, Loader2, Link as LinkIcon, Type, Timer, Save, ChevronDown } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

export default function AddMonitorModal({ isOpen, onClose, onAdded, monitorToEdit = null }) {

  const [formData, setFormData] = useState({ url: "", name: "", frequency: 300 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (monitorToEdit) {
        setFormData({
          url: monitorToEdit.url,
          name: monitorToEdit.name,
          frequency: monitorToEdit.frequency
        });
      } else {
        setFormData({ url: "", name: "", frequency: 300 });
      }
    }
  }, [isOpen, monitorToEdit]);

  const validateURL = (string) => {
    try {
      const url = new URL(string);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      if (url.hostname.indexOf('.') === -1 && url.hostname !== 'localhost') return false;
      return true;
    } catch (_) {
      return false;  
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateURL(formData.url)) {
      return toast.error("Please enter a valid URL (e.g., https://google.com)");
    }

    setLoading(true);
    try {
      if (monitorToEdit) {
        await api.patch(`/monitors/${monitorToEdit.id}`, formData);
        toast.success("Monitor updated");
      } else {
        await api.post("/monitors", formData);
        toast.success("Monitor created");
      }
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-secondary/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                {monitorToEdit ? <Type className="w-4 h-4 text-primary"/> : <LinkIcon className="w-4 h-4 text-primary"/>}
                {monitorToEdit ? "Edit Configuration" : "New Monitor"}
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
            </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target URL</label>
            <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input 
                  type="url" 
                  placeholder="https://api.example.com"
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Friendly Name</label>
            <div className="relative">
                <Type className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Production Server"
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Heartbeat Interval</label>
            <div className="relative">
                <Timer className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground z-10" />
                
                {/* Custom Arrow Icon */}
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                
                <select 
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all appearance-none cursor-pointer relative"
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: Number(e.target.value)})}
                >
                  <option value={60}>Every 1 minute</option>
                  <option value={300}>Every 5 minutes</option>
                  <option value={600}>Every 10 minutes</option>
                  <option value={3600}>Every 1 hour</option>
                </select>
            </div>
          </div>

          <div className="pt-2">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-medium hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4" /> Save Configuration</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}