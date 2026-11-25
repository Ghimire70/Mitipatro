import { createContext } from 'react';

export interface AdSettings {
  enabled: boolean;
  clientId: string;
  slotLeaderboard: string;
  slotRectangle: string;
}

export const AdSettingsContext = createContext<AdSettings>({
  enabled: false,
  clientId: '',
  slotLeaderboard: '',
  slotRectangle: '',
});
