import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaEye, FaPlus } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => { 
    fetchEvents(); 
  }, []);

  // ✅ UPDATED: Fetch events with real-time registration counts
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events`);
      const eventsData = res.data;

      // Fetch real-time registration counts for each event
      const eventsWithCounts = await Promise.all(
        eventsData.map(async (event) => {
          try {
            const slotsRes = await axios.get(
              `${API_URL}/api/registrations/slots/${event._id}`
            );
            return {
              ...event,
              registeredCount: slotsRes.data.registeredCount || 0,
              waitlistCount: slotsRes.data.waitlistCount || 0,
              remainingSlots: slotsRes.data.remainingSlots || 0,
            };
          } catch (error) {
            console.error(`Failed to fetch slots for event ${event._id}:`, error);
            // Fallback to event's stored count if API fails
            return {
              ...event,
              registeredCount: event.registeredCount || 0,
              waitlistCount: 0,
              remainingSlots: event.studentCapacity - (event.registeredCount || 0),
            };
          }
        })
      );

      setEvents(eventsWithCounts);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also remove all registrations.`)) return;
    try {
      await axios.delete(`${API_URL}/api/events/${id}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Social Event': return '#38b2ac';
      case 'Workshop': return '#ed8936';
      case 'Competition': return '#e53e3e';
      case 'Academics': return '#9f7aea';
      default: return '#667eea';
    }
  };

  const filteredEvents = events
    .filter(e => {
      const s = e.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.organisingClubName.toLowerCase().includes(searchTerm.toLowerCase());
      const c = !filterCategory || e.eventCategory === filterCategory;
      return s && c;
    })
    .sort((a, b) => {
      const now = new Date();
      const aP = new Date(a.eventDate) < now;
      const bP = new Date(b.eventDate) < now;
      if (aP && !bP) return 1;
      if (!aP && bP) return -1;
      if (!aP && !bP) return new Date(a.eventDate) - new Date(b.eventDate);
      return new Date(b.eventDate) - new Date(a.eventDate);
    });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '2px solid #0a1e8c20',
            borderRadius: '10px',
            fontSize: '14px',
            flex: 1,
            minWidth: '200px',
            fontFamily: 'inherit',
            color: '#0a1e8c'
          }}
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '2px solid #0a1e8c20',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#0a1e8c'
          }}
        >
          <option value="">All Categories</option>
          <option value="Social Event">Social Event</option>
          <option value="Workshop">Workshop</option>
          <option value="Competition">Competition</option>
          <option value="Academics">Academics</option>
          <option value="Other">Other</option>
        </select>

        <Link
          to="/create-event"
          className="btn btn-primary"
          style={{ background: '#f37021', border: 'none', color: 'white' }}
        >
          <FaPlus /> New Event
        </Link>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 style={{ color: '#0a1e8c' }}>No events found</h3>
          <p style={{ color: '#4a5b86' }}>Create your first event to get started</p>

          <Link
            to="/create-event"
            className="btn btn-primary"
            style={{ marginTop: '15px', background: '#f37021', border: 'none' }}
          >
            <FaPlus /> Create Event
          </Link>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => {
            const isPast = new Date(event.eventDate) < new Date();

            return (
              <div key={event._id} className={`event-card ${isPast ? 'past-event-card' : ''}`}>
                {event.eventPoster ? (
                  <img src={`${API_URL}${event.eventPoster}`} alt={event.eventTitle} className="event-card-poster" />
                ) : (
                  <div
                    className="event-card-no-poster"
                    style={{
                      background: `linear-gradient(135deg, #0a1e8c 0%, #08166f 100%)`
                    }}
                  >
                    🎉
                  </div>
                )}

                {isPast && <div className="past-overlay">Event Ended</div>}

                <div className="event-card-body">
                  <span
                    className="event-card-category"
                    style={{
                      backgroundColor: '#fff4ec',
                      color: '#f37021'
                    }}
                  >
                    {event.eventCategory === 'Other' ? event.customCategory : event.eventCategory}
                  </span>

                  <h3 style={{ color: '#0a1e8c' }}>{event.eventTitle}</h3>

                  <div className="event-card-info">
                    <FaCalendarAlt color="#0a1e8c" />
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>

                  <div className="event-card-info">
                    <FaClock color="#0a1e8c" />
                    {event.startTime} - {event.endTime}
                  </div>

                  <div className="event-card-info">
                    <FaMapMarkerAlt color="#0a1e8c" />
                    {event.venue}
                  </div>

                  {/* ✅ UPDATED: Show real-time registration count with waitlist */}
                  <div className="event-card-info">
                    <FaUsers color="#0a1e8c" />
                    <span>
                      {event.registeredCount || 0} / {event.studentCapacity} registered
                      {event.waitlistCount > 0 && (
                        <span style={{ color: '#f37021', marginLeft: '8px', fontSize: '12px' }}>
                          (+{event.waitlistCount} waitlist)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="event-card-info" style={{ fontSize: '13px', color: '#4a5b86' }}>
                    Organised by: {event.organisingClubName}
                  </div>

                  <div className="event-card-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ background: '#0a1e8c', border: 'none' }}
                      onClick={() => navigate(`/event/${event._id}`)}
                    >
                      <FaEye /> View
                    </button>

                    {!isPast && (
                      <button
                        className="btn btn-warning btn-sm"
                        style={{ background: '#f37021', border: 'none', color: 'white' }}
                        onClick={() => navigate(`/edit-event/${event._id}`)}
                      >
                        <FaEdit /> Edit
                      </button>
                    )}

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ background: '#dc2626', border: 'none' }}
                      onClick={() => handleDelete(event._id, event.eventTitle)}
                    >
                      <FaTrash /> Delete
                    </button>

                    {isPast && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: '#f5f8ff',
                          color: '#0a1e8c',
                          marginLeft: 'auto'
                        }}
                      >
                        ⏹️ Ended
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageEvents;