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
  FileEdit,
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

const LANGUAGE_LOOKUP: Record<string, { code: string; native: string; dir: string }> = {
  "afrikaans": { code: "af", native: "Afrikaans", dir: "ltr" },
  "albanian": { code: "sq", native: "Shqip", dir: "ltr" },
  "amharic": { code: "am", native: "\u12A0\u121B\u122D\u129B", dir: "ltr" },
  "arabic": { code: "ar", native: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", dir: "rtl" },
  "armenian": { code: "hy", native: "\u0540\u0561\u0575\u0565\u0580\u0565\u0576", dir: "ltr" },
  "azerbaijani": { code: "az", native: "Az\u0259rbaycan", dir: "ltr" },
  "basque": { code: "eu", native: "Euskara", dir: "ltr" },
  "belarusian": { code: "be", native: "\u0411\u0435\u043B\u0430\u0440\u0443\u0441\u043A\u0430\u044F", dir: "ltr" },
  "bengali": { code: "bn", native: "\u09AC\u09BE\u0982\u09B2\u09BE", dir: "ltr" },
  "bosnian": { code: "bs", native: "Bosanski", dir: "ltr" },
  "bulgarian": { code: "bg", native: "\u0411\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438", dir: "ltr" },
  "burmese": { code: "my", native: "\u1019\u103C\u1014\u103A\u1019\u102C\u1005\u102C", dir: "ltr" },
  "catalan": { code: "ca", native: "Catal\u00E0", dir: "ltr" },
  "chinese": { code: "zh", native: "\u4E2D\u6587", dir: "ltr" },
  "chinese (simplified)": { code: "zh-CN", native: "\u7B80\u4F53\u4E2D\u6587", dir: "ltr" },
  "chinese (traditional)": { code: "zh-TW", native: "\u7E41\u9AD4\u4E2D\u6587", dir: "ltr" },
  "croatian": { code: "hr", native: "Hrvatski", dir: "ltr" },
  "czech": { code: "cs", native: "\u010Ce\u0161tina", dir: "ltr" },
  "danish": { code: "da", native: "Dansk", dir: "ltr" },
  "dutch": { code: "nl", native: "Nederlands", dir: "ltr" },
  "english": { code: "en", native: "English", dir: "ltr" },
  "estonian": { code: "et", native: "Eesti", dir: "ltr" },
  "farsi": { code: "fa", native: "\u0641\u0627\u0631\u0633\u06CC", dir: "rtl" },
  "filipino": { code: "fil", native: "Filipino", dir: "ltr" },
  "finnish": { code: "fi", native: "Suomi", dir: "ltr" },
  "french": { code: "fr", native: "Fran\u00E7ais", dir: "ltr" },
  "galician": { code: "gl", native: "Galego", dir: "ltr" },
  "georgian": { code: "ka", native: "\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8", dir: "ltr" },
  "german": { code: "de", native: "Deutsch", dir: "ltr" },
  "greek": { code: "el", native: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC", dir: "ltr" },
  "gujarati": { code: "gu", native: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0", dir: "ltr" },
  "haitian creole": { code: "ht", native: "Krey\u00F2l Ayisyen", dir: "ltr" },
  "hausa": { code: "ha", native: "Hausa", dir: "ltr" },
  "hebrew": { code: "he", native: "\u05E2\u05D1\u05E8\u05D9\u05EA", dir: "rtl" },
  "hindi": { code: "hi", native: "\u0939\u093F\u0928\u094D\u0926\u0940", dir: "ltr" },
  "hungarian": { code: "hu", native: "Magyar", dir: "ltr" },
  "icelandic": { code: "is", native: "\u00CDslenska", dir: "ltr" },
  "igbo": { code: "ig", native: "Igbo", dir: "ltr" },
  "indonesian": { code: "id", native: "Bahasa Indonesia", dir: "ltr" },
  "irish": { code: "ga", native: "Gaeilge", dir: "ltr" },
  "italian": { code: "it", native: "Italiano", dir: "ltr" },
  "japanese": { code: "ja", native: "\u65E5\u672C\u8A9E", dir: "ltr" },
  "javanese": { code: "jv", native: "Basa Jawa", dir: "ltr" },
  "kannada": { code: "kn", native: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1", dir: "ltr" },
  "kazakh": { code: "kk", native: "\u049A\u0430\u0437\u0430\u049B", dir: "ltr" },
  "khmer": { code: "km", native: "\u1797\u17B6\u179F\u17B6\u1781\u17D2\u1798\u17C2\u179A", dir: "ltr" },
  "korean": { code: "ko", native: "\uD55C\uAD6D\uC5B4", dir: "ltr" },
  "kurdish": { code: "ku", native: "Kurd\u00EE", dir: "ltr" },
  "lao": { code: "lo", native: "\u0EA5\u0EB2\u0EA7", dir: "ltr" },
  "latvian": { code: "lv", native: "Latvie\u0161u", dir: "ltr" },
  "lithuanian": { code: "lt", native: "Lietuvi\u0173", dir: "ltr" },
  "macedonian": { code: "mk", native: "\u041C\u0430\u043A\u0435\u0434\u043E\u043D\u0441\u043A\u0438", dir: "ltr" },
  "malay": { code: "ms", native: "Bahasa Melayu", dir: "ltr" },
  "malayalam": { code: "ml", native: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02", dir: "ltr" },
  "maltese": { code: "mt", native: "Malti", dir: "ltr" },
  "marathi": { code: "mr", native: "\u092E\u0930\u093E\u0920\u0940", dir: "ltr" },
  "mongolian": { code: "mn", native: "\u041C\u043E\u043D\u0433\u043E\u043B", dir: "ltr" },
  "nepali": { code: "ne", native: "\u0928\u0947\u092A\u093E\u0932\u0940", dir: "ltr" },
  "norwegian": { code: "no", native: "Norsk", dir: "ltr" },
  "pashto": { code: "ps", native: "\u067E\u069A\u062A\u0648", dir: "rtl" },
  "persian": { code: "fa", native: "\u0641\u0627\u0631\u0633\u06CC", dir: "rtl" },
  "polish": { code: "pl", native: "Polski", dir: "ltr" },
  "portuguese": { code: "pt", native: "Portugu\u00EAs", dir: "ltr" },
  "punjabi": { code: "pa", native: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40", dir: "ltr" },
  "romanian": { code: "ro", native: "Rom\u00E2n\u0103", dir: "ltr" },
  "russian": { code: "ru", native: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", dir: "ltr" },
  "serbian": { code: "sr", native: "\u0421\u0440\u043F\u0441\u043A\u0438", dir: "ltr" },
  "sinhala": { code: "si", native: "\u0DC3\u0DD2\u0D82\u0DC4\u0DBD", dir: "ltr" },
  "slovak": { code: "sk", native: "Sloven\u010Dina", dir: "ltr" },
  "slovenian": { code: "sl", native: "Sloven\u0161\u010Dina", dir: "ltr" },
  "somali": { code: "so", native: "Soomaali", dir: "ltr" },
  "spanish": { code: "es", native: "Espa\u00F1ol", dir: "ltr" },
  "swahili": { code: "sw", native: "Kiswahili", dir: "ltr" },
  "swedish": { code: "sv", native: "Svenska", dir: "ltr" },
  "tagalog": { code: "tl", native: "Tagalog", dir: "ltr" },
  "tamil": { code: "ta", native: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", dir: "ltr" },
  "telugu": { code: "te", native: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", dir: "ltr" },
  "thai": { code: "th", native: "\u0E44\u0E17\u0E22", dir: "ltr" },
  "turkish": { code: "tr", native: "T\u00FCrk\u00E7e", dir: "ltr" },
  "ukrainian": { code: "uk", native: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430", dir: "ltr" },
  "urdu": { code: "ur", native: "\u0627\u0631\u062F\u0648", dir: "rtl" },
  "uzbek": { code: "uz", native: "O\u02BBzbek", dir: "ltr" },
  "vietnamese": { code: "vi", native: "Ti\u1EBFng Vi\u1EC7t", dir: "ltr" },
  "welsh": { code: "cy", native: "Cymraeg", dir: "ltr" },
  "yiddish": { code: "yi", native: "\u05D9\u05D9\u05D3\u05D9\u05E9", dir: "rtl" },
  "yoruba": { code: "yo", native: "Yor\u00F9b\u00E1", dir: "ltr" },
  "zulu": { code: "zu", native: "IsiZulu", dir: "ltr" },
};

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
  const [autoFilled, setAutoFilled] = useState(false);

  const handleLabelChange = (value: string) => {
    setNewLangLabel(value);
    const match = LANGUAGE_LOOKUP[value.toLowerCase().trim()];
    if (match) {
      setNewLangCode(match.code);
      setNewLangNative(match.native);
      setNewLangDir(match.dir);
      setAutoFilled(true);
    } else {
      if (autoFilled) {
        setNewLangCode("");
        setNewLangNative("");
        setNewLangDir("ltr");
        setAutoFilled(false);
      }
    }
  };

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
      setAutoFilled(false);
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
                        onClick={() => setLocation(`/admin/content/${lang.code}`)}
                        data-testid={`button-edit-content-${lang.id}`}
                      >
                        <FileEdit className="w-4 h-4" />
                      </Button>
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
              <Label htmlFor="lang-label">English Name</Label>
              <Input
                id="lang-label"
                placeholder="e.g., French, German, Japanese"
                value={newLangLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                data-testid="input-lang-label"
              />
              {autoFilled && (
                <p className="text-xs text-muted-foreground">
                  Fields below were auto-filled. You can still edit them if needed.
                </p>
              )}
            </div>
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
              <Label htmlFor="lang-native">Native Name</Label>
              <Input
                id="lang-native"
                placeholder="e.g., Fran\u00e7ais, Deutsch, \u65e5\u672c\u8a9e"
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
