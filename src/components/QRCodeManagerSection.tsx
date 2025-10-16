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
import { QrCode, Plus, Edit, Trash2, Search, Download, Eye, MapPin, Scan, Loader2 } from 'lucide-react';
import { getQRCodes, addQRCode, updateQRCode, deleteQRCode, isSupabaseConfigured } from '../lib/supabase';

interface QRCodeData {
  id: string;
  code?: string;
  title: string;
  description?: string;
  destination_type: string;
  destination_id: string;
  qr_url?: string;
  scan_count?: number;
  is_active?: boolean;
  created_at?: string;
}

export default function QRCodeManagerSection() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<QRCodeData>>({});
  const [activeTab, setActiveTab] = useState('grid');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const data = await getQRCodes();
      console.log('📋 Loaded QR codes:', data.length);
      setQrCodes(data);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = qr.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qr.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || qr.destination_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const generateQRCode = async () => {
    if (formData.title && formData.destination_type && formData.destination_id) {
      setActionLoading(true);
      try {
        const newQR = await addQRCode({
          code: `QR_${Date.now()}`,
          title: formData.title,
          description: formData.description || '',
          destination_type: formData.destination_type,
          destination_id: formData.destination_id,
          qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${formData.destination_id}`,
          scan_count: 0,
          is_active: true
        });
        
        if (newQR) {
          setQrCodes([newQR, ...qrCodes]);
          setFormData({});
          setIsGenerateDialogOpen(false);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleEditQR = async () => {
    if (selectedQR && formData.title) {
      setActionLoading(true);
      try {
        const updated = await updateQRCode(selectedQR.id, formData);
        
        if (updated) {
          setQrCodes(qrCodes.map(qr => qr.id === selectedQR.id ? updated : qr));
          setSelectedQR(null);
          setFormData({});
          setIsEditDialogOpen(false);
        }
      } catch (error) {
        console.error('Error updating QR code:', error);
        alert('Failed to update QR code. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteQR = async (qrId: string) => {
    try {
      const success = await deleteQRCode(qrId);
      if (success) {
        setQrCodes(qrCodes.filter(qr => qr.id !== qrId));
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
      alert('Failed to delete QR code. Please try again.');
    }
  };

  const exportQRCodes = () => {
    const csv = [
      ['Title', 'Type', 'Destination ID', 'Scans', 'Status'],
      ...filteredQRCodes.map(qr => [
        qr.title, qr.destination_type, qr.destination_id, qr.scan_count || 0, qr.is_active ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-codes.csv';
    a.click();
  };

  const QRForm = ({ qr }: { qr?: QRCodeData }) => (
    <div className="grid gap-4 py-4">
      <div>
        <Label htmlFor="qrTitle">QR Code Title</Label>
        <Input
          id="qrTitle"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter QR code title"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Destination Type</Label>
          <Select value={formData.destination_type || ''} onValueChange={(value) => setFormData({ ...formData, destination_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="room">Room</SelectItem>
              <SelectItem value="tour">Tour</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="destinationId">Destination ID</Label>
          <Input
            id="destinationId"
            value={formData.destination_id || ''}
            onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
            placeholder="Enter ID"
          />
        </div>
      </div>
    </div>
  );

  const QRPreview = ({ qr }: { qr: QRCodeData }) => (
    <div className="text-center space-y-4">
      <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center">
        <div className="w-40 h-40 bg-gray-900 rounded-lg flex items-center justify-center">
          <QrCode className="h-32 w-32 text-white" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">{qr.title}</h3>
        <p className="text-sm text-muted-foreground capitalize">{qr.destination_type}</p>
        <p className="text-xs text-muted-foreground">{qr.scan_count || 0} scans</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading QR codes...</p>
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
          <h2 className="text-2xl font-semibold">QR Code Manager</h2>
          <p className="text-muted-foreground">
            {dbConnected ? 'Manage QR codes from database' : 'Database not connected'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportQRCodes}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {dbConnected && (
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate New QR Code</DialogTitle>
                  <DialogDescription>
                    Create a new QR code for a specific location or content in your virtual tour.
                  </DialogDescription>
                </DialogHeader>
                <QRForm />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={generateQRCode} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Generate QR Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <QrCode className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-semibold">{qrCodes.length}</p>
                <p className="text-sm text-muted-foreground">Total QR Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Scan className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-semibold">{qrCodes.reduce((total, qr) => total + (qr.scan_count || 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Total Scans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-semibold">{qrCodes.filter(q => q.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-semibold">{new Set(qrCodes.map(q => q.destination_type)).size}</p>
                <p className="text-sm text-muted-foreground">Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search QR codes by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="tour">Tour</SelectItem>
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
          {filteredQRCodes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No QR codes found</p>
                {!dbConnected && (
                  <p className="text-sm mt-2">Connect your Supabase database to manage QR codes</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredQRCodes.map((qr) => (
                <Card key={qr.id} className="relative group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        <div>
                          <CardTitle className="text-sm">{qr.title}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">{qr.destination_type}</p>
                        </div>
                      </div>
                      <Badge variant={qr.is_active ? 'default' : 'secondary'} className="text-xs">
                        {qr.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="aspect-square bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="w-20 h-20 bg-gray-900 rounded flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                          <Dialog open={isPreviewOpen && selectedQR?.id === qr.id} onOpenChange={setIsPreviewOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => setSelectedQR(qr)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>QR Code Preview</DialogTitle>
                                <DialogDescription>
                                  View and download QR code.
                                </DialogDescription>
                              </DialogHeader>
                              <QRPreview qr={qr} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {qr.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{qr.scan_count || 0} scans</span>
                      </div>
                    </div>

                    {dbConnected && (
                      <div className="flex gap-2">
                        <Dialog open={isEditDialogOpen && selectedQR?.id === qr.id} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setSelectedQR(qr);
                                setFormData(qr);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit QR Code</DialogTitle>
                              <DialogDescription>
                                Update QR code information and settings.
                              </DialogDescription>
                            </DialogHeader>
                            <QRForm qr={qr} />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                              <Button onClick={handleEditQR} disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete QR Code</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{qr.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteQR(qr.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR Codes ({filteredQRCodes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredQRCodes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No QR codes found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>QR Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Scans</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQRCodes.map((qr) => (
                      <TableRow key={qr.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
                              <QrCode className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{qr.title}</p>
                              <p className="text-sm text-muted-foreground">{qr.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{qr.destination_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-sm">{qr.destination_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Scan className="h-3 w-3" />
                            <span>{qr.scan_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={qr.is_active ? 'default' : 'secondary'}>
                            {qr.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {dbConnected && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete QR Code</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this QR code?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteQR(qr.id)}>
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
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}