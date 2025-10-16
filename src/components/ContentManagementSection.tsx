import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileImage, Video, Music, FileText, Trash2, Edit, Search, Filter, Download, Eye, Loader2, Folder } from 'lucide-react';
import { supabase, supabaseUrl, getContent, addContent, updateContent, deleteContent, isSupabaseConfigured, getStorageBuckets, listBucketFiles, getStorageObjectsSnapshot, buildPublicStorageUrl } from '../lib/supabase';

interface MediaFile {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  file_url: string;
  thumbnail_url?: string;
  file_size?: number;
  tags?: string[];
  building_id?: string;
  room_id?: string;
  created_at?: string;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Move MediaEditForm outside to prevent re-creation on every render
const MediaEditForm = ({ 
  formData, 
  setFormData 
}: { 
  formData: Partial<MediaFile>; 
  setFormData: React.Dispatch<React.SetStateAction<Partial<MediaFile>>>; 
}) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        value={formData.title || ''}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Enter file title"
      />
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Enter file description"
        rows={3}
      />
    </div>
    <div>
      <Label htmlFor="tags">Tags (comma-separated)</Label>
      <Input
        id="tags"
        value={formData.tags?.join(', ') || ''}
        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
        placeholder="e.g., exterior, main entrance, architecture"
      />
    </div>
  </div>
);

export default function ContentManagementSection() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MediaFile>>({});
  const [activeTab, setActiveTab] = useState('grid');
  const [actionLoading, setActionLoading] = useState(false);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [bucketsLoading, setBucketsLoading] = useState(false);
  const [bucketFiles, setBucketFiles] = useState<Record<string, any[]>>({});
  // Map of bucket -> path -> entries at that path (lazy loaded)
  const [bucketPathEntries, setBucketPathEntries] = useState<Record<string, Record<string, any[]>>>({});
  // Track expanded folder paths per bucket
  const [expandedPaths, setExpandedPaths] = useState<Record<string, Set<string>>>({});
  // Per-bucket counts
  const [bucketCounts, setBucketCounts] = useState<Record<string, { items: number; files: number; folders: number; loadedAll: boolean }>>({});
  // Toggle: use DB snapshot instead of live storage list
  const [useSnapshot, setUseSnapshot] = useState(true);
  // Track images that failed to load so we can show a fallback icon instead of a blank box
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  useEffect(() => {
    // Load content items and storage buckets on mount
    loadContent();
    loadBuckets();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await getContent();
      console.log('📋 Loaded content:', data.length);
      setMediaFiles(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBuckets = async () => {
    setBucketsLoading(true);
    try {
      let data = await getStorageBuckets();
      // Fallback: public clients cannot list buckets; try common buckets
      if (!data || data.length === 0) {
        const candidateNames = ['logo', 'avatars'];
        const discovered: any[] = [];
        for (const name of candidateNames) {
          try {
            const files = await listBucketFiles(name, '', { limit: 1 });
            if (Array.isArray(files)) {
              discovered.push({ name, id: name, public: true, created_at: new Date().toISOString() });
            }
          } catch (_) {
            // ignore
          }
        }
        data = discovered;
      }

      setBuckets(data);
      console.log('📦 Buckets:', data);

      // Load files for each discovered bucket (root path)
      const filesByBucket: Record<string, any[]> = {};
      const byPath: Record<string, Record<string, any[]>> = {};
      for (const b of data) {
        try {
          const files = useSnapshot
            ? (await getStorageObjectsSnapshot(b.name, '')).map((row: any) => {
                // In snapshot table, folder indicates virtual directories; files have metadata and filename
                const isFolder = !!row.folder && (!row.metadata || !row.metadata.size)
                const name = row.name || row.filename || ''
                const fileEntry: any = {
                  name,
                  id: row.id,
                  metadata: row.metadata || (isFolder ? null : { size: 0 }),
                }
                if (!isFolder) {
                  fileEntry.publicUrl = buildPublicStorageUrl(b.name, name)
                }
                return fileEntry
              })
            : await listBucketFiles(b.name, '', { limit: 100 });
          // augment with public URLs if bucket is public
          const withUrls = (files || []).map((f: any) => {
            const path = f.name;
            const { data: pub } = supabase.storage.from(b.name).getPublicUrl(path);
            let publicUrl = f.publicUrl || pub?.publicUrl;
            // Fallback build (pre-signed pattern) if SDK returns empty
            if (!publicUrl && supabaseUrl) {
              publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${b.name}/${encodeURIComponent(path)}`;
            }
            return { ...f, publicUrl };
          });
          filesByBucket[b.name] = withUrls;
          byPath[b.name] = { '': withUrls };
        } catch (e) {
          console.error('Error loading files for bucket', b.name, e);
          filesByBucket[b.name] = [];
          byPath[b.name] = { '': [] };
        }
      }
      setBucketFiles(filesByBucket);
      setBucketPathEntries(byPath);
    } catch (e) {
      console.error('Error loading buckets:', e);
    } finally {
      setBucketsLoading(false);
    }
  };

  // Helper to determine if entry is a file (has metadata with size) or folder
  const isFileEntry = (entry: any) => !!entry && typeof entry === 'object' && entry.metadata && typeof entry.metadata.size === 'number';

  // Recursively load all paths for a bucket and compute counts
  const loadAllBucketPaths = async (bucketName: string) => {
    try {
      const queue: string[] = [''];
      const visited = new Set<string>();
      let totalFiles = 0;
      let totalFolders = 0;
      const aggregateByPath: Record<string, any[]> = { ...(bucketPathEntries[bucketName] || {}) };

      while (queue.length > 0) {
        const currentPath = queue.shift() as string;
        if (visited.has(currentPath)) continue;
        visited.add(currentPath);

        // Fetch if not already cached
        let entries = aggregateByPath[currentPath];
        if (!entries) {
          const children = await listBucketFiles(bucketName, currentPath, { limit: 1000 });
          entries = (children || []).map((f: any) => {
            const childPath = currentPath + f.name;
            if (f && f.metadata && typeof f.metadata.size === 'number') {
              const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(childPath);
              let publicUrl = pub?.publicUrl;
              if (!publicUrl && supabaseUrl) {
                publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucketName}/${encodeURIComponent(childPath)}`;
              }
              return { ...f, publicUrl };
            }
            return { ...f };
          });
          aggregateByPath[currentPath] = entries;
        }

        for (const entry of entries) {
          const isFile = isFileEntry(entry);
          if (isFile) {
            totalFiles += 1;
          } else {
            totalFolders += 1;
            const nextPath = currentPath + entry.name + '/';
            if (!visited.has(nextPath)) {
              queue.push(nextPath);
            }
          }
        }
      }

      setBucketPathEntries((prev) => ({ ...prev, [bucketName]: { ...(prev[bucketName] || {}), ...aggregateByPath } }));
      setBucketCounts((prev) => ({
        ...prev,
        [bucketName]: {
          items: totalFiles + totalFolders,
          files: totalFiles,
          folders: totalFolders,
          loadedAll: true
        }
      }));
    } catch (e) {
      console.error('Error loading all paths for bucket', bucketName, e);
    }
  };

  const toggleFolder = async (bucketName: string, parentPath: string, folderName: string) => {
    const fullPath = (parentPath ? parentPath : '') + folderName + '/';
    setExpandedPaths((prev) => {
      const set = new Set(prev[bucketName] || []);
      if (set.has(fullPath)) set.delete(fullPath); else set.add(fullPath);
      return { ...prev, [bucketName]: set };
    });

    // If not loaded yet, fetch children for this folder path
    if (!bucketPathEntries[bucketName] || !(fullPath in bucketPathEntries[bucketName])) {
      try {
        const children = useSnapshot
          ? (await getStorageObjectsSnapshot(bucketName, fullPath)).map((row: any) => {
              const isFolder = !!row.folder && (!row.metadata || !row.metadata.size)
              const name = row.name?.slice(fullPath.length) || row.filename || ''
              const fileEntry: any = {
                name,
                id: row.id,
                metadata: row.metadata || (isFolder ? null : { size: 0 }),
              }
              if (!isFolder) {
                fileEntry.publicUrl = buildPublicStorageUrl(bucketName, fullPath + name)
              }
              return fileEntry
            })
          : await listBucketFiles(bucketName, fullPath, { limit: 100 });
        const withUrls = (children || []).map((f: any) => {
          const childPath = fullPath + f.name;
          // Only compute public URL for files
          if (f && f.metadata && typeof f.metadata.size === 'number') {
            const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(childPath);
            let publicUrl = pub?.publicUrl;
            if (!publicUrl && supabaseUrl) {
              publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucketName}/${encodeURIComponent(childPath)}`;
            }
            return { ...f, publicUrl };
          }
          return { ...f };
        });
        setBucketPathEntries((prev) => ({
          ...prev,
          [bucketName]: { ...(prev[bucketName] || {}), [fullPath]: withUrls }
        }));
      } catch (e) {
        console.error('Error loading folder path', fullPath, 'in bucket', bucketName, e);
        setBucketPathEntries((prev) => ({
          ...prev,
          [bucketName]: { ...(prev[bucketName] || {}), [fullPath]: [] }
        }));
      }
    }
  };

  const renderPath = (bucketName: string, path: string, depth: number) => {
    const entries = (bucketPathEntries[bucketName] && bucketPathEntries[bucketName][path]) || [];
    return (
      <div className="space-y-2">
        {entries.map((f: any) => {
          const isFile = isFileEntry(f);
          const itemPath = path + f.name + (isFile ? '' : '/');
          return (
            <div key={`${bucketName}:${itemPath}`} className="border rounded-lg p-3" style={{ marginLeft: depth * 16 }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isFile ? (
                    <FileText className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Folder className="h-4 w-4 text-blue-500" />
                  )}
                  <p className="text-xs truncate" title={f.name}>{f.name}</p>
                </div>
                {isFile ? (
                  f.publicUrl ? (
                    <Button variant="outline" size="sm" onClick={() => triggerDownload(f.publicUrl, f.name)}>
                      <Download className="h-3 w-3" />
                    </Button>
                  ) : null
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => toggleFolder(bucketName, path, f.name)}>
                    {expandedPaths[bucketName]?.has(itemPath) ? 'Collapse' : 'Expand'}
                  </Button>
                )}
              </div>
              {!isFile && expandedPaths[bucketName]?.has(itemPath) ? (
                <div className="mt-2">
                  {renderPath(bucketName, itemPath, depth + 1)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const triggerDownload = (url: string, filename: string) => {
    if (!url) return;
    // Force download via Supabase public endpoint by appending ?download=<filename>
    const sep = url.includes('?') ? '&' : '?';
    const suggested = filename && filename.trim() ? filename.trim() : 'download';
    const downloadUrl = `${url}${sep}download=${encodeURIComponent(suggested)}`;
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.setAttribute('download', suggested);
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const categories = [
    {
      id: 'image',
      name: 'Images',
      count: mediaFiles.filter(f => f.content_type === 'image').length,
      totalSize: mediaFiles.filter(f => f.content_type === 'image').reduce((sum, f) => sum + (f.file_size || 0), 0)
    },
    {
      id: 'video',
      name: 'Videos',
      count: mediaFiles.filter(f => f.content_type === 'video').length,
      totalSize: mediaFiles.filter(f => f.content_type === 'video').reduce((sum, f) => sum + (f.file_size || 0), 0)
    },
    {
      id: 'audio',
      name: 'Audio',
      count: mediaFiles.filter(f => f.content_type === 'audio').length,
      totalSize: mediaFiles.filter(f => f.content_type === 'audio').reduce((sum, f) => sum + (f.file_size || 0), 0)
    },
    {
      id: 'document',
      name: 'Documents',
      count: mediaFiles.filter(f => f.content_type === 'document').length,
      totalSize: mediaFiles.filter(f => f.content_type === 'document').reduce((sum, f) => sum + (f.file_size || 0), 0)
    }
  ];

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || file.content_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleEditFile = async () => {
    if (selectedFile && formData.title) {
      setActionLoading(true);
      try {
        const updated = await updateContent(selectedFile.id, formData);
        
        if (updated) {
          setMediaFiles(mediaFiles.map(file =>
            file.id === selectedFile.id ? updated : file
          ));
          setSelectedFile(null);
          setFormData({});
          setIsEditDialogOpen(false);
        }
      } catch (error) {
        console.error('Error updating content:', error);
        alert('Failed to update content. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const success = await deleteContent(fileId);
      if (success) {
        setMediaFiles(mediaFiles.filter(file => file.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return FileImage;
      case 'video': return Video;
      case 'audio': return Music;
      case 'document': return FileText;
      default: return FileText;
    }
  };

  const openPreview = (file: MediaFile) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  const dbConnected = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Content Management</h2>
          <p className="text-muted-foreground">
            {dbConnected ? 'Manage media files from database' : 'Database not connected'}
          </p>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {categories.map((category) => {
          const Icon = getFileIcon(category.id);
          return (
            <Card key={category.id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Icon className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-semibold">{category.count}</p>
                    <p className="text-sm text-muted-foreground">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(category.totalSize)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files by name, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          {filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileImage className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No content found</p>
                {!dbConnected && (
                  <p className="text-sm mt-2">Connect your Supabase database to manage content</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.content_type);
                return (
                  <Card key={file.id} className="relative group">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
                        {file.content_type === 'image' && (file.thumbnail_url || file.file_url) && !failedImageIds.has(file.id) ? (
                          <img 
                            src={file.thumbnail_url || file.file_url}
                            alt={file.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={() => {
                              setFailedImageIds((prev) => new Set(prev).add(file.id))
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2">
                            <div className="w-full h-full bg-white text-gray-400 rounded flex items-center justify-center">
                              <Icon className="h-12 w-12" />
                            </div>
                          </div>
                        )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => openPreview(file)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => triggerDownload(file.file_url, file.title)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            {dbConnected && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="secondary" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete File</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {file.title}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteFile(file.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {dbConnected && (
                              <Dialog open={isEditDialogOpen && selectedFile?.id === file.id} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setFormData(file);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit Media File</DialogTitle>
                                    <DialogDescription>
                                      Update media file information and metadata.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <MediaEditForm formData={formData} setFormData={setFormData} />
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleEditFile} disabled={actionLoading}>
                                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                      Save Changes
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{file.title}</p>
                          <Badge variant="default" className="text-xs capitalize">
                            {file.content_type}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {file.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(file.file_size || 0)}</span>
                        </div>
                        
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {file.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {file.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{file.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Files ({filteredFiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No content found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => {
                      const Icon = getFileIcon(file.content_type);
                      return (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Icon className="h-8 w-8 text-gray-400" />
                              <div>
                                <p className="font-medium">{file.title}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {file.description || 'No description'}
                                </p>
                                {file.tags && file.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {file.tags.slice(0, 3).map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{file.content_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <p>{formatFileSize(file.file_size || 0)}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openPreview(file)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => triggerDownload(file.file_url, file.title)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {dbConnected && (
                                <>
                                  <Dialog open={isEditDialogOpen && selectedFile?.id === file.id} onOpenChange={setIsEditDialogOpen}>
                                    <DialogTrigger asChild>
                                  <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedFile(file);
                                          setFormData(file);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Edit Media File</DialogTitle>
                                        <DialogDescription>
                                          Update media file information and metadata.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <MediaEditForm formData={formData} setFormData={setFormData} />
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleEditFile} disabled={actionLoading}>
                                          {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                          Save Changes
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {file.title}? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteFile(file.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.title || 'Preview'}</DialogTitle>
            <DialogDescription>
              {previewFile?.description || ''}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full">
            {previewFile ? (
              previewFile.content_type === 'image' ? (
                <img 
                  src={previewFile.thumbnail_url || previewFile.file_url}
                  alt={previewFile.title}
                  className="w-full h-auto rounded"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                  <p className="text-sm text-muted-foreground">No inline preview available</p>
                </div>
              )
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            {previewFile?.file_url ? (
              <Button variant="outline" onClick={() => triggerDownload(previewFile.file_url, previewFile.title)}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            ) : null}
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}