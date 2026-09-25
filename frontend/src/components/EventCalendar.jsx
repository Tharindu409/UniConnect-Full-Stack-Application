import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events`);
      setEvents(res.data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
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
      case 'Academics':
        return '#9f7aea';
      default:
        return '#667eea';
    }
  };

  const getCategoryBgColor = (cat) => {
    switch (cat) {
      case 'Social Event':
        return '#fff4ec';
      case 'Workshop':
        return '#eef4ff';
      case 'Competition':
        return '#fff4ec';
      case 'Academics':
        return '#eef4ff';
      default:
        return '#eef4ff';
    }
  };

  const getMonthName = (d) =>
    d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDaysInMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const goToNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return events.filter((event) => {
      const ed = new Date(event.eventDate);
      return (
        `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(
          ed.getDate()
        ).padStart(2, '0')}` === dateStr
      );
    });
  };

  const isToday = (day) => {
    const t = new Date();
    return (
      day === t.getDate() &&
      currentDate.getMonth() === t.getMonth() &&
      currentDate.getFullYear() === t.getFullYear()
    );
  };

  const getMonthEvents = () =>
    events
      .filter((e) => {
        const d = new Date(e.eventDate);
        return (
          d.getMonth() === currentDate.getMonth() &&
          d.getFullYear() === currentDate.getFullYear()
        );
      })
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  const buildCalendar = () => {
    const days = [];

    for (let i = 0; i < getFirstDayOfMonth(currentDate); i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= getDaysInMonth(currentDate); day++) {
      const dayEvents = getEventsForDate(day);
      const todayClass = isToday(day) ? 'today' : '';

      days.push(
        <div
          key={day}
          className={`calendar-day ${todayClass} ${dayEvents.length > 0 ? 'has-events' : ''}`}
        >
          <span className={`day-number ${todayClass}`}>{day}</span>

          <div className="day-events">
            {dayEvents.map((event) => (
              <div
                key={event._id}
                className="calendar-event-dot"
                onClick={() => navigate(`/event/${event._id}`)}
                style={{
                  backgroundColor: getCategoryBgColor(event.eventCategory),
                  borderLeft: `4px solid ${getCategoryColor(event.eventCategory)}`,
                }}
                title={`${event.eventTitle} | ${event.startTime} - ${event.endTime} | ${event.venue}`}
              >
                <span className="event-dot-text">{event.eventTitle}</span>
                <span className="event-dot-time">{event.startTime}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  const monthEvents = getMonthEvents();

  return (
    <div>
      <div className="calendar-legend">
        {[
          { label: 'Social Event', color: '#38b2ac' },
          { label: 'Workshop', color: '#ed8936' },
          { label: 'Competition', color: '#e53e3e' },
          { label: 'Academics', color: '#9f7aea' },
          { label: 'Other', color: '#667eea' },
        ].map((item) => (
          <div key={item.label} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: item.color }}></div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="calendar-layout">
        <div className="custom-calendar-container">
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
              <FaChevronLeft />
            </button>
            <h2 className="calendar-month-title">{getMonthName(currentDate)}</h2>
            <button className="calendar-nav-btn" onClick={goToNextMonth}>
              <FaChevronRight />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="calendar-weekday">
                {d}
              </div>
            ))}
          </div>

          <div className="calendar-grid">{buildCalendar()}</div>
        </div>

        <div className="month-events-sidebar">
          <div className="sidebar-header">
            <h3>Events in {currentDate.toLocaleDateString('en-US', { month: 'long' })}</h3>
            <span className="event-count-badge">{monthEvents.length} events</span>
          </div>

          <div className="sidebar-events-list">
            {monthEvents.length === 0 ? (
              <div className="no-events-sidebar">
                <div className="no-events-icon">📅</div>
                <p>No events this month</p>
              </div>
            ) : (
              monthEvents.map((event) => (
                <div
                  key={event._id}
                  className="sidebar-event-item"
                  onClick={() => navigate(`/event/${event._id}`)}
                  style={{
                    borderLeft: `5px solid ${getCategoryColor(event.eventCategory)}`,
                    backgroundColor: getCategoryBgColor(event.eventCategory),
                  }}
                >
                  <div
                    className="sidebar-event-date-box"
                    style={{ backgroundColor: getCategoryColor(event.eventCategory) }}
                  >
                    <span className="sidebar-event-day">
                      {new Date(event.eventDate).getDate()}
                    </span>
                    <span className="sidebar-event-weekday">
                      {new Date(event.eventDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                      })}
                    </span>
                  </div>

                  <div className="sidebar-event-info">
                    <h4>{event.eventTitle}</h4>
                    <p className="sidebar-event-time">
                      🕐 {event.startTime} - {event.endTime}
                    </p>
                    <p className="sidebar-event-venue">📍 {event.venue}</p>
                    <span
                      className="sidebar-event-category"
                      style={{
                        backgroundColor: getCategoryColor(event.eventCategory),
                        color: 'white',
                      }}
                    >
                      {event.eventCategory === 'Other'
                        ? event.customCategory
                        : event.eventCategory}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .loading {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #4a5b86;
        }

        .spinner {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid #f37021;
          border-top-color: transparent;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        .calendar-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
          padding: 14px 16px;
          background: #ffffff;
          border: 1px solid rgba(10, 30, 140, 0.14);
          border-radius: 18px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #4a5b86;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 999px;
        }

        .calendar-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .custom-calendar-container {
          background: #ffffff;
          border: 1px solid rgba(10, 30, 140, 0.14);
          border-radius: 26px;
          padding: 22px;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .calendar-nav-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(10, 30, 140, 0.14);
          background: #ffffff;
          color: #0a1e8c;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .calendar-month-title {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          color: #0a1e8c;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 13px;
          font-weight: 800;
          color: #6b7bb5;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
        }

        .calendar-day {
          min-height: 122px;
          background: #ffffff;
          border: 1px solid rgba(10, 30, 140, 0.14);
          border-radius: 18px;
          padding: 10px;
        }

        .calendar-day.today {
          border: 2px solid #f37021;
        }

        .calendar-day.empty {
          background: transparent;
          border: none;
        }

        .day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 800;
          color: #0a1e8c;
          margin-bottom: 8px;
        }

        .day-number.today {
          background: #f37021;
          color: #ffffff;
        }

        .day-events {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .calendar-event-dot {
          border-radius: 10px;
          padding: 6px 8px;
          cursor: pointer;
        }

        .event-dot-text {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #0a1e8c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-dot-time {
          display: block;
          font-size: 11px;
          color: #4a5b86;
          margin-top: 2px;
        }

        .month-events-sidebar {
          background: #ffffff;
          border: 1px solid rgba(10, 30, 140, 0.14);
          border-radius: 26px;
          padding: 22px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #0a1e8c;
        }

        .event-count-badge {
          background: #fff4ec;
          color: #f37021;
          border: 1px solid rgba(243, 112, 33, 0.25);
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .sidebar-events-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .no-events-sidebar {
          border: 1px dashed rgba(10, 30, 140, 0.18);
          border-radius: 18px;
          padding: 30px 18px;
          text-align: center;
          color: #4a5b86;
        }

        .no-events-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .sidebar-event-item {
          border-radius: 18px;
          padding: 14px;
          display: flex;
          gap: 14px;
          cursor: pointer;
        }

        .sidebar-event-date-box {
          color: #ffffff;
          min-width: 58px;
          height: 58px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-event-day {
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }

        .sidebar-event-weekday {
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
          text-transform: uppercase;
        }

        .sidebar-event-info {
          min-width: 0;
        }

        .sidebar-event-info h4 {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 800;
          color: #0a1e8c;
          line-height: 1.25;
        }

        .sidebar-event-time,
        .sidebar-event-venue {
          margin: 0 0 6px;
          font-size: 13px;
          color: #4a5b86;
          font-weight: 500;
        }

        .sidebar-event-category {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .calendar-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .calendar-grid,
          .calendar-weekdays {
            gap: 8px;
          }

          .calendar-day {
            min-height: 100px;
          }

          .custom-calendar-container,
          .month-events-sidebar {
            padding: 16px;
          }

          .calendar-month-title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};

export default EventCalendar;