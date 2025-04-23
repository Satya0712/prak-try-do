
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { useNavigate } from 'react-router-dom';

export const RoomJoin = () => {
  const { joinRoom } = useGame();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = () => {
    setError('');
    if (!playerName.trim() || !roomCode.trim()) {
      setError('Please enter your name and the room code');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = joinRoom(roomCode.toUpperCase(), playerName);
      if (success) {
        navigate(`/room/${roomCode.toUpperCase()}`);
      } else {
        setError('Room not found or invalid code');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Join Game Room</CardTitle>
        <CardDescription className="text-center">Enter a room code to join an existing game</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input 
            id="name" 
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="code">Room Code</Label>
          <Input 
            id="code" 
            placeholder="Enter 6-letter code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full text-center text-lg uppercase tracking-widest font-mono"
          />
        </div>
        
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-game-primary hover:bg-game-secondary"
          onClick={handleJoinRoom}
          disabled={!playerName.trim() || !roomCode.trim() || isSubmitting}
        >
          Join Room
        </Button>
      </CardFooter>
    </Card>
  );
};
