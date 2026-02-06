import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  useAdminSession,
  useAdminLanguages,
  useAdminContent,
  useSaveContent,
  usePublishContent,
  useUnpublishContent,
  useTranslateContent,
  useContentVersions,
} from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Save,
  Eye,
  EyeOff,
  Languages,
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Globe,
  History,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b" data-testid="editor-toolbar">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn("toggle-elevate", editor.isActive("bold") && "toggle-elevated")}
        data-testid="button-bold"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn("toggle-elevate", editor.isActive("italic") && "toggle-elevated")}
        data-testid="button-italic"
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn("toggle-elevate", editor.isActive("underline") && "toggle-elevated")}
        data-testid="button-underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("toggle-elevate", editor.isActive("bulletList") && "toggle-elevated")}
        data-testid="button-bullet-list"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("toggle-elevate", editor.isActive("orderedList") && "toggle-elevated")}
        data-testid="button-ordered-list"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={cn("toggle-elevate", editor.isActive({ textAlign: "left" }) && "toggle-elevated")}
        data-testid="button-align-left"
      >
        <AlignLeft className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={cn("toggle-elevate", editor.isActive({ textAlign: "center" }) && "toggle-elevated")}
        data-testid="button-align-center"
      >
        <AlignCenter className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={cn("toggle-elevate", editor.isActive({ textAlign: "right" }) && "toggle-elevated")}
        data-testid="button-align-right"
      >
        <AlignRight className="w-4 h-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        data-testid="button-undo"
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        data-testid="button-redo"
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function ContentEditor() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/content/:lang");
  const langCode = match ? params.lang : "";

  const { data: session, isLoading: sessionLoading } = useAdminSession();
  const { data: languages } = useAdminLanguages();
  const { data: contentData, isLoading: contentLoading } = useAdminContent(langCode);
  const saveContentMutation = useSaveContent();
  const publishMutation = usePublishContent();
  const unpublishMutation = useUnpublishContent();
  const translateMutation = useTranslateContent();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const language = languages?.find(l => l.code === langCode);
  const isRTL = language?.dir === "rtl";
  const isPublished = contentData?.some(c => c.published) ?? false;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      setLocation("/admin");
    }
  }, [session?.authenticated, sessionLoading, setLocation]);

  useEffect(() => {
    if (contentData && contentData.length > 0) {
      const titleItem = contentData.find(c => c.section === "title");
      const composerItem = contentData.find(c => c.section === "composer");
      const notesItem = contentData.find(c => c.section === "notes");

      setTitle(titleItem?.content || "");
      setComposer(composerItem?.content || "");
      if (editor && notesItem) {
        editor.commands.setContent(notesItem.content);
      }
      setHasUnsavedChanges(false);
    } else if (contentData && contentData.length === 0) {
      setTitle("");
      setComposer("");
      if (editor) {
        editor.commands.setContent("");
      }
      setHasUnsavedChanges(false);
    }
  }, [contentData, editor]);

  const handleSave = useCallback(async () => {
    if (!langCode) return;
    const notesContent = editor?.getHTML() || "";

    try {
      await saveContentMutation.mutateAsync({
        language: langCode,
        sections: [
          { section: "title", content: title, order: 1 },
          { section: "composer", content: composer, order: 2 },
          { section: "notes", content: notesContent, order: 3 },
        ],
      });
      setHasUnsavedChanges(false);
      toast({ title: "Saved", description: "Content saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    }
  }, [langCode, title, composer, editor, saveContentMutation, toast]);

  const handlePublish = async () => {
    if (!langCode) return;
    try {
      await publishMutation.mutateAsync(langCode);
      toast({ title: "Published", description: `Content published for ${language?.label || langCode}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to publish", variant: "destructive" });
    }
  };

  const handleUnpublish = async () => {
    if (!langCode) return;
    try {
      await unpublishMutation.mutateAsync(langCode);
      toast({ title: "Unpublished", description: `Content unpublished for ${language?.label || langCode}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to unpublish", variant: "destructive" });
    }
  };

  const handleTranslate = async () => {
    if (!langCode || !language) return;
    try {
      const result = await translateMutation.mutateAsync({
        targetLanguage: langCode,
        targetLanguageLabel: language.label,
      });
      setTitle(result.title);
      setComposer(result.composer);
      if (editor) {
        editor.commands.setContent(result.notes);
      }
      setHasUnsavedChanges(true);
      toast({ title: "Translation Complete", description: "AI translation loaded. Review and save when ready." });
    } catch (error: any) {
      toast({ title: "Translation Failed", description: error.message || "Failed to translate", variant: "destructive" });
    }
  };

  if (sessionLoading || !session?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/dashboard")} data-testid="button-back-dashboard">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm" data-testid="text-current-language">
                {language?.label || langCode} {language?.nativeLabel ? `(${language.nativeLabel})` : ""}
              </span>
              {isPublished && <Badge variant="default" className="text-xs">Published</Badge>}
              {!isPublished && contentData && contentData.length > 0 && <Badge variant="secondary" className="text-xs">Draft</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreview(true)}
              data-testid="button-preview"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVersions(true)}
              data-testid="button-history"
            >
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveContentMutation.isPending}
              data-testid="button-save-content"
            >
              {saveContentMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
            {isPublished ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnpublish}
                disabled={unpublishMutation.isPending}
                data-testid="button-unpublish"
              >
                <EyeOff className="w-4 h-4 mr-1" />
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={handlePublish}
                disabled={publishMutation.isPending || !contentData || contentData.length === 0}
                data-testid="button-publish"
              >
                <Eye className="w-4 h-4 mr-1" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        {contentLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {langCode !== "en" && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Languages className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">AI Translation</p>
                        <p className="text-xs text-muted-foreground">
                          Translate English content to {language?.label || langCode} using AI
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTranslate}
                      disabled={translateMutation.isPending}
                      data-testid="button-translate"
                    >
                      {translateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Languages className="w-4 h-4 mr-1" />
                          Translate from English
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Title</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setHasUnsavedChanges(true); }}
                  placeholder="Enter program title..."
                  dir={isRTL ? "rtl" : "ltr"}
                  data-testid="input-content-title"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Composer / Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={composer}
                  onChange={(e) => { setComposer(e.target.value); setHasUnsavedChanges(true); }}
                  placeholder="Enter composer or performer name..."
                  dir={isRTL ? "rtl" : "ltr"}
                  data-testid="input-content-composer"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-visible" dir={isRTL ? "rtl" : "ltr"}>
                  <MenuBar editor={editor} />
                  <EditorContent
                    editor={editor}
                    className="prose dark:prose-invert max-w-none p-4 min-h-[300px] focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[280px]"
                    data-testid="editor-notes"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
            <DialogDescription>How the program notes will appear to the audience</DialogDescription>
          </DialogHeader>
          <div
            className={cn("space-y-6 py-4", isRTL && "text-right")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div>
              <h1 className="text-2xl font-bold" data-testid="preview-title">{title || "No title"}</h1>
            </div>
            <div>
              <p className="text-lg text-muted-foreground italic" data-testid="preview-composer">{composer || "No composer"}</p>
            </div>
            <Separator />
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "<p>No content</p>" }}
              data-testid="preview-notes"
            />
          </div>
        </DialogContent>
      </Dialog>

      <VersionHistoryDialog
        open={showVersions}
        onOpenChange={setShowVersions}
        language={langCode}
        onRestore={(content, section) => {
          if (section === "title") setTitle(content);
          else if (section === "composer") setComposer(content);
          else if (section === "notes" && editor) editor.commands.setContent(content);
          setHasUnsavedChanges(true);
          toast({ title: "Restored", description: `Previous version of ${section} restored. Save to keep changes.` });
        }}
      />
    </div>
  );
}

function VersionHistoryDialog({
  open,
  onOpenChange,
  language,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
  onRestore: (content: string, section: string) => void;
}) {
  const [selectedSection, setSelectedSection] = useState("notes");
  const { data: versions, isLoading } = useContentVersions(
    open ? language : "",
    open ? selectedSection : ""
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>View and restore previous versions of your content</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger data-testid="select-version-section">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="composer">Composer</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
            </SelectContent>
          </Select>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions && versions.length > 0 ? (
            <div className="space-y-3">
              {versions.map((v) => (
                <Card key={v.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">v{v.version}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {v.sourceType === "ai" ? "AI Translation" : "Manual Edit"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {v.createdAt ? new Date(v.createdAt).toLocaleString() : ""}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onRestore(v.content, selectedSection);
                            onOpenChange(false);
                          }}
                          data-testid={`button-restore-version-${v.id}`}
                        >
                          Restore
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-3 bg-muted/50 rounded p-2">
                      {selectedSection === "notes" ? (
                        <div dangerouslySetInnerHTML={{ __html: v.content.slice(0, 300) }} />
                      ) : (
                        v.content.slice(0, 200)
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-versions">
              No version history yet. Versions are created each time you save.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
