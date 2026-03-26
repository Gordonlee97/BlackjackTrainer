import { useState } from 'react';
import SetupPage from './components/setup/SetupPage';
import GameTable from './components/game/GameTable';

type Page = 'setup' | 'game';

export default function App() {
  const [page, setPage] = useState<Page>('setup');

  if (page === 'game') {
    return <GameTable onBackToMenu={() => setPage('setup')} />;
  }

  return <SetupPage onStart={() => setPage('game')} />;
}
