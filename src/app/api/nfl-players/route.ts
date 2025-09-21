import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'percent_started_change';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const playerFilter = searchParams.get('player') || '';
    const teamFilter = searchParams.get('team') || '';
    const positionFilter = searchParams.get('position') || '';

    const offset = (page - 1) * limit;

    // Build query - incluir datos de cambios para ordenación
    let query = supabase
      .from('nfl_fantasy_trends')
      .select('player_name, player_id, position, team, percent_started_change, percent_rostered_change, adds, drops, timestamp', { count: 'exact' });

    // Apply filters
    if (playerFilter) {
      query = query.ilike('player_name', `%${playerFilter}%`);
    }
    
    if (teamFilter) {
      query = query.ilike('team', `%${teamFilter}%`);
    }
    
    if (positionFilter) {
      query = query.eq('position', positionFilter);
    }

    // Filter for players with changes (non-zero changes in any metric)
    query = query.or('percent_rostered_change.neq.0,percent_started_change.neq.0,adds.neq.0,drops.neq.0');

    // Apply ordering
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Get all data for processing
    const { data: allData, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch NFL players from Supabase' },
        { status: 500 }
      );
    }

    // Get distinct players with their maximum started change
    const playerMap = new Map();
    allData?.forEach(record => {
      const key = record.player_name;
      const existing = playerMap.get(key);
      
      if (!existing || (record.percent_started_change || 0) > (existing.percent_started_change || 0)) {
        playerMap.set(key, {
          player_name: record.player_name,
          player_id: record.player_id,
          position: record.position,
          team: record.team,
          percent_started_change: record.percent_started_change,
          percent_rostered_change: record.percent_rostered_change,
          adds: record.adds,
          drops: record.drops,
          timestamp: record.timestamp
        });
      }
    });

    // Convert to array and sort by started change (highest first)
    const distinctPlayers = Array.from(playerMap.values())
      .sort((a, b) => (b.percent_started_change || 0) - (a.percent_started_change || 0));

    // Apply pagination
    const paginatedPlayers = distinctPlayers.slice(offset, offset + limit);

    return NextResponse.json({
      players: paginatedPlayers,
      pagination: {
        page,
        limit,
        total: distinctPlayers.length,
        totalPages: Math.ceil(distinctPlayers.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching NFL players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL players' },
      { status: 500 }
    );
  }
}