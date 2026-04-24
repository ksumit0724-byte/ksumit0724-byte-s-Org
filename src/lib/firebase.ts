// Mock Authentication Service for Aether OS (Local Storage based)
export const auth = {
  currentUser: JSON.parse(localStorage.getItem('aether_user') || 'null')
};

export async function signIn() {
  const mockUser = {
    uid: 'dev-user-' + Math.random().toString(36).substr(2, 9),
    displayName: 'Aether Pilot',
    email: 'pilot@aether.neural',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pilot',
    modeSelected: false
  };
  localStorage.setItem('aether_user', JSON.stringify(mockUser));
  window.location.reload(); // Simple reload to refresh app state
  return mockUser;
}

export function signOut() {
  localStorage.removeItem('aether_user');
  window.location.reload();
}

// Mock DB (neutralized)
export const db = {};
