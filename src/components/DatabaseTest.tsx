import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, getDashboardStats, getRecentActivities } from '../lib/supabase.js';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, Database, Loader2 } from 'lucide-react';

export function DatabaseTest() {
  const [testResults, setTestResults] = useState({
    configured: false,
    connected: false,
    tablesExist: false,
    hasData: false,
    stats: null,
    activities: null,
    errors: []
  });
  const [testing, setTesting] = useState(false);
  const [tableInfo, setTableInfo] = useState({});

  const runTests = async () => {
    setTesting(true);
    const results = {
      configured: false,
      connected: false,
      tablesExist: false,
      hasData: false,
      stats: null,
      activities: null,
      errors: []
    };

    try {
      // Test 1: Configuration
      results.configured = isSupabaseConfigured();
      console.log('✅ Configuration test:', results.configured);

      if (!results.configured) {
        results.errors.push('Supabase client not configured properly');
        setTestResults(results);
        setTesting(false);
        return;
      }

      // Test 2: Connection - use capitalized table name
      try {
        const { data, error } = await supabase.from('Users').select('count', { count: 'exact', head: true });
        if (error) {
          if (error.code === 'PGRST116' || error.code === 'PGRST205') {
            results.errors.push('Tables do not exist - need to run schema');
          } else {
            results.errors.push(`Connection error: ${error.message}`);
          }
        } else {
          results.connected = true;
          results.tablesExist = true;
          console.log('✅ Connection and tables test passed');
        }
      } catch (err) {
        results.errors.push(`Connection failed: ${err.message}`);
      }

      // Test 3: Check all tables (using capitalized names that match your database)
      const tables = {
        'Users': 'users',
        'Buildings': 'buildings', 
        'Content': 'content_items',
        'Tours': 'tours',
        'QR_Codes': 'qr_codes'
      };
      const tableResults = {};
      
      for (const [actualTable, displayName] of Object.entries(tables)) {
        try {
          const { count, error } = await supabase.from(actualTable).select('*', { count: 'exact', head: true });
          if (error) {
            tableResults[displayName] = `Error: ${error.code}`;
          } else {
            tableResults[displayName] = `${count || 0} rows`;
            if (count > 0) results.hasData = true;
          }
        } catch (err) {
          tableResults[displayName] = `Failed: ${err.message}`;
        }
      }
      
      // Also check for activities and notifications (which don't exist)
      tableResults['activities'] = 'Not found (using mock)';
      tableResults['notifications'] = 'Not found (using mock)';
      
      setTableInfo(tableResults);

      // Test 4: Dashboard functions
      try {
        const stats = await getDashboardStats();
        results.stats = stats;
        console.log('✅ Stats loaded:', stats);
      } catch (err) {
        results.errors.push(`Stats error: ${err.message}`);
      }

      try {
        const activities = await getRecentActivities(5);
        results.activities = activities;
        console.log('✅ Activities loaded:', activities?.length || 0, 'items');
      } catch (err) {
        results.errors.push(`Activities error: ${err.message}`);
      }

    } catch (error) {
      results.errors.push(`General error: ${error.message}`);
      console.error('Test error:', error);
    }

    setTestResults(results);
    setTesting(false);
  };

  const createSampleData = async () => {
    if (!supabase) return;
    
    try {
      // Get the actual table names from the global mapping
      const usersTable = window.actualTableNames?.users || 'Users'
      const buildingsTable = window.actualTableNames?.buildings || 'Buildings'
      const contentTable = window.actualTableNames?.content_items || 'Content'
      const activitiesTable = window.actualTableNames?.activities || 'Activities'
      
      // Insert sample users
      if (usersTable) {
        await supabase.from(usersTable).insert([
          { email: 'admin@itouru.edu', full_name: 'System Administrator', role: 'admin' },
          { email: 'john.student@itouru.edu', full_name: 'John Smith', role: 'student' },
          { email: 'mary.visitor@email.com', full_name: 'Mary Johnson', role: 'visitor' },
          { email: 'professor.davis@itouru.edu', full_name: 'Prof. Sarah Davis', role: 'faculty' }
        ]);
      }

      // Insert sample buildings
      if (buildingsTable) {
        await supabase.from(buildingsTable).insert([
          {
            name: 'Main Library',
            description: 'Central campus library with 5 floors',
            address: '123 University Ave',
            latitude: 40.7128,
            longitude: -74.0060,
            total_rooms: 45
          },
          {
            name: 'Engineering Building',
            description: 'State-of-the-art engineering facility',
            address: '456 Tech Street',
            latitude: 40.7589,
            longitude: -73.9851,
            total_rooms: 32
          }
        ]);
      }

      // Insert sample content
      if (contentTable) {
        await supabase.from(contentTable).insert([
          {
            title: 'Library Tour Video',
            description: 'Virtual tour of the main library',
            content_type: 'video',
            file_url: 'https://example.com/video.mp4',
            created_at: new Date().toISOString()
          },
          {
            title: 'Engineering Building Photos',
            description: 'Photo gallery of engineering facilities',
            content_type: 'image',
            file_url: 'https://example.com/image.jpg',
            created_at: new Date().toISOString()
          }
        ]);
      }

      // Insert sample activities
      if (activitiesTable) {
        await supabase.from(activitiesTable).insert([
          {
            activity_type: 'registration',
            title: 'New User Registration',
            description: 'Users registered for virtual tours',
            created_at: new Date().toISOString()
          },
          {
            activity_type: 'media_upload',
            title: 'Media Upload Complete',
            description: 'New photos added to building tours',
            created_at: new Date().toISOString()
          }
        ]);
      }

      alert('Sample data created successfully! Refresh the test.');
    } catch (error) {
      alert(`Error creating sample data: ${error.message}`);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const StatusIcon = ({ success }) => 
    success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">🔍 Supabase Database Diagnostic</h1>
        <Button onClick={runTests} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
          {testing ? 'Testing...' : 'Run Tests'}
        </Button>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon success={testResults.configured} />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Supabase URL:</span>
              <span className="font-mono text-sm">https://dlzlnebdpxrmqnelrbfm.supabase.co</span>
            </div>
            <div className="flex justify-between">
              <span>API Key:</span>
              <span className="font-mono text-sm">eyJhbGciOiJIUzI1NiIs...Yuw</span>
            </div>
            <div className="flex justify-between">
              <span>Client Status:</span>
              <span className={testResults.configured ? 'text-green-600' : 'text-red-600'}>
                {testResults.configured ? 'Configured ✅' : 'Not Configured ❌'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon success={testResults.connected} />
            Connection & Tables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Database Connection:</span>
              <span className={testResults.connected ? 'text-green-600' : 'text-red-600'}>
                {testResults.connected ? 'Connected ✅' : 'Failed ❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tables Exist:</span>
              <span className={testResults.tablesExist ? 'text-green-600' : 'text-red-600'}>
                {testResults.tablesExist ? 'Found ✅' : 'Missing ❌'}
              </span>
            </div>
            
            {Object.keys(tableInfo).length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Table Status:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(tableInfo).map(([table, status]) => (
                    <div key={table} className="flex justify-between">
                      <span>{table}:</span>
                      <span className={status.includes('Error') || status.includes('Failed') ? 'text-red-600' : 'text-green-600'}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon success={testResults.hasData} />
            Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Has Sample Data:</span>
              <span className={testResults.hasData ? 'text-green-600' : 'text-orange-600'}>
                {testResults.hasData ? 'Yes ✅' : 'Empty ⚠️'}
              </span>
            </div>

            {testResults.stats && (
              <div className="space-y-2">
                <h4 className="font-medium">Dashboard Stats:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Users: <span className="font-mono">{testResults.stats.totalUsers}</span></div>
                  <div>Buildings: <span className="font-mono">{testResults.stats.buildingsMapped}</span></div>
                  <div>Content: <span className="font-mono">{testResults.stats.contentItems}</span></div>
                  <div>Tour Views: <span className="font-mono">{testResults.stats.tourViews}</span></div>
                </div>
              </div>
            )}

            {testResults.activities && (
              <div className="space-y-2">
                <h4 className="font-medium">Recent Activities:</h4>
                <div className="text-sm text-gray-600">
                  {testResults.activities.length} activities loaded
                </div>
              </div>
            )}

            {!testResults.hasData && testResults.tablesExist && (
              <Button onClick={createSampleData} className="w-full mt-3">
                Create Sample Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {testResults.errors.length > 0 && (
        <Alert className="border-red-200">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Issues Found:</div>
              {testResults.errors.map((error, index) => (
                <div key={index} className="text-sm">• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {testResults.configured && testResults.connected && testResults.hasData && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="font-medium">🎉 All Tests Passed!</div>
            <div className="text-sm mt-1">
              Your Supabase database is properly connected and has data. Your dashboard should be working correctly.
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}