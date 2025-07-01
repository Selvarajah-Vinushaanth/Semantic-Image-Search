import React, { useState, useEffect } from 'react';

export default function App() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null, filename: '' });

  const backendUrl = 'http://localhost:8000';

  // Fetch all images on mount
  useEffect(() => {
    fetchAllImages();
    // eslint-disable-next-line
  }, []);

  async function fetchAllImages() {
    setMessage('Loading images...');
    try {
      const res = await fetch(`${backendUrl}/images/`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results);
        setMessage(`${data.results.length} images loaded.`);
      } else {
        setMessage('Failed to load images.');
      }
    } catch (err) {
      setMessage('Error loading images: ' + err.message);
    }
  }

  async function handleUpload() {
    if (!imageFile) {
      alert('Please select an image.');
      return;
    }
    setUploading(true);
    setMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const res = await fetch(`${backendUrl}/upload/`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Upload successful!');
        setImageFile(null);
        setImagePreview(null);
        await fetchAllImages();
      } else {
        setMessage('Upload failed: ' + (data.message || ''));
      }
    } catch (err) {
      setMessage('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSearch() {
    if (!searchTerm.trim()) {
      alert('Please enter search keywords.');
      return;
    }
    setSearching(true);
    setMessage('Searching...');
    setSearchResults([]);

    try {
      const res = await fetch(
        `${backendUrl}/search/?query=${encodeURIComponent(searchTerm)}&top_k=10`
      );
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results);
        setMessage(`${data.results.length} results found.`);
      } else {
        setMessage('Search failed.');
      }
    } catch (err) {
      setMessage('Search error: ' + err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleDeleteConfirm() {
    const { id, filename } = deleteModal;
    setDeletingId(id);
    setMessage('Deleting...');
    try {
      const res = await fetch(`${backendUrl}/delete_image/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, filename }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Image deleted.');
        await fetchAllImages();
      } else {
        setMessage('Delete failed: ' + (data.message || ''));
      }
    } catch (err) {
      setMessage('Delete error: ' + err.message);
    } finally {
      setDeletingId(null);
      setDeleteModal({ visible: false, id: null, filename: '' });
    }
  }

  function handleDelete(id, filename) {
    setDeleteModal({ visible: true, id, filename });
  }

  function handleImageSelection(file) {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setMessage('Image removed.');
  }

  return (
    <div className="container" style={{
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ef 100%)',
      minHeight: '100vh',
      padding: '0 0 40px 0',
      position: 'relative'
    }}>
      <h1 style={{
        textAlign: 'center',
        color: '#2d3748',
        margin: '30px 0 10px 0',
        letterSpacing: '1.5px',
        fontWeight: 700,
        fontSize: '2.5rem'
      }}>Semantic Image Search</h1>

      {/* Upload Section */}
      <section style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 16px #0001',
        maxWidth: 520,
        margin: '30px auto 20px auto',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        <h2 style={{ margin: 0, color: '#4a5568', fontSize: '1.5rem', fontWeight: 600 }}>Upload Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={e => handleImageSelection(e.target.files[0])}
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: '1rem',
            background: '#f7fafc'
          }}
        />
        {imagePreview && (
          <div style={{
            textAlign: 'center',
            marginTop: 16,
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: 8,
            background: '#f7fafc'
          }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 6,
                boxShadow: '0 2px 8px #0001'
              }}
            />
            <button
              onClick={handleRemoveImage}
              style={{
                marginTop: 12,
                background: '#e53e3e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Remove Image
            </button>
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            background: uploading ? '#a0aec0' : 'linear-gradient(90deg,#4299e1,#3182ce)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 0',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            position: 'relative'
          }}
        >
          {uploading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <div className="spinner" style={{
                width: 16,
                height: 16,
                border: '2px solid #fff',
                borderTop: '2px solid #3182ce',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Uploading...
            </div>
          ) : 'Upload'}
        </button>
      </section>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      {/* Search Section */}
      <section style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 16px #0001',
        maxWidth: 520,
        margin: '0 auto 20px auto',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        <h2 style={{ margin: 0, color: '#4a5568', fontSize: '1.5rem', fontWeight: 600 }}>Search Images</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            placeholder="Type e.g. 'cat', 'mountain', 'car'"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: '1rem',
              background: '#f7fafc'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              background: searching ? '#a0aec0' : 'linear-gradient(90deg,#38b2ac,#319795)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 22px',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: searching ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </section>

      {/* Results Section */}
      {message && <p className="message" style={{
        textAlign: 'center',
        color: message.toLowerCase().includes('error') || message.toLowerCase().includes('fail') ? '#e53e3e' : '#2b6cb0',
        fontWeight: 600,
        margin: '10px 0 20px 0',
        fontSize: '1.1rem'
      }}>{message}</p>}

      <section>
        <h2 style={{ textAlign: 'center', color: '#4a5568', fontSize: '1.5rem', fontWeight: 600 }}>Results</h2>
        {searchResults.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#777', fontSize: '1rem' }}>
            No results to show
          </p>
        ) : (
          <div
            className="results-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 32,
              maxWidth: 700,
              margin: '30px auto 0 auto',
              padding: '0 20px'
            }}
          >
            {searchResults.map(img => (
              <div
                key={img.id}
                className="result-item"
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 2px 10px #0002',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <img
                  src={img.image_base64}
                  alt={img.filename}
                  loading="lazy"
                  style={{
                    width: 220,
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginBottom: 10,
                    boxShadow: '0 1px 6px #0001'
                  }}
                />
                <div
                  className="result-filename"
                  style={{
                    fontWeight: 600,
                    color: '#2d3748',
                    fontSize: '1rem',
                    marginBottom: 8,
                    wordBreak: 'break-all',
                    textAlign: 'center'
                  }}
                >
                  {img.filename}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleDelete(img.id, img.filename)}
                    disabled={deletingId === img.id}
                    style={{
                      background: deletingId === img.id ? '#e53e3e99' : 'linear-gradient(90deg,#e53e3e,#c53030)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      cursor: deletingId === img.id ? 'not-allowed' : 'pointer',
                      marginTop: 4,
                      transition: 'background 0.2s'
                    }}
                  >
                    {deletingId === img.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <a
                    href={img.image_base64}
                    download={img.filename}
                    style={{
                      background: 'linear-gradient(90deg,#38b2ac,#319795)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      textDecoration: 'none',
                      textAlign: 'center',
                      cursor: 'pointer',
                      marginTop: 4,
                      transition: 'background 0.2s'
                    }}
                  >
                    Preview
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Modal */}
      {deleteModal.visible && (
        <div className="delete-modal" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 24px #0003',
          padding: '24px',
          width: '320px',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2d3748', marginBottom: '16px', fontSize: '1.3rem', fontWeight: 600 }}>Confirm Deletion</h3>
          <p style={{ color: '#4a5568', marginBottom: '24px', fontSize: '1rem' }}>
            Are you sure you want to delete <strong>{deleteModal.filename}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              onClick={() => setDeleteModal({ visible: false, id: null, filename: '' })}
              style={{
                background: '#edf2f7',
                color: '#2d3748',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deletingId === deleteModal.id}
              style={{
                background: deletingId === deleteModal.id ? '#e53e3e99' : '#e53e3e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: deletingId === deleteModal.id ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {deletingId === deleteModal.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
