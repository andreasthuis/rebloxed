export interface Game {
  id: number;
  name: string;
  thumbnail?: string;
  player_count?: number;
  total_up_votes?: number;
  total_down_votes?: number;
  root_place_id?: number;
  [key: string]: any;
}

export interface User {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  presenceType: number;
  isOnline: boolean;
  presence: string;
  gameId: string | null;
  presenceData: any;
  description: string;
  created: string;
  friends?: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  displayName?: string;
  [key: string]: any;
}

export type ActiveView = "Home" | "Games" | "Settings";