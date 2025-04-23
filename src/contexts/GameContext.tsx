
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Player, Room, GuessResult, GameState } from '../types/game';
import { generateRoomCode } from '../utils/gameUtils';

interface GameContextType {
  gameState: GameState;
  createRoom: (playerName: string, rounds: number, timePerRound: number) => Room;
  joinRoom: (code: string, playerName: string) => boolean;
  startGame: () => void;
  submitGuess: (guess: string) => GuessResult;
  selectWord: (word: string) => void;
  leaveRoom: () => void;
  setPlayerName: (name: string) => void;
  isCreator: boolean;
  syncRoomState: () => void;
  nextRound: () => void;
}

const mockWords = [
  'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 
  'house', 'ice cream', 'jellyfish', 'kangaroo', 'lemon', 'monkey', 
  'notebook', 'ocean', 'pizza', 'queen', 'robot', 'sun', 'tree', 
  'umbrella', 'violin', 'watermelon', 'xylophone', 'yacht', 'zebra'
];

// Mock room storage to simulate a server
const mockRoomsStorage: { [code: string]: Room } = {};
const mockPlayerRooms: { [playerId: string]: string } = {};

const initialGameState: GameState = {
  room: null,
  currentPlayer: null,
  currentWord: null,
  wordOptions: null,
  timeLeft: 0,
  guesses: [],
  isConnected: false,
  lastSync: Date.now()
};

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isCreator, setIsCreator] = useState(false);
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);

  // In a real application, this would connect to a WebSocket server
  useEffect(() => {
    // Simulating connection
    setGameState(prevState => ({ ...prevState, isConnected: true }));
    
    // Start syncing room state more frequently (every 1 second)
    const interval = setInterval(() => {
      syncRoomState();
    }, 1000);
    
    setSyncInterval(interval);
    
    return () => {
      // Clean up WebSocket connection
      setGameState(prevState => ({ ...prevState, isConnected: false }));
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, []);

  // Sync room state with mock storage
  const syncRoomState = () => {
    if (!gameState.room || !gameState.currentPlayer) return;
    
    const roomCode = gameState.room.code;
    if (mockRoomsStorage[roomCode]) {
      const updatedRoom = mockRoomsStorage[roomCode];
      
      // Only update if the room has been updated since last sync
      if (!gameState.lastSync || (updatedRoom.lastUpdated && updatedRoom.lastUpdated > gameState.lastSync)) {
        console.log("Syncing room state:", JSON.stringify(updatedRoom, circularReplacer()));
        
        // Find the current player in the updated room
        const updatedCurrentPlayer = updatedRoom.players.find(
          p => p.id === gameState.currentPlayer?.id
        );
        
        // Get current drawing player based on ID
        const currentDrawingPlayer = updatedRoom.currentDrawingPlayerId ? 
          updatedRoom.players.find(p => p.id === updatedRoom.currentDrawingPlayerId) : 
          undefined;
        
        setGameState(prevState => ({
          ...prevState,
          room: updatedRoom,
          currentPlayer: updatedCurrentPlayer || prevState.currentPlayer,
          currentWord: updatedRoom.currentWord || prevState.currentWord,
          timeLeft: updatedRoom.timeLeft || prevState.timeLeft,
          guesses: [...(updatedRoom.guesses || [])],
          lastSync: Date.now()
        }));
      }
    }
  };

  // Create a new room
  const createRoom = (playerName: string, rounds: number, timePerRound: number): Room => {
    const playerId = uuidv4();
    const roomCode = generateRoomCode();
    
    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isDrawing: false,
      isRoomCreator: true
    };
    
    const newRoom: Room = {
      id: uuidv4(),
      code: roomCode,
      players: [player],
      currentRound: 0,
      totalRounds: rounds,
      timePerRound: timePerRound,
      status: 'waiting',
      guesses: [],
      lastUpdated: Date.now()
    };
    
    // Store in mock storage
    mockRoomsStorage[roomCode] = newRoom;
    mockPlayerRooms[playerId] = roomCode;
    
    setGameState(prevState => ({
      ...prevState,
      room: newRoom,
      currentPlayer: player,
      lastSync: Date.now()
    }));
    
    setIsCreator(true);
    console.log("Room created with code:", roomCode);
    console.log("Mock rooms:", JSON.stringify(mockRoomsStorage, circularReplacer()));
    
    return newRoom;
  };

  // Join an existing room
  const joinRoom = (code: string, playerName: string): boolean => {
    // Check if room exists in our mock storage
    if (mockRoomsStorage[code]) {
      console.log("Room found:", JSON.stringify(mockRoomsStorage[code], circularReplacer()));
      const playerId = uuidv4();
      
      const player: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        isDrawing: false,
        isRoomCreator: false
      };
      
      // Update room with new player
      const updatedPlayers = [...mockRoomsStorage[code].players, player];
      mockRoomsStorage[code] = {
        ...mockRoomsStorage[code],
        players: updatedPlayers,
        lastUpdated: Date.now()
      };
      
      mockPlayerRooms[playerId] = code;
      
      setGameState(prevState => ({
        ...prevState,
        room: mockRoomsStorage[code],
        currentPlayer: player,
        lastSync: Date.now()
      }));
      
      setIsCreator(false);
      console.log("Player joined room:", code);
      console.log("Updated room:", JSON.stringify(mockRoomsStorage[code], circularReplacer()));
      
      return true;
    } else if (code && code.length === 6) {
      // If code format is valid but doesn't exist, create a mock room
      const playerId = uuidv4();
      
      const player: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        isDrawing: false,
        isRoomCreator: false
      };
      
      // Mock room for demo with another player as creator
      const mockRoom: Room = {
        id: uuidv4(),
        code: code,
        players: [
          // Simulate another player as the creator
          {
            id: uuidv4(),
            name: "Room Creator",
            score: 0,
            isDrawing: false,
            isRoomCreator: true
          },
          player
        ],
        currentRound: 0,
        totalRounds: 3,
        timePerRound: 60,
        status: 'waiting',
        guesses: [],
        lastUpdated: Date.now()
      };
      
      mockRoomsStorage[code] = mockRoom;
      mockPlayerRooms[playerId] = code;
      
      setGameState(prevState => ({
        ...prevState,
        room: mockRoom,
        currentPlayer: player,
        lastSync: Date.now()
      }));
      
      setIsCreator(false);
      return true;
    }
    
    return false;
  };

  // Start the game (only available to room creator)
  const startGame = () => {
    if (!gameState.room) return;
    
    console.log("Starting game, room is:", JSON.stringify(gameState.room, circularReplacer()));
    
    // Select a random player to draw first
    const players = [...gameState.room.players];
    const randomIndex = Math.floor(Math.random() * players.length);
    players[randomIndex].isDrawing = true;
    
    const drawingPlayerId = players[randomIndex].id;
    
    const updatedRoom: Room = {
      ...gameState.room,
      status: 'playing',
      currentRound: 1,
      players,
      currentDrawingPlayerId: drawingPlayerId,
      guesses: [],
      lastUpdated: Date.now()
    };
    
    // Update in mock storage
    mockRoomsStorage[updatedRoom.code] = updatedRoom;
    
    // If the current user is the drawing player, give them word options
    if (gameState.currentPlayer && gameState.currentPlayer.id === players[randomIndex].id) {
      // Randomly select 3 words from the mock list
      const wordOptions = mockWords
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        wordOptions,
        lastSync: Date.now()
      }));
    } else {
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        lastSync: Date.now()
      }));
    }
    
    console.log("Game started, updated room:", JSON.stringify(updatedRoom, circularReplacer()));
  };

  // Next round function
  const nextRound = () => {
    if (!gameState.room) return;

    // Only proceed if we're in roundEnd status
    if (gameState.room.status !== 'roundEnd') {
      console.log("Cannot proceed to next round - current status:", gameState.room.status);
      return;
    }
    
    const nextRoundNumber = gameState.room.currentRound + 1;
    console.log("Moving to round:", nextRoundNumber);
    
    // Check if game should end
    if (nextRoundNumber > gameState.room.totalRounds) {
      const gameOverRoom: Room = {
        ...gameState.room,
        status: 'gameOver',
        currentRound: gameState.room.totalRounds, // Stay at final round number
        lastUpdated: Date.now()
      };
      
      // Update in mock storage
      mockRoomsStorage[gameOverRoom.code] = gameOverRoom;
      
      setGameState(prevState => ({
        ...prevState,
        room: gameOverRoom,
        lastSync: Date.now()
      }));
      
      console.log("Game over, final scores:", gameOverRoom.players.map(p => `${p.name}: ${p.score}`).join(', '));
      return;
    }
    
    // Choose next player to draw
    const currentDrawerIndex = gameState.room.players.findIndex(p => p.isDrawing);
    const nextDrawerIndex = (currentDrawerIndex + 1) % gameState.room.players.length;
    
    const updatedPlayers = gameState.room.players.map((player, index) => ({
      ...player,
      isDrawing: index === nextDrawerIndex
    }));
    
    const nextPlayer = updatedPlayers[nextDrawerIndex];
    
    const updatedRoom: Room = {
      ...gameState.room,
      status: 'playing',
      currentRound: nextRoundNumber,
      players: updatedPlayers,
      currentDrawingPlayerId: nextPlayer.id,
      guesses: [],
      currentWord: undefined, // Clear the word
      lastUpdated: Date.now()
    };
    
    // Update in mock storage
    mockRoomsStorage[updatedRoom.code] = updatedRoom;
    
    // If the current user is the drawing player, give them word options
    if (gameState.currentPlayer && gameState.currentPlayer.id === nextPlayer.id) {
      // Randomly select 3 words from the mock list
      const wordOptions = mockWords
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        wordOptions,
        guesses: [],
        lastSync: Date.now()
      }));
    } else {
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        guesses: [],
        lastSync: Date.now()
      }));
    }
    
    console.log("Started round", nextRoundNumber, "with drawer:", nextPlayer.name);
  };

  // Submit a guess for the current word
  const submitGuess = (guess: string): GuessResult => {
    if (!gameState.room || !gameState.currentPlayer || !gameState.room.currentWord) {
      return {
        player: gameState.currentPlayer!,
        guess,
        isCorrect: false,
        timestamp: Date.now()
      };
    }
    
    const isCorrect = guess.toLowerCase() === gameState.room.currentWord.toLowerCase();
    const result: GuessResult = {
      player: gameState.currentPlayer,
      guess,
      isCorrect,
      timestamp: Date.now()
    };
    
    if (isCorrect) {
      // Update player score - earlier guesses get more points
      const timeBonus = Math.floor(gameState.timeLeft / 5);
      const pointsEarned = 100 + timeBonus;
      
      const updatedPlayers = gameState.room.players.map(player => {
        if (player.id === gameState.currentPlayer?.id) {
          return {
            ...player,
            score: player.score + pointsEarned
          };
        }
        return player;
      });
      
      const updatedRoom = {
        ...gameState.room,
        players: updatedPlayers,
        guesses: [...(gameState.room.guesses || []), result],
        lastUpdated: Date.now()
      };
      
      // Update in mock storage
      mockRoomsStorage[updatedRoom.code] = updatedRoom;
      
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        guesses: [...prevState.guesses, result],
        lastSync: Date.now()
      }));
    } else {
      // Check for hint
      const currentWord = gameState.room.currentWord.toLowerCase();
      const guessLower = guess.toLowerCase();
      
      // Simple matching algorithm - check if parts of the guess match the word
      let matchCount = 0;
      for (let i = 0; i < guessLower.length; i++) {
        if (currentWord.includes(guessLower[i])) {
          matchCount++;
        }
      }
      
      const matchPercentage = (matchCount / currentWord.length) * 100;
      
      const updatedRoom = {
        ...gameState.room,
        guesses: [...(gameState.room.guesses || []), result],
        lastUpdated: Date.now()
      };
      
      // Update in mock storage
      mockRoomsStorage[updatedRoom.code] = updatedRoom;
      
      // Save the guess for displaying in the chat
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        guesses: [...prevState.guesses, result],
        lastSync: Date.now()
      }));
    }
    
    return result;
  };

  // Select a word from the options (for the drawing player)
  const selectWord = (word: string) => {
    if (!gameState.room || !gameState.currentPlayer?.isDrawing) return;
    
    const updatedRoom: Room = {
      ...gameState.room,
      currentWord: word,
      timeLeft: gameState.room.timePerRound,
      lastUpdated: Date.now()
    };
    
    // Update in mock storage
    mockRoomsStorage[updatedRoom.code] = updatedRoom;
    
    setGameState(prevState => ({
      ...prevState,
      room: updatedRoom,
      currentWord: word,
      wordOptions: null,
      timeLeft: updatedRoom.timePerRound,
      lastSync: Date.now()
    }));
    
    // Start the timer
    startTimer();
  };

  // Leave the current room
  const leaveRoom = () => {
    if (gameState.room && gameState.currentPlayer) {
      const roomCode = gameState.room.code;
      const playerId = gameState.currentPlayer.id;
      
      // Remove player from room
      if (mockRoomsStorage[roomCode]) {
        const updatedPlayers = mockRoomsStorage[roomCode].players.filter(
          p => p.id !== playerId
        );
        
        // If there are still players, update the room
        if (updatedPlayers.length > 0) {
          mockRoomsStorage[roomCode] = {
            ...mockRoomsStorage[roomCode],
            players: updatedPlayers,
            lastUpdated: Date.now()
          };
        } else {
          // If no players left, delete the room
          delete mockRoomsStorage[roomCode];
        }
      }
      
      // Remove player-room association
      delete mockPlayerRooms[playerId];
    }
    
    setGameState(initialGameState);
    setIsCreator(false);
  };

  // Set the player name
  const setPlayerName = (name: string) => {
    if (!gameState.currentPlayer || !gameState.room) return;
    
    const updatedPlayer = {
      ...gameState.currentPlayer,
      name
    };
    
    // Update player in room
    const roomCode = gameState.room.code;
    if (mockRoomsStorage[roomCode]) {
      const updatedPlayers = mockRoomsStorage[roomCode].players.map(p => 
        p.id === updatedPlayer.id ? updatedPlayer : p
      );
      
      mockRoomsStorage[roomCode] = {
        ...mockRoomsStorage[roomCode],
        players: updatedPlayers,
        lastUpdated: Date.now()
      };
    }
    
    setGameState(prevState => ({
      ...prevState,
      currentPlayer: updatedPlayer,
      lastSync: Date.now()
    }));
  };

  // Timer function
  const startTimer = () => {
    // In a real app, this would be synchronized via WebSockets
    const timerInterval = setInterval(() => {
      setGameState(prevState => {
        if (!prevState.room || prevState.timeLeft <= 0) {
          clearInterval(timerInterval);
          return prevState;
        }
        
        const newTimeLeft = prevState.timeLeft - 1;
        
        // Update time in mock storage
        if (mockRoomsStorage[prevState.room.code]) {
          mockRoomsStorage[prevState.room.code] = {
            ...mockRoomsStorage[prevState.room.code],
            timeLeft: newTimeLeft,
            lastUpdated: Date.now()
          };
        }
        
        // If time runs out, end the round
        if (newTimeLeft <= 0) {
          clearInterval(timerInterval);
          // Handle round end - in a real app, this would be done by the server
          
          const updatedRoom: Room = {
            ...prevState.room,
            status: 'roundEnd',
            timeLeft: 0,
            lastUpdated: Date.now()
          };
          
          // Update in mock storage
          mockRoomsStorage[updatedRoom.code] = updatedRoom;
          
          return {
            ...prevState,
            timeLeft: 0,
            room: updatedRoom,
            lastSync: Date.now()
          };
        }
        
        return {
          ...prevState,
          timeLeft: newTimeLeft
        };
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  };

  // Helper function to handle circular JSON structures in logs
  const circularReplacer = () => {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return { message: '[Circular Reference]' };
        }
        seen.add(value);
      }
      return value;
    };
  };

  const value = {
    gameState,
    createRoom,
    joinRoom,
    startGame,
    submitGuess,
    selectWord,
    leaveRoom,
    setPlayerName,
    isCreator,
    syncRoomState,
    nextRound
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
