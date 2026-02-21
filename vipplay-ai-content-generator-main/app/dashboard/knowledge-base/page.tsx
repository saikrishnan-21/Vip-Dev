"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Trash2,
  ExternalLink,
  Rss,
  Globe,
  TrendingUp,
  Tag,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  Eye,
  Loader2,
} from "lucide-react"
import { AddRssDialog } from "@/components/add-rss-dialog"
import { AddWebsiteDialog } from "@/components/add-website-dialog"
import { AddTopicDialog } from "@/components/add-topic-dialog"
import { AddTrendsDialog } from "@/components/add-trends-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SourcePublic, ArticlePublic } from "@/lib/types"

interface Article extends ArticlePublic {
  sourceId: string
  publishedDate: string
  capturedDate: string
}

interface Source extends SourcePublic {
  id: string
  url?: string
  status: string
  lastUpdated: string
  articleCount: number
}

export default function KnowledgeBasePage() {
  const [viewMode, setViewMode] = useState<"articles" | "sources">("articles")
  const [sources, setSources] = useState<Source[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSources, setExpandedSources] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch sources from API
  const fetchSources = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      const response = await fetch("/api/sources", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch sources")
      }

      const data = await response.json()
      if (data.success) {
        const formattedSources: Source[] = data.sources.map((s: SourcePublic) => ({
          ...s,
          id: s._id,
          url: s.feedUrl || s.websiteUrl,
          status: s.status === "active" ? "Active" : s.status === "paused" ? "Paused" : "Error",
          lastUpdated: s.lastFetchedAt
            ? new Date(s.lastFetchedAt).toLocaleString()
            : "Never",
          articleCount: s.articlesCount || 0,
        }))
        setSources(formattedSources)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load sources"
      setError(message)
      console.error("Sources fetch error:", err)
    }
  }, [])

  // Fetch articles from API
  const fetchArticles = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("q", searchQuery)
      }
      params.append("limit", "100") // Get more articles for display

      const response = await fetch(`/api/articles/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch articles")
      }

      const data = await response.json()
      if (data.success) {
        const formattedArticles: Article[] = data.articles.map((a: ArticlePublic) => ({
          ...a,
          id: a._id,
          sourceId: a.sourceId,
          publishedDate: a.publishedAt
            ? new Date(a.publishedAt).toLocaleDateString()
            : "Unknown",
          capturedDate: a.fetchedAt
            ? new Date(a.fetchedAt).toLocaleString()
            : "Unknown",
          keywords: a.tags || [],
        }))
        setArticles(formattedArticles)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load articles"
      setError(message)
      console.error("Articles fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  // Initial load
  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  // Fetch articles when search query changes (debounced)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchArticles()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [fetchArticles])

  // Refresh data when dialogs close (after adding source)
  const handleSourceAdded = () => {
    fetchSources()
    fetchArticles()
  }

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery) return true
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.keywords && article.keywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase())))
    return matchesSearch
  })

  const filteredSources = sources.filter((source) => {
    if (!searchQuery) return true
    return source.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const toggleSource = (sourceId: string) => {
    setExpandedSources((prev) => (prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]))
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "rss":
        return <Rss className="h-4 w-4" />
      case "website":
        return <Globe className="h-4 w-4" />
      case "topic":
        return <Tag className="h-4 w-4" />
      case "trend":
        return <TrendingUp className="h-4 w-4" />
      default:
        return null
    }
  }

  const getArticlesBySource = (sourceId: string) => {
    return articles.filter((article) => article.sourceId === sourceId)
  }

  const handleDeleteSource = async () => {
    if (!deleteDialog.id) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("Not authenticated")
        return
      }

      // TODO: Implement DELETE endpoint for sources
      // const response = await fetch(`/api/sources/${deleteDialog.id}`, {
      //   method: "DELETE",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // })

      // if (!response.ok) {
      //   throw new Error("Failed to delete source")
      // }

      setDeleteDialog({ open: false, id: null })
      fetchSources()
      fetchArticles()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete source"
      setError(message)
      console.error("Delete source error:", err)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Knowledge Base</h1>
        <p className="text-muted-foreground">Captured articles and sources for AI-powered content generation</p>
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={viewMode === "articles" ? "Search articles..." : "Search sources..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "articles" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("articles")}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              Articles ({articles.length})
            </Button>
            <Button
              variant={viewMode === "sources" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("sources")}
              className="text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              Sources ({sources.length})
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AddRssDialog onSuccess={handleSourceAdded}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              <Rss className="h-4 w-4" />
              RSS Feed
            </Button>
          </AddRssDialog>
          <AddWebsiteDialog onSuccess={handleSourceAdded}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              <Globe className="h-4 w-4" />
              Website
            </Button>
          </AddWebsiteDialog>
          <AddTopicDialog onSuccess={handleSourceAdded}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              <Tag className="h-4 w-4" />
              Topic
            </Button>
          </AddTopicDialog>
          <AddTrendsDialog onSuccess={handleSourceAdded}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              <TrendingUp className="h-4 w-4" />
              Trends
            </Button>
          </AddTrendsDialog>
        </div>
      </div>

      {viewMode === "articles" ? (
        // Articles View - Grouped by Source
        <div className="space-y-4">
          {sources
            .filter((s) => getArticlesBySource(s.id).length > 0)
            .map((source) => {
              const sourceArticles = getArticlesBySource(source.id).filter(
                (article) => {
                  if (!searchQuery) return true
                  return (
                    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (article.keywords && article.keywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase())))
                  )
                }
              )

              if (sourceArticles.length === 0 && searchQuery) return null

              return (
                <Card key={source.id} className="bg-card border-border">
                  <Collapsible open={expandedSources.includes(source.id)} onOpenChange={() => toggleSource(source.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedSources.includes(source.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            {getSourceIcon(source.type)}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-foreground">{source.name}</div>
                            <div className="text-sm text-muted-foreground">{sourceArticles.length} articles</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {source.status}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border">
                        {sourceArticles.map((article) => (
                          <div
                            key={article.id}
                            className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start gap-3">
                                  <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h3 className="font-medium text-foreground hover:text-primary cursor-pointer">
                                      {article.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {article.publishedDate}
                                      </span>
                                      <span>Captured {article.capturedDate}</span>
                                      <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-primary"
                                      >
                                        View Source
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                    {article.keywords && article.keywords.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {article.keywords.map((keyword) => (
                                          <Badge key={keyword} variant="outline" className="text-xs">
                                            {keyword}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="flex-shrink-0 bg-transparent">
                                <Eye className="h-3 w-3 mr-1" />
                                Use in Content
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
        </div>
      ) : (
        // Sources Only View
        <Card className="bg-card border-border">
          <div className="divide-y divide-border">
            {filteredSources.map((source) => (
              <div key={source.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getSourceIcon(source.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{source.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary flex items-center gap-1"
                          >
                            {source.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <span>•</span>
                        <span>{source.articleCount} articles</span>
                        <span>•</span>
                        <span>Updated {source.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {source.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteDialog({ open: true, id: source.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Source"
        description="Are you sure you want to delete this source? All captured articles will also be removed."
        onConfirm={handleDeleteSource}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
