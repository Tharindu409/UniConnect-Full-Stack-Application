import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { sendRegistrationEmail } from "../utils/emailService.js";

export const registerForEvent = async (req, res) => {
  try {
    const { eventId, studentName, studentEmail, contactNumber, specialRequests } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    const existingRegistration = await Registration.findOne({ 
      eventId, 
      studentEmail 
    });
    
    if (existingRegistration) {
      return res.status(400).json({ message: "You have already registered for this event" });
    }

    // Count actual registered students from Registration collection
    const registeredCount = await Registration.countDocuments({
      eventId,
      status: "registered",
    });

    let status = "registered";
    if (registeredCount >= event.studentCapacity) {
      status = "waitlist";
    }

    const registration = new Registration({
      eventId,
      studentName,
      studentEmail,
      contactNumber,
      specialRequests,
      status,
    });

    await registration.save();

    console.log(`📧 Sending ${status} email to ${studentEmail}...`);
    const emailSent = await sendRegistrationEmail(
      studentEmail,
      studentName,
      event.eventTitle,
      status
    );

    let message =
      status === "registered"
        ? "Successfully registered for the event!"
        : "Event is full. You have been added to the waitlist.";

    if (emailSent) {
      message += " A confirmation email has been sent.";
    }

    res.status(201).json({ message, registration });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already registered for this event",
      });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      eventId: req.params.eventId,
    })
      .populate("eventId")
      .sort({ registeredAt: 1 });

    const registered = registrations.filter((r) => r.status === "registered");
    const waitlist = registrations.filter((r) => r.status === "waitlist");

    res.json({ registered, waitlist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEventSlots = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Dynamic counts - always accurate
    const registeredCount = await Registration.countDocuments({
      eventId: req.params.eventId,
      status: "registered",
    });

    const waitlistCount = await Registration.countDocuments({
      eventId: req.params.eventId,
      status: "waitlist",
    });

    res.json({
      totalCapacity: event.studentCapacity,
      registeredCount,
      remainingSlots: Math.max(0, event.studentCapacity - registeredCount),
      waitlistCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const eventId = registration.eventId;
    const wasRegistered = registration.status === "registered";

    // Delete the registration
    await Registration.findByIdAndDelete(req.params.id);

    // If a registered student was removed, promote next waitlist student
    if (wasRegistered) {
      const nextWaitlist = await Registration.findOne({
        eventId: eventId,
        status: "waitlist",
      }).sort({ registeredAt: 1 });

      if (nextWaitlist) {
        nextWaitlist.status = "registered";
        await nextWaitlist.save();

        const event = await Event.findById(eventId);

        console.log(
          `📧 Sending promotion email to ${nextWaitlist.studentEmail}...`
        );

        const emailSent = await sendRegistrationEmail(
          nextWaitlist.studentEmail,
          nextWaitlist.studentName,
          event.eventTitle,
          "promoted"
        );

        let message = `Registration removed. ${nextWaitlist.studentName} has been promoted from the waitlist!`;

        if (emailSent) {
          message += " Promotion email sent.";
        }

        return res.json({
          message,
          promotedStudent: nextWaitlist.studentName,
        });
      }
    }

    res.json({ message: "Registration removed successfully" });
  } catch (error) {
    console.error("Remove registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};