import { supabase } from '../lib/supabaseClient';

export async function listTrades(userId) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTrade(trade) {
  const { error } = await supabase.from('trades').insert(trade);
  if (error) throw error;
}

export async function deleteTrade(id) {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
}

export function tradePnl(trade) {
  if (trade.exit_price == null) return null;
  const diff = trade.side === 'long' ? trade.exit_price - trade.entry_price : trade.entry_price - trade.exit_price;
  return diff * trade.quantity;
}

export function computeStats(trades) {
  const closed = trades.filter((t) => t.exit_price != null);
  const pnls = closed.map(tradePnl);
  const totalPnl = pnls.reduce((sum, p) => sum + p, 0);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const grossWin = wins.reduce((sum, p) => sum + p, 0);
  const grossLoss = Math.abs(losses.reduce((sum, p) => sum + p, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  const sortedByDate = [...closed].sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date));
  let running = 0;
  const equityCurve = sortedByDate.map((t) => {
    running += tradePnl(t);
    return { date: t.exit_date, equity: running };
  });

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    totalPnl,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    equityCurve,
  };
}
