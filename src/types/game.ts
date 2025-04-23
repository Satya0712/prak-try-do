
export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawing: boolean;
  isRoomCreator: boolean;
}

export interface Room {
  id: string;
  code: string;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  timePerRound: number;
  currentWord?: string;
  status: 'waiting' | 'playing' | 'roundEnd' | 'gameOver';
  currentDrawingPlayer?: Player;
}

export interface GuessResult {
  player: Player;
  guess: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface DrawingTool {
  name: string;
  type: 'pencil' | 'brush' | 'eraser';
  icon: string;
  size?: number;
}

export interface GameState {
  room: Room | null;
  currentPlayer: Player | null;
  currentWord: string | null;
  wordOptions: string[] | null;
  timeLeft: number;
  guesses: GuessResult[];
  isConnected: boolean;
}
