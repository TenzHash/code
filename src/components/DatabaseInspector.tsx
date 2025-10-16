import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Database, CheckCircle, XCircle, Info } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function DatabaseInspector() {
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inspectDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured');
        setLoading(false);
        return;
      }

      const tablesToCheck = [
        'Users', 'users', 'User', 'user',
        'Building', 'Buildings', 'building', 'buildings',
        'Room', 'Rooms', 'room', 'rooms',
        'Content', 'content',
        'Tours', 'tours', 'Tour', 'tour',
        'QR Code', 'QR_Codes', 'qr_codes'
      ];

      const results: any[] = [];

      for (const tableName of tablesToCheck) {
        try {
          // Try to fetch one row to see columns
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(1);

          if (!error && data !== null) {
            const columns = data.length > 0 ? Object.keys(data[0]) : [];
            const sampleRow = data.length > 0 ? data[0] : null;
            
            results.push({
              name: tableName,
              exists: true,
              rowCount: count,
              columns: columns,
              sampleRow: sampleRow,
              error: null
            });
            
            // Once we find a table, don't check its variants
            const baseName = tableName.toLowerCase().replace(/s$/, '');
            const variantsToSkip = tablesToCheck.filter(t => 
              t.toLowerCase().replace(/s$/, '') === baseName && t !== tableName
            );
            variantsToSkip.forEach(variant => {
              const index = tablesToCheck.indexOf(variant);
              if (index > -1) tablesToCheck.splice(index, 1);
            });
          }
        } catch (err: any) {
          // Silently skip - table doesn't exist
        }
      }

      setTableInfo(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    inspectDatabase();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Inspecting database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Error:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Database Introspection Tool</h3>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            This tool shows the actual structure of your Supabase database tables, including exact column names and sample data.
          </p>
          <Button onClick={inspectDatabase} size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <Database className="h-4 w-4 mr-2" />
            Refresh Inspection
          </Button>
        </CardContent>
      </Card>

      {tableInfo.length === 0 ? (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No tables found in your database. Make sure your Supabase project has tables created.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {tableInfo.map((table) => (
            <Card key={table.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <CardTitle>Table: {table.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {table.rowCount} {table.rowCount === 1 ? 'row' : 'rows'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Columns */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Columns ({table.columns.length}):</h4>
                  <div className="flex flex-wrap gap-2">
                    {table.columns.map((col: string) => (
                      <Badge key={col} variant="secondary" className="font-mono text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sample Row */}
                {table.sampleRow && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Sample Row:</h4>
                    <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-xs font-mono">
                        {JSON.stringify(table.sampleRow, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Column Mapping Hints */}
                {table.name.toLowerCase().includes('user') && (
                  <Alert className="bg-green-50 border-green-200">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-800">
                      <strong>Auto-Detection Active:</strong> The code will automatically map these columns to the expected format:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {table.columns.find((c: string) => c.toLowerCase().includes('name')) && (
                          <li>
                            <code className="bg-white px-1 rounded">
                              {table.columns.find((c: string) => c.toLowerCase().includes('name'))}
                            </code>
                            {' → '}
                            <code className="bg-white px-1 rounded">full_name</code>
                          </li>
                        )}
                        {table.columns.find((c: string) => c.toLowerCase() === 'email') && (
                          <li>
                            <code className="bg-white px-1 rounded">
                              {table.columns.find((c: string) => c.toLowerCase() === 'email')}
                            </code>
                            {' → '}
                            <code className="bg-white px-1 rounded">email</code>
                          </li>
                        )}
                        {table.columns.find((c: string) => c.toLowerCase() === 'role') && (
                          <li>
                            <code className="bg-white px-1 rounded">
                              {table.columns.find((c: string) => c.toLowerCase() === 'role')}
                            </code>
                            {' → '}
                            <code className="bg-white px-1 rounded">role</code>
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
