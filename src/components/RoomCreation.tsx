
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useGame } from '@/contexts/GameContext';
import { useNavigate } from 'react-router-dom';

export const RoomCreation = () => {
  const { createRoom } = useGame();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [rounds, setRounds] = useState(3);
  const [timePerRound, setTimePerRound] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const room = createRoom(playerName, rounds, timePerRound);
      navigate(`/room/${room.code}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create New Game Room</CardTitle>
        <CardDescription className="text-center">Set up a new drawing game room for your friends</CardDescription>
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
          <div className="flex justify-between items-center">
            <Label>Number of Rounds: {rounds}</Label>
          </div>
          <Slider
            defaultValue={[rounds]}
            min={1}
            max={10}
            step={1}
            onValueChange={(values) => setRounds(values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Time per Round: {timePerRound} seconds</Label>
          </div>
          <Slider
            defaultValue={[timePerRound]}
            min={30}
            max={120}
            step={10}
            onValueChange={(values) => setTimePerRound(values[0])}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-game-primary hover:bg-game-secondary"
          onClick={handleCreateRoom}
          disabled={!playerName.trim() || isSubmitting}
        >
          Create Room
        </Button>
      </CardFooter>
    </Card>
  );
};
