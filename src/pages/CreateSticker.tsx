// src/pages/CreateSticker.tsx
import React, { useState } from 'react';
import './CreateSticker.css';

interface CreateStickerProps {
  userCredits?: number;
  onSubmit?: (data: FormData) => void;
}

const CreateSticker: React.FC<CreateStickerProps> = ({ userCredits = 0, onSubmit }) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const hasCredits = userCredits > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasCredits) return;
    if (file) {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('file', file);
      onSubmit?.(formData);
    }
  };

  return (
    <div className="create-sticker-container">
      <h2 className="create-sticker-title">Create a New Sticker</h2>
      <form className="create-sticker-form" onSubmit={handleSubmit}>
        <label className="create-sticker-label">
          Sticker Name
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="create-sticker-input"
          />
        </label>

        <label className="create-sticker-label">
          Image File
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            required
            className="create-sticker-file-input"
          />
        </label>

        <button
          type="submit"
          disabled={!hasCredits}
          className="create-sticker-button"
        >
          ➕ Create Sticker
        </button>

        {!hasCredits && (
          <p className="create-sticker-warning">
            You need at least one credit to create a sticker.
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateSticker;
