
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
}

const mockWords = [
  'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 
  'house', 'ice cream', 'jellyfish', 'kangaroo', 'lemon', 'monkey', 
  'notebook', 'ocean', 'pizza', 'queen', 'robot', 'sun', 'tree', 
  'umbrella', 'violin', 'watermelon', 'xylophone', 'yacht', 'zebra'
];

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

  // In a real application, this would connect to a WebSocket server
  useEffect(() => {
    // Simulating connection
    setGameState(prevState => ({ ...prevState, isConnected: true }));
    
    return () => {
      // Clean up WebSocket connection
      setGameState(prevState => ({ ...prevState, isConnected: false }));
    };
  }, []);

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
      status: 'waiting'
    };
    
    setGameState(prevState => ({
      ...prevState,
      room: newRoom,
      currentPlayer: player
    }));
    
    setIsCreator(true);
    return newRoom;
  };

  // Join an existing room
  const joinRoom = (code: string, playerName: string): boolean => {
    // In a real app, this would send a WebSocket request to join the room
    // For demonstration, we'll simulate a successful join if the code format is valid
    if (code && code.length === 6) {
      const playerId = uuidv4();
      
      const player: Player = {
        id: playerId,
        name: playerName,
        score: 0,
        isDrawing: false,
        isRoomCreator: false
      };
      
      // Mock room for demo
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
        status: 'waiting'
      };
      
      setGameState(prevState => ({
        ...prevState,
        room: mockRoom,
        currentPlayer: player
      }));
      
      setIsCreator(false);  // Explicitly set to false for joiners
      return true;
    }
    return false;
  };

  // Start the game (only available to room creator)
  const startGame = () => {
    if (!gameState.room) return;
    
    // Select a random player to draw first
    const players = [...gameState.room.players];
    const randomIndex = Math.floor(Math.random() * players.length);
    players[randomIndex].isDrawing = true;
    
    const updatedRoom: Room = {
      ...gameState.room,
      status: 'playing',
      currentRound: 1,
      players,
      currentDrawingPlayer: players[randomIndex]
    };
    
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
      
      setGameState(prevState => ({
        ...prevState,
        room: {
          ...prevState.room!,
          players: updatedPlayers
        },
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
      
      // Save the guess for displaying in the chat
      setGameState(prevState => ({
        ...prevState,
        guesses: [...prevState.guesses, result]
      }));
    }
    
    return result;
  };

  // Select a word from the options (for the drawing player)
  const selectWord = (word: string) => {
    if (!gameState.room || !gameState.currentPlayer?.isDrawing) return;
    
    setGameState(prevState => ({
      ...prevState,
      room: {
        ...prevState.room!,
        currentWord: word
      },
      currentWord: word,
      wordOptions: null,
      timeLeft: prevState.room!.timePerRound
    }));
    
    // Start the timer
    startTimer();
  };

  // Leave the current room
  const leaveRoom = () => {
    setGameState(initialGameState);
    setIsCreator(false);
  };

  // Set the player name
  const setPlayerName = (name: string) => {
    if (!gameState.currentPlayer) return;
    
    const updatedPlayer = {
      ...gameState.currentPlayer,
      name
    };
    
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
        
        // If time runs out, end the round
        if (newTimeLeft <= 0) {
          clearInterval(timerInterval);
          // Handle round end - in a real app, this would be done by the server
          return {
            ...prevState,
            timeLeft: 0,
            room: {
              ...prevState.room,
              status: 'roundEnd'
            }
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
    isCreator
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
