import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerStoryHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('submit_story_choice', ({ chapterId, choiceId }: { chapterId: string; choiceId: string }) => {
    const result = gameWorld.submitStoryChoice(currentUserId, chapterId, choiceId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('story_choice_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      storyChapters: gameWorld.getStoryChapters(currentUserId),
      darkChatChannels: gameWorld.getDarkChatChannels(),
    });
  });

  socket.on('set_faction_alignment', ({ faction }: { faction: any }) => {
    const result = gameWorld.setFactionAlignment(currentUserId, faction);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('faction_alignment_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      darkChatChannels: gameWorld.getDarkChatChannels(),
    });
  });

  socket.on('send_dark_chat_message', ({ channelId, text }: { channelId: string; text: string }) => {
    const result = gameWorld.sendDarkChatMessage(currentUserId, channelId, text);
    socket.emit('dark_chat_message_sent', { ...result, channels: gameWorld.getDarkChatChannels() });
    if (result.success) {
      socket.broadcast.emit('dark_chat_message_received', {
        message: result.message,
        channels: gameWorld.getDarkChatChannels(),
      });
    }
  });
}
