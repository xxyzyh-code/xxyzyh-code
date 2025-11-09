// functions/api/track.js - Cloudflare Pages Function (POST)

// 由於 Workers Runtime 對 Node.js 兼容性限制，我們需要使用特定 Workers 友好的 Supabase 導入
// ⚠️ 注意：您可能需要安裝 @supabase/supabase-js，並確保 Pages Functions 能找到它。
// 在簡單的 Pages 專案中，最好使用相對路徑導入或直接在程式碼中貼入 Supabase URL 和 Key
import { createClient } from '@supabase/supabase-js'; 

// 由於我們使用 onRequestPost，不需要像 Vercel 那樣檢查 req.method
export const onRequestPost = async (context) => {
    
    // 1. 從 context.env 獲取環境變數 (Secrets)
    const SUPABASE_URL = context.env.SUPABASE_URL; 
    const SUPABASE_ANON_KEY = context.env.SUPABASE_ANON_KEY; 
    
    // ⚠️ 請確保您在 Cloudflare Secrets 中設定了 SUPABASE_ANON_KEY
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    let body;
    try {
        // Cloudflare Workers Request 對象的 body 是 ReadableStream
        body = await context.request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
    
    const { user_id, song_id, title } = body; 

    if (!user_id || !song_id || !title) {
        return new Response(JSON.stringify({ error: 'Missing required fields: user_id, song_id, or title.' }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    try {
        // 1. 查詢現有記錄
        // ⚠️ Workers 程式碼應該放在 try-catch 內
        const { data: existing, error: selectError } = await supabase
            .from('play_logs')
            .select('id, plays') 
            .eq('user_id', user_id)
            .eq('song_id', song_id)
            .maybeSingle(); 

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 是 No Rows Found 的代碼
            console.error('Supabase select error:', selectError);
            return new Response(JSON.stringify({ error: 'Database read error', details: selectError.message }), { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        if (existing) {
            // 2. 找到記錄，更新播放次數
            const { error: updateError } = await supabase
                .from('play_logs')
                .update({ plays: existing.plays + 1, last_played: new Date().toISOString() })
                .eq('id', existing.id)
                // Cloudflare Workers (Deno/V8) 不支援 returning: 'minimal'，
                // 應使用標準的 .maybeSingle() 或 .select()。
                // 為了兼容性，我們直接移除 returning: 'minimal'，如果 Supabase 設置正確，更新後應返回單一記錄。
                .maybeSingle(); 

            if (updateError) {
                console.error('Supabase update error:', updateError);
                return new Response(JSON.stringify({ error: 'Database update error', details: updateError.message }), { 
                    status: 500, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
            
        } else {
            // 3. 未找到記錄，插入新記錄
            const { error: insertError } = await supabase
                .from('play_logs')
                .insert([{ 
                    user_id, 
                    song_id, 
                    title, 
                    plays: 1, 
                    last_played: new Date().toISOString() 
                }])
                .maybeSingle(); // 移除 returning: 'minimal'

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                return new Response(JSON.stringify({ error: 'Database insert error', details: insertError.message }), { 
                    status: 500, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        }

        return new Response(JSON.stringify({ success: true, message: 'Play log recorded.' }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('API execution error:', error.message);
        return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
};
