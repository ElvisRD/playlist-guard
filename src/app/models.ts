export interface Video {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalVideos: number;
  protect: boolean;
  updatedAt: string;
  videos: Video[];
}

export interface PlaylistSummary {
  id: string;
  title: string;
  thumbnail: string;
  totalVideos: number;
  updatedAt: string;
}

export interface Profile {
  email: string;
  name: string;
  picture: string;
}

export interface VideoDiff {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  type: 'new' | 'removed';
}

export interface AccessCheckResponse {
  hasAccess: boolean;
  playlist: Playlist;
}

export interface VerifyPlaylistResponse {
  diff: {
    allVideosDiff: VideoDiff[];
  };
}

export interface PlaylistsResponse {
  playlists: PlaylistSummary[];
}

export type DialogType = 'delete-playlist' | 'unauthorized' | 'not-access';

export type ToastType = 'success' | 'error' | 'warning' | 'not-found';

export interface ToastText {
  text: string;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  email: string;
  playlistIds: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscribeRequest {
  email: string;
  playlistIds?: string[];
}
