'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  Trophy, 
  Target,
  Star,
  Filter,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Crown,
  Award,
  BarChart3,
  Eye,
  User
} from 'lucide-react';

interface NFLPlayer {
  player_name: string;
  player_id: string | null;
  position: string | null;
  team: string | null;
}

interface PlayerDetail {
  id: number;
  player_name: string;
  player_id: string | null;
  position: string | null;
  team: string | null;
  opponent: string | null;
  percent_rostered: number | null;
  percent_rostered_change: number | null;
  percent_started: number | null;
  percent_started_change: number | null;
  adds: number | null;
  drops: number | null;
  scraped_at: string;
  created_at: string;
  semana: number;
  timestamp: string;
}

interface PlayerSummary {
  totalAdds: number;
  totalDrops: number;
  avgRosteredChange: number;
  avgStartedChange: number;
  maxRostered: number;
  maxStarted: number;
  currentRostered: number;
  currentStarted: number;
}

interface PlayerDetailsResponse {
  playerDetails: PlayerDetail[];
  summary: PlayerSummary;
  playerName: string;
  position: string | null;
  team: string | null;
}

interface NFLStats {
  topAdds: Array<{
    player_name: string;
    position: string | null;
    team: string | null;
    totalAdds: number;
  }>;
  topDrops: Array<{
    player_name: string;
    position: string | null;
    team: string | null;
    totalDrops: number;
  }>;
  topRostered: Array<{
    player_name: string;
    position: string | null;
    team: string | null;
    percent_rostered: number | null;
  }>;
  topPositiveChanges: Array<{
    player_name: string;
    position: string | null;
    team: string | null;
    percent_started_change: number | null;
  }>;
  topNegativeChanges: Array<{
    player_name: string;
    position: string | null;
    team: string | null;
    percent_started_change: number | null;
  }>;
  topStartedChangeLastWeek: Array<{
    player_name: string;
    position: string | null;
    team: string | null;
    percent_started_change: number | null;
    timestamp: string;
    semana: number;
  }>;
  totalStats: {
    totalAdds: number;
    totalDrops: number;
    avgRostered: number;
    avgStarted: number;
    totalRecords: number;
    uniquePlayers: number;
  };
}

export default function Home() {
  const [players, setPlayers] = useState<NFLPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetailsResponse | null>(null);
  const [playerDetailsLoading, setPlayerDetailsLoading] = useState(false);
  const [stats, setStats] = useState<NFLStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState({
    player: '',
    team: '',
    position: '',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/nfl-players?${params}`);
      const data = await response.json();
      
      if (data.players) {
        setPlayers(data.players);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, player: value });
    setIsSearching(true);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setPagination({ ...pagination, page: 1 }); // Reset to first page
      fetchPlayers().finally(() => setIsSearching(false));
    }, 500); // 500ms delay
    
    setSearchTimeout(timeout);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/nfl-stats');
      const data = await response.json();
      
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPlayerDetails = async (playerName: string) => {
    setPlayerDetailsLoading(true);
    try {
      const response = await fetch(`/api/nfl-player-details?playerName=${encodeURIComponent(playerName)}`);
      const data = await response.json();
      
      if (data.playerDetails) {
        setSelectedPlayer(data);
      }
    } catch (error) {
      console.error('Error fetching player details:', error);
    } finally {
      setPlayerDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchStats();
  }, [pagination.page, filters]);

  const formatChartData = (details: PlayerDetail[]) => {
    return details.map(detail => ({
      fecha: new Date(detail.timestamp).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fechaCompleta: detail.timestamp,
      semana: detail.semana,
      rostered: detail.percent_rostered || 0,
      rosteredChange: detail.percent_rostered_change || 0,
      started: detail.percent_started || 0,
      startedChange: detail.percent_started_change || 0,
      adds: detail.adds || 0,
      drops: detail.drops || 0
    }));
  };

  const getPositionColor = (position: string | null) => {
    const colors: { [key: string]: string } = {
      'QB': 'bg-blue-600 text-blue-100',
      'RB': 'bg-green-600 text-green-100',
      'WR': 'bg-purple-600 text-purple-100',
      'TE': 'bg-orange-600 text-orange-100',
      'K': 'bg-red-600 text-red-100',
      'DEF': 'bg-gray-600 text-gray-100'
    };
    return colors[position || ''] || 'bg-gray-700 text-gray-100';
  };

  const getChangeColor = (change: number | null) => {
    if (!change) return 'text-gray-400';
    return change > 0 ? 'text-green-400' : 'text-red-400';
  };

  const getChangeIcon = (change: number | null) => {
    if (!change) return null;
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  // Get top performers for executive view
  const topStartedPlayers = stats?.topRostered
    .sort((a, b) => (b.percent_rostered || 0) - (a.percent_rostered || 0))
    .slice(0, 5) || [];

  const topStartedChangeLastWeekPlayers = stats?.topStartedChangeLastWeek || [];

  const topStartedChangePlayers = stats?.topPositiveChanges
    .sort((a, b) => (b.percent_started_change || 0) - (a.percent_started_change || 0))
    .slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-4">
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            NFL Fantasy Executive
          </h1>
          <Crown className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-gray-400 text-sm md:text-base">Dashboard Ejecutivo de Tendencias Elite</p>
      </div>

      {/* Executive Summary Cards */}
      {statsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Cargando análisis ejecutivo...</p>
        </div>
      ) : stats && (
        <div className="space-y-4 mb-6">
          {/* Top Started Change Last Week - NEW FOCUS */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-400">
                <Zap className="h-5 w-5" />
                🔥 Trending Esta Semana - Mayor Started Change
              </CardTitle>
              <CardDescription className="text-gray-400">
                Jugadores con mayor crecimiento en titularidad en los últimos 7 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topStartedChangeLastWeekPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No hay cambios significativos en la última semana</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {topStartedChangeLastWeekPlayers.map((player, index) => (
                    <div key={player.player_name} className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-3 border border-green-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                          <Badge className={getPositionColor(player.position)}>
                            {player.position}
                          </Badge>
                        </div>
                        <span className="text-xs text-green-400 font-semibold">#{index + 1}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-white truncate">{player.player_name}</p>
                        <p className="text-xs text-gray-400">{player.team} • Sem {player.semana}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Started Change</span>
                          <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            +{player.percent_started_change?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-green-300">
                          {new Date(player.timestamp).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Started Players - Elite Focus */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-yellow-400">
                <Star className="h-5 w-5" />
                Elite Players - Mayor Started General
              </CardTitle>
              <CardDescription className="text-gray-400">
                Jugadores con mayor porcentaje de titularidad en fantasía (histórico)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {topStartedPlayers.map((player, index) => (
                  <div key={player.player_name} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                        {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                        {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                        <Badge className={getPositionColor(player.position)}>
                          {player.position}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-white truncate">{player.player_name}</p>
                      <p className="text-xs text-gray-400">{player.team}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Started</span>
                        <span className="text-sm font-bold text-green-400">
                          {player.percent_rostered?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalStats.uniquePlayers}</div>
                <p className="text-xs text-gray-400">Jugadores Activos</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <ArrowUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalStats.totalAdds.toLocaleString()}</div>
                <p className="text-xs text-gray-400">Total Adds</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <ArrowDown className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalStats.totalDrops.toLocaleString()}</div>
                <p className="text-xs text-gray-400">Total Drops</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Activity className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalStats.avgStarted.toFixed(1)}%</div>
                <p className="text-xs text-gray-400">Started Promedio</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Search Bar - Always Visible */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar jugadores elite..."
                  value={filters.player}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pl-10 pr-4 py-3 text-base"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 px-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Más Filtros'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters Section */}
      {showFilters && (
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros Avanzados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                placeholder="Equipo..."
                value={filters.team}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Select value={filters.position} onValueChange={(value) => setFilters({ ...filters, position: value === 'all' ? '' : value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Posición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="QB">QB</SelectItem>
                  <SelectItem value="RB">RB</SelectItem>
                  <SelectItem value="WR">WR</SelectItem>
                  <SelectItem value="TE">TE</SelectItem>
                  <SelectItem value="K">K</SelectItem>
                  <SelectItem value="DEF">DEF</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Fecha</SelectItem>
                  <SelectItem value="player_name">Nombre</SelectItem>
                  <SelectItem value="team">Equipo</SelectItem>
                  <SelectItem value="position">Posición</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={fetchPlayers} 
                disabled={loading}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
              >
                {loading ? 'Aplicando...' : 'Aplicar Filtros'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players Table */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Jugadores Elite con Cambios
          </CardTitle>
          <CardDescription className="text-gray-400">
            Análisis detallado de jugadores con tendencias significativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Analizando jugadores...</p>
            </div>
          ) : (
            <>
              {players.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    {filters.player ? 'No se encontraron jugadores' : 'No hay jugadores con cambios'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {filters.player 
                      ? `No hay jugadores que coincidan con "${filters.player}". Intenta con otra búsqueda.`
                      : 'Actualmente no hay jugadores con cambios registrados en la base de datos.'
                    }
                  </p>
                  {filters.player && (
                    <Button
                      onClick={() => handleSearchChange('')}
                      className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                    >
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Jugador</TableHead>
                          <TableHead className="text-gray-300 hidden sm:table-cell">Posición</TableHead>
                          <TableHead className="text-gray-300 hidden md:table-cell">Equipo</TableHead>
                          <TableHead className="text-gray-300">Análisis</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player) => (
                          <TableRow key={player.player_name} className="border-gray-700 hover:bg-gray-700/50">
                            <TableCell className="font-medium text-white">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{player.player_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge className={getPositionColor(player.position)}>
                                {player.position}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-gray-300">{player.team}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => fetchPlayerDetails(player.player_name)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-white">
                                      <BarChart3 className="h-5 w-5 text-yellow-500" />
                                      {selectedPlayer?.playerName} - Análisis Ejecutivo
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      {selectedPlayer?.position} • {selectedPlayer?.team}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {playerDetailsLoading ? (
                                    <div className="text-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                                      <p className="text-gray-400 mt-2">Generando análisis ejecutivo...</p>
                                    </div>
                                  ) : selectedPlayer && (
                                    <div className="space-y-6">
                                      {/* Executive Summary Cards */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="bg-gray-700/50 border-gray-600">
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-green-400">Adds Totales</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="text-2xl font-bold text-white">
                                              {selectedPlayer.summary.totalAdds.toLocaleString()}
                                            </div>
                                          </CardContent>
                                        </Card>
                                        <Card className="bg-gray-700/50 border-gray-600">
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-red-400">Drops Totales</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="text-2xl font-bold text-white">
                                              {selectedPlayer.summary.totalDrops.toLocaleString()}
                                            </div>
                                          </CardContent>
                                        </Card>
                                        <Card className="bg-gray-700/50 border-gray-600">
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-blue-400">Started Actual</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="text-2xl font-bold text-white">
                                              {selectedPlayer.summary.currentStarted.toFixed(1)}%
                                            </div>
                                          </CardContent>
                                        </Card>
                                        <Card className="bg-gray-700/50 border-gray-600">
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-purple-400">Rostered Actual</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="text-2xl font-bold text-white">
                                              {selectedPlayer.summary.currentRostered.toFixed(1)}%
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>

                                      {/* Charts with Date on X-axis */}
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <Card className="bg-gray-700/50 border-gray-600">
                                          <CardHeader>
                                            <CardTitle className="text-lg text-white">Evolución de Porcentajes por Fecha</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                              <LineChart data={formatChartData(selectedPlayer.playerDetails)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis 
                                                  dataKey="fecha" 
                                                  stroke="#9CA3AF"
                                                  angle={-45}
                                                  textAnchor="end"
                                                  height={60}
                                                />
                                                <YAxis stroke="#9CA3AF" />
                                                <Tooltip 
                                                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                                                  labelStyle={{ color: '#F9FAFB' }}
                                                  labelFormatter={(value, payload) => {
                                                    if (payload && payload[0]) {
                                                      const data = payload[0].payload;
                                                      return `${data.fecha} (Sem ${data.semana})`;
                                                    }
                                                    return value;
                                                  }}
                                                />
                                                <Legend />
                                                <Line 
                                                  type="monotone" 
                                                  dataKey="rostered" 
                                                  stroke="#8B5CF6" 
                                                  name="% Rostered"
                                                  strokeWidth={2}
                                                />
                                                <Line 
                                                  type="monotone" 
                                                  dataKey="started" 
                                                  stroke="#10B981" 
                                                  name="% Started"
                                                  strokeWidth={2}
                                                />
                                              </LineChart>
                                            </ResponsiveContainer>
                                          </CardContent>
                                        </Card>

                                        <Card className="bg-gray-700/50 border-gray-600">
                                          <CardHeader>
                                            <CardTitle className="text-lg text-white">Cambio en Started por Fecha</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                              <BarChart data={formatChartData(selectedPlayer.playerDetails)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis 
                                                  dataKey="fecha" 
                                                  stroke="#9CA3AF"
                                                  angle={-45}
                                                  textAnchor="end"
                                                  height={60}
                                                />
                                                <YAxis stroke="#9CA3AF" />
                                                <Tooltip 
                                                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                                                  labelStyle={{ color: '#F9FAFB' }}
                                                  labelFormatter={(value, payload) => {
                                                    if (payload && payload[0]) {
                                                      const data = payload[0].payload;
                                                      return `${data.fecha} (Sem ${data.semana})`;
                                                    }
                                                    return value;
                                                  }}
                                                />
                                                <Legend />
                                                <Bar 
                                                  dataKey="startedChange" 
                                                  fill="#F59E0B"
                                                  name="Cambio % Started"
                                                />
                                              </BarChart>
                                            </ResponsiveContainer>
                                          </CardContent>
                                        </Card>
                                      </div>

                                      <Card className="bg-gray-700/50 border-gray-600">
                                        <CardHeader>
                                          <CardTitle className="text-lg text-white">Actividad de Mercado por Fecha</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={formatChartData(selectedPlayer.playerDetails)}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                              <XAxis 
                                                dataKey="fecha" 
                                                stroke="#9CA3AF"
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                              />
                                              <YAxis stroke="#9CA3AF" />
                                              <Tooltip 
                                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                                                labelStyle={{ color: '#F9FAFB' }}
                                                labelFormatter={(value, payload) => {
                                                  if (payload && payload[0]) {
                                                    const data = payload[0].payload;
                                                    return `${data.fecha} (Sem ${data.semana})`;
                                                  }
                                                  return value;
                                                }}
                                              />
                                              <Legend />
                                              <Line 
                                                type="monotone" 
                                                dataKey="adds" 
                                                stroke="#10B981" 
                                                name="Adds"
                                                strokeWidth={2}
                                              />
                                              <Line 
                                                type="monotone" 
                                                dataKey="drops" 
                                                stroke="#EF4444" 
                                                name="Drops"
                                                strokeWidth={2}
                                              />
                                            </LineChart>
                                          </ResponsiveContainer>
                                        </CardContent>
                                      </Card>

                                      {/* Detailed Table */}
                                      <Card className="bg-gray-700/50 border-gray-600">
                                        <CardHeader>
                                          <CardTitle className="text-lg text-white">Historial Completo</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="max-h-96 overflow-y-auto">
                                            <Table>
                                              <TableHeader>
                                                <TableRow className="border-gray-600">
                                                  <TableHead className="text-gray-300">Semana</TableHead>
                                                  <TableHead className="text-gray-300 hidden sm:table-cell">Fecha</TableHead>
                                                  <TableHead className="text-gray-300">% Started</TableHead>
                                                  <TableHead className="text-gray-300">Cambio</TableHead>
                                                  <TableHead className="text-gray-300 hidden md:table-cell">Adds</TableHead>
                                                  <TableHead className="text-gray-300 hidden md:table-cell">Drops</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {selectedPlayer.playerDetails.map((detail) => (
                                                  <TableRow key={detail.id} className="border-gray-600">
                                                    <TableCell className="text-white">{detail.semana}</TableCell>
                                                    <TableCell className="hidden sm:table-cell text-gray-300">
                                                      {new Date(detail.timestamp).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-white font-medium">
                                                      {detail.percent_started?.toFixed(1)}%
                                                    </TableCell>
                                                    <TableCell>
                                                      <span className={`flex items-center gap-1 ${getChangeColor(detail.percent_started_change)}`}>
                                                        {getChangeIcon(detail.percent_started_change)}
                                                        {detail.percent_started_change?.toFixed(1)}%
                                                      </span>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-green-400">
                                                      +{detail.adds}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-red-400">
                                                      -{detail.drops}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
                    <div className="text-sm text-gray-400 text-center sm:text-left">
                      Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} jugadores
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page <= 1}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page >= pagination.totalPages}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}