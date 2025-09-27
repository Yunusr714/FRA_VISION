import { create } from 'zustand';

export interface AppState {
  language: string;
  eli5Mode: boolean;
  sidebarOpen: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  selectedDistrict: string | null;
  notifications: Notification[];
  setLanguage: (language: string) => void;
  toggleEli5Mode: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMapView: (center: [number, number], zoom: number) => void;
  setSelectedDistrict: (district: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  read?: boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  language: 'en',
  eli5Mode: false,
  sidebarOpen: true,
  mapCenter: [74.2179, 24.5854], // Rajasthan center
  mapZoom: 7,
  selectedDistrict: null,
  notifications: [],

  setLanguage: (language) => set({ language }),

  toggleEli5Mode: () => set((state) => ({ eli5Mode: !state.eli5Mode })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),

  setSelectedDistrict: (district) => set({ selectedDistrict: district }),

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      timestamp: new Date()
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 10) // Keep last 10
    }));

    // Auto-remove after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        get().removeNotification(id);
      }, 5000);
    }
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  }))
}));