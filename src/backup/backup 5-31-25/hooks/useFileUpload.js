import { useState } from 'react';
import DOMPurify from 'dompurify';

export const useFileUpload = (setSongs) => {
  const [isDragging, setIsDragging] = useState(false);

  // File upload handler
  const handleFileUpload = async (files) => {
    const newSongs = [];
    
    for (let file of files) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          const content = await file.text();
          const songTitle = file.name.replace('.txt', '').replace(/[-_]/g, ' ');
          
          const song = {
            id: Date.now() + Math.random(),
            title: DOMPurify.sanitize(songTitle),
            lyrics: DOMPurify.sanitize(content),
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            dateAdded: new Date().toISOString(),
            filename: DOMPurify.sanitize(file.name)
          };
          
          newSongs.push(song);
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
        }
      }
    }
    
    setSongs(prev => [...prev, ...newSongs]);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  return {
    isDragging,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};