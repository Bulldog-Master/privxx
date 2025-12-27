/**
 * Component Documentation Page
 * 
 * Comprehensive documentation system with usage examples and prop types.
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { 
  Book, 
  Component, 
  ChevronRight,
  Copy,
  Check,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { PageBackground } from "@/components/layout";
import { AppFooter } from "@/components/shared";
import { componentDocs, type ComponentDoc } from "@/docs/components";

export default function ComponentDocs() {
  const { t } = useTranslation();
  const [selectedComponent, setSelectedComponent] = useState<string>(componentDocs[0]?.id || "");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(componentDocs.map(doc => doc.category))];
    return cats.sort();
  }, []);

  // Filter components based on search query
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return componentDocs;
    
    const query = searchQuery.toLowerCase();
    return componentDocs.filter(doc => 
      doc.name.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query) ||
      doc.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group filtered docs by category
  const groupedDocs = useMemo(() => {
    const groups: Record<string, ComponentDoc[]> = {};
    filteredDocs.forEach(doc => {
      if (!groups[doc.category]) {
        groups[doc.category] = [];
      }
      groups[doc.category].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  const selectedDoc = componentDocs.find(doc => doc.id === selectedComponent);

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <PageBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Book className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {t("componentDocs", "Component Documentation")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("componentDocsDesc", "Usage examples and prop types for all components")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Component className="h-4 w-4" />
                    {t("components", "Components")}
                  </CardTitle>
                  {/* Search Input */}
                  <div className="relative mt-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={t("searchComponents", "Search components...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-8 h-9 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[55vh]">
                    <nav className="space-y-4 p-2">
                      {Object.entries(groupedDocs).map(([category, docs]) => (
                        <div key={category}>
                          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {category}
                          </div>
                          <div className="space-y-0.5">
                            {docs.map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() => setSelectedComponent(doc.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                                  selectedComponent === doc.id
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                <ChevronRight className={`h-3 w-3 transition-transform ${
                                  selectedComponent === doc.id ? "rotate-90" : ""
                                }`} />
                                {doc.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {filteredDocs.length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                          {t("noComponentsFound", "No components found")}
                        </div>
                      )}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </aside>

            {/* Documentation Content */}
            <main className="lg:col-span-3">
              {selectedDoc ? (
                <ComponentDocumentation 
                  doc={selectedDoc} 
                  copiedCode={copiedCode}
                  onCopyCode={copyToClipboard}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {t("selectComponent", "Select a component to view its documentation")}
                  </CardContent>
                </Card>
              )}
            </main>
          </div>
        </div>

        <AppFooter />
      </div>
    </PageBackground>
  );
}

interface ComponentDocumentationProps {
  doc: ComponentDoc;
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
}

function ComponentDocumentation({ doc, copiedCode, onCopyCode }: ComponentDocumentationProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Component Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{doc.name}</CardTitle>
              <CardDescription className="mt-2">{doc.description}</CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              {doc.category}
            </Badge>
          </div>
          {doc.importPath && (
            <div className="mt-4">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {doc.importPath}
              </code>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Props Table */}
      {doc.props && doc.props.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("props", "Props")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      {t("propName", "Name")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      {t("propType", "Type")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      {t("propDefault", "Default")}
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      {t("propDescription", "Description")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {doc.props.map((prop, index) => (
                    <tr key={prop.name} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="py-2 px-3">
                        <code className="text-primary font-mono text-xs">{prop.name}</code>
                        {prop.required && (
                          <span className="ml-1 text-destructive">*</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                          {prop.type}
                        </code>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {prop.default || "-"}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {prop.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Examples */}
      {doc.examples && doc.examples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("examples", "Examples")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={doc.examples[0]?.id} className="w-full">
              <TabsList className="mb-4">
                {doc.examples.map((example) => (
                  <TabsTrigger key={example.id} value={example.id}>
                    {example.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {doc.examples.map((example) => (
                <TabsContent key={example.id} value={example.id} className="space-y-4">
                  {example.description && (
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  )}
                  
                  {/* Live Preview */}
                  {example.preview && (
                    <div className="border border-border rounded-lg p-6 bg-background">
                      <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                        {t("preview", "Preview")}
                      </div>
                      <div className="flex items-center justify-center min-h-[100px]">
                        {example.preview}
                      </div>
                    </div>
                  )}

                  {/* Code Block */}
                  <div className="relative">
                    <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-t-lg border border-border border-b-0">
                      <span className="text-xs text-muted-foreground font-mono">
                        {example.language || "tsx"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyCode(example.code, example.id)}
                        className="h-7 px-2"
                      >
                        {copiedCode === example.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted/30 p-4 rounded-b-lg border border-border border-t-0 overflow-x-auto">
                      <code className="text-sm font-mono text-foreground whitespace-pre">
                        {example.code}
                      </code>
                    </pre>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {doc.notes && doc.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("notes", "Notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {doc.notes.map((note, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
