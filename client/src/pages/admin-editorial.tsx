import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calendar, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type EditorialItem = {
  id: string;
  title: string;
  type: string;
  category: string;
  status: string;
  priority: string;
  description: string | null;
  dueDate: number | null;
  publishWeek: string | null;
  assigneeId: string | null;
  tags: string[] | null;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
};

const editorialItemSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  type: z.enum(["blog", "website", "technical", "strategy"]),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  status: z.enum(["idea", "queued", "drafting", "in_review", "scheduled", "published", "done"]).default("idea"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  publishWeek: z.string().optional(),
  tags: z.string().optional(),
});

type EditorialFormData = z.infer<typeof editorialItemSchema>;

const statusLabels: Record<string, string> = {
  idea: "Idee",
  queued: "Warteschlange",
  drafting: "In Arbeit",
  in_review: "Review",
  scheduled: "Geplant",
  published: "Veröffentlicht",
  done: "Erledigt",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  normal: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function AdminEditorial() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditorialItem | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");

  const { data: itemsData, isLoading } = useQuery<{ items: EditorialItem[] }>({
    queryKey: ["/api/editorial"],
  });

  const form = useForm<EditorialFormData>({
    resolver: zodResolver(editorialItemSchema),
    defaultValues: {
      title: "",
      type: "blog",
      category: "",
      status: "idea",
      priority: "normal",
      description: "",
      dueDate: "",
      publishWeek: "",
      tags: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EditorialFormData) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
      };
      return apiRequest("/api/editorial", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Erfolg",
        description: "Redaktioneller Eintrag erstellt",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditorialFormData> }) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
      };
      return apiRequest(`/api/editorial/${id}`, "PATCH", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial"] });
      setEditingItem(null);
      form.reset();
      toast({
        title: "Erfolg",
        description: "Eintrag aktualisiert",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/editorial/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial"] });
      toast({
        title: "Erfolg",
        description: "Eintrag gelöscht",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditorialFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: EditorialItem) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      type: item.type as any,
      category: item.category,
      status: item.status as any,
      priority: item.priority as any,
      description: item.description || "",
      dueDate: item.dueDate ? format(new Date(item.dueDate), "yyyy-MM-dd") : "",
      publishWeek: item.publishWeek || "",
      tags: item.tags ? item.tags.join(", ") : "",
    });
    setIsCreateOpen(true);
  };

  const handleDialogClose = () => {
    setIsCreateOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const filterItems = (items: EditorialItem[]) => {
    if (!items) return [];
    
    switch (selectedTab) {
      case "blog":
        return items.filter((item) => item.type === "blog");
      case "website":
        return items.filter((item) => item.type === "website");
      case "completed":
        return items.filter((item) => item.status === "published" || item.status === "done");
      default:
        return items;
    }
  };

  const filteredItems = filterItems(itemsData?.items || []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-normal mb-2">Redaktionsplan</h1>
          <p className="text-muted-foreground">
            Verwalte Blog-Beiträge, Website-Updates und Content-Strategie
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-item">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Eintrag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Eintrag bearbeiten" : "Neuer redaktioneller Eintrag"}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? "Änderungen am Eintrag vornehmen" : "Erstelle einen neuen Eintrag im Redaktionsplan"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title" placeholder="z.B. Neue Homepage-Features" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blog">Blog</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="technical">Technisch</SelectItem>
                            <SelectItem value="strategy">Strategie</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategorie</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-category" placeholder="z.B. SEO, Features" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="idea">Idee</SelectItem>
                            <SelectItem value="queued">Warteschlange</SelectItem>
                            <SelectItem value="drafting">In Arbeit</SelectItem>
                            <SelectItem value="in_review">Review</SelectItem>
                            <SelectItem value="scheduled">Geplant</SelectItem>
                            <SelectItem value="published">Veröffentlicht</SelectItem>
                            <SelectItem value="done">Erledigt</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorität</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                            <SelectItem value="urgent">Dringend</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="input-description"
                          placeholder="Details zum Eintrag..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fälligkeitsdatum</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-due-date" type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publishWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veröffentlichungswoche</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-publish-week" placeholder="z.B. KW 42" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (kommagetrennt)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-tags" placeholder="z.B. SEO, Marketing, Launch" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    data-testid="button-cancel"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    data-testid="button-submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingItem ? "Speichern" : "Erstellen"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">Alle</TabsTrigger>
          <TabsTrigger value="blog" data-testid="tab-blog">Blog</TabsTrigger>
          <TabsTrigger value="website" data-testid="tab-website">Website</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Abgeschlossen</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Lädt...</p>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Keine Einträge gefunden</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="hover-elevate" data-testid={`card-item-${item.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[item.priority]}>
                          {item.priority}
                        </Badge>
                        <Badge variant="secondary">
                          {statusLabels[item.status]}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span>{item.category}</span>
                        {item.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.dueDate), "dd.MM.yyyy", { locale: de })}
                          </span>
                        )}
                        {item.publishWeek && (
                          <span className="text-xs">{item.publishWeek}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        data-testid={`button-edit-${item.id}`}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteMutation.mutate(item.id)}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {item.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        {item.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
