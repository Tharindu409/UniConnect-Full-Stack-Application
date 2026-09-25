import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUsers, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaTrash, FaTicketAlt } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EventRegistration = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [slotInfo, setSlotInfo] = useState(null);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [waitlistStudents, setWaitlistStudents] = useState([]);
  const [formData, setFormData] = useState({ studentName: '', studentEmail: '', contactNumber: '', specialRequests: '' });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => {
    if (selectedEventId) { fetchEventDetails(); fetchSlotInfo(); fetchRegistrations(); }
    else { setSelectedEvent(null); setSlotInfo(null); setRegisteredStudents([]); setWaitlistStudents([]); }
  }, [selectedEventId]);

    useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
      console.log('🔍 User role loaded:', user.role);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => { try { const res = await axios.get(`${API_URL}/api/events`); setEvents(res.data.filter(e => new Date(e.registrationDeadline) >= new Date())); } catch { toast.error('Failed to load events'); } };
  const fetchEventDetails = async () => { try { const res = await axios.get(`${API_URL}/api/events/${selectedEventId}`); setSelectedEvent(res.data); } catch { toast.error('Failed to load event details'); } };
  const fetchSlotInfo = async () => { try { const res = await axios.get(`${API_URL}/api/registrations/slots/${selectedEventId}`); setSlotInfo(res.data); } catch { console.error('Failed to fetch slot info'); } };
  const fetchRegistrations = async () => { try { const res = await axios.get(`${API_URL}/api/registrations/event/${selectedEventId}`); setRegisteredStudents(res.data.registered); setWaitlistStudents(res.data.waitlist); } catch { console.error('Failed to fetch registrations'); } };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') { const n = value.replace(/[^0-9]/g, ''); if (n.length <= 10) setFormData(prev => ({ ...prev, [name]: n })); return; }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId) { toast.error('Please select an event'); return; }
    if (formData.contactNumber.length !== 10) { toast.error('Please enter a valid 10-digit phone number'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/registrations`, { eventId: selectedEventId, ...formData });
      toast.success(res.data.message);
      setFormData({ studentName: '', studentEmail: '', contactNumber: '', specialRequests: '' });
      fetchSlotInfo(); fetchRegistrations();
    } catch (error) { toast.error(error.response?.data?.message || 'Registration failed'); } finally { setLoading(false); }
  };

  const handleRemoveRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to remove this registration?')) return;
    try {
      const res = await axios.delete(`${API_URL}/api/registrations/${registrationId}`);
      toast.success(res.data.message);
      if (res.data.promotedStudent) toast.info(`${res.data.promotedStudent} has been promoted from the waitlist!`);
      fetchSlotInfo(); fetchRegistrations();
    } catch { toast.error('Failed to remove registration'); }
  };

 return (
  <div>
    <div className="page-header">
      <h1 style={{ color: '#0a1e8c' }}>
        📝 {(userRole === 'CLUB_ADMIN' || userRole === 'SYSTEM_ADMIN') ? 'Event Registrations' : 'Student Event Registration'}
      </h1>
      <p style={{ color: '#4a5b86' }}>
        {(userRole === 'CLUB_ADMIN' || userRole === 'SYSTEM_ADMIN')
          ? 'View and manage event registrations'
          : 'Select an event and register'}
      </p>
    </div>

    <div className="registration-container">
      <div className="registration-form-section">
        <h2
          style={{
            marginBottom: '20px',
            color: '#0a1e8c',
            fontSize: '18px',
            fontWeight: '700',
          }}
        >
          <FaTicketAlt style={{ marginRight: '8px', color: '#f37021' }} />
          {(userRole === 'CLUB_ADMIN' || userRole === 'SYSTEM_ADMIN') ? 'Event Selection' : 'Registration Form'}
        </h2>

        <div className="form-group">
          <label style={{ color: '#0a1e8c' }}>
            Select Event <span className="required" style={{ color: '#f37021' }}>*</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            required
            style={{ color: '#0a1e8c', borderColor: '#0a1e8c20' }}
          >
            <option value="">-- Select an Event --</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.eventTitle} - {new Date(event.eventDate).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && slotInfo && (
          <div
            className="event-details-card"
            style={{
              borderColor: '#0a1e8c20',
              background: '#ffffff',
            }}
          >
            <h3 style={{ color: '#0a1e8c' }}>{selectedEvent.eventTitle}</h3>

            <div className="event-detail-row" style={{ color: '#4a5b86' }}>
              <FaCalendarAlt color="#0a1e8c" />
              <span>
                {new Date(selectedEvent.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="event-detail-row" style={{ color: '#4a5b86' }}>
              <FaClock color="#0a1e8c" />
              <span>
                {selectedEvent.startTime} - {selectedEvent.endTime}
              </span>
            </div>

            <div className="event-detail-row" style={{ color: '#4a5b86' }}>
              <FaMapMarkerAlt color="#0a1e8c" />
              <span>{selectedEvent.venue}</span>
            </div>

            <div className="slots-info">
              <span
                className={`slot-badge ${
                  slotInfo.remainingSlots > 0 ? 'slot-available' : 'slot-full'
                }`}
                style={{
                  background:
                    slotInfo.remainingSlots > 0 ? '#f5f8ff' : '#fff4ec',
                  color:
                    slotInfo.remainingSlots > 0 ? '#0a1e8c' : '#f37021',
                  border: `1px solid ${
                    slotInfo.remainingSlots > 0 ? '#0a1e8c20' : '#f3702120'
                  }`,
                }}
              >
                {slotInfo.remainingSlots > 0
                  ? `${slotInfo.remainingSlots} slots remaining`
                  : 'Event Full'}
              </span>

              <span
                className="slot-badge slot-waitlist-count"
                style={{
                  background: '#f5f8ff',
                  color: '#0a1e8c',
                  border: '1px solid #0a1e8c20',
                }}
              >
                {slotInfo.registeredCount}/{slotInfo.totalCapacity} registered
              </span>

              {slotInfo.waitlistCount > 0 && (
                <span
                  className="slot-badge slot-waitlist-count"
                  style={{
                    background: '#fff4ec',
                    color: '#f37021',
                    border: '1px solid #f3702120',
                  }}
                >
                  {slotInfo.waitlistCount} in waitlist
                </span>
              )}
            </div>
          </div>
        )}

        {selectedEventId && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ color: '#0a1e8c' }}>
                Student Name <span className="required" style={{ color: '#f37021' }}>*</span>
              </label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                style={{ color: '#0a1e8c', borderColor: '#0a1e8c20' }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#0a1e8c' }}>
                Student Email <span className="required" style={{ color: '#f37021' }}>*</span>
              </label>
              <input
                type="email"
                name="studentEmail"
                value={formData.studentEmail}
                onChange={handleChange}
                placeholder="Enter email address"
                required
                style={{ color: '#0a1e8c', borderColor: '#0a1e8c20' }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#0a1e8c' }}>
                Contact Number <span className="required" style={{ color: '#f37021' }}>*</span>
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Enter 10-digit contact number"
                required
                maxLength="10"
                style={{ color: '#0a1e8c', borderColor: '#0a1e8c20' }}
              />
              {formData.contactNumber.length > 0 && formData.contactNumber.length < 10 && (
                <p
                  style={{
                    color: '#dc2626',
                    fontSize: '12px',
                    marginTop: '5px',
                    fontWeight: '600',
                  }}
                >
                  ⚠️ Phone number must be 10 digits
                </p>
              )}
              <p
                style={{
                  color: '#4a5b86',
                  fontSize: '11px',
                  marginTop: '3px',
                }}
              >
                {formData.contactNumber.length}/10 digits
              </p>
            </div>


            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                background: '#f37021',
                border: 'none',
                color: '#ffffff',
              }}
            >
              <FaUserPlus /> {loading ? 'Registering...' : 'Register for Event'}
            </button>
          </form>
        )}
      </div>

      <div className="registration-lists-section">
        <div className="registration-list">
          <h3 className="registered-title" style={{ color: '#0a1e8c' }}>
            <FaUsers style={{ color: '#0a1e8c' }} /> Registered Students ({registeredStudents.length})
          </h3>

          {registeredStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: '25px' }}>
              <p style={{ color: '#4a5b86' }}>No students registered yet</p>
            </div>
          ) : (
            registeredStudents.map((reg, i) => (
              <div key={reg._id} className="student-item">
                <div className="student-info">
                  <h4 style={{ color: '#0a1e8c' }}>
                    {i + 1}. {reg.studentName}
                  </h4>
                  <p style={{ color: '#4a5b86' }}>
                    {reg.studentEmail} | {reg.contactNumber}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className="status-badge status-registered"
                    style={{
                      background: '#f5f8ff',
                      color: '#0a1e8c',
                      border: '1px solid #0a1e8c20',
                    }}
                  >
                    Registered
                  </span>

                  {(userRole === 'CLUB_ADMIN' || userRole === 'SYSTEM_ADMIN') && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveRegistration(reg._id)}
                      title="Remove registration"
                      style={{ color: '#f37021' }}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="registration-list">
          <h3 className="waitlist-title" style={{ color: '#f37021' }}>
            <FaClock style={{ color: '#f37021' }} /> Waiting List ({waitlistStudents.length})
          </h3>

          {waitlistStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: '25px' }}>
              <p style={{ color: '#4a5b86' }}>No students in waitlist</p>
            </div>
          ) : (
            waitlistStudents.map((reg, i) => (
              <div key={reg._id} className="student-item">
                <div className="student-info">
                  <h4 style={{ color: '#0a1e8c' }}>
                    {i + 1}. {reg.studentName}
                  </h4>
                  <p style={{ color: '#4a5b86' }}>
                    {reg.studentEmail} | {reg.contactNumber}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className="status-badge status-waitlist"
                    style={{
                      background: '#fff4ec',
                      color: '#f37021',
                      border: '1px solid #f3702120',
                    }}
                  >
                    Waitlist #{i + 1}
                  </span>

                  {(userRole === 'CLUB_ADMIN' || userRole === 'SYSTEM_ADMIN') && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveRegistration(reg._id)}
                      title="Remove from waitlist"
                      style={{ color: '#f37021' }}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default EventRegistration;