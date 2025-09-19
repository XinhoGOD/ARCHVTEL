import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('playerName');

    if (!playerName) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Get all records for the player ordered by semana
    const { data: playerDetails, error } = await supabase
      .from('nfl_fantasy_trends')
      .select('*')
      .ilike('player_name', playerName)
      .order('semana', { ascending: true })
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch NFL player details from Supabase' },
        { status: 500 }
      );
    }

    if (!playerDetails || playerDetails.length === 0) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Calculate summary statistics
    const summary = {
      totalAdds: playerDetails.reduce((sum, record) => sum + (record.adds || 0), 0),
      totalDrops: playerDetails.reduce((sum, record) => sum + (record.drops || 0), 0),
      avgRosteredChange: playerDetails.reduce((sum, record) => sum + (record.percent_rostered_change || 0), 0) / playerDetails.length,
      avgStartedChange: playerDetails.reduce((sum, record) => sum + (record.percent_started_change || 0), 0) / playerDetails.length,
      maxRostered: Math.max(...playerDetails.map(r => r.percent_rostered || 0)),
      maxStarted: Math.max(...playerDetails.map(r => r.percent_started || 0)),
      currentRostered: playerDetails[playerDetails.length - 1]?.percent_rostered || 0,
      currentStarted: playerDetails[playerDetails.length - 1]?.percent_started || 0
    };

    return NextResponse.json({
      playerDetails,
      summary,
      playerName: playerDetails[0].player_name,
      position: playerDetails[0].position,
      team: playerDetails[0].team
    });
  } catch (error) {
    console.error('Error fetching NFL player details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFL player details' },
      { status: 500 }
    );
  }
}