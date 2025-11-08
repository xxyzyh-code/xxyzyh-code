// api/track.js (已修正 INSERT/UPDATE 語句以解決 400 Bad Request)
const { createClient } = require('@supabase/supabase-js');

// 由於 Vercel Serverless Function 環境變數的載入方式，
// 建議直接在檔案中定義函式並導出。
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  
  // *** 解決 405 Method Not Allowed 的關鍵部分 ***
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  // **********************************************
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // ⭐️ 從請求體中取出 user_id, song_id, title
    const { user_id, song_id, title } = body; 

    // 檢查關鍵數據是否存在
    if (!user_id || !song_id || !title) {
        return res.status(400).json({ error: 'Missing required fields: user_id, song_id, or title.' });
    }

    // 1. 查詢現有記錄
    const { data: existing, error: selectError } = await supabase
      .from('play_logs')
      .select('id, plays') 
      .eq('user_id', user_id)
      .eq('song_id', song_id)
      .maybeSingle(); 

    if (selectError && selectError.code !== 'PGRST116') {
        console.error('Supabase select error:', selectError);
        return res.status(500).json({ error: 'Database read error' });
    }

    if (existing) {
      // 2. 找到記錄，更新播放次數
      const { error: updateError } = await supabase
        .from('play_logs')
        // 核心修正 A: UPDATE 邏輯
        .update({ plays: existing.plays + 1, last_played: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*'); // 👈 新增：強制 SDK 完整執行並返回數據，避免 400 錯誤

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return res.status(500).json({ error: 'Database update error' });
      }
      
    } else {
      // 3. 未找到記錄，插入新記錄
      const { error: insertError } = await supabase
        .from('play_logs')
        // 核心修正 B: INSERT 邏輯包含 title
        .insert([{ 
            user_id, 
            song_id, 
            title, // 必須包含 title 欄位
            plays: 1, 
            last_played: new Date().toISOString() 
        }])
        .select('*'); // 👈 新增：強制 SDK 完整執行並返回數據，避免 400 錯誤

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.status(500).json({ error: 'Database insert error' });
      }
    }

    res.status(200).json({ success: true, message: 'Play log recorded.' });

  } catch (error) {
    console.error('API execution error:', error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
