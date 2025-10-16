import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building, 
  Route, 
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AnalyticsSection() {
  const [analytics, setAnalytics] = useState({
    tourEngagement: [],
    popularLocations: [],
    deviceBreakdown: [],
    timeSpentData: [],
    completionRates: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      if (!isSupabaseConfigured()) {
        // Use mock analytics data
        const mockTourVisits = generateMockVisits(timeRange);
        
        const tourEngagement = processTourEngagement(mockTourVisits);
        const popularLocations = processPopularLocations(mockTourVisits);
        const deviceBreakdown = processDeviceBreakdown(mockTourVisits);
        const timeSpentData = processTimeSpentData(mockTourVisits);
        const completionRates = processCompletionRates(mockTourVisits);

        setAnalytics({
          tourEngagement,
          popularLocations,
          deviceBreakdown,
          timeSpentData,
          completionRates
        });
        return;
      }
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Get tour engagement data
      const { data: tourVisits } = await supabase
        .from('tour_visits')
        .select(`
          *,
          tours(name),
          buildings(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get popular buildings data
      const { data: buildingVisits } = await supabase
        .from('tour_visits')
        .select(`
          building_id,
          buildings(name)
        `)
        .gte('created_at', startDate.toISOString());

      // Process data
      const tourEngagement = processTourEngagement(tourVisits || []);
      const popularLocations = processPopularLocations(buildingVisits || []);
      const deviceBreakdown = processDeviceBreakdown(tourVisits || []);
      const timeSpentData = processTimeSpentData(tourVisits || []);
      const completionRates = processCompletionRates(tourVisits || []);

      setAnalytics({
        tourEngagement,
        popularLocations,
        deviceBreakdown,
        timeSpentData,
        completionRates
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTourEngagement = (visits) => {
    const engagement = {};
    
    visits.forEach(visit => {
      const date = new Date(visit.created_at).toLocaleDateString();
      if (!engagement[date]) {
        engagement[date] = { date, visits: 0, completions: 0 };
      }
      engagement[date].visits++;
      if (visit.completed) {
        engagement[date].completions++;
      }
    });

    return Object.values(engagement).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const processPopularLocations = (visits) => {
    const locations = {};
    
    visits.forEach(visit => {
      const buildingName = visit.buildings?.name || 'Unknown Building';
      if (!locations[buildingName]) {
        locations[buildingName] = { name: buildingName, visits: 0 };
      }
      locations[buildingName].visits++;
    });

    return Object.values(locations)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
  };

  const processDeviceBreakdown = (visits) => {
    const devices = {};
    
    visits.forEach(visit => {
      const device = visit.device_type || 'unknown';
      if (!devices[device]) {
        devices[device] = { type: device, count: 0 };
      }
      devices[device].count++;
    });

    return Object.values(devices);
  };

  const processTimeSpentData = (visits) => {
    const durations = visits
      .filter(visit => visit.visit_duration)
      .map(visit => Math.floor(visit.visit_duration / 60)); // Convert to minutes

    const avgDuration = durations.length > 0 
      ? Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const ranges = {
      '0-5 min': durations.filter(d => d <= 5).length,
      '5-15 min': durations.filter(d => d > 5 && d <= 15).length,
      '15-30 min': durations.filter(d => d > 15 && d <= 30).length,
      '30+ min': durations.filter(d => d > 30).length
    };

    return { avgDuration, ranges };
  };

  const processCompletionRates = (visits) => {
    const total = visits.length;
    const completed = visits.filter(visit => visit.completed).length;
    const completionRate = total > 0 ? Math.floor((completed / total) * 100) : 0;

    return { total, completed, completionRate };
  };

  // Generate mock visit data for demo mode
  const generateMockVisits = (timeRange) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const visits = [];
    const buildings = ['Main Library', 'Student Center', 'Engineering Building', 'Science Complex'];
    const devices = ['mobile', 'desktop', 'tablet'];
    
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * days);
      visits.push({
        id: i,
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        completed: Math.random() > 0.3,
        visit_duration: Math.floor(Math.random() * 1800) + 300,
        device_type: devices[Math.floor(Math.random() * devices.length)],
        buildings: { name: buildings[Math.floor(Math.random() * buildings.length)] }
      });
    }
    return visits;
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Monitor;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            <Button
              variant={timeRange === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="rounded-r-none"
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="rounded-none border-x-0"
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('90d')}
              className="rounded-l-none"
            >
              90 Days
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.tourEngagement.reduce((sum, day) => sum + day.visits, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRates.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completionRates.completed} of {analytics.completionRates.total} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.timeSpentData.avgDuration}m</div>
            <p className="text-xs text-muted-foreground">Average per visit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.popularLocations.length}</div>
            <p className="text-xs text-muted-foreground">Buildings with visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tour Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Tour Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.tourEngagement.length > 0 ? (
                analytics.tourEngagement.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {day.visits} visits
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {day.completions} completed
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No tour data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.popularLocations.length > 0 ? (
                analytics.popularLocations.slice(0, 6).map((location, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm">{location.name}</span>
                    </div>
                    <Badge variant="outline">{location.visits} visits</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No location data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.deviceBreakdown.length > 0 ? (
                analytics.deviceBreakdown.map((device, index) => {
                  const DeviceIcon = getDeviceIcon(device.type);
                  const total = analytics.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);
                  const percentage = total > 0 ? Math.round((device.count / total) * 100) : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{device.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                        <Badge variant="outline">{device.count}</Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No device data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Spent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Visit Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.timeSpentData.avgDuration}m
                </div>
                <p className="text-sm text-blue-600">Average Duration</p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                {Object.entries(analytics.timeSpentData.ranges || {}).map(([range, count], index) => {
                  const total = Object.values(analytics.timeSpentData.ranges || {}).reduce((sum, c) => sum + c, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{range}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">High Engagement</span>
              </div>
              <p className="text-sm text-green-700">
                {analytics.completionRates.completionRate}% completion rate indicates strong user engagement
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Popular Routes</span>
              </div>
              <p className="text-sm text-blue-700">
                Focus content development on top {Math.min(3, analytics.popularLocations.length)} visited locations
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Optimal Duration</span>
              </div>
              <p className="text-sm text-purple-700">
                Average {analytics.timeSpentData.avgDuration}m visit time suggests good content pacing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}