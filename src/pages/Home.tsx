
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoomCreation } from '@/components/RoomCreation';
import { RoomJoin } from '@/components/RoomJoin';

const Home = () => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="min-h-screen game-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-game-primary mb-2">Draw & Guess</h1>
          <p className="text-gray-600">Create a room or join an existing one to play!</p>
        </div>
        
        <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="create">Create Room</TabsTrigger>
            <TabsTrigger value="join">Join Room</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <RoomCreation />
          </TabsContent>
          <TabsContent value="join">
            <RoomJoin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;
