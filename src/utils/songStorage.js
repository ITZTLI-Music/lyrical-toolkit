// Save user songs to localStorage (excluding example songs)
export const saveUserSongs = (songs) => {
  try {
    const userSongs = songs.filter(song => !song.isExample);
    localStorage.setItem('lyricsUserSongs', JSON.stringify(userSongs));
  } catch (error) {
    console.error('Error saving songs to localStorage:', error);
  }
};

// Save example song deletion state
export const saveExampleSongDeleted = (deleted) => {
  try {
    localStorage.setItem('lyricsExampleDeleted', JSON.stringify(deleted));
  } catch (error) {
    console.error('Error saving example deletion state:', error);
  }
};

// Load example song deletion state
export const loadExampleSongDeleted = () => {
  try {
    const stored = localStorage.getItem('lyricsExampleDeleted');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading example deletion state:', error);
  }
  return false;
};

// Load user songs from localStorage
export const loadUserSongs = () => {
  try {
    const stored = localStorage.getItem('lyricsUserSongs');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the data structure
      if (Array.isArray(parsed)) {
        return parsed.filter(song => song && song.id && song.title && song.lyrics);
      }
    }
  } catch (error) {
    console.error('Error loading songs from localStorage:', error);
  }
  return [];
};

// Clear user songs from localStorage
export const clearUserSongs = () => {
  try {
    localStorage.removeItem('lyricsUserSongs');
  } catch (error) {
    console.error('Error clearing songs from localStorage:', error);
  }
};

