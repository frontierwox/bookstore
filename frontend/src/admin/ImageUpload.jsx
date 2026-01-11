import React, { useState } from 'react';
import { IoCloudUpload, IoTrash, IoImage } from 'react-icons/io5';

const ImageUpload = ({ onImageUpload, maxImages = 5 }) => {
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (previews.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images.`);
      return;
    }

    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
    onImageUpload([...previews, ...newPreviews].map(p => p.file));
  };

  const removeImage = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onImageUpload(newPreviews.map(p => p.file));
  };

  return (
    <div className="image-upload-container">
      <div className="image-previews mb-3">
        {previews.map((preview, index) => (
          <div key={index} className="image-preview-item">
            <img src={preview.url} alt={`Preview ${index}`} />
            <button
              type="button"
              className="remove-image-btn"
              onClick={() => removeImage(index)}
            >
              <IoTrash size={16} />
            </button>
          </div>
        ))}
        {previews.length < maxImages && (
          <label className="image-upload-label">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
            <div className="upload-placeholder">
              <IoImage size={32} />
              <span>Add Image</span>
            </div>
          </label>
        )}
      </div>
      <p className="text-muted small">Max {maxImages} images. PNG, JPG or WebP.</p>
    </div>
  );
};

export default ImageUpload;
