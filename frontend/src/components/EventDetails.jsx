import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaPhone, FaUser, FaBuilding, FaArrowLeft, FaUserPlus } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [slotInfo, setSlotInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
    fetchSlotInfo();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/${id}`);
      setEvent(res.data);
    } catch {
      toast.error('Failed to load event details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotInfo = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/registrations/slots/${id}`);
      setSlotInfo(res.data);
    } catch {
      console.error('Failed to fetch slot info');
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Social Event':
        return '#38b2ac';
      case 'Workshop':
        return '#ed8936';
      case 'Competition':
        return '#e53e3e';
      case 'Club Meeting':
        return '#9f7aea';
      default:
        return '#667eea';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) return null;

  const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();
  const isPast = new Date(event.eventDate) < new Date();

  return (
  <div className="event-details-page">
    <button
      className="btn btn-primary btn-sm"
      onClick={() => navigate(-1)}
      style={{ marginBottom: '20px', backgroundColor: '#F36C21', borderColor: '#F36C21' }}
    >
      <FaArrowLeft /> Back
    </button>

    <div className="form-container">
      {event.eventPoster && (
        <img
          src={`${API_URL}${event.eventPoster}`}
          alt={event.eventTitle}
          className="event-poster-large"
        />
      )}

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span
          className="event-card-category"
          style={{
            fontSize: '14px',
            padding: '6px 18px',
            backgroundColor: `${getCategoryColor(event.eventCategory)}20`,
            color: getCategoryColor(event.eventCategory),
          }}
        >
          {event.eventCategory === 'Other' ? event.customCategory : event.eventCategory}
        </span>

        <h1 style={{ marginTop: '15px', fontSize: '28px', color: '#0B1E8A' }}>
          {event.eventTitle}
        </h1>

        {isPast && (
          <span
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '5px 15px',
              backgroundColor: '#0B1E8A20',
              color: '#0B1E8A',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            Event Completed
          </span>
        )}
      </div>

      <p
        style={{
          color: '#555',
          lineHeight: 1.8,
          marginBottom: '25px',
          fontSize: '15px',
        }}
      >
        {event.description}
      </p>

      <div className="info-grid">
        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaCalendarAlt /> Event Date</label>
          <p>{new Date(event.eventDate).toLocaleDateString()}</p>
        </div>

        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaClock /> Time</label>
          <p>{event.startTime} - {event.endTime}</p>
        </div>

        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaMapMarkerAlt /> Venue</label>
          <p>{event.venue}</p>
        </div>

        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaUsers /> Capacity</label>
          <p>
            {slotInfo
              ? `${slotInfo.registeredCount}/${slotInfo.totalCapacity}`
              : event.studentCapacity}{' '}
            students
          </p>
        </div>

        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaBuilding /> Organising Club</label>
          <p>{event.organisingClubName}</p>
        </div>

        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaUser /> Organiser</label>
          <p>{event.organiserName}</p>
        </div>

        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaPhone /> Contact</label>
          <p>{event.organiserPhone}</p>
        </div>

        <div className="info-item">
          <label style={{ color: '#0B1E8A' }}><FaCalendarAlt /> Registration Deadline</label>
          <p style={{ color: isDeadlinePassed ? '#e53e3e' : '#F36C21' }}>
            {new Date(event.registrationDeadline).toLocaleDateString()}
            {isDeadlinePassed && ' (Closed)'}
          </p>
        </div>
      </div>

      {slotInfo && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div className="slots-info" style={{ justifyContent: 'center' }}>
            <span
              className={`slot-badge ${
                slotInfo.remainingSlots > 0 ? 'slot-available' : 'slot-full'
              }`}
            >
              {slotInfo.remainingSlots > 0
                ? `${slotInfo.remainingSlots} slots available`
                : 'Event Full'}
            </span>

            {slotInfo.waitlistCount > 0 && (
              <span className="slot-badge slot-waitlist-count">
                {slotInfo.waitlistCount} in waitlist
              </span>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginTop: '25px',
        }}
      >
        {!isDeadlinePassed && !isPast && (
          <Link
            to="/event-registration"
            className="btn"
            style={{ backgroundColor: '#F36C21', color: '#fff' }}
          >
            <FaUserPlus /> Register for this Event
          </Link>
        )}
      </div>
    </div>
  </div>
);
};

export default EventDetails;