// api/stats.js - 修正為 CommonJS 語法

const { createClient } = require('@supabase/supabase-js'); // 修正: 使用 require

// 假設 SUPABASE_URL 和 SUPABASE_KEY 已配置
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async function handler(req, res) { // 修正: 使用 module.exports
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  try {
    // ⭐️ 調用 Supabase 數據庫中的 RPC 函數進行聚合
    const { data, error } = await supabase.rpc('get_global_play_counts');

    if (error) {
      console.error('Error fetching global stats (RPC):', error);
      // 確保即使在 RPC 錯誤時也返回 JSON
      return res.status(500).json({ 
        error: 'Error fetching global stats (RPC)',
        details: error.message 
      });
    }

    // 整理數據格式為 { "s0": 150, "s1": 80, ... }，匹配前端需求
    const globalPlayCounts = data.reduce((acc, current) => {
        // RPC 返回的栏位是 song_id 和 total_plays
        acc[current.song_id] = current.total_plays; 
        return acc;
    }, {});
    
    // 返回 JSON 格式的排行榜數據
    res.status(200).json(globalPlayCounts);
    
  } catch (e) {
      console.error('API execution error:', e.message);
      // 捕獲所有意外錯誤並返回 JSON
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
