import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { DrawingCanvas } from './DrawingCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Play, Clock, Crown } from 'lucide-react';

export const GameRoom = () => {
  const { gameState, isCreator, startGame, submitGuess, selectWord, leaveRoom, syncRoomState } = useGame();
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [guess, setGuess] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  
  const { room, currentPlayer, wordOptions, timeLeft, guesses } = gameState;
  
  // For debugging
  useEffect(() => {
    console.log("Current player:", currentPlayer);
    console.log("Is creator:", isCreator);
    console.log("Room status:", room?.status);
  }, [currentPlayer, isCreator, room]);
  
  // If room or player is not set, redirect to home
  useEffect(() => {
    if (!room || !currentPlayer) {
      navigate('/');
    }
  }, [room, currentPlayer, navigate]);

  // Force sync room state when component mounts and whenever relevant state changes
  useEffect(() => {
    const interval = setInterval(() => {
      syncRoomState();
    }, 1000); // Check for updates every second
    
    return () => clearInterval(interval);
  }, [syncRoomState, roomCode]);
  
  // Handle room not found
  if (!room || !roomCode) {
    return null;
  }

  const isPlayerDrawing = currentPlayer?.isDrawing;
  const isWaiting = room.status === 'waiting';
  const isPlaying = room.status === 'playing';
  const isRoundEnd = room.status === 'roundEnd';
  const isGameOver = room.status === 'gameOver';
  
  const handleStartGame = () => {
    console.log("Starting game...");
    startGame();
  };
  
  const handleWordSelection = (word: string) => {
    setSelectedWord(word);
    selectWord(word);
  };
  
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    
    submitGuess(guess);
    setGuess('');
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const getDrawingPlayerName = () => {
    const drawingPlayer = room.players.find(p => p.isDrawing);
    return drawingPlayer ? drawingPlayer.name : '';
  };
  
  return (
    <div className="container my-8">
      <div className="flex flex-col gap-4">
        {/* Room info */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Room: {roomCode}</h1>
            <p className="text-muted-foreground">
              Round {room.currentRound} of {room.totalRounds}
            </p>
          </div>
          <Button variant="outline" onClick={handleLeaveRoom}>
            Leave Room
          </Button>
        </div>
        
        {/* Game status */}
        {isWaiting && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Waiting for players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <p>Players in room: {room.players.length}</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {room.players.map((player) => (
                      <div 
                        key={player.id} 
                        className="px-3 py-1 rounded-full bg-muted flex items-center gap-1"
                      >
                        {player.isRoomCreator && <Crown size={14} className="text-yellow-500" />}
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
                
                {isCreator && (
                  <Button 
                    className="mx-auto bg-game-primary hover:bg-game-secondary"
                    onClick={handleStartGame}
                    disabled={room.players.length < 1} // Changed from 2 to 1 to allow testing with just the creator
                  >
                    <Play className="mr-2 h-4 w-4" /> Start Game
                  </Button>
                )}
                
                {!isCreator && (
                  <p className="text-center text-muted-foreground">
                    Waiting for the room creator to start the game...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Word selection */}
        {isPlaying && isPlayerDrawing && wordOptions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Choose a word to draw</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4">
                {wordOptions.map((word) => (
                  <Button 
                    key={word}
                    variant="outline"
                    className="text-lg px-6"
                    onClick={() => handleWordSelection(word)}
                  >
                    {word}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Game in progress */}
        {isPlaying && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left side - player list */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Players</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {room.players.map((player) => (
                    <div key={player.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {player.isDrawing && <Pencil size={16} className="text-game-primary" />}
                        {player.name}
                        {player.isRoomCreator && <Crown size={14} className="text-yellow-500" />}
                      </div>
                      <span className="font-bold">{player.score}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Timer */}
              {room.currentWord && (
                <Card className="mt-4">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span>{formatTimeLeft()}</span>
                      </div>
                      <span>
                        {isPlayerDrawing ? (
                          <span className="font-medium text-game-primary">Your turn to draw!</span>
                        ) : (
                          <span className="text-muted-foreground">{getDrawingPlayerName()} is drawing</span>
                        )}
                      </span>
                    </div>
                    <Progress value={(timeLeft / room.timePerRound) * 100} />
                  </CardContent>
                </Card>
              )}
              
              {/* Word display for drawer */}
              {isPlayerDrawing && room.currentWord && (
                <Alert className="mt-4 bg-game-primary text-primary-foreground">
                  <AlertDescription className="text-center font-medium">
                    You are drawing: <strong>{room.currentWord}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Right side - canvas and chat */}
            <div className="lg:col-span-3 space-y-4">
              <DrawingCanvas 
                isDrawing={isPlayerDrawing} 
                width={800}
                height={500}
              />
              
              {/* Chat/guess input */}
              {!isPlayerDrawing && (
                <form onSubmit={handleGuessSubmit} className="flex gap-2">
                  <Input
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Type your guess here..."
                    className="flex-1"
                    disabled={isPlayerDrawing}
                  />
                  <Button 
                    type="submit" 
                    disabled={!guess.trim() || isPlayerDrawing}
                  >
                    Guess
                  </Button>
                </form>
              )}
              
              {/* Guesses display */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">Guesses</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] overflow-y-auto space-y-2">
                  {(!gameState.guesses || gameState.guesses.length === 0) && (!room.guesses || room.guesses.length === 0) ? (
                    <p className="text-muted-foreground text-center">No guesses yet</p>
                  ) : (
                    (room.guesses || gameState.guesses || []).map((guessResult, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-md ${
                          guessResult.isCorrect 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : ''
                        }`}
                      >
                        <span className="font-medium">{guessResult.player.name}: </span>
                        <span>{guessResult.isCorrect ? 'Guessed correctly!' : guessResult.guess}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Round end */}
        {isRoundEnd && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Round Over!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg mb-4">The word was: <strong>{room.currentWord}</strong></p>
                
                <div className="space-y-2 max-w-md mx-auto">
                  {room.players.map((player) => (
                    <div key={player.id} className="flex justify-between items-center">
                      <span>{player.name}</span>
                      <span className="font-bold">{player.score} points</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            {isCreator && (
              <CardFooter>
                <Button className="mx-auto" onClick={() => console.log('Next round')}>
                  Next Round
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
        
        {/* Game over */}
        {isGameOver && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Game Over!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg mb-4">Final Scores:</p>
                
                <div className="space-y-2 max-w-md mx-auto">
                  {[...room.players]
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`flex justify-between items-center ${
                        index === 0 ? 'text-lg font-bold text-game-primary' : ''
                      }`}
                    >
                      <span>
                        {index === 0 && <Crown className="inline mr-1 text-yellow-500" size={18} />}
                        {player.name}
                      </span>
                      <span>{player.score} points</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="mx-auto" onClick={handleLeaveRoom}>
                Back to Home
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

function Pencil(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
