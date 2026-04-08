import { useRef, useState } from 'react';
import api from '../utils/api';
import './ImageUploader.css';

/**
 * Drag & drop multi-image uploader.
 * Props:
 *   value: string[]  — current image URLs
 *   onChange: (urls: string[]) => void
 */
export default function ImageUploader({ value = [], onChange }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const upload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('images', f));
      const res = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Support both old { urls } and new { urls, variants } response shapes
      onChange([...value, ...res.data.urls]);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files);
  };

  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:1000';
    if (url.startsWith('/uploads/')) {
      // Use md variant for dashboard previews (faster)
      const preview = url.endsWith('-full.webp')
        ? url.replace(/-full\.webp$/, '-md.webp')
        : url;
      return `${base}${preview}`;
    }
    return `${base}/assets/${encodeURIComponent(url)}`;
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="img-uploader">
      <div
        className={`drop-zone ${dragging ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => upload(e.target.files)}
        />
        {uploading ? (
          <span className="upload-status">⏳ Uploading...</span>
        ) : (
          <>
            <span className="drop-icon">🖼️</span>
            <span className="drop-text">Drag & drop images here, or click to browse</span>
            <span className="drop-hint">JPG, PNG, WEBP — up to 10 MB each</span>
          </>
        )}
      </div>

      {value.length > 0 && (
        <div className="img-preview-row">
          {value.map((url, i) => {
            const src = resolveUrl(url);
            return (
              <div key={i} className="img-thumb">
                <img src={src} alt={`upload-${i}`} />
                <button className="img-remove" onClick={() => remove(i)} title="Remove">✕</button>
                {i === 0 && <span className="img-primary">Main</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
