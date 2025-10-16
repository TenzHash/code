import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Edit, Trash2, Search, Route, Play, Users, Star, Loader2, MapPin, Clock } from 'lucide-react';
import { getTours, addTour, updateTour, deleteTour, getTourStops, isSupabaseConfigured } from '../lib/supabase';

interface Tour {
  id: string;
  name: string;
  description?: string;
  tour_type?: string;
  estimated_duration?: number;
  total_stops?: number;
  is_active?: boolean;
  created_at?: string;
}

export default function ToursTrailsSection() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isAddTourOpen, setIsAddTourOpen] = useState(false);
  const [isEditTourOpen, setIsEditTourOpen] = useState(false);
  const [tourFormData, setTourFormData] = useState<Partial<Tour>>({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    setLoading(true);
    try {
      const data = await getTours();
      console.log('📋 Loaded tours:', data.length);
      setTours(data);
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddTour = async () => {
    if (tourFormData.name && tourFormData.description) {
      setActionLoading(true);
      try {
        const newTour = await addTour({
          name: tourFormData.name,
          description: tourFormData.description,
          tour_type: tourFormData.tour_type || 'self_guided',
          estimated_duration: tourFormData.estimated_duration || 30,
          is_active: true,
          total_stops: 0
        });
        
        if (newTour) {
          setTours([newTour, ...tours]);
          setTourFormData({});
          setIsAddTourOpen(false);
        }
      } catch (error) {
        console.error('Error adding tour:', error);
        alert('Failed to add tour. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleEditTour = async () => {
    if (selectedTour && tourFormData.name) {
      setActionLoading(true);
      try {
        const updated = await updateTour(selectedTour.id, tourFormData);
        
        if (updated) {
          setTours(tours.map(t => t.id === selectedTour.id ? updated : t));
          setSelectedTour(null);
          setTourFormData({});
          setIsEditTourOpen(false);
        }
      } catch (error) {
        console.error('Error updating tour:', error);
        alert('Failed to update tour. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    try {
      const success = await deleteTour(tourId);
      if (success) {
        setTours(tours.filter(t => t.id !== tourId));
      }
    } catch (error) {
      console.error('Error deleting tour:', error);
      alert('Failed to delete tour. Please try again.');
    }
  };

  const TourForm = ({ tour }: { tour?: Tour }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tourName">Tour Name</Label>
          <Input
            id="tourName"
            value={tourFormData.name || ''}
            onChange={(e) => setTourFormData({ ...tourFormData, name: e.target.value })}
            placeholder="Enter tour name"
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={tourFormData.tour_type || 'self_guided'} onValueChange={(value) => setTourFormData({ ...tourFormData, tour_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self_guided">Self Guided</SelectItem>
              <SelectItem value="guided">Guided</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={tourFormData.description || ''}
          onChange={(e) => setTourFormData({ ...tourFormData, description: e.target.value })}
          placeholder="Enter tour description"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="duration">Estimated Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          value={tourFormData.estimated_duration || ''}
          onChange={(e) => setTourFormData({ ...tourFormData, estimated_duration: parseInt(e.target.value) || 30 })}
          placeholder="Duration in minutes"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading tours...</p>
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
          <h2 className="text-2xl font-semibold">Tours & Trails</h2>
          <p className="text-muted-foreground">
            {dbConnected ? 'Manage virtual tours from database' : 'Database not connected'}
          </p>
        </div>
        {dbConnected && (
          <Dialog open={isAddTourOpen} onOpenChange={setIsAddTourOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tour
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Tour</DialogTitle>
                <DialogDescription>
                  Create a new virtual tour with multiple stops and media content.
                </DialogDescription>
              </DialogHeader>
              <TourForm />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddTourOpen(false)}>Cancel</Button>
                <Button onClick={handleAddTour} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Tour
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Route className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-semibold">{tours.length}</p>
                <p className="text-sm text-muted-foreground">Total Tours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Play className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-semibold">{tours.filter(t => t.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Tours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-semibold">{tours.reduce((sum, t) => sum + (t.total_stops || 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Total Stops</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-semibold">{Math.round(tours.reduce((sum, t) => sum + (t.estimated_duration || 0), 0) / (tours.length || 1))}</p>
                <p className="text-sm text-muted-foreground">Avg Duration (min)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tours by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tours Grid */}
      {filteredTours.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Route className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No tours found</p>
            {!dbConnected && (
              <p className="text-sm mt-2">Connect your Supabase database to manage tours</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTours.map((tour) => (
            <Card key={tour.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Route className="h-5 w-5" />
                      {tour.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{tour.tour_type?.replace('_', ' ') || 'Tour'}</p>
                  </div>
                  <Badge variant={tour.is_active ? 'default' : 'secondary'}>
                    {tour.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{tour.description || 'No description'}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{tour.estimated_duration || 0} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{tour.total_stops || 0} stops</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {dbConnected && (
                    <>
                      <Dialog open={isEditTourOpen && selectedTour?.id === tour.id} onOpenChange={setIsEditTourOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTour(tour);
                              setTourFormData(tour);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Tour</DialogTitle>
                            <DialogDescription>
                              Update tour information and settings.
                            </DialogDescription>
                          </DialogHeader>
                          <TourForm tour={tour} />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditTourOpen(false)}>Cancel</Button>
                            <Button onClick={handleEditTour} disabled={actionLoading}>
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
                            <AlertDialogTitle>Delete Tour</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{tour.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTour(tour.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}