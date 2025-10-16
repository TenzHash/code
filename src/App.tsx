import React, { useState, useEffect } from 'react';
import { DatabaseTest } from './components/DatabaseTest';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  FileText, 
  Route, 
  QrCode, 
  BarChart3, 
  Settings,
  Plus,
  Upload,
  FileImage,
  TrendingUp,
  Bell,
  User,
  LogOut,
  UserCircle,
  HelpCircle,
  Check,
  X,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Component imports
import UserManagementSection from './components/UserManagementSection';
import BuildingsRoomsSection from './components/BuildingsRoomsSection';
import ContentManagementSection from './components/ContentManagementSection';
import ToursTrailsSection from './components/ToursTrailsSection';
import QRCodeManagerSection from './components/QRCodeManagerSection';
import SettingsSection from './components/SettingsSection';
import AnalyticsSection from './components/AnalyticsSection';
import SystemStatus from './components/SystemStatus';

// Supabase imports
import { 
  initializeDatabase,
  getDashboardStats,
  getRecentActivities,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  isSupabaseConfigured,
  ensureAnonymousSession
} from './lib/supabase';

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'buildings', label: 'Buildings & Rooms', icon: Building },
  { id: 'content', label: 'Content Management', icon: FileText },
  { id: 'tours', label: 'Tours & Trails', icon: Route },
  { id: 'qrcodes', label: 'QR Code Manager', icon: QrCode },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

// Individual Page Components
const UserManagement = () => <UserManagementSection />;
const BuildingsRooms = () => <BuildingsRoomsSection />;
const ContentManagement = () => <ContentManagementSection />;
const ToursTrails = () => <ToursTrailsSection />;
const QRCodeManager = () => <QRCodeManagerSection />;

const Analytics = () => <AnalyticsSection />;

const SettingsPage = () => <SettingsSection />;

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    buildingsMapped: 0,
    contentItems: 0,
    tourViews: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading dashboard data...');
        
        // Initialize database once if Supabase is configured
        // This sets up table mappings and inserts sample data if needed
        if (isSupabaseConfigured()) {
          console.log('🗄️ Initializing database...');
          try {
            // Ensure we have an anonymous session for RLS access
            await ensureAnonymousSession();
            await initializeDatabase();
            console.log('✅ Database initialization completed');
          } catch (error) {
            console.warn('⚠️ Database initialization warning:', error.message);
            // Continue anyway - we have hardcoded defaults
          }
        }
        
        // Now load dashboard data with correct table names
        const [statsData, activitiesData, notificationsData] = await Promise.all([
          getDashboardStats(),
          getRecentActivities(8),
          getNotifications()
        ]);
        
        console.log('📊 Stats loaded:', statsData);
        console.log('📱 Activities loaded:', activitiesData?.length || 0, 'items');
        console.log('🔔 Notifications loaded:', notificationsData?.length || 0, 'items');
        
        setStats(statsData);
        setActivities(activitiesData);
        setNotifications(notificationsData);
        
      } catch (error) {
        console.error('❌ Error loading data:', error);
        // Set fallback data on error
        setStats({
          totalUsers: 0,
          buildingsMapped: 0,
          contentItems: 0,
          tourViews: 0
        });
        setActivities([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleMarkNotificationAsRead = async (id) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const refreshDashboardData = async () => {
    setRefreshing(true);
    try {
      const [statsData, activitiesData, notificationsData] = await Promise.all([
        getDashboardStats(),
        getRecentActivities(8),
        getNotifications()
      ]);
      
      console.log('🔄 Refreshed data:', { 
        users: statsData.totalUsers, 
        buildings: statsData.buildingsMapped,
        content: statsData.contentItems,
        activities: activitiesData?.length || 0 
      });
      
      setStats(statsData);
      setActivities(activitiesData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    // Add logout logic here
  };

  const handleProfile = () => {
    console.log('Profile clicked');
    setActiveTab('settings');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Toggle sidebar with Ctrl+B or Cmd+B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      // Close sidebar on Escape when open on mobile
      if (event.key === 'Escape' && !sidebarCollapsed && window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  const StatCard = ({ icon: Icon, title, value, description, color, loading = false }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionButton = ({ icon: Icon, label, color, onClick }) => (
    <Button 
      className={`${color} text-white hover:opacity-90 h-12 flex items-center gap-2`}
      onClick={onClick}
      size="default"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );



  const renderContent = () => {
    // Special debug mode to test database connection
    if (activeTab === 'debug-test') {
      return <DatabaseTest />;
    }
    
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold">Welcome to iTOURu Virtual Tour System</h1>
                    <Building className="h-6 w-6" />
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={refreshDashboardData}
                    disabled={refreshing}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <TrendingUp className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                </div>
                <p className="text-blue-100">
                  Manage your virtual campus tour platform with powerful CMS tools. Create immersive tour 
                  experiences, upload content, generate QR codes for locations, and track visitor 
                  engagement across your campus tours. <strong>Now with live Supabase data!</strong>
                </p>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                title="Total Users"
                value={loading ? 0 : stats.totalUsers}
                description="Tour visitors"
                color="bg-blue-500"
                loading={loading}
              />
              <StatCard
                icon={Building}
                title="Buildings Mapped"
                value={loading ? 0 : stats.buildingsMapped}
                description="Campus locations"
                color="bg-green-500"
                loading={loading}
              />
              <StatCard
                icon={FileImage}
                title="Content Items"
                value={loading ? 0 : stats.contentItems}
                description="Media files"
                color="bg-purple-500"
                loading={loading}
              />
              <StatCard
                icon={TrendingUp}
                title="Tour Views"
                value={loading ? 0 : stats.tourViews}
                description="Engagement metrics"
                color="bg-orange-500"
                loading={loading}
              />
            </div>

            {/* Backend Integration Info */}
            {loading && (
              <Card className={`${isSupabaseConfigured() 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-2 h-2 ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-blue-500'} rounded-full animate-pulse`}></div>
                    <h3 className={`font-semibold ${isSupabaseConfigured() ? 'text-green-800' : 'text-blue-800'}`}>
                      {isSupabaseConfigured() ? 'Supabase Backend Connected - Auto-Detecting Schema' : 'Demo Mode Active'}
                    </h3>
                  </div>
                  <p className={`text-sm ${isSupabaseConfigured() ? 'text-green-700' : 'text-blue-700'} mb-3`}>
                    {isSupabaseConfigured() 
                      ? 'Loading real data from your Supabase database. Automatically detecting table and column names to ensure compatibility with your schema. Check the console for detection details.'
                      : 'Running with realistic mock data to demonstrate the iTOURu dashboard functionality. All features are fully interactive with simulated data that updates dynamically.'
                    }
                  </p>
                  <div className={`flex items-center gap-2 text-xs ${isSupabaseConfigured() ? 'text-green-600' : 'text-blue-600'}`}>
                    {isSupabaseConfigured() ? (
                      <>
                        <span>✅ Auto-detecting schema</span>
                        <span>•</span>
                        <span>✅ Inserting sample data</span>
                        <span>•</span>
                        <span>✅ Normalizing formats</span>
                      </>
                    ) : (
                      <>
                        <span>🎯 Mock dashboard data</span>
                        <span>•</span>
                        <span>🎯 Interactive components</span>
                        <span>•</span>
                        <span>🎯 Full feature preview</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Recent Activities */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="space-y-4">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activities.length > 0 ? (
                      activities.map((activity) => {
                        // Map icon names to actual icon components
                        const IconComponent = {
                          'Users': Users,
                          'Upload': Upload,
                          'QrCode': QrCode,
                          'Route': Route,
                          'Building': Building,
                          'Activity': FileText
                        }[activity.icon] || FileText;

                        return (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No recent activities</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={refreshDashboardData}
                        >
                          Load Sample Data
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & System Status */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <QuickActionButton
                      icon={Plus}
                      label="Add Building"
                      color="bg-green-500"
                      onClick={() => setActiveTab('buildings')}
                    />
                    <QuickActionButton
                      icon={Upload}
                      label="Upload Media"
                      color="bg-blue-500"
                      onClick={() => setActiveTab('content')}
                    />
                    <QuickActionButton
                      icon={QrCode}
                      label="Generate QR"
                      color="bg-purple-500"
                      onClick={() => setActiveTab('qrcodes')}
                    />
                    <QuickActionButton
                      icon={BarChart3}
                      label="View Reports"
                      color="bg-orange-500"
                      onClick={() => setActiveTab('analytics')}
                    />
                  </CardContent>
                </Card>

                {/* System Status */}
                <SystemStatus />
              </div>
            </div>
          </div>
        );
      case 'users':
        return <UserManagement />;
      case 'buildings':
        return <BuildingsRooms />;
      case 'content':
        return <ContentManagement />;
      case 'tours':
        return <ToursTrails />;
      case 'qrcodes':
        return <QRCodeManager />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile Overlay */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <div className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-white shadow-sm border-r transition-all duration-300 ease-in-out relative z-50 ${
          !sidebarCollapsed ? 'md:relative md:translate-x-0' : ''
        } ${
          sidebarCollapsed ? '' : 'fixed md:relative left-0 top-0 h-full md:h-auto'
        }`}>
          {/* Logo Section */}
          <div className={`${sidebarCollapsed ? 'p-3' : 'p-6'} border-b`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <Building className="h-5 w-5" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h2 className="font-semibold">iTOURu</h2>
                  <p className="text-xs text-muted-foreground">Virtual Tours</p>
                </div>
              )}
            </div>
          </div>

          {/* Collapse Toggle Button */}
          <div className={`${sidebarCollapsed ? 'p-2' : 'px-4 py-2'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`${sidebarCollapsed ? 'w-full' : ''} hover:bg-gray-100 transition-all duration-200`}
              title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <div className="flex items-center space-x-2">
                  <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
                  <span className="text-sm">Collapse</span>
                </div>
              )}
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className={`${sidebarCollapsed ? 'px-2' : 'px-4'} space-y-1`}>
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              const buttonContent = (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2'} rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  } ${isActive && !sidebarCollapsed ? 'border-r-2 border-blue-700' : ''} ${
                    isActive && sidebarCollapsed ? 'bg-blue-50 text-blue-700 relative' : ''
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {/* Active indicator for collapsed state */}
                  {isActive && sidebarCollapsed && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-700 rounded-l-sm"></div>
                  )}
                </button>
              );

              // Wrap in tooltip when collapsed
              return sidebarCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : buttonContent;
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h1>
                  <p className="text-sm text-muted-foreground">
                    Wednesday, 19/06/2025 12:50:10 AM
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative p-2">
                      <Bell className="h-5 w-5 text-gray-500" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="border-b p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
                            Mark all read
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleMarkNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-medium">{notification.title}</h5>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.time}
                                </p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  notification.priority === 'high' ? 'border-red-200 text-red-700' :
                                  notification.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                  'border-gray-200 text-gray-700'
                                }`}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t p-2">
                      <Button variant="ghost" className="w-full text-xs" onClick={() => setActiveTab('settings')}>
                        View all notifications
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600">
                      A
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Admin User</p>
                        <p className="text-xs text-muted-foreground">admin@itouru.edu</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('analytics')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Dashboard Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}