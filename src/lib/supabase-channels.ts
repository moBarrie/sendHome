import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

class ChannelManager {
  private static instance: ChannelManager;
  private channels: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  static getInstance(): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }

  createChannel(channelName: string): RealtimeChannel {
    // If channel already exists, unsubscribe it first
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName);
      if (existingChannel) {
        existingChannel.unsubscribe();
        this.channels.delete(channelName);
      }
    }

    // Create new channel with unique identifier
    const uniqueChannelName = `${channelName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(uniqueChannelName);
    this.channels.set(channelName, channel);
    
    return channel;
  }

  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  removeAllChannels(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const channelManager = ChannelManager.getInstance();

// Helper function to create a safe subscription
export function createSafeSubscription(
  channelName: string,
  config: {
    event: string;
    schema: string;
    table: string;
    filter?: string;
  },
  callback: (payload: any) => void
): () => void {
  const channel = channelManager.createChannel(channelName);
  
  channel
    .on(
      'postgres_changes' as any,
      config,
      callback
    )
    .subscribe();

  // Return cleanup function
  return () => {
    channelManager.removeChannel(channelName);
  };
}
