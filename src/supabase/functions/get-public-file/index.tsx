Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const bucket = params.get('bucket');
    const path = params.get('path');

    if (!bucket || !path) {
      return new Response(JSON.stringify({ error: 'Missing bucket or path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedPath = path.replace(/^\/+/, '');

    const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(normalizedPath)}`;

    return new Response(JSON.stringify({ publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});


