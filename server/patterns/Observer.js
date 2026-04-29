/**
 * Observer Pattern - Booking Event Observer
 * Handles booking state changes and notifies subscribers
 */

class BookingObserver {
  constructor() {
    this.observers = [];
    this.events = [];
  }

  subscribe(observer) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(o => o !== observer);
    };
  }

  notify(event) {
    this.events.push({
      ...event,
      timestamp: new Date()
    });
    this.observers.forEach(observer => {
      try {
        observer.update(event);
      } catch (error) {
        console.error('Observer notification error:', error);
      }
    });
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

// Singleton instance
const bookingObserver = new BookingObserver();

// Concrete observers
const DriverNotificationObserver = {
  update(event) {
    if (event.type === 'BOOKING_CREATED') {
      console.log(`[DriverNotification] New booking for driver ${event.driverId}: ${event.status}`);
    }
  }
};

const AdminAnalyticsObserver = {
  update(event) {
    console.log(`[Analytics] Booking event: ${event.type}`, {
      bookingId: event.bookingId,
      status: event.status,
      timestamp: event.timestamp
    });
  }
};

const NotificationObserver = {
  update(event) {
    // Could integrate with push notifications, emails, etc.
    console.log(`[Notification] Processing ${event.type} for booking ${event.bookingId}`);
  }
};

module.exports = {
  bookingObserver,
  DriverNotificationObserver,
  AdminAnalyticsObserver,
  NotificationObserver
};