import { createClient } from '@supabase/supabase-js';

// 假設 SUPABASE_URL 和 SUPABASE_KEY 已配置
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // 執行 SQL 聚合查詢：按 song_id 分組，並對 plays 字段求和
  const { data, error } = await supabase
    .from('play_logs')
    .select('song_id, plays') // Supabase/PostgREST 可以在 select 中使用聚合函數
    .order('plays', { ascending: false }); // 按播放次數降序排列

  if (error) {
    console.error('Error fetching global stats:', error);
    return res.status(500).json({ error: error.message });
  }

  // 整理數據格式為 { "s0": 150, "s1": 80, ... }，方便前端合併
  const globalPlayCounts = data.reduce((acc, current) => {
      // 這裡假設您的 Supabase 配置允許直接返回聚合後的結果
      acc[current.song_id] = current.plays;
      return acc;
  }, {});

  // 注意：如果您的 Supabase/PostgREST 默認配置不允許直接聚合，
  // 您可能需要在 Supabase 中創建一個 PostgreSQL 視圖 (View) 或 RPC 函數來處理聚合。
  
  res.status(200).json(globalPlayCounts);
}
