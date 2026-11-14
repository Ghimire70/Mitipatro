import { createContext } from 'react';

export interface AdSettings {
  enabled: boolean;
  clientId: string;
}

export const AdSettingsContext = createContext<AdSettings>({
  enabled: false,
  clientId: '',
});
