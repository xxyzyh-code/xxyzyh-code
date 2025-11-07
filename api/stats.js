import { createClient } from '@supabase/supabase-js';

// 假設 SUPABASE_URL 和 SUPABASE_KEY 已配置
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // ⭐️ 修正：調用 Supabase 數據庫中的 RPC 函數進行聚合
  const { data, error } = await supabase.rpc('get_global_play_counts');

  if (error) {
    console.error('Error fetching global stats (RPC):', error);
    return res.status(500).json({ error: error.message });
  }

  // 整理數據格式為 { "s0": 150, "s1": 80, ... }，匹配前端需求
  const globalPlayCounts = data.reduce((acc, current) => {
      // RPC 返回的栏位是 song_id 和 total_plays
      acc[current.song_id] = current.total_plays; 
      return acc;
  }, {});
  
  // 返回 JSON 格式的排行榜數據
  res.status(200).json(globalPlayCounts);
}
