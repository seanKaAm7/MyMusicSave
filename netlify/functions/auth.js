// Spotify OAuth 코드 → 토큰 교환 + Supabase 유저 저장
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const { code, redirect_uri } = event.queryStringParameters || {};

  if (!code || !redirect_uri) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'code와 redirect_uri가 필요합니다' }) };
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!clientId || !clientSecret || !supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: '환경변수가 설정되지 않았습니다' }) };
  }

  // 1. Spotify 토큰 교환
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: tokenData.error }) };
  }

  const { access_token, refresh_token, expires_in } = tokenData;

  // 2. Spotify 유저 정보 가져오기
  const profileRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': 'Bearer ' + access_token }
  });
  const profile = await profileRes.json();

  if (!profileRes.ok) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Spotify 프로필 조회 실패' }) };
  }

  // 3. Supabase에 유저 저장 (upsert)
  const userData = {
    spotify_id: profile.id,
    display_name: profile.display_name || profile.id,
    username: profile.id
  };

  await fetch(`${supabaseUrl}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(userData)
  });

  // 4. 토큰 + 유저 정보 반환
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      access_token,
      refresh_token,
      expires_in,
      user: {
        spotify_id: profile.id,
        display_name: profile.display_name || profile.id,
        username: profile.id,
        image: profile.images?.[0]?.url || null
      }
    })
  };
};
