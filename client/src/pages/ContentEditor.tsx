import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  useAdminSession,
  useAdminLanguages,
  useAdminIntro,
  useAdminFooter,
  useAdminPieces,
  useSavePieces,
  useDeletePiece,
  usePublishPieces,
  useUnpublishPieces,
  useTranslatePieces,
} from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  BookOpen,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface PieceFormData {
  id?: number;
  title: string;
  composer: string;
  notes: string;
  pieceOrder: number;
}

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

function PieceEditor({
  piece,
  index,
  isRTL,
  totalPieces,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  piece: PieceFormData;
  index: number;
  isRTL: boolean;
  totalPieces: number;
  onUpdate: (field: keyof PieceFormData, value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: piece.notes,
    onUpdate: ({ editor: ed }) => {
      onUpdate("notes", ed.getHTML());
    },
  });

  useEffect(() => {
    if (editor && piece.notes !== editor.getHTML()) {
      editor.commands.setContent(piece.notes);
    }
  }, [piece.notes]);

  return (
    <Card data-testid={`card-piece-${index}`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-lg">Piece {index + 1}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onMoveUp}
              disabled={index === 0}
              data-testid={`button-move-up-${index}`}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onMoveDown}
              disabled={index === totalPieces - 1}
              data-testid={`button-move-down-${index}`}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              disabled={totalPieces <= 1}
              data-testid={`button-delete-piece-${index}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Title</label>
          <Textarea
            value={piece.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder="Enter piece title… (Shift+Enter for a new line)"
            dir={isRTL ? "rtl" : "ltr"}
            rows={2}
            className="resize-none"
            data-testid={`input-piece-title-${index}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Composer</label>
          <Input
            value={piece.composer}
            onChange={(e) => onUpdate("composer", e.target.value)}
            placeholder="Enter composer name..."
            dir={isRTL ? "rtl" : "ltr"}
            data-testid={`input-piece-composer-${index}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Program Notes</label>
          <div className="border rounded-md overflow-visible" dir={isRTL ? "rtl" : "ltr"}>
            <MenuBar editor={editor} />
            <EditorContent
              editor={editor}
              className="prose dark:prose-invert max-w-none p-4 min-h-[200px] focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px]"
              data-testid={`editor-piece-notes-${index}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IntroEditor({
  content,
  isRTL,
  onUpdate,
}: {
  content: string;
  isRTL: boolean;
  onUpdate: (value: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onUpdate(ed.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  return (
    <Card data-testid="card-intro">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <CardTitle className="text-lg">Introduction</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Optional thematic paragraph displayed before the program pieces
        </p>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-visible" dir={isRTL ? "rtl" : "ltr"}>
          <MenuBar editor={editor} />
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert max-w-none p-4 min-h-[120px] focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[100px]"
            data-testid="editor-intro"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FooterEditor({ content, isRTL, onUpdate }: { content: string; isRTL: boolean; onUpdate: (value: string) => void }) {
  return (
    <Card data-testid="card-footer">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <CardTitle className="text-lg">Footer / Attribution</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Optional note displayed after the program pieces — e.g. who wrote the notes
        </p>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="e.g. Program notes written by Jane Smith"
          dir={isRTL ? "rtl" : "ltr"}
          rows={3}
          className="resize-none"
          data-testid="textarea-footer"
        />
      </CardContent>
    </Card>
  );
}

export default function ContentEditor() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/content/:lang");
  const langCode = match ? params.lang : "";

  const { data: session, isLoading: sessionLoading } = useAdminSession();
  const { data: languages } = useAdminLanguages();
  const { data: introData } = useAdminIntro(langCode);
  const { data: footerData } = useAdminFooter(langCode);
  const { data: piecesData, isLoading: piecesLoading } = useAdminPieces(langCode);
  const savePiecesMutation = useSavePieces();
  const deletePieceMutation = useDeletePiece();
  const publishMutation = usePublishPieces();
  const unpublishMutation = useUnpublishPieces();
  const translateMutation = useTranslatePieces();
  const { toast } = useToast();

  const [introContent, setIntroContent] = useState("");
  const [footerContent, setFooterContent] = useState("");
  const [pieces, setPieces] = useState<PieceFormData[]>([
    { title: "", composer: "", notes: "", pieceOrder: 1 },
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [translationProvider, setTranslationProvider] = useState<"openai" | "google">("openai");
  const [initialized, setInitialized] = useState(false);

  const language = languages?.find(l => l.code === langCode);
  const isRTL = language?.dir === "rtl";
  const isPublished = piecesData?.some(p => p.published) ?? false;

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      setLocation("/admin");
    }
  }, [session?.authenticated, sessionLoading, setLocation]);

  const [introInitialized, setIntroInitialized] = useState(false);
  const [footerInitialized, setFooterInitialized] = useState(false);

  useEffect(() => {
    if (piecesData && !initialized) {
      if (piecesData.length > 0) {
        setPieces(piecesData.map(p => ({
          id: p.id,
          title: p.title,
          composer: p.composer,
          notes: p.notes,
          pieceOrder: p.pieceOrder,
        })));
      } else {
        setPieces([{ title: "", composer: "", notes: "", pieceOrder: 1 }]);
      }
      setHasUnsavedChanges(false);
      setInitialized(true);
    }
  }, [piecesData, initialized]);

  useEffect(() => {
    if (introData !== undefined && !introInitialized) {
      setIntroContent(introData?.content || "");
      setIntroInitialized(true);
    }
  }, [introData, introInitialized]);

  useEffect(() => {
    if (footerData !== undefined && !footerInitialized) {
      setFooterContent(footerData?.content || "");
      setFooterInitialized(true);
    }
  }, [footerData, footerInitialized]);

  useEffect(() => {
    setInitialized(false);
    setIntroInitialized(false);
    setFooterInitialized(false);
  }, [langCode]);

  const updatePiece = useCallback((index: number, field: keyof PieceFormData, value: string) => {
    setPieces(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []);

  const addPiece = useCallback(() => {
    setPieces(prev => [
      ...prev,
      { title: "", composer: "", notes: "", pieceOrder: prev.length + 1 },
    ]);
    setHasUnsavedChanges(true);
  }, []);

  const removePiece = useCallback(async (index: number) => {
    const piece = pieces[index];
    if (piece.id) {
      try {
        await deletePieceMutation.mutateAsync(piece.id);
      } catch (error: any) {
        toast({ title: "Error", description: "Failed to delete piece", variant: "destructive" });
        return;
      }
    }
    setPieces(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((p, i) => ({ ...p, pieceOrder: i + 1 }));
    });
    setHasUnsavedChanges(true);
  }, [pieces, deletePieceMutation, toast]);

  const movePiece = useCallback((index: number, direction: "up" | "down") => {
    setPieces(prev => {
      const updated = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated.map((p, i) => ({ ...p, pieceOrder: i + 1 }));
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!langCode) return;

    try {
      const result = await savePiecesMutation.mutateAsync({
        language: langCode,
        intro: introContent,
        footer: footerContent,
        pieces: pieces.map((p, i) => ({
          id: p.id,
          title: p.title,
          composer: p.composer,
          notes: p.notes,
          pieceOrder: i + 1,
        })),
      });
      if (result.pieces) {
        setPieces(result.pieces.map((p: any) => ({
          id: p.id,
          title: p.title,
          composer: p.composer,
          notes: p.notes,
          pieceOrder: p.pieceOrder,
        })));
      }
      setHasUnsavedChanges(false);
      toast({ title: "Saved", description: "All content saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    }
  }, [langCode, introContent, pieces, savePiecesMutation, toast]);

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
        provider: translationProvider,
      });
      if (result.pieces && result.pieces.length > 0) {
        setPieces(result.pieces.map((p: { title: string; composer: string; notes: string }, i: number) => ({
          title: p.title,
          composer: p.composer,
          notes: p.notes,
          pieceOrder: i + 1,
        })));
        if (result.intro) {
          setIntroContent(result.intro);
        }
        setHasUnsavedChanges(true);
        toast({ title: "Translation Complete", description: "AI translation loaded. Review and save when ready." });
      }
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
              {!isPublished && piecesData && piecesData.length > 0 && <Badge variant="secondary" className="text-xs">Draft</Badge>}
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
              onClick={handleSave}
              disabled={savePiecesMutation.isPending}
              data-testid="button-save-content"
            >
              {savePiecesMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
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
                disabled={publishMutation.isPending || !piecesData || piecesData.length === 0}
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
        {piecesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {langCode !== "en" && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Languages className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">AI Translation</p>
                        <p className="text-xs text-muted-foreground">
                          Translate all English pieces to {language?.label || langCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={translationProvider} onValueChange={(v) => setTranslationProvider(v as "openai" | "google")} data-testid="select-translation-provider">
                        <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-translation-provider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="google">Google Translate</SelectItem>
                        </SelectContent>
                      </Select>
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
                            Translate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <IntroEditor
              content={introContent}
              isRTL={isRTL ?? false}
              onUpdate={(value) => {
                setIntroContent(value);
                setHasUnsavedChanges(true);
              }}
            />

            {pieces.map((piece, index) => (
              <PieceEditor
                key={piece.id ?? `new-${index}`}
                piece={piece}
                index={index}
                isRTL={isRTL ?? false}
                totalPieces={pieces.length}
                onUpdate={(field, value) => updatePiece(index, field, value)}
                onMoveUp={() => movePiece(index, "up")}
                onMoveDown={() => movePiece(index, "down")}
                onDelete={() => removePiece(index)}
              />
            ))}

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={addPiece}
                data-testid="button-add-piece"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Piece
              </Button>
            </div>

            <FooterEditor
              content={footerContent}
              isRTL={isRTL ?? false}
              onUpdate={(value) => {
                setFooterContent(value);
                setHasUnsavedChanges(true);
              }}
            />
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
            className={cn("space-y-8 py-4", isRTL && "text-right")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {introContent && introContent !== "<p></p>" && (
              <div className="space-y-3" data-testid="preview-intro">
                <div
                  className="prose dark:prose-invert max-w-none text-sm italic text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(introContent) }}
                />
                <Separator />
              </div>
            )}
            {pieces.map((piece, index) => (
              <div key={index} className="space-y-3">
                {index > 0 && <Separator />}
                <h2 className="text-xl font-bold whitespace-pre-line" data-testid={`preview-title-${index}`}>
                  {piece.title || "Untitled Piece"}
                </h2>
                <p className="text-base text-muted-foreground italic" data-testid={`preview-composer-${index}`}>
                  {piece.composer || "Unknown Composer"}
                </p>
                <div
                  className="prose dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(piece.notes || "<p>No notes</p>") }}
                  data-testid={`preview-notes-${index}`}
                />
              </div>
            ))}
            {footerContent.trim() && (
              <div className="pt-4 mt-4 border-t border-border" data-testid="preview-footer">
                <p className="text-sm text-muted-foreground italic whitespace-pre-line">{footerContent}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
