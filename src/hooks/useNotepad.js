import { useState, useEffect, useCallback } from 'react';

export const useNotepad = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [isMinimized, setIsMinimized] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 480, height: 350 });
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [currentEditingSongId, setCurrentEditingSongId] = useState(null);

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedNotepad = localStorage.getItem('lyricsNotepad');
      if (savedNotepad) {
        const parsed = JSON.parse(savedNotepad);
        setContent(parsed.content || '');
        setTitle(parsed.title || 'Untitled');
        setIsMinimized(parsed.isMinimized ?? true);
        setDimensions(parsed.dimensions || { width: 480, height: 350 });
        setPosition(parsed.position || { bottom: 20, right: 20 });
        setCurrentEditingSongId(null);
      }
    } catch (error) {
      console.error('Error loading notepad state:', error);
    }
  }, []);

  // Save state to localStorage
  const saveToStorage = useCallback((updates = {}) => {
    try {
      const notepadState = {
        content,
        title,
        isMinimized,
        dimensions,
        position,
        ...updates
      };
      localStorage.setItem('lyricsNotepad', JSON.stringify(notepadState));
    } catch (error) {
      console.error('Error saving notepad state:', error);
    }
  }, [content, title, isMinimized, dimensions, position, currentEditingSongId]);

  // Update content with auto-save
  const updateContent = useCallback((newContent) => {
    setContent(newContent);
    saveToStorage({ content: newContent });
  }, [saveToStorage]);

  // Update title with auto-save
  const updateTitle = useCallback((newTitle) => {
    setTitle(newTitle);
    saveToStorage({ title: newTitle });
  }, [saveToStorage]);

  // Toggle minimized state
  const toggleMinimized = useCallback(() => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    saveToStorage({ isMinimized: newMinimized });
  }, [isMinimized, saveToStorage]);

  // Update dimensions
  const updateDimensions = useCallback((newDimensions) => {
    setDimensions(newDimensions);
    saveToStorage({ dimensions: newDimensions });
  }, [saveToStorage]);

  // Update current editing song ID
  const updateCurrentEditingSongId = useCallback((songId) => {
    setCurrentEditingSongId(songId);
    saveToStorage({ currentEditingSongId: songId });
  }, [saveToStorage]);

  return {
    content,
    title,
    isMinimized,
    dimensions,
    position,
    currentEditingSongId,
    updateContent,
    updateTitle,
    toggleMinimized,
    updateDimensions,
    setPosition,
    setCurrentEditingSongId: updateCurrentEditingSongId
  };
};