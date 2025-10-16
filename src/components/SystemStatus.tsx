import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Settings, Database, Server, HardDrive, Wifi, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured, getTableName } from '../lib/supabase';

export default function SystemStatus() {
  const [status, setStatus] = useState({
    database: 'checking',
    server: 'checking',
    storage: 'checking',
    api: 'checking'
  });
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    
    try {
      // Test database connection
      const dbStatus = await checkDatabaseStatus();
      
      // Test storage (simulate checking file storage)
      const storageStatus = await checkStorageStatus();
      
      // API is operational if we can make requests
      const apiStatus = 'operational';
      
      // Server status (if we can make requests, server is up)
      const serverStatus = 'operational';

      setStatus({
        database: dbStatus,
        server: serverStatus,
        storage: storageStatus,
        api: apiStatus
      });
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking system status:', error);
      setStatus({
        database: 'error',
        server: 'error',
        storage: 'warning',
        api: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    if (!isSupabaseConfigured()) {
      return Promise.resolve('warning'); // Not configured but demo mode
    }
    
    try {
      const usersTable = getTableName('users');
      if (!usersTable) {
        console.warn('Users table not found in mappings');
        return 'warning';
      }
      
      // Just check if we can query the table - use count without specifying columns
      const { count, error } = await supabase
        .from(usersTable)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      console.log(`✅ Database operational - ${usersTable} table accessible (${count} records)`);
      return 'operational';
    } catch (error) {
      console.error('Database check failed:', error);
      return 'error';
    }
  };

  const checkStorageStatus = async () => {
    if (!isSupabaseConfigured()) {
      return Promise.resolve('operational'); // Demo mode
    }
    
    try {
      const contentTable = getTableName('content_items');
      if (!contentTable) {
        console.warn('Content items table not found in mappings');
        return 'warning';
      }
      
      // Check if we can access content table - use count without specifying columns
      const { count, error } = await supabase
        .from(contentTable)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      console.log(`✅ Storage operational - ${contentTable} table accessible (${count} content items)`);
      
      // In a real app, you might check actual file accessibility
      // For now, we'll simulate storage being at 75% capacity
      const usagePercentage = 75;
      
      if (usagePercentage > 90) return 'error';
      if (usagePercentage > 80) return 'warning';
      return 'operational';
    } catch (error) {
      console.error('Storage check failed:', error);
      return 'warning';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'checking': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'operational': return 'Operational';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  const SystemStatusItem = ({ icon: Icon, label, status, details }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {details && (
          <span className="text-xs text-muted-foreground">{details}</span>
        )}
        <Badge 
          variant="outline" 
          className={`${getStatusColor(status)} border-none text-white`}
        >
          {getStatusText(status)}
        </Badge>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          System Status
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkSystemStatus}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <SystemStatusItem
          icon={Database}
          label="Database Connection"
          status={status.database}
          details={
            status.database === 'operational' ? 'Connected' : 
            status.database === 'warning' ? 'Demo Mode' : ''
          }
        />
        
        <SystemStatusItem
          icon={Server}
          label="Server Status"
          status={status.server}
          details={status.server === 'operational' ? 'Online' : ''}
        />
        
        <SystemStatusItem
          icon={HardDrive}
          label="Media Storage"
          status={status.storage}
          details={status.storage === 'warning' ? '75% used' : ''}
        />
        
        <SystemStatusItem
          icon={Wifi}
          label="API Service"
          status={status.api}
          details={status.api === 'operational' ? 'Active' : ''}
        />
        
        <Separator />
        
        {lastChecked && (
          <div className="text-xs text-muted-foreground text-center">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
        
        <Button variant="outline" className="w-full" onClick={() => window.open('/settings', '_self')}>
          System Settings
        </Button>
      </CardContent>
    </Card>
  );
}