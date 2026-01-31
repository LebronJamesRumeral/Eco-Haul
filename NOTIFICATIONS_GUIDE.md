# EcoHaul Notification System Guide

## Overview
The EcoHaul app now includes a comprehensive notification system with badge support for installed PWA apps.

## Features

### 1. Notification Center (Bell Icon)
- Located in top-right corner of the dashboard
- Shows unread notification count
- Click to open/close notification panel
- Mark notifications as read individually or all at once
- Clear individual or all notifications

### 2. App Badge
When the app is installed on a mobile device:
- Badge appears on the app icon
- Shows count of unread notifications (max 99+)
- Auto-updates when new notifications arrive
- Clears when all notifications are read

### 3. Push Notifications
- Real-time alerts for important events
- Works even when app is closed (if installed)
- Request permission on first use
- Three types of notifications:
  - 🚚 **Trip Notifications** - Trip started/completed
  - 👤 **Driver Notifications** - Driver updates
  - 💰 **Payroll Notifications** - Payment updates
  - ⚙️ **System Notifications** - General updates

## How to Use

### Enable Notifications
1. Click the **Bell Icon** (🔔) in the top-right
2. Click **Enable Notifications**
3. Browser will request permission
4. Click **Allow** to enable

### View Notifications
1. Click the **Bell Icon** (🔔)
2. See all notifications in the panel
3. Blue dot indicates unread notifications

### Manage Notifications
- **Mark as read**: Just viewing a notification marks it as read
- **Mark all as read**: Click "Mark all as read" button
- **Clear**: Click X on individual notification or "Clear all"

### On Mobile (Installed App)
- Notifications appear as system alerts
- Badge count shows on app icon
- Tap notification to open app
- Badge clears when notifications are read

## API Usage

### In Components

```typescript
import { useNotifications } from '@/hooks/use-notifications'

export function MyComponent() {
  const {
    notifications,
    badge,
    requestPermission,
    notifyTripStarted,
    notifyTripCompleted,
    notifyDriver,
    notifyPayroll,
  } = useNotifications()

  // Send trip notification
  const handleTripStart = async () => {
    notifyTripStarted('John Doe', 'T-001')
  }

  // Send trip completion
  const handleTripEnd = (distance) => {
    notifyTripCompleted('John Doe', 'T-001', 150.5)
  }

  // Send driver notification
  const handleDriverUpdate = () => {
    notifyDriver('John Doe', 'Please update your compliance')
  }

  // Send payroll notification
  const handlePayrollUpdate = (amount) => {
    notifyPayroll('John Doe', amount)
  }

  return (
    <div>
      <span>Unread: {badge}</span>
    </div>
  )
}
```

### Available Methods

**notifyTripStarted(driverName, truckNumber)**
- Sends notification when driver starts a trip

**notifyTripCompleted(driverName, truckNumber, distance)**
- Sends notification when trip is completed

**notifyDriver(driverName, message)**
- Sends custom driver notification

**notifyPayroll(driverName, amount)**
- Sends payroll notification with amount

**requestPermission()**
- Requests browser notification permission

**markAsRead(id)**
- Mark specific notification as read

**markAllAsRead()**
- Mark all notifications as read

**clearNotification(id)**
- Remove specific notification

**clearAll()**
- Remove all notifications

## Data Persistence

- All notifications are stored in localStorage
- Badge count is synced with the browser/system
- Notifications persist across sessions
- Clear browser storage to reset notifications

## Browser Support

| Browser | Desktop | Mobile | Push |
|---------|---------|--------|------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ⚠️ | ✅ | ⚠️ |
| Edge | ✅ | ✅ | ✅ |

## Troubleshooting

### Notifications not showing
- Check if notifications are enabled in browser settings
- Check if app has permission in system settings
- For mobile, ensure app is installed as PWA

### Badge not updating
- Badge API only works on installed PWA apps
- Works on Chrome, Edge, Samsung Internet
- Check if app is properly installed

### No push notifications
- Push notifications require server setup (Optional)
- Currently supports in-app notifications
- To enable push: configure VAPID keys in .env.local

## Future Enhancements

- [ ] Server-side push notifications
- [ ] Notification preferences/settings
- [ ] Scheduled notifications
- [ ] Custom notification sounds
- [ ] Notification history with filters
- [ ] Smart grouping of similar notifications
