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
import { Plus, Edit, Trash2, Search, Building, MapPin, Users, Eye, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getBuildings, addBuilding, updateBuilding, deleteBuilding, getRooms, addRoom, updateRoom, deleteRoom, isSupabaseConfigured } from '../lib/supabase';

interface Room {
  room_id: string;
  building_id: number;
  room_name: string;
  room_number?: string;
  room_type?: string;
  floor_level?: number;
}

interface BuildingData {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  total_rooms?: number;
  image_url?: string;
  rooms?: Room[];
  building_id?: number;
  building_name?: string;
  building_nickname?: string;
  building_type?: string;
}

// Expandable description component
const ExpandableDescription = ({ 
  description, 
  maxLength = 100, 
  building 
}: { 
  description?: string; 
  maxLength?: number;
  building?: BuildingData;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (!description || description === 'No description') {
    return <p className="text-sm text-muted-foreground mb-2">No description</p>;
  }
  
  const shouldTruncate = description.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? description : description.substring(0, maxLength) + '...';
  
  return (
    <div className="mb-2">
      <p className="text-sm text-muted-foreground">{displayText}</p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
          onClick={() => setIsModalOpen(true)}
        >
          <ChevronDown className="h-3 w-3 mr-1" />
          Read more
        </Button>
      )}
      
      {/* Building Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {building?.name}
            </DialogTitle>
            <DialogDescription>
              Complete building information and details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Building Description */}
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {building?.description || 'No description available'}
              </p>
            </div>
            
            {/* Building Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Building Type</h4>
                <p className="text-sm text-muted-foreground">{building?.building_type || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Building ID</h4>
                <p className="text-sm text-muted-foreground">{building?.id || 'N/A'}</p>
              </div>
            </div>
            
            {/* Address */}
            <div>
              <h4 className="font-semibold mb-2">Address</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {building?.address || 'Address not available'}
              </div>
            </div>
            
            {/* Rooms Information */}
            <div>
              <h4 className="font-semibold mb-2">Total Rooms</h4>
              <p className="text-2xl font-bold text-blue-600">{building?.rooms?.length || 0}</p>
            </div>
            
            {/* Rooms List */}
            {building?.rooms && building.rooms.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Rooms</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {building.rooms.map((room, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{room.room_name}</p>
                        {room.room_number && (
                          <p className="text-xs text-muted-foreground">Room #{room.room_number}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {room.room_type && (
                          <p className="text-xs text-muted-foreground">{room.room_type}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Move forms outside to prevent re-creation on every render
const BuildingForm = React.memo(({ 
  buildingFormData, 
  setBuildingFormData 
}: { 
  buildingFormData: Partial<BuildingData>; 
  setBuildingFormData: React.Dispatch<React.SetStateAction<Partial<BuildingData>>>; 
}) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name">Building Name</Label>
        <Input
          id="name"
          value={buildingFormData.name || ''}
          onChange={(e) => setBuildingFormData({ ...buildingFormData, name: e.target.value })}
          placeholder="Enter building name"
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={buildingFormData.address || ''}
          onChange={(e) => setBuildingFormData({ ...buildingFormData, address: e.target.value })}
          placeholder="Enter building address"
        />
      </div>
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={buildingFormData.description || ''}
        onChange={(e) => setBuildingFormData({ ...buildingFormData, description: e.target.value })}
        placeholder="Enter building description"
        rows={3}
      />
    </div>
  </div>
));

const RoomForm = React.memo(({ 
  roomFormData, 
  setRoomFormData 
}: { 
  roomFormData: Partial<Room>; 
  setRoomFormData: React.Dispatch<React.SetStateAction<Partial<Room>>>; 
}) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="roomNumber">Room Number</Label>
        <Input
          id="roomNumber"
          value={roomFormData.room_number || ''}
          onChange={(e) => setRoomFormData({ ...roomFormData, room_number: e.target.value })}
          placeholder="e.g., 101"
        />
      </div>
      <div>
        <Label htmlFor="roomName">Room Name</Label>
        <Input
          id="roomName"
          value={roomFormData.room_name || ''}
          onChange={(e) => setRoomFormData({ ...roomFormData, room_name: e.target.value })}
          placeholder="Enter room name"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="roomType">Room Type</Label>
        <Select value={roomFormData.room_type || 'Classroom'} onValueChange={(value) => setRoomFormData({ ...roomFormData, room_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Classroom">Classroom</SelectItem>
            <SelectItem value="Laboratory">Laboratory</SelectItem>
            <SelectItem value="Office">Office</SelectItem>
            <SelectItem value="Auditorium">Auditorium</SelectItem>
            <SelectItem value="Library">Library</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="floor">Floor Level</Label>
        <Input
          id="floor"
          type="number"
          value={roomFormData.floor_level || ''}
          onChange={(e) => setRoomFormData({ ...roomFormData, floor_level: parseInt(e.target.value) || 0 })}
          placeholder="Floor"
        />
      </div>
    </div>
  </div>
));

export default function BuildingsRoomsSection() {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomsSearchTerm, setRoomsSearchTerm] = useState('');
  const [roomsTypeFilter, setRoomsTypeFilter] = useState('all');
  const [roomsFloorFilter, setRoomsFloorFilter] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [buildingTypeFilter, setBuildingTypeFilter] = useState('all');
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isEditBuildingOpen, setIsEditBuildingOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isViewRoomsOpen, setIsViewRoomsOpen] = useState(false);
  const [selectedBuildingForRooms, setSelectedBuildingForRooms] = useState<BuildingData | null>(null);
  const [buildingFormData, setBuildingFormData] = useState<Partial<BuildingData>>({});
  const [roomFormData, setRoomFormData] = useState<Partial<Room>>({});
  const [activeTab, setActiveTab] = useState('buildings');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [buildingsData, roomsData] = await Promise.all([
        getBuildings(),
        getRooms()
      ]);
      
      // Group rooms by building and normalize field names
      const buildingsWithRooms = buildingsData.map(building => ({
        ...building,
        id: building.building_id, // Map building_id to id for consistency
        name: building.building_name, // Map building_name to name for consistency
        address: building.address, // Preserve address field
        rooms: roomsData.filter(room => room.building_id === building.building_id)
      }));
      
      console.log('📋 Loaded buildings:', buildingsWithRooms.length);
      console.log('📋 Loaded rooms:', roomsData.length);
      console.log('🔍 Sample building data:', buildingsData[0]);
      console.log('🔍 Sample room data:', roomsData[0]);
      console.log('🏢 Building fields available:', buildingsData[0] ? Object.keys(buildingsData[0]) : 'No buildings');
      console.log('🏢 Address field value:', buildingsData[0]?.address);
      console.log('🔍 Building IDs:', buildingsData.map(b => b.id));
      console.log('🔍 Room building_ids:', roomsData.map(r => r.building_id));
      setBuildings(buildingsWithRooms);
      setAllRooms(roomsData);
    } catch (error) {
      console.error('Error loading buildings/rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBuildings = buildings.filter(building => {
    // Filter out deleted buildings (those with DELETED_ prefix)
    if (building.name?.startsWith('DELETED_') || building.building_name?.startsWith('DELETED_')) {
      return false;
    }
    
    // Search filter
    const matchesSearch = !searchTerm || 
      building.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.building_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.building_nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.building_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Building type filter
    const matchesType = buildingTypeFilter === 'all' || 
      building.building_type?.toLowerCase() === buildingTypeFilter.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  // Debug logging
  console.log('🔍 Buildings state:', buildings.length);
  console.log('🔍 Search term:', searchTerm);
  console.log('🔍 Building type filter:', buildingTypeFilter);
  console.log('🔍 Filtered buildings:', filteredBuildings.length);
  console.log('🔍 Sample building for filtering:', buildings[0]);

  const handleAddBuilding = async () => {
    if (buildingFormData.name && buildingFormData.address) {
      setActionLoading(true);
      try {
        const newBuilding = await addBuilding({
          name: buildingFormData.name,
          description: buildingFormData.description || '',
          address: buildingFormData.address,
          total_rooms: 0
        });
        
        if (newBuilding) {
          setBuildings([{ ...newBuilding, rooms: [] }, ...buildings]);
          setBuildingFormData({});
          setIsAddBuildingOpen(false);
        }
      } catch (error) {
        console.error('Error adding building:', error);
        alert('Failed to add building. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleEditBuilding = async () => {
    if (selectedBuilding && buildingFormData.name) {
      setActionLoading(true);
      try {
        // Use building_id from the selected building (it's a number)
        const buildingId = selectedBuilding.building_id || parseInt(selectedBuilding.id);
        const updated = await updateBuilding(buildingId, buildingFormData);
        
        if (updated) {
          // Ensure the updated building has the correct structure
          const normalizedUpdated = {
            ...updated,
            id: updated.building_id?.toString() || updated.id,
            name: updated.building_name || updated.name,
            description: updated.description,
            rooms: selectedBuilding.rooms || []
          };
          
          setBuildings(buildings.map(b =>
            b.id === selectedBuilding.id ? normalizedUpdated : b
          ));
          setSelectedBuilding(null);
          setBuildingFormData({});
          setIsEditBuildingOpen(false);
        }
      } catch (error) {
        console.error('Error updating building:', error);
        alert('Failed to update building. Please try again.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    try {
      const success = await deleteBuilding(buildingId);
      if (success) {
        setBuildings(buildings.filter(b => b.id !== buildingId));
        if (selectedBuilding?.id === buildingId) {
          setSelectedBuilding(null);
        }
      }
    } catch (error) {
      console.error('Error deleting building:', error);
      alert('Failed to delete building. Please try again.');
    }
  };

  const handleAddRoom = async () => {
    const buildingId = selectedBuilding?.id || roomFormData.building_id;
    if (buildingId && roomFormData.room_name && roomFormData.room_number) {
      setActionLoading(true);
      try {
        const newRoom = await addRoom({
          building_id: typeof buildingId === 'string' ? parseInt(buildingId) : buildingId,
          room_name: roomFormData.room_name,
          room_number: roomFormData.room_number,
          room_type: roomFormData.room_type || 'Classroom',
          floor_level: roomFormData.floor_level || 1
        });
        
        if (newRoom) {
          const updatedBuildings = buildings.map(b =>
            parseInt(b.id) === (typeof buildingId === 'string' ? parseInt(buildingId) : buildingId)
              ? { ...b, rooms: [...(b.rooms || []), newRoom] }
              : b
          );
          setBuildings(updatedBuildings);
          setAllRooms([...allRooms, newRoom]);
          setRoomFormData({});
          setIsAddRoomOpen(false);
        }
      } catch (error) {
        console.error('Error adding room:', error);
        alert('Failed to add room. Please try again.');
      } finally {
        setActionLoading(false);
      }
    } else {
      alert('Please fill in all required room fields (Building, Name, Room Number).');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading buildings...</p>
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
          <h2 className="text-2xl font-semibold">Buildings & Rooms</h2>
          <p className="text-muted-foreground">
            {dbConnected ? 'Manage campus buildings from database' : 'Database not connected'}
          </p>
        </div>
        {dbConnected && (
          <div className="flex gap-2">
            <Dialog open={isAddBuildingOpen} onOpenChange={setIsAddBuildingOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Building
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Building</DialogTitle>
                <DialogDescription>
                  Create a new building entry for your campus virtual tour system.
                </DialogDescription>
              </DialogHeader>
              <BuildingForm buildingFormData={buildingFormData} setBuildingFormData={setBuildingFormData} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddBuildingOpen(false)}>Cancel</Button>
                <Button onClick={handleAddBuilding} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Add Building
                </Button>
              </div>
            </DialogContent>
            </Dialog>
            
            <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                  <DialogDescription>
                    Create a new room entry for a building.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {!selectedBuilding && (
                    <div>
                      <Label htmlFor="buildingSelect">Select Building</Label>
                      <Select 
                        value={roomFormData.building_id?.toString() || ''} 
                        onValueChange={(value) => setRoomFormData({ ...roomFormData, building_id: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a building" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem key={building.id || building.building_id} value={(building.id || building.building_id)?.toString() || ''}>
                              {building.name || building.building_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {selectedBuilding && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        <strong>Adding room to:</strong> {selectedBuilding.name}
                      </p>
                    </div>
                  )}
                  <RoomForm roomFormData={roomFormData} setRoomFormData={setRoomFormData} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddRoom} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Add Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-semibold">{buildings.length}</p>
                <p className="text-sm text-muted-foreground">Total Buildings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-semibold">{allRooms.length}</p>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-semibold">{buildings.length}</p>
                <p className="text-sm text-muted-foreground">Active Buildings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="rooms">All Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="buildings" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search buildings by name, address, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select value={buildingTypeFilter} onValueChange={setBuildingTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="non-academic">Non-Academic</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="recreational">Recreational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buildings Grid */}
          {filteredBuildings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No buildings found</p>
                {!dbConnected && (
                  <p className="text-sm mt-2">Connect your Supabase database to manage buildings</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBuildings.map((building) => (
                <Card key={building.id} className="relative h-fit max-h-80 flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          {building.name}
                        </CardTitle>
                        {building.building_type && (
                          <Badge variant="outline" className="mt-2 capitalize">
                            {building.building_type}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div>
                      <ExpandableDescription description={building.description} maxLength={120} building={building} />
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs">
                          {building.address || 'Location details not available'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium">Rooms: {building.rooms?.length || 0}</p>
                    </div>

                    <div className="flex gap-2 pt-4 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBuildingForRooms(building);
                          setIsViewRoomsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Rooms
                      </Button>
                      {dbConnected && (
                        <>
                          <Dialog open={isEditBuildingOpen && selectedBuilding?.id === building.id} onOpenChange={setIsEditBuildingOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedBuilding(building);
                                  setBuildingFormData({
                                    name: building.name || building.building_name,
                                    building_name: building.building_name,
                                    building_nickname: building.building_nickname,
                                    building_type: building.building_type,
                                    address: building.address,
                                    description: building.description
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Edit Building</DialogTitle>
                                <DialogDescription>
                                  Update building information and details.
                                </DialogDescription>
                              </DialogHeader>
                              <BuildingForm buildingFormData={buildingFormData} setBuildingFormData={setBuildingFormData} />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsEditBuildingOpen(false)}>Cancel</Button>
                                <Button onClick={handleEditBuilding} disabled={actionLoading}>
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
                                <AlertDialogTitle>Delete Building</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {building.name}? This will also delete all associated rooms.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBuilding(building.id)}>
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
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rooms by name, number, type, or floor..."
                      value={roomsSearchTerm}
                      onChange={(e) => setRoomsSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select value={roomsTypeFilter} onValueChange={setRoomsTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Classroom">Classroom</SelectItem>
                      <SelectItem value="Laboratory">Laboratory</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Auditorium">Auditorium</SelectItem>
                      <SelectItem value="Library">Library</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Floor"
                    value={roomsFloorFilter}
                    onChange={(e) => setRoomsFloorFilter(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {buildings.some(b => {
                const term = roomsSearchTerm.trim().toLowerCase();
                const floor = roomsFloorFilter.trim();
                const rooms = b.rooms || [];
                const matches = rooms.filter(r => {
                  const matchesSearch = !term ||
                    String(r.room_name ?? '').toLowerCase().includes(term) ||
                    String(r.room_number ?? '').toLowerCase().includes(term) ||
                    String(r.room_type ?? '').toLowerCase().includes(term) ||
                    (r.floor_level !== undefined && String(r.floor_level).toLowerCase().includes(term));
                  const matchesType = roomsTypeFilter === 'all' || String(r.room_type ?? '') === roomsTypeFilter;
                  const matchesFloor = floor === '' || (r.floor_level !== undefined && String(r.floor_level) === floor);
                  return matchesSearch && matchesType && matchesFloor;
                });
                return matches.length > 0;
              }) ? (
                <div className="space-y-6">
                  {buildings
                    .filter(building => {
                      const term = roomsSearchTerm.trim().toLowerCase();
                      const floor = roomsFloorFilter.trim();
                      const rooms = building.rooms || [];
                      const matches = rooms.filter(r => {
                        const matchesSearch = !term ||
                          String(r.room_name ?? '').toLowerCase().includes(term) ||
                          String(r.room_number ?? '').toLowerCase().includes(term) ||
                          String(r.room_type ?? '').toLowerCase().includes(term) ||
                          (r.floor_level !== undefined && String(r.floor_level).toLowerCase().includes(term));
                        const matchesType = roomsTypeFilter === 'all' || String(r.room_type ?? '') === roomsTypeFilter;
                        const matchesFloor = floor === '' || (r.floor_level !== undefined && String(r.floor_level) === floor);
                        return matchesSearch && matchesType && matchesFloor;
                      });
                      return matches.length > 0;
                    })
                    .map((building) => {
                      const term = roomsSearchTerm.trim().toLowerCase();
                      const floor = roomsFloorFilter.trim();
                      const rooms = building.rooms || [];
                      const filteredRooms = rooms.filter(r => {
                        const matchesSearch = !term ||
                          String(r.room_name ?? '').toLowerCase().includes(term) ||
                          String(r.room_number ?? '').toLowerCase().includes(term) ||
                          String(r.room_type ?? '').toLowerCase().includes(term) ||
                          (r.floor_level !== undefined && String(r.floor_level).toLowerCase().includes(term));
                        const matchesType = roomsTypeFilter === 'all' || String(r.room_type ?? '') === roomsTypeFilter;
                        const matchesFloor = floor === '' || (r.floor_level !== undefined && String(r.floor_level) === floor);
                        return matchesSearch && matchesType && matchesFloor;
                      });
                      return (
                        <div key={building.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{building.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {filteredRooms.length || 0} rooms • {building.building_type}
                              </p>
                            </div>
                            <Badge variant="outline">{building.building_type}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredRooms.map((room) => (
                              <div key={room.room_id} className="bg-gray-50 rounded-lg p-3 border">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{room.room_name}</p>
                                    <p className="text-xs text-muted-foreground">Room #{room.room_number}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {room.room_type || 'N/A'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Floor {room.floor_level || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No rooms found in any building</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Rooms Modal */}
      <Dialog open={isViewRoomsOpen} onOpenChange={setIsViewRoomsOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rooms in {selectedBuildingForRooms?.name}</DialogTitle>
            <DialogDescription>
              View all rooms available in this building.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBuildingForRooms?.rooms && selectedBuildingForRooms.rooms.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedBuildingForRooms.rooms.map((room) => (
                  <div key={room.room_id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="space-y-2">
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <h4 className="font-semibold text-sm">{room.room_name}</h4>
                           <Badge variant="secondary" className="text-xs">
                             {room.room_type || 'N/A'}
                           </Badge>
                         </div>
                         <div className="space-y-1">
                           <p className="text-xs text-muted-foreground">Room #{room.room_number}</p>
                           <div className="text-xs text-muted-foreground">
                             Floor {room.floor_level || 'N/A'}
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Room Card */}
                {dbConnected && (
                  <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
                       onClick={() => {
                         setSelectedBuilding(selectedBuildingForRooms);
                         setIsViewRoomsOpen(false);
                         setIsAddRoomOpen(true);
                       }}>
                    <div className="text-center">
                      <Plus className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-700">Add Room</p>
                      <p className="text-xs text-blue-600">to this building</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No rooms found in this building</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewRoomsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}