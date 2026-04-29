import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminCourseService } from '../services/adminCourseService';
import Toast from '../components/common/Toast';
import './AdminAddCourse.css';

const STEP_TITLES = [
  'Basic Information',
  'Media & Images',
  'Instructor, Pricing & Tags',
];

export default function AdminAddCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    summary: '',
    level: 'beginner',
    status: 'draft',
    language: 'English',
    instructor: '',
    price: 0,
    isFree: true,
    thumbnailUrl: '',
    bannerUrl: '',
    tags: [],
  });

  const [previews, setPreviews] = useState({
    thumbnail: '',
    banner: '',
  });
  const [imageErrors, setImageErrors] = useState({
    thumbnail: '',
    banner: '',
  });
  const [dragOver, setDragOver] = useState({
    thumbnail: false,
    banner: false,
  });

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
    }));
  };

  const validateAndSetImage = (file, imageType) => {
    if (!file) return;

    const isJpgOrPng = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    if (!isJpgOrPng) {
      setImageErrors((prev) => ({ ...prev, [imageType]: 'Only JPG/PNG allowed' }));
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageErrors((prev) => ({ ...prev, [imageType]: 'File too large (Max 5MB)' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      if (imageType === 'thumbnail') {
        setFormData((prev) => ({ ...prev, thumbnailUrl: dataUrl }));
        setPreviews((prev) => ({ ...prev, thumbnail: dataUrl }));
      } else {
        setFormData((prev) => ({ ...prev, bannerUrl: dataUrl }));
        setPreviews((prev) => ({ ...prev, banner: dataUrl }));
      }
      setImageErrors((prev) => ({ ...prev, [imageType]: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e, imageType) => {
    const file = e.target.files?.[0];
    validateAndSetImage(file, imageType);
  };

  const handleDrop = (e, imageType) => {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [imageType]: false }));
    const file = e.dataTransfer.files?.[0];
    validateAndSetImage(file, imageType);
  };

  const handleDragOver = (e, imageType) => {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [imageType]: true }));
  };

  const handleDragLeave = (imageType) => {
    setDragOver((prev) => ({ ...prev, [imageType]: false }));
  };

  const handleClearImage = (imageType) => {
    if (imageType === 'thumbnail') {
      setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
      setPreviews((prev) => ({ ...prev, thumbnail: '' }));
    } else {
      setFormData((prev) => ({ ...prev, bannerUrl: '' }));
      setPreviews((prev) => ({ ...prev, banner: '' }));
    }
    setImageErrors((prev) => ({ ...prev, [imageType]: '' }));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      showToast('Course title is required', 'error');
      return false;
    }
    if (!formData.description.trim()) {
      showToast('Course description is required', 'error');
      return false;
    }
    if (!formData.instructor.trim()) {
      showToast('Instructor name is required', 'error');
      return false;
    }
    if (!formData.isFree && formData.price <= 0) {
      showToast('Please enter a valid price for paid courses', 'error');
      return false;
    }
    return true;
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.title.trim()) {
        showToast('Course title is required', 'error');
        return false;
      }
      if (!formData.description.trim()) {
        showToast('Course description is required', 'error');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.instructor.trim()) {
        showToast('Instructor name is required', 'error');
        return false;
      }
      if (!formData.isFree && formData.price <= 0) {
        showToast('Please enter a valid price for paid courses', 'error');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        price: formData.isFree ? 0 : formData.price,
      };

      const response = await adminCourseService.createCourse(payload);
      showToast('Course created successfully!', 'success');

      setTimeout(() => {
        const createdCourseId = response?.data?._id || response?.data?.id;
        if (createdCourseId) {
          navigate(`/admin/courses/${createdCourseId}`, { replace: true });
          return;
        }
        navigate('/admin/courses', {
          replace: true,
          state: { refreshAt: Date.now(), createdCourseId: response?.data?._id },
        });
      }, 1500);
    } catch (error) {
      showToast(error?.message || 'Error creating course', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/courses');
  };

  return (
    <div className="admin-add-course">
      {/* Main Content */}
      <div className="add-course-container">
        <div className="stepper-card">
          {STEP_TITLES.map((title, index) => {
            const stateClass = index < currentStep ? 'completed' : index === currentStep ? 'active' : '';
            return (
              <button
                key={title}
                type="button"
                className={`stepper-item ${stateClass}`}
                onClick={() => setCurrentStep(index)}
              >
                <span className="step-index">{index + 1}</span>
                <span className="step-title">{title}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="course-creation-form">
          {currentStep === 0 && (
            <div className="form-card">
              <div className="card-header">
                <h2>Basic Information</h2>
                <p>Foundation details about your course</p>
              </div>

              <div className="form-content">
                <div className="form-group full-width">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Advanced React Development 2024"
                    required
                    className="form-input"
                    maxLength="220"
                  />
                  <span className="char-count">{formData.title.length}/220</span>
                </div>

                <div className="form-group full-width">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="Optional subtitle - max 220 characters"
                    className="form-input"
                    maxLength="220"
                  />
                  <span className="char-count">{formData.subtitle.length}/220</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Level *</label>
                    <select name="level" value={formData.level} onChange={handleInputChange} className="form-select">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="form-select">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed description of what students will learn..."
                    required
                    className="form-textarea"
                    rows="5"
                    maxLength="20000"
                  />
                  <span className="char-count">{formData.description.length}/20000</span>
                </div>

              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="form-card">
              <div className="card-header">
                <h2>Media & Images</h2>
                <p>Add thumbnail and banner visuals for your course page</p>
              </div>

              <div className="form-content">
                <div className="media-grid">
                  <div className="media-item">
                    <label>Thumbnail Image</label>
                    <div
                      className={`image-preview-container dropzone ${dragOver.thumbnail ? 'drag-over' : ''}`}
                      onDrop={(e) => handleDrop(e, 'thumbnail')}
                      onDragOver={(e) => handleDragOver(e, 'thumbnail')}
                      onDragLeave={() => handleDragLeave('thumbnail')}
                    >
                      {previews.thumbnail && (
                        <button
                          type="button"
                          className="clear-image-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearImage('thumbnail');
                          }}
                          aria-label="Remove thumbnail image"
                          title="Remove image"
                        >
                          x
                        </button>
                      )}
                      {previews.thumbnail ? (
                        <img src={previews.thumbnail} alt="Thumbnail" className="image-preview" />
                      ) : (
                        <div className="image-placeholder">
                          <span>Drop JPG/PNG here</span>
                          <p>or click to upload</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        className="image-file-input"
                        onChange={(e) => handleImageFileChange(e, 'thumbnail')}
                      />
                    </div>
                    {imageErrors.thumbnail && <p className="image-error">{imageErrors.thumbnail}</p>}
                  </div>

                  <div className="media-item">
                    <label>Banner Image</label>
                    <div
                      className={`image-preview-container banner dropzone ${dragOver.banner ? 'drag-over' : ''}`}
                      onDrop={(e) => handleDrop(e, 'banner')}
                      onDragOver={(e) => handleDragOver(e, 'banner')}
                      onDragLeave={() => handleDragLeave('banner')}
                    >
                      {previews.banner && (
                        <button
                          type="button"
                          className="clear-image-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearImage('banner');
                          }}
                          aria-label="Remove banner image"
                          title="Remove image"
                        >
                          x
                        </button>
                      )}
                      {previews.banner ? (
                        <img src={previews.banner} alt="Banner" className="image-preview" />
                      ) : (
                        <div className="image-placeholder">
                          <span>Drop JPG/PNG here</span>
                          <p>or click to upload</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        className="image-file-input"
                        onChange={(e) => handleImageFileChange(e, 'banner')}
                      />
                    </div>
                    {imageErrors.banner && <p className="image-error">{imageErrors.banner}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <>
              <div className="form-card">
                <div className="card-header">
                  <h2>Instructor & Pricing</h2>
                  <p>Define ownership and course pricing details</p>
                </div>

                <div className="form-content">
                  <div className="form-group full-width">
                    <label>Instructor Name *</label>
                    <input
                      type="text"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleInputChange}
                      placeholder="Your name or team name"
                      required
                      className="form-input"
                      maxLength="120"
                    />
                  </div>

                  <div className="pricing-section">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="isFree"
                        name="isFree"
                        checked={formData.isFree}
                        onChange={handleInputChange}
                        className="form-checkbox"
                      />
                      <label htmlFor="isFree" className="checkbox-label">
                        This is a Free Course
                      </label>
                    </div>

                    {!formData.isFree && (
                      <div className="form-group price-input">
                        <label>Course Price ($)</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="form-input"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="card-header">
                  <h2>Tags & Keywords</h2>
                  <p>Add discovery tags students can search for</p>
                </div>

                <div className="form-content">
                  <div className="tags-input-section">
                    <div className="tag-input-group">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleTagInputKeyPress}
                        placeholder="Type a tag and press Enter..."
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="btn-add-tag"
                        onClick={handleAddTag}
                      >
                        + Add Tag
                      </button>
                    </div>

                    <div className="tags-display">
                      {formData.tags.length === 0 ? (
                        <p className="no-tags">No tags added yet</p>
                      ) : (
                        formData.tags.map((tag) => (
                          <div key={tag} className="tag-badge">
                            <span>{tag}</span>
                            <button
                              type="button"
                              className="tag-remove"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            {currentStep > 0 && (
              <button type="button" className="btn-secondary" onClick={handlePreviousStep}>
                Back
              </button>
            )}
            {currentStep < STEP_TITLES.length - 1 ? (
              <button type="button" className="btn-primary" onClick={handleNextStep}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
