import { useState, useEffect, useCallback } from 'react';

export const useNotepad = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [isMinimized, setIsMinimized] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [position, setPosition] = useState({ bottom: 20, right: 20 });

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedNotepad = localStorage.getItem('lyricsNotepad');
      if (savedNotepad) {
        const parsed = JSON.parse(savedNotepad);
        setContent(parsed.content || '');
        setTitle(parsed.title || 'Untitled');
        setIsMinimized(parsed.isMinimized ?? true);
        setDimensions(parsed.dimensions || { width: 400, height: 300 });
        setPosition(parsed.position || { bottom: 20, right: 20 });
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
  }, [content, title, isMinimized, dimensions, position]);

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

  return {
    content,
    title,
    isMinimized,
    dimensions,
    position,
    updateContent,
    updateTitle,
    toggleMinimized,
    updateDimensions,
    setPosition
  };
};