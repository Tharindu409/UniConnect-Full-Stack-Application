import Event from "../models/Event.js";

export const createEvent = async (req, res) => {
  try {
    const {
      eventTitle,
      description,
      eventCategory,
      customCategory,
      eventDate,
      startTime,
      endTime,
      venue,
      studentCapacity,
      organisingClubName,
      organiserName,
      organiserPhone,
      registrationDeadline,
    } = req.body;

    const eventPoster = req.file ? `/uploads/${req.file.filename}` : "";

    const event = new Event({
      eventTitle,
      description,
      eventCategory,
      customCategory,
      eventDate,
      startTime,
      endTime,
      venue,
      studentCapacity,
      organisingClubName,
      organiserName,
      organiserPhone,
      registrationDeadline,
      eventPoster,
    });

    const savedEvent = await event.save();

    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("createEvent error:", error);
    res.status(500).json({
      message: error.message || "Failed to create event",
    });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("getAllEvents error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch events",
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("getEventById error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch event",
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const {
      eventTitle,
      description,
      eventCategory,
      customCategory,
      eventDate,
      startTime,
      endTime,
      venue,
      studentCapacity,
      organisingClubName,
      organiserName,
      organiserPhone,
      registrationDeadline,
    } = req.body;

    const existingEvent = await Event.findById(req.params.id);

    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    existingEvent.eventTitle = eventTitle ?? existingEvent.eventTitle;
    existingEvent.description = description ?? existingEvent.description;
    existingEvent.eventCategory = eventCategory ?? existingEvent.eventCategory;
    existingEvent.customCategory = customCategory ?? existingEvent.customCategory;
    existingEvent.eventDate = eventDate ?? existingEvent.eventDate;
    existingEvent.startTime = startTime ?? existingEvent.startTime;
    existingEvent.endTime = endTime ?? existingEvent.endTime;
    existingEvent.venue = venue ?? existingEvent.venue;
    existingEvent.studentCapacity =
      studentCapacity ?? existingEvent.studentCapacity;
    existingEvent.organisingClubName =
      organisingClubName ?? existingEvent.organisingClubName;
    existingEvent.organiserName =
      organiserName ?? existingEvent.organiserName;
    existingEvent.organiserPhone =
      organiserPhone ?? existingEvent.organiserPhone;
    existingEvent.registrationDeadline =
      registrationDeadline ?? existingEvent.registrationDeadline;

    if (req.file) {
      existingEvent.eventPoster = `/uploads/${req.file.filename}`;
    }

    const updatedEvent = await existingEvent.save();

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("updateEvent error:", error);
    res.status(500).json({
      message: error.message || "Failed to update event",
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("deleteEvent error:", error);
    res.status(500).json({
      message: error.message || "Failed to delete event",
    });
  }
};