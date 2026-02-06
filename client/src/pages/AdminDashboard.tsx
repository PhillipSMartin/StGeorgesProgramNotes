import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useAdminSession,
  useAdminLogout,
  useChangePassword,
  useAdminLanguages,
  useCreateLanguage,
  useDeleteLanguage,
  useUpdateLanguage,
} from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  KeyRound,
  Languages,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const [_, setLocation] = useLocation();
  const { data: session, isLoading: sessionLoading } = useAdminSession();
  const logoutMutation = useAdminLogout();
  const changePasswordMutation = useChangePassword();
  const { data: languages, isLoading: langsLoading } = useAdminLanguages();
  const createLangMutation = useCreateLanguage();
  const deleteLangMutation = useDeleteLanguage();
  const updateLangMutation = useUpdateLanguage();
  const { toast } = useToast();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showAddLangDialog, setShowAddLangDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newLangCode, setNewLangCode] = useState("");
  const [newLangLabel, setNewLangLabel] = useState("");
  const [newLangNative, setNewLangNative] = useState("");
  const [newLangDir, setNewLangDir] = useState("ltr");

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      setLocation("/admin");
    }
  }, [session?.authenticated, sessionLoading, setLocation]);

  if (sessionLoading || !session?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/admin");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast({ title: "Success", description: "Password changed successfully" });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to change password", variant: "destructive" });
    }
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangCode || !newLangLabel || !newLangNative) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    try {
      await createLangMutation.mutateAsync({
        code: newLangCode.toLowerCase(),
        label: newLangLabel,
        nativeLabel: newLangNative,
        dir: newLangDir,
        enabled: true,
        order: (languages?.length || 0) + 1,
      });
      toast({ title: "Success", description: `Added ${newLangLabel}` });
      setShowAddLangDialog(false);
      setNewLangCode("");
      setNewLangLabel("");
      setNewLangNative("");
      setNewLangDir("ltr");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add language", variant: "destructive" });
    }
  };

  const handleToggleLanguage = async (id: number, currentlyEnabled: boolean) => {
    try {
      await updateLangMutation.mutateAsync({ id, updates: { enabled: !currentlyEnabled } });
      toast({ title: "Updated", description: `Language ${currentlyEnabled ? "disabled" : "enabled"}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteLanguage = async (id: number, label: string) => {
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return;
    try {
      await deleteLangMutation.mutateAsync(id);
      toast({ title: "Deleted", description: `${label} removed` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="font-serif font-bold text-primary-foreground text-xs">SG</span>
            </div>
            <h1 className="font-serif text-lg font-bold" data-testid="text-admin-dashboard-title">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} data-testid="button-view-site">
              <ChevronLeft className="w-4 h-4 mr-1" />
              View Site
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-admin-logout">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Languages Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Supported Languages
              </CardTitle>
              <CardDescription>Manage the languages available in the mobile app</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddLangDialog(true)} data-testid="button-add-language">
              <Plus className="w-4 h-4 mr-1" />
              Add Language
            </Button>
          </CardHeader>
          <CardContent>
            {langsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : languages && languages.length > 0 ? (
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div
                    key={lang.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-md border border-border"
                    data-testid={`row-language-${lang.id}`}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground w-8">{lang.code}</span>
                      <span className="font-medium">{lang.label}</span>
                      <span className="text-muted-foreground">{lang.nativeLabel}</span>
                      {lang.dir === "rtl" && (
                        <Badge variant="secondary">RTL</Badge>
                      )}
                      <Badge variant={lang.enabled ? "default" : "secondary"}>
                        {lang.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleLanguage(lang.id, !!lang.enabled)}
                        data-testid={`button-toggle-language-${lang.id}`}
                      >
                        {lang.enabled ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLanguage(lang.id, lang.label)}
                        data-testid={`button-delete-language-${lang.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">No languages configured</p>
            )}
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your admin password</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)} data-testid="button-change-password">
              Change Admin Password
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending} data-testid="button-submit-password">
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Language Dialog */}
      <Dialog open={showAddLangDialog} onOpenChange={setShowAddLangDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Language</DialogTitle>
            <DialogDescription>Add a new language option for the mobile app</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLanguage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lang-code">Language Code</Label>
              <Input
                id="lang-code"
                placeholder="e.g., fr, de, ja"
                value={newLangCode}
                onChange={(e) => setNewLangCode(e.target.value)}
                data-testid="input-lang-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang-label">English Name</Label>
              <Input
                id="lang-label"
                placeholder="e.g., French, German, Japanese"
                value={newLangLabel}
                onChange={(e) => setNewLangLabel(e.target.value)}
                data-testid="input-lang-label"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang-native">Native Name</Label>
              <Input
                id="lang-native"
                placeholder="e.g., Français, Deutsch, 日本語"
                value={newLangNative}
                onChange={(e) => setNewLangNative(e.target.value)}
                data-testid="input-lang-native"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang-dir">Text Direction</Label>
              <Select value={newLangDir} onValueChange={setNewLangDir}>
                <SelectTrigger data-testid="select-lang-dir">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltr">Left to Right (LTR)</SelectItem>
                  <SelectItem value="rtl">Right to Left (RTL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddLangDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLangMutation.isPending} data-testid="button-submit-language">
                {createLangMutation.isPending ? "Adding..." : "Add Language"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
