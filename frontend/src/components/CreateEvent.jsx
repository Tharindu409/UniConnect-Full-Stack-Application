import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaTimes, FaCloudUploadAlt } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    eventTitle: '', description: '', eventCategory: '', customCategory: '',
    eventDate: '', startTime: '', endTime: '', venue: '', studentCapacity: '',
    organisingClubName: '', organiserName: '', organiserPhone: '', registrationDeadline: ''
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [deadlineError, setDeadlineError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (isEditing) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/${id}`);
      const event = res.data;
      setFormData({
        eventTitle: event.eventTitle, description: event.description,
        eventCategory: event.eventCategory, customCategory: event.customCategory || '',
        eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
        startTime: event.startTime, endTime: event.endTime, venue: event.venue,
        studentCapacity: event.studentCapacity.toString(),
        organisingClubName: event.organisingClubName, organiserName: event.organiserName,
        organiserPhone: event.organiserPhone,
        registrationDeadline: event.registrationDeadline ? event.registrationDeadline.split('T')[0] : ''
      });
      if (event.eventPoster) setPosterPreview(`${API_URL}${event.eventPoster}`);
    } catch (error) {
      toast.error('Failed to fetch event details');
      navigate('/manage-events');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'organiserPhone') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      if (numbersOnly.length > 10) { setPhoneError('Phone number cannot exceed 10 digits'); return; }
      if (numbersOnly.length < 10 && numbersOnly.length > 0) { setPhoneError('Phone number must be 10 digits'); }
      else { setPhoneError(''); }
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      return;
    }
    if (name === 'registrationDeadline') {
      if (formData.eventDate && value > formData.eventDate) {
        setDeadlineError('Registration deadline cannot be after the event date.');
        setFormData(prev => ({ ...prev, [name]: value })); return;
      } else { setDeadlineError(''); }
    }
    if (name === 'eventDate') {
      if (formData.registrationDeadline && formData.registrationDeadline > value) {
        setDeadlineError('Registration deadline cannot be after the event date.');
      } else { setDeadlineError(''); }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return; }
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.registrationDeadline > formData.eventDate) { setDeadlineError('Registration deadline cannot be after the event date.'); toast.error('Please fix the registration deadline'); return; }
    if (formData.organiserPhone.length !== 10) { setPhoneError('Phone number must be exactly 10 digits'); toast.error('Please enter a valid 10-digit phone number'); return; }
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) { toast.error('End time must be after start time'); return; }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (posterFile) data.append('eventPoster', posterFile);

      if (isEditing) {
        await axios.put(`${API_URL}/api/events/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/events`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event created successfully!');
      }
      navigate('/manage-events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setFormData({ eventTitle: '', description: '', eventCategory: '', customCategory: '', eventDate: '', startTime: '', endTime: '', venue: '', studentCapacity: '', organisingClubName: '', organiserName: '', organiserPhone: '', registrationDeadline: '' });
    setPosterFile(null); setPosterPreview(''); setDeadlineError(''); setPhoneError('');
  };

  return (
    <div>
      <div className="page-header">
        <h1>{isEditing ? 'Edit Event' : 'Create New Event'}</h1>
        <p>{isEditing ? 'Update the event details below' : 'Fill in the details to create a new event'}</p>
      </div>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Event Title <span className="required">*</span></label>
              <input type="text" name="eventTitle" value={formData.eventTitle} onChange={handleChange} placeholder="Enter event title" required />
            </div>
            <div className="form-group full-width">
              <label>Description <span className="required">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter event description" required rows="4" />
            </div>
            <div className="form-group">
              <label>Event Category <span className="required">*</span></label>
              <select name="eventCategory" value={formData.eventCategory} onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Social Event">Social Event</option>
                <option value="Workshop">Workshop</option>
                <option value="Competition">Competition</option>
                <option value="Academics">Academics</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.eventCategory === 'Other' ? (
              <div className="form-group">
                <label>Specify Category <span className="required">*</span></label>
                <input type="text" name="customCategory" value={formData.customCategory} onChange={handleChange} placeholder="Enter custom category" required />
              </div>
            ) : (<div className="form-group"></div>)}
            <div className="form-group full-width">
              <label>Event Date <span className="required">*</span></label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>Start Time <span className="required">*</span></label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Time <span className="required">*</span></label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Venue <span className="required">*</span></label>
              <input type="text" name="venue" value={formData.venue} onChange={handleChange} placeholder="Enter venue" required />
            </div>
            <div className="form-group">
              <label>Student Capacity <span className="required">*</span></label>
              <input type="number" name="studentCapacity" value={formData.studentCapacity} onChange={handleChange} placeholder="Enter maximum capacity" required min="1" />
            </div>
            <div className="form-group">
              <label>Organising Club Name <span className="required">*</span></label>
              <input type="text" name="organisingClubName" value={formData.organisingClubName} onChange={handleChange} placeholder="Enter club name" required />
            </div>
            <div className="form-group">
              <label>Organiser Name <span className="required">*</span></label>
              <input type="text" name="organiserName" value={formData.organiserName} onChange={handleChange} placeholder="Enter organiser name" required />
            </div>
            <div className="form-group">
              <label>Organiser Phone <span className="required">*</span></label>
              <input type="tel" name="organiserPhone" value={formData.organiserPhone} onChange={handleChange} placeholder="Enter 10-digit phone number" required maxLength="10" />
              {phoneError && <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '5px' }}>⚠️ {phoneError}</p>}
              <p style={{ color: '#a0aec0', fontSize: '12px', marginTop: '3px' }}>{formData.organiserPhone.length}/10 digits</p>
            </div>
            <div className="form-group">
              <label>Registration Deadline <span className="required">*</span></label>
              <input type="date" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} max={formData.eventDate || ''} />
              {deadlineError && <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '5px', padding: '8px 12px', backgroundColor: '#fff5f5', borderRadius: '6px', border: '1px solid #fed7d7' }}>⚠️ {deadlineError}</p>}
              {!formData.eventDate && <p style={{ color: '#ed8936', fontSize: '12px', marginTop: '3px' }}>ℹ️ Please select event date first</p>}
            </div>
            <div className="form-group full-width">
              <label>Event Poster (Optional)</label>
              <div className="file-upload-area" onClick={() => fileInputRef.current.click()}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                <div className="upload-icon"><FaCloudUploadAlt /></div>
                <p>Click to upload event poster</p>
                <p style={{ fontSize: '12px', color: '#a0aec0' }}>JPEG, PNG, GIF, WebP (Max 5MB)</p>
              </div>
              {posterPreview && (
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                  <img src={posterPreview} alt="Preview" className="image-preview" />
                  <br />
                  <button type="button" onClick={() => { setPosterFile(null); setPosterPreview(''); }} className="btn btn-danger btn-sm" style={{ marginTop: '10px' }}>Remove Image</button>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <FaSave /> {isEditing ? 'Update Event' : 'Create Event'}
              </button>
              <button type="button" className="btn btn-danger" onClick={isEditing ? () => navigate('/manage-events') : handleReset}>
                <FaTimes /> {isEditing ? 'Cancel' : 'Reset'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;