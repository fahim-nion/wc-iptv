import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      channels: [],
      favorites: [],
      currentChannel: null,
      searchQuery: '',
      selectedCategory: 'All',
      setChannels: (channels) => set({ channels }),
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
      toggleFavorite: (url) => set((state) => ({
        favorites: state.favorites.includes(url) 
          ? state.favorites.filter(f => f !== url) 
          : [...state.favorites, url]
      })),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setCategory: (cat) => set({ selectedCategory: cat }),
    }),
    { name: 'iptv-storage' }
  )
);