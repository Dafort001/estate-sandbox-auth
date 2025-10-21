import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Trash2, Plus, Save, X } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SeoMetadata } from "@shared/schema";

const DEFAULT_PAGES = [
  { path: "/", name: "Homepage" },
  { path: "/preise", name: "Pricing" },
  { path: "/about", name: "About" },
  { path: "/kontakt", name: "Contact" },
  { path: "/faq", name: "FAQ" },
  { path: "/impressum", name: "Imprint" },
  { path: "/datenschutz", name: "Privacy Policy" },
  { path: "/galerie", name: "Gallery" },
  { path: "/downloads", name: "Downloads" },
];

type EditingMetadata = {
  pagePath: string;
  pageTitle: string;
  metaDescription: string;
  ogImage: string;
  altText: string;
};

export default function AdminSeo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<EditingMetadata | null>(null);

  const { data: metadataList, isLoading } = useQuery<{ metadata: SeoMetadata[] }>({
    queryKey: ["/api/seo-metadata"],
    queryFn: getQueryFn<{ metadata: SeoMetadata[] }>({ on401: "returnNull" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: EditingMetadata) => {
      return await apiRequest("POST", "/api/seo-metadata", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-metadata"] });
      setIsEditing(false);
      setEditingData(null);
      toast({
        title: "Success",
        description: "SEO metadata saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save SEO metadata",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pagePath: string) => {
      return await apiRequest("DELETE", `/api/seo-metadata/${encodeURIComponent(pagePath)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-metadata"] });
      toast({
        title: "Success",
        description: "SEO metadata deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete SEO metadata",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (metadata?: SeoMetadata) => {
    setEditingData({
      pagePath: metadata?.pagePath || "",
      pageTitle: metadata?.pageTitle || "",
      metaDescription: metadata?.metaDescription || "",
      ogImage: metadata?.ogImage || "",
      altText: metadata?.altText || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editingData) return;
    
    if (!editingData.pagePath || !editingData.pageTitle || !editingData.metaDescription) {
      toast({
        title: "Validation Error",
        description: "Page path, title, and meta description are required",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(editingData);
  };

  const handleDelete = (pagePath: string) => {
    if (confirm(`Are you sure you want to delete SEO metadata for "${pagePath}"?`)) {
      deleteMutation.mutate(pagePath);
    }
  };

  const getMetadataForPage = (pagePath: string) => {
    return metadataList?.metadata.find(m => m.pagePath === pagePath);
  };

  // Merge default pages with any additional pages from metadata
  const allPagePaths = (() => {
    const allPaths = new Set([
      ...DEFAULT_PAGES.map(p => p.path),
      ...(metadataList?.metadata.map(m => m.pagePath) || [])
    ]);
    return Array.from(allPaths).sort();
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 bg-white border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-semibold">SEO Management</h1>
          </div>
        </header>
        <div className="container mx-auto px-6 py-12 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/editorial">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold" data-testid="heading-seo-admin">
              SEO Management
            </h1>
          </div>
          <Button
            onClick={() => handleEdit()}
            data-testid="button-add-seo"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Page
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="space-y-4">
          {allPagePaths.map((path) => {
            const defaultPage = DEFAULT_PAGES.find(p => p.path === path);
            const metadata = getMetadataForPage(path);
            const name = defaultPage?.name || path;
            
            return (
              <Card key={path} data-testid={`seo-card-${path}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{name}</CardTitle>
                      <CardDescription className="mt-1">
                        Path: <code className="text-xs bg-muted px-1 py-0.5 rounded">{path}</code>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(metadata)}
                        data-testid={`button-edit-${path}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {metadata && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(path)}
                          data-testid={`button-delete-${path}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {metadata && (
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Page Title</Label>
                      <p className="text-sm mt-1" data-testid={`title-${path}`}>{metadata.pageTitle}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Meta Description</Label>
                      <p className="text-sm mt-1 text-muted-foreground" data-testid={`description-${path}`}>
                        {metadata.metaDescription}
                      </p>
                    </div>
                    {metadata.ogImage && (
                      <div>
                        <Label className="text-xs text-muted-foreground">OG Image</Label>
                        <p className="text-sm mt-1 text-muted-foreground truncate">{metadata.ogImage}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(metadata.updatedAt).toLocaleDateString("de-DE")}
                    </div>
                  </CardContent>
                )}
                {!metadata && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">No SEO metadata configured</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-edit">
              {editingData?.pagePath ? "Edit SEO Metadata" : "Add New Page SEO"}
            </DialogTitle>
            <DialogDescription>
              Configure SEO metadata for your page
            </DialogDescription>
          </DialogHeader>

          {editingData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pagePath">Page Path *</Label>
                <Input
                  id="pagePath"
                  value={editingData.pagePath}
                  onChange={(e) => setEditingData({ ...editingData, pagePath: e.target.value })}
                  placeholder="/example"
                  disabled={!!getMetadataForPage(editingData.pagePath)}
                  data-testid="input-page-path"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  e.g., / for homepage, /preise for pricing page
                </p>
              </div>

              <div>
                <Label htmlFor="pageTitle">Page Title *</Label>
                <Input
                  id="pageTitle"
                  value={editingData.pageTitle}
                  onChange={(e) => setEditingData({ ...editingData, pageTitle: e.target.value })}
                  placeholder="Professional Real Estate Photography"
                  data-testid="input-page-title"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be suffixed with " | PIX.IMMO"
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description *</Label>
                <Textarea
                  id="metaDescription"
                  value={editingData.metaDescription}
                  onChange={(e) => setEditingData({ ...editingData, metaDescription: e.target.value })}
                  placeholder="High-quality real estate photography services..."
                  rows={3}
                  data-testid="textarea-meta-description"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editingData.metaDescription.length} / 160 characters (recommended)
                </p>
              </div>

              <div>
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  value={editingData.ogImage}
                  onChange={(e) => setEditingData({ ...editingData, ogImage: e.target.value })}
                  placeholder="/og-image.jpg"
                  data-testid="input-og-image"
                />
              </div>

              <div>
                <Label htmlFor="altText">Alt Text (JSON)</Label>
                <Textarea
                  id="altText"
                  value={editingData.altText}
                  onChange={(e) => setEditingData({ ...editingData, altText: e.target.value })}
                  placeholder='{"hero": "Modern apartment living room"}'
                  rows={2}
                  data-testid="textarea-alt-text"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: JSON object for page-specific image alt texts
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingData(null);
                  }}
                  data-testid="button-cancel"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
