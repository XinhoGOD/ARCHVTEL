import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get top players by adds
    const { data: topAddsData, error: topAddsError } = await supabase
      .from('nfl_fantasy_trends')
      .select('player_name, position, team, adds')
      .not('adds', 'is', null);

    // Get top players by drops
    const { data: topDropsData, error: topDropsError } = await supabase
      .from('nfl_fantasy_trends')
      .select('player_name, position, team, drops')
      .not('drops', 'is', null);

    // Get players with highest rostered percentage
    const { data: topRosteredData, error: topRosteredError } = await supabase
      .from('nfl_fantasy_trends')
      .select('player_name, position, team, percent_rostered')
      .not('percent_rostered', 'is', null)
      .order('percent_rostered', { ascending: false });

    // Get players with biggest positive changes
    const { data: topPositiveChangesData, error: topPositiveChangesError } = await supabase
      .from('nfl_fantasy_trends')
      .select('player_name, position, team, percent_started_change')
      .gt('percent_started_change', 0)
      .order('percent_started_change', { ascending: false });

    // Get players with biggest negative changes
    const { data: topNegativeChangesData, error: topNegativeChangesError } = await supabase
      .from('nfl_fantasy_trends')
      .select('player_name, position, team, percent_started_change')
      .lt('percent_started_change', 0)
      .order('percent_started_change', { ascending: true });

    // Get total stats
    const { data: totalStatsData, error: totalStatsError } = await supabase
      .from('nfl_fantasy_trends')
      .select('adds, drops, percent_rostered, percent_started');

    // Get unique players
    const { data: uniquePlayersData, error: uniquePlayersError } = await supabase
      .from('nfl_fantasy_trends')
      .select('player_name');

    if (topAddsError || topDropsError || topRosteredError || 
        topPositiveChangesError || topNegativeChangesError || 
        totalStatsError || uniquePlayersError) {
      console.error('Supabase errors:', {
        topAddsError, topDropsError, topRosteredError,
        topPositiveChangesError, topNegativeChangesError,
        totalStatsError, uniquePlayersError
      });
      return NextResponse.json(
        { error: 'Failed to fetch NFL stats from Supabase' },
        { status: 500 }
      );
    }

    // Process top adds (group by player and sum)
    const topAddsMap = new Map();
    topAddsData?.forEach(item => {
      const key = `${item.player_name}-${item.position}-${item.team}`;
      const current = topAddsMap.get(key) || 0;
      topAddsMap.set(key, current + (item.adds || 0));
    });
    const topAdds = Array.from(topAddsMap.entries())
      .map(([key, totalAdds]) => {
        const [player_name, position, team] = key.split('-');
        return { player_name, position, team, totalAdds };
      })
      .sort((a, b) => b.totalAdds - a.totalAdds)
      .slice(0, 5);

    // Process top drops (group by player and sum)
    const topDropsMap = new Map();
    topDropsData?.forEach(item => {
      const key = `${item.player_name}-${item.position}-${item.team}`;
      const current = topDropsMap.get(key) || 0;
      topDropsMap.set(key, current + (item.drops || 0));
    });
    const topDrops = Array.from(topDropsMap.entries())
      .map(([key, totalDrops]) => {
        const [player_name, position, team] = key.split('-');
        return { player_name, position, team, totalDrops };
      })
      .sort((a, b) => b.totalDrops - a.totalDrops)
      .slice(0, 5);

    // Get unique players for top rostered
    const topRosteredMap = new Map();
    topRosteredData?.forEach(item => {
      const key = item.player_name;
      const current = topRosteredMap.get(key);
      if (!current || (item.percent_rostered || 0) > (current.percent_rostered || 0)) {
        topRosteredMap.set(key, item);
      }
    });
    const topRostered = Array.from(topRosteredMap.values())
      .sort((a, b) => (b.percent_rostered || 0) - (a.percent_rostered || 0))
      .slice(0, 5);

    // Get unique players for positive changes
    const topPositiveChangesMap = new Map();
    topPositiveChangesData?.forEach(item => {
      const key = item.player_name;
      const current = topPositiveChangesMap.get(key);
      if (!current || (item.percent_started_change || 0) > (current.percent_started_change || 0)) {
        topPositiveChangesMap.set(key, item);
      }
    });
    const topPositiveChanges = Array.from(topPositiveChangesMap.values())
      .sort((a, b) => (b.percent_started_change || 0) - (a.percent_started_change || 0))
      .slice(0, 5);

    // Get unique players for negative changes
    const topNegativeChangesMap = new Map();
    topNegativeChangesData?.forEach(item => {
      const key = item.player_name;
      const current = topNegativeChangesMap.get(key);
      if (!current || (item.percent_started_change || 0) < (current.percent_started_change || 0)) {
        topNegativeChangesMap.set(key, item);
      }
    });
    const topNegativeChanges = Array.from(topNegativeChangesMap.values())
      .sort((a, b) => (a.percent_started_change || 0) - (b.percent_started_change || 0))
      .slice(0, 5);

    // Calculate total stats
    const totalStats = {
      totalAdds: totalStatsData?.reduce((sum, item) => sum + (item.adds || 0), 0) || 0,
      totalDrops: totalStatsData?.reduce((sum, item) => sum + (item.drops || 0), 0) || 0,
      avgRostered: totalStatsData?.reduce((sum, item) => sum + (item.percent_rostered || 0), 0) / (totalStatsData?.length || 1) || 0,
      avgStarted: totalStatsData?.reduce((sum, item) => sum + (item.percent_started || 0), 0) / (totalStatsData?.length || 1) || 0,
      totalRecords: totalStatsData?.length || 0,
      uniquePlayers: new Set(uniquePlayersData?.map(item => item.player_name)).size || 0
    };

    return NextResponse.json({
      topAdds,
      topDrops,
      topRostered,
      topPositiveChanges,
      topNegativeChanges,
      totalStats
    });
  } catch (error) {
    console.error('Error fetching NFL stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL stats' },
      { status: 500 }
    );
  }
}