import { create } from 'zustand';
import type { FamilyMember } from '../constants/mockData';

interface AppState {
  currentUser: FamilyMember | null;
  familyId: string | null;
  familyName: string | null;
  selectedMemberIds: string[];

  logout: () => void;
  setSelectedMembers: (ids: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  familyId: null,
  familyName: null,
  selectedMemberIds: [],

  logout: () => set({ currentUser: null, familyId: null, familyName: null, selectedMemberIds: [] }),
  setSelectedMembers: (ids) => set({ selectedMemberIds: ids }),
}));
