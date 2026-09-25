import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaEye, FaSearch } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StudentEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTime, setFilterTime] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events`);
      const eventsData = res.data;

      // ✅ Fetch real-time registration counts for each event
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
    } catch (error) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events
    .filter((e) => {
      const s =
        e.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.organisingClubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchTerm.toLowerCase());

      const c = !filterCategory || e.eventCategory === filterCategory;

      const now = new Date();
      const ed = new Date(e.eventDate);

      let t = true;
      if (filterTime === 'upcoming') t = ed >= now;
      if (filterTime === 'past') t = ed < now;

      return s && c && t;
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
      <div
        className="loading"
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4a5b86',
        }}
      >
        <div
          className="spinner"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid #f37021',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '12px',
          }}
        />
        <p style={{ fontWeight: 600 }}>Loading events...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '12px 20px 24px' }}>
      {/* Filters */}
      <div
        className="student-events-filters"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(10,30,140,0.18)',
          padding: '16px',
          borderRadius: '18px',
          marginBottom: '16px',
          boxShadow: '0 6px 20px rgba(10,30,140,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div className="search-box" style={{ position: 'relative', flex: '1 1 420px' }}>
            <FaSearch
              className="search-icon"
              style={{
                color: '#0a1e8c',
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="Search events, clubs, venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: '1px solid rgba(10,30,140,0.18)',
                padding: '0 14px 0 42px',
                outline: 'none',
                fontSize: '15px',
                color: '#0a1e8c',
                background: '#ffffff',
              }}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
            style={{
              height: '48px',
              minWidth: '180px',
              borderRadius: '14px',
              border: '1px solid rgba(10,30,140,0.18)',
              color: '#0a1e8c',
              background: '#ffffff',
              padding: '0 14px',
              fontSize: '15px',
              outline: 'none',
            }}
          >
            <option value="">All Categories</option>
            <option value="Social Event">Social Event</option>
            <option value="Workshop">Workshop</option>
            <option value="Competition">Competition</option>
            <option value="Academics">Academics</option>
            <option value="Other">Other</option>
          </select>

          <div
            className="time-filter-btns"
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(10,30,140,0.18)',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#ffffff',
            }}
          >
            {['all', 'upcoming', 'past'].map((t) => (
              <button
                key={t}
                className={`time-btn ${filterTime === t ? 'active' : ''}`}
                onClick={() => setFilterTime(t)}
                style={{
                  minWidth: '88px',
                  height: '48px',
                  padding: '0 18px',
                  background: filterTime === t ? '#0a1e8c' : '#ffffff',
                  color: filterTime === t ? '#ffffff' : '#0a1e8c',
                  border: 'none',
                  borderRight:
                    t !== 'past' ? '1px solid rgba(10,30,140,0.12)' : 'none',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <div
        style={{
          margin: '0 0 18px',
          color: '#4a5b86',
          fontWeight: 600,
          fontSize: '15px',
        }}
      >
        Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
      </div>

      {/* Empty */}
      {filteredEvents.length === 0 ? (
        <div
          className="empty-state"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(10,30,140,0.18)',
            borderRadius: '20px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 6px 20px rgba(10,30,140,0.06)',
          }}
        >
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>🔍</div>
          <h3 style={{ color: '#0a1e8c', marginBottom: '8px', fontSize: '22px' }}>
            No events found
          </h3>
          <p style={{ color: '#4a5b86' }}>Try changing your search or filters</p>
        </div>
      ) : (
        <div
          className="events-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredEvents.map((event) => {
            const isPast = new Date(event.eventDate) < new Date();

            return (
              <div
                key={event._id}
                className="event-card"
                style={{
                  position: 'relative', // ✅ For positioning badge
                  background: '#ffffff',
                  border: '1px solid rgba(10,30,140,0.18)',
                  boxShadow: '0 8px 24px rgba(10,30,140,0.08)',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  opacity: isPast ? 0.7 : 1, // ✅ Fade past events
                  filter: isPast ? 'grayscale(30%)' : 'none', // ✅ Slight desaturation
                  transition: 'all 0.3s ease',
                }}
              >
                {/* ✅ Event Ended Badge */}
                {isPast && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(74, 91, 134, 0.95)',
                      color: '#ffffff',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    Event Ended
                  </div>
                )}

                {event.eventPoster ? (
                  <img
                    src={`${API_URL}${event.eventPoster}`}
                    alt={event.eventTitle}
                    className="event-card-poster"
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    className="event-card-no-poster"
                    style={{
                      height: '220px',
                      background: isPast
                        ? 'linear-gradient(135deg, #6b7bb5, #4a5b86)' // ✅ Muted gradient for past events
                        : 'linear-gradient(135deg, #0a1e8c, #08166f)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '42px',
                      color: '#ffffff',
                    }}
                  >
                    {isPast ? '📅' : '🎉'}
                  </div>
                )}

                <div className="event-card-body" style={{ padding: '18px 18px 20px' }}>
                  <span
                    className="event-card-category"
                    style={{
                      display: 'inline-block',
                      marginBottom: '12px',
                      padding: '7px 12px',
                      borderRadius: '999px',
                      background: isPast ? '#e8ecf3' : '#fff4ec', // ✅ Muted background for past
                      color: isPast ? '#6b7bb5' : '#f37021',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {event.eventCategory}
                  </span>

                  <h3
                    style={{
                      color: isPast ? '#6b7bb5' : '#0a1e8c', // ✅ Muted title for past
                      fontSize: '30px',
                      fontWeight: 800,
                      margin: '0 0 14px',
                      lineHeight: 1.2,
                    }}
                  >
                    {event.eventTitle}
                  </h3>

                  <div
                    className="event-card-info"
                    style={{
                      color: '#4a5b86',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '10px',
                      fontSize: '15px',
                    }}
                  >
                    <FaCalendarAlt color={isPast ? '#6b7bb5' : '#0a1e8c'} />
                    {new Date(event.eventDate).toLocaleDateString()}
                  </div>

                  <div
                    className="event-card-info"
                    style={{
                      color: '#4a5b86',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '10px',
                      fontSize: '15px',
                    }}
                  >
                    <FaClock color={isPast ? '#6b7bb5' : '#0a1e8c'} />
                    {event.startTime} - {event.endTime}
                  </div>

                  <div
                    className="event-card-info"
                    style={{
                      color: '#4a5b86',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '10px',
                      fontSize: '15px',
                    }}
                  >
                    <FaMapMarkerAlt color={isPast ? '#6b7bb5' : '#0a1e8c'} />
                    {event.venue}
                  </div>

                  {/* ✅ Updated registration count display */}
                  <div
                    className="event-card-info"
                    style={{
                      color: '#4a5b86',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '10px',
                      fontSize: '15px',
                    }}
                  >
                    <FaUsers color={isPast ? '#6b7bb5' : '#0a1e8c'} />
                    <span>
                      {event.registeredCount || 0} / {event.studentCapacity}
                      {event.waitlistCount > 0 && (
                        <span style={{ color: isPast ? '#6b7bb5' : '#f37021', marginLeft: '8px' }}>
                          (+{event.waitlistCount} waitlist)
                        </span>
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#6b7bb5',
                      marginBottom: '16px',
                      fontWeight: 600,
                    }}
                  >
                    By: {event.organisingClubName}
                  </div>

                  <div
                    className="event-card-actions"
                    style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                  >
                    <button
                      className="btn btn-primary btn-sm"
                      style={{
                        background: isPast ? '#6b7bb5' : '#0a1e8c', // ✅ Muted button for past
                        border: 'none',
                        color: '#ffffff',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/event/${event._id}`)}
                    >
                      <FaEye /> View
                    </button>

                    {!isPast && (
                      <button
                        className="btn btn-success btn-sm"
                        style={{
                          background: '#f37021',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/event-registration?eventId=${event._id}`)}
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .events-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(10,30,140,0.12) !important;
        }
      `}</style>
    </div>
  );
};

export default StudentEvents;