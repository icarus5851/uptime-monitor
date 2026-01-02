import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { User, Mail, Lock, Trash2, LogOut, ArrowLeft, Save, ShieldAlert, Loader2 } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "" 
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const previousUser = { ...user };

    const payload = {};
    if (formData.name) payload.name = formData.name;
    if (formData.email) payload.email = formData.email;
    if (formData.password) payload.password = formData.password;

    try {
      setUser({ ...user, ...payload });
      toast.success("Profile updated"); 

      await api.patch("/auth/me", payload);
      
      setFormData(prev => ({ ...prev, password: "" })); 

    } catch (err) {
      setUser(previousUser);
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmName = prompt(`Type your name to confirm deletion: ${user.name}`);
    if (confirmName !== user.name) return toast.error("Name mismatch");

    try {
      await api.delete("/auth/me");
      toast.success("Account deleted");
      logout();
      navigate("/login");
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-background p-4 md:p-10 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/')} 
                className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
            >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Account Settings</h1>
                <p className="text-sm md:text-base text-muted-foreground">Manage your personal information</p>
            </div>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            <div className="md:col-span-2">
                <Card className="p-5 md:p-8 border border-border shadow-sm">
                    <form onSubmit={handleUpdate} className="space-y-5 md:space-y-6">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                <User className="w-4 h-4" /> Full Name
                            </label>
                            <input 
                                type="text" 
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" /> Email Address
                            </label>
                            <input 
                                type="email" 
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                <Lock className="w-4 h-4" /> New Password
                            </label>
                            <input 
                                type="password" 
                                placeholder="Leave blank to keep current"
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 ml-auto shadow-lg shadow-primary/10"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4" /> Update Profile</>}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="p-5 md:p-6 border border-border shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Session</h3>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-input rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground font-medium"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </Card>

                <Card className="p-5 md:p-6 border-destructive/20 bg-destructive/5 shadow-sm">
                    <h3 className="font-semibold text-lg text-destructive mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> Danger Zone
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed">
                        Permanently delete your account and all monitors. This action cannot be undone.
                    </p>
                    <button 
                        onClick={handleDelete}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}