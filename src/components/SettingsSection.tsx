import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Settings, Save, RefreshCw, Database, Shield, Globe, Bell, Users, Palette, HardDrive, Activity } from 'lucide-react';
import DatabaseInspector from './DatabaseInspector';

interface SystemSettings {
  campusName: string;
  campusAddress: string;
  campusWebsite: string;
  adminEmail: string;
  defaultTourDuration: number;
  maxFileSize: number;
  supportedLanguages: string[];
  maintenanceMode: boolean;
  userRegistration: boolean;
  emailNotifications: boolean;
  tourRatings: boolean;
  publicTours: boolean;
  geoLocation: boolean;
  analyticsEnabled: boolean;
  backupFrequency: string;
  maxUsers: number;
  storageLimit: number;
  apiEndpoint: string;
  databaseHost: string;
  theme: string;
}

const initialSettings: SystemSettings = {
  campusName: 'University Campus',
  campusAddress: '123 University Avenue, Campus City, CC 12345',
  campusWebsite: 'https://www.university.edu',
  adminEmail: 'admin@university.edu',
  defaultTourDuration: 45,
  maxFileSize: 50,
  supportedLanguages: ['English', 'Spanish', 'French'],
  maintenanceMode: false,
  userRegistration: true,
  emailNotifications: true,
  tourRatings: true,
  publicTours: true,
  geoLocation: true,
  analyticsEnabled: true,
  backupFrequency: 'daily',
  maxUsers: 5000,
  storageLimit: 100,
  apiEndpoint: 'https://api.campus-tour.edu',
  databaseHost: 'localhost:5432',
  theme: 'light'
};

const systemStats = {
  totalRecords: 15847,
  storageUsed: 2.4,
  lastBackup: '2 hours ago',
  uptime: '99.8%',
  activeUsers: 234,
  serverLoad: 23,
  databaseConnections: 45,
  memoryUsage: 67
};

export default function SettingsSection() {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings);
    setHasChanges(false);
    // You would typically make an API call here
  };

  const resetSettings = () => {
    setSettings(initialSettings);
    setHasChanges(false);
  };

  const runBackup = () => {
    // Simulate backup process
    console.log('Running backup...');
  };

  const clearCache = () => {
    // Simulate cache clearing
    console.log('Clearing cache...');
  };

  const optimizeDatabase = () => {
    // Simulate database optimization
    console.log('Optimizing database...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={resetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Campus Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campusName">Campus Name</Label>
                  <Input
                    id="campusName"
                    value={settings.campusName}
                    onChange={(e) => handleSettingChange('campusName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="campusAddress">Campus Address</Label>
                <Textarea
                  id="campusAddress"
                  value={settings.campusAddress}
                  onChange={(e) => handleSettingChange('campusAddress', e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="campusWebsite">Campus Website</Label>
                <Input
                  id="campusWebsite"
                  type="url"
                  value={settings.campusWebsite}
                  onChange={(e) => handleSettingChange('campusWebsite', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Default Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultTourDuration">Default Tour Duration (minutes)</Label>
                  <Input
                    id="defaultTourDuration"
                    type="number"
                    value={settings.defaultTourDuration}
                    onChange={(e) => handleSettingChange('defaultTourDuration', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="userRegistration">User Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new users to register for tours</p>
                </div>
                <Switch
                  id="userRegistration"
                  checked={settings.userRegistration}
                  onCheckedChange={(checked) => handleSettingChange('userRegistration', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tourRatings">Tour Ratings</Label>
                  <p className="text-sm text-muted-foreground">Enable tour rating and review system</p>
                </div>
                <Switch
                  id="tourRatings"
                  checked={settings.tourRatings}
                  onCheckedChange={(checked) => handleSettingChange('tourRatings', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="publicTours">Public Tours</Label>
                  <p className="text-sm text-muted-foreground">Allow tours to be publicly accessible</p>
                </div>
                <Switch
                  id="publicTours"
                  checked={settings.publicTours}
                  onCheckedChange={(checked) => handleSettingChange('publicTours', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="geoLocation">Geo-location</Label>
                  <p className="text-sm text-muted-foreground">Enable location-based features</p>
                </div>
                <Switch
                  id="geoLocation"
                  checked={settings.geoLocation}
                  onCheckedChange={(checked) => handleSettingChange('geoLocation', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analyticsEnabled">Analytics</Label>
                  <p className="text-sm text-muted-foreground">Enable usage analytics and tracking</p>
                </div>
                <Switch
                  id="analyticsEnabled"
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => handleSettingChange('analyticsEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable public access</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={settings.maxUsers}
                    onChange={(e) => handleSettingChange('maxUsers', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="storageLimit">Storage Limit (GB)</Label>
                  <Input
                    id="storageLimit"
                    type="number"
                    value={settings.storageLimit}
                    onChange={(e) => handleSettingChange('storageLimit', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="apiEndpoint">API Endpoint</Label>
                <Input
                  id="apiEndpoint"
                  value={settings.apiEndpoint}
                  onChange={(e) => handleSettingChange('apiEndpoint', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="databaseHost">Database Host</Label>
                  <Input
                    id="databaseHost"
                    value={settings.databaseHost}
                    onChange={(e) => handleSettingChange('databaseHost', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select 
                    value={settings.backupFrequency} 
                    onValueChange={(value) => handleSettingChange('backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Records</span>
                    <Badge variant="outline">{systemStats.totalRecords.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Storage Used</span>
                    <Badge variant="outline">{systemStats.storageUsed} GB</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Backup</span>
                    <Badge variant="outline">{systemStats.lastBackup}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="outline">{systemStats.databaseConnections}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full" onClick={runBackup}>
                    <Database className="h-4 w-4 mr-2" />
                    Run Backup
                  </Button>
                  <Button variant="outline" className="w-full" onClick={optimizeDatabase}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <HardDrive className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear Cache</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear all cached data. This action may temporarily slow down the system while the cache rebuilds.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearCache}>
                          Clear Cache
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Inspector */}
          <Card>
            <CardHeader>
              <CardTitle>Database Schema Inspector</CardTitle>
            </CardHeader>
            <CardContent>
              <DatabaseInspector />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold">{systemStats.uptime}</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{systemStats.activeUsers}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{systemStats.serverLoad}%</div>
                  <div className="text-sm text-muted-foreground">Server Load</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{systemStats.memoryUsage}%</div>
                  <div className="text-sm text-muted-foreground">Memory Usage</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Application Version</p>
                  <p className="text-muted-foreground">v2.1.4</p>
                </div>
                <div>
                  <p className="font-medium">Database Version</p>
                  <p className="text-muted-foreground">PostgreSQL 15.2</p>
                </div>
                <div>
                  <p className="font-medium">Server OS</p>
                  <p className="text-muted-foreground">Ubuntu 22.04 LTS</p>
                </div>
                <div>
                  <p className="font-medium">Node.js Version</p>
                  <p className="text-muted-foreground">v18.17.1</p>
                </div>
                <div>
                  <p className="font-medium">Last Update</p>
                  <p className="text-muted-foreground">2024-12-15</p>
                </div>
                <div>
                  <p className="font-medium">Environment</p>
                  <p className="text-muted-foreground">Production</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label>Supported Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.supportedLanguages.map((lang, index) => (
                    <Badge key={index} variant="outline">{lang}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add new language" className="flex-1" />
                  <Button variant="outline">Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}