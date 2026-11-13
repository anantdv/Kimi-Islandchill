import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  User, Camera, Mail, Phone, Building, Briefcase, Calendar,
  Shield, Key, Bell, Save, Upload, Trash2,
} from "lucide-react";

export default function UserProfile() {
  const { user, updateUserProfile, appUsers } = useAppStore();
  const fullUser = appUsers.find((u) => u.id === user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: fullUser?.email ? "" : "",
    department: "",
    bio: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
  const [saved, setSaved] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      updateUserProfile({ avatarUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUserProfile({
      name: form.name,
      email: form.email,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400 text-sm">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account, avatar, and preferences</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-violet-500" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 border-2 border-dashed border-cyan-300 dark:border-cyan-700 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{user.avatar}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg hover:bg-cyan-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                <Badge className="text-[10px] border-0 bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                  {user.role}
                </Badge>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3 mr-1" /> Upload
                </Button>
                {avatarPreview && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-red-600 border-red-200"
                    onClick={() => {
                      setAvatarPreview("");
                      updateUserProfile({ avatarUrl: undefined });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.slice(0, 12).map((perm) => (
                  <Badge key={perm} className="text-[9px] border-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {perm}
                  </Badge>
                ))}
                {user.permissions.length > 12 && (
                  <Badge className="text-[9px] border-0 bg-gray-100 text-gray-500">
                    +{user.permissions.length - 12} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 space-y-4">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Full Name
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+679-xxx-xxxx"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    <Building className="w-3 h-3" /> Department
                  </label>
                  <Input
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Production"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Bio / Notes
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Short bio or notes..."
                  className="w-full h-20 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  Last login: {fullUser?.lastLogin || "N/A"}
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-cyan-600 text-white"
                  onClick={handleSave}
                >
                  {saved ? (
                    <>
                      <Save className="w-3 h-3 mr-1" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { label: "Email notifications", desc: "Receive production alerts via email", key: "email" },
                { label: "WhatsApp notifications", desc: "Get alerts on WhatsApp", key: "whatsapp" },
                { label: "Shift change alerts", desc: "Notify when your shift is changed", key: "shift" },
                { label: "QC failure alerts", desc: "Immediate alert on QC check failure", key: "qc" },
                { label: "DSS fault alerts", desc: "Alert when a process is halted", key: "dss" },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{pref.label}</p>
                    <p className="text-[10px] text-slate-400">{pref.desc}</p>
                  </div>
                  <Switch defaultChecked={pref.key === "email" || pref.key === "qc"} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Key className="w-4 h-4 text-red-500" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-500">Current Password</label>
                  <Input type="password" placeholder="••••••••" className="h-9 text-xs" disabled />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-500">New Password</label>
                  <Input type="password" placeholder="••••••••" className="h-9 text-xs" disabled />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Password changes are managed by your administrator.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
