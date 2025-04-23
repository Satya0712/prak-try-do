
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
  isConnected: false
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
    
    // Start syncing room state every 2 seconds
    const interval = setInterval(() => {
      syncRoomState();
    }, 2000);
    
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
      console.log("Syncing room state:", mockRoomsStorage[roomCode]);
      
      // Update local state with the "server" state
      setGameState(prevState => {
        const updatedRoom = mockRoomsStorage[roomCode];
        
        // Find the current player in the updated room
        const updatedCurrentPlayer = updatedRoom.players.find(
          p => p.id === prevState.currentPlayer?.id
        );
        
        return {
          ...prevState,
          room: updatedRoom,
          currentPlayer: updatedCurrentPlayer || prevState.currentPlayer,
          currentWord: updatedRoom.currentWord || prevState.currentWord,
          timeLeft: updatedRoom.timeLeft || prevState.timeLeft,
          guesses: [...(updatedRoom.guesses || [])]
        };
      });
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
      guesses: []
    };
    
    // Store in mock storage
    mockRoomsStorage[roomCode] = newRoom;
    mockPlayerRooms[playerId] = roomCode;
    
    setGameState(prevState => ({
      ...prevState,
      room: newRoom,
      currentPlayer: player
    }));
    
    setIsCreator(true);
    console.log("Room created with code:", roomCode);
    console.log("Mock rooms:", mockRoomsStorage);
    
    return newRoom;
  };

  // Join an existing room
  const joinRoom = (code: string, playerName: string): boolean => {
    // Check if room exists in our mock storage
    if (mockRoomsStorage[code]) {
      console.log("Room found:", mockRoomsStorage[code]);
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
        players: updatedPlayers
      };
      
      mockPlayerRooms[playerId] = code;
      
      setGameState(prevState => ({
        ...prevState,
        room: mockRoomsStorage[code],
        currentPlayer: player
      }));
      
      setIsCreator(false);
      console.log("Player joined room:", code);
      console.log("Updated room:", mockRoomsStorage[code]);
      
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
        guesses: []
      };
      
      mockRoomsStorage[code] = mockRoom;
      mockPlayerRooms[playerId] = code;
      
      setGameState(prevState => ({
        ...prevState,
        room: mockRoom,
        currentPlayer: player
      }));
      
      setIsCreator(false);
      return true;
    }
    
    return false;
  };

  // Start the game (only available to room creator)
  const startGame = () => {
    if (!gameState.room) return;
    
    console.log("Starting game, room is:", gameState.room);
    
    // Select a random player to draw first
    const players = [...gameState.room.players];
    const randomIndex = Math.floor(Math.random() * players.length);
    players[randomIndex].isDrawing = true;
    
    const updatedRoom: Room = {
      ...gameState.room,
      status: 'playing',
      currentRound: 1,
      players,
      currentDrawingPlayer: players[randomIndex],
      guesses: []
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
        wordOptions
      }));
    } else {
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom
      }));
    }
    
    console.log("Game started, updated room:", updatedRoom);
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
        guesses: [...(gameState.room.guesses || []), result]
      };
      
      // Update in mock storage
      mockRoomsStorage[updatedRoom.code] = updatedRoom;
      
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        guesses: [...prevState.guesses, result]
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
        guesses: [...(gameState.room.guesses || []), result]
      };
      
      // Update in mock storage
      mockRoomsStorage[updatedRoom.code] = updatedRoom;
      
      // Save the guess for displaying in the chat
      setGameState(prevState => ({
        ...prevState,
        room: updatedRoom,
        guesses: [...prevState.guesses, result]
      }));
    }
    
    return result;
  };

  // Select a word from the options (for the drawing player)
  const selectWord = (word: string) => {
    if (!gameState.room || !gameState.currentPlayer?.isDrawing) return;
    
    const updatedRoom = {
      ...gameState.room,
      currentWord: word,
      timeLeft: gameState.room.timePerRound
    };
    
    // Update in mock storage
    mockRoomsStorage[updatedRoom.code] = updatedRoom;
    
    setGameState(prevState => ({
      ...prevState,
      room: updatedRoom,
      currentWord: word,
      wordOptions: null,
      timeLeft: updatedRoom.timePerRound
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
            players: updatedPlayers
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
        players: updatedPlayers
      };
    }
    
    setGameState(prevState => ({
      ...prevState,
      currentPlayer: updatedPlayer
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
            timeLeft: newTimeLeft
          };
        }
        
        // If time runs out, end the round
        if (newTimeLeft <= 0) {
          clearInterval(timerInterval);
          // Handle round end - in a real app, this would be done by the server
          
          const updatedRoom = {
            ...prevState.room,
            status: 'roundEnd',
            timeLeft: 0
          };
          
          // Update in mock storage
          mockRoomsStorage[updatedRoom.code] = updatedRoom;
          
          return {
            ...prevState,
            timeLeft: 0,
            room: updatedRoom
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
    syncRoomState
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
