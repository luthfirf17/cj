const express = require('express');
const router = express.Router();
const googleCalendarController = require('../../controllers/googleCalendarController');
const { authenticate } = require('../../middlewares/authMiddleware');

/**
 * GOOGLE CALENDAR ROUTES
 */

/**
 * @route   GET /api/user/google-calendar/status
 * @desc    Get Google Calendar connection status
 * @access  Private
 */
router.get('/google-calendar/status', authenticate, googleCalendarController.getCalendarStatus);

/**
 * @route   DELETE /api/user/google-calendar/disconnect
 * @desc    Disconnect Google Calendar
 * @access  Private
 */
router.delete('/google-calendar/disconnect', authenticate, googleCalendarController.disconnectCalendar);

/**
 * @route   GET /api/user/google-calendar/holidays
 * @desc    Get holiday events from Indonesian holiday calendar
 * @access  Private
 */
router.get('/google-calendar/holidays', authenticate, googleCalendarController.getHolidayEvents);

/**
 * @route   GET /api/user/google-calendar/auth-url
 * @desc    Get Google Calendar authorization URL
 * @access  Private
 */
router.get('/google-calendar/auth-url', authenticate, googleCalendarController.getCalendarAuthUrl);

/**
 * @route   GET /api/user/google-calendar/callback
 * @desc    Handle Google Calendar OAuth callback
 * @access  Public
 */
router.get('/google-calendar/callback', googleCalendarController.handleCalendarCallback);

/**
 * @route   GET /api/user/google-calendar/events
 * @desc    Get Google Calendar events
 * @access  Private
 */
router.get('/google-calendar/events', authenticate, googleCalendarController.getCalendarEvents);

/**
 * @route   POST /api/user/google-calendar/events
 * @desc    Create Google Calendar event
 * @access  Private
 */
router.post('/google-calendar/events', authenticate, googleCalendarController.createCalendarEvent);

/**
 * @route   PUT /api/user/google-calendar/events/:eventId
 * @desc    Update Google Calendar event
 * @access  Private
 */
router.put('/google-calendar/events/:eventId', authenticate, googleCalendarController.updateCalendarEvent);

/**
 * @route   DELETE /api/user/google-calendar/events/:eventId
 * @desc    Delete Google Calendar event
 * @access  Private
 */
router.delete('/google-calendar/events/:eventId', authenticate, googleCalendarController.deleteCalendarEvent);

module.exports = router;