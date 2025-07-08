// Basic Notification Service
class NotificationService {
  constructor() {
    this.notifications = [];
  }

  async sendStationHandoffNotification(handoffData) {
    console.log('📧 Station Handoff Notification:', handoffData.patientName);
    
    const notifications = [
      { type: 'email', status: 'sent', timestamp: new Date() },
      { type: 'sms', status: 'sent', timestamp: new Date() }
    ];

    this.notifications.push({ handoffData, notifications, timestamp: new Date() });

    return {
      success: true,
      notifications,
      stats: { total: 2, sent: 2, failed: 0, success_rate: 100 }
    };
  }
}

module.exports = NotificationService;
