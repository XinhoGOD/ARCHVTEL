import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const playerFilter = searchParams.get('player') || '';
    const teamFilter = searchParams.get('team') || '';
    const positionFilter = searchParams.get('position') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('nfl_fantasy_trends')
      .select('player_name, player_id, position, team', { count: 'exact' });

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

    // Apply ordering and pagination
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Get distinct players
    const { data: allData, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch NFL players from Supabase' },
        { status: 500 }
      );
    }

    // Get distinct players manually
    const distinctPlayers = allData ? allData.reduce((acc, current) => {
      const exists = acc.find(player => player.player_name === current.player_name);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as any[]) : [];

    // Apply pagination manually
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