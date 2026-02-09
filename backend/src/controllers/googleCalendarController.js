const googleCalendarService = require('../services/googleCalendarService');
const { query } = require('../config/database');

/**
 * Get Google Calendar connection status
 */
const getCalendarStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT 
        google_access_token IS NOT NULL as is_connected,
        google_token_expiry,
        google_refresh_token IS NOT NULL as has_refresh_token,
        google_refresh_token
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    const isConnected = user.is_connected && user.has_refresh_token;
    const isExpired = user.google_token_expiry ? new Date(user.google_token_expiry) < new Date() : false;
    let needsReconnect = false;

    // If connected but expired, try to refresh token to check if refresh token is still valid
    if (isConnected && isExpired && user.google_refresh_token) {
      try {
        console.log('Checking refresh token validity for user:', userId);
        const refreshResult = await googleCalendarService.testRefreshToken(userId);
        if (!refreshResult.success) {
          console.log('Refresh token invalid, marking as needs reconnect');
          needsReconnect = true;
        }
      } catch (error) {
        console.error('Error testing refresh token:', error);
        needsReconnect = true;
      }
    } else if (isConnected && isExpired && !user.has_refresh_token) {
      needsReconnect = true;
    }

    res.json({
      success: true,
      data: {
        connected: isConnected && !needsReconnect,
        hasRefreshToken: user.has_refresh_token && !needsReconnect,
        tokenExpiry: user.google_token_expiry,
        isExpired: isExpired,
        needsReconnect: needsReconnect
      }
    });
  } catch (error) {
    console.error('Error in getCalendarStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Disconnect Google Calendar
 */
const disconnectCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Revoke tokens if possible
    try {
      await googleCalendarService.revokeTokens(userId);
    } catch (revokeError) {
      console.log('Could not revoke tokens (may already be invalid):', revokeError.message);
    }

    // Clear tokens from database
    await query(
      `UPDATE users
       SET google_access_token = NULL,
           google_refresh_token = NULL,
           google_token_expiry = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error in disconnectCalendar:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Google Calendar authorization URL
 */
const getCalendarAuthUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔗 Generating auth URL for user:', userId);
    const authUrl = googleCalendarService.getCalendarAuthUrl(userId);
    console.log('🔗 Generated auth URL:', authUrl);

    res.json({
      success: true,
      data: {
        authUrl: authUrl
      }
    });
  } catch (error) {
    console.error('Error in getCalendarAuthUrl:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Google Calendar events for the authenticated user
 */
const getCalendarEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get query parameters
    const { maxResults, timeMin, timeMax } = req.query;

    const options = {};
    if (maxResults) options.maxResults = parseInt(maxResults);
    if (timeMin) options.timeMin = timeMin;
    if (timeMax) options.timeMax = timeMax;

    const result = await googleCalendarService.getCalendarEvents(userId, options);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      // Check for specific error types
      if (result.message === 'invalid_grant' || result.needsReconnect) {
        return res.status(401).json({
          success: false,
          message: 'Google Calendar connection expired. Please reconnect.',
          errorCode: 'NEEDS_RECONNECT'
        });
      }
      if (result.message === 'User not connected to Google Calendar') {
        return res.status(401).json({
          success: false,
          message: result.message,
          errorCode: 'NOT_CONNECTED'
        });
      }
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in getCalendarEvents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create a new Google Calendar event
 */
const createCalendarEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { summary, description, startDateTime, endDateTime, location, timeZone } = req.body;

    // Validate required fields
    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Summary, start date/time, and end date/time are required'
      });
    }

    const eventData = {
      summary,
      description,
      startDateTime,
      endDateTime,
      location,
      timeZone
    };

    const result = await googleCalendarService.createCalendarEvent(userId, eventData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Calendar event created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in createCalendarEvent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a Google Calendar event
 */
const updateCalendarEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;
    const { summary, description, startDateTime, endDateTime, location, timeZone } = req.body;

    // Validate required fields
    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Summary, start date/time, and end date/time are required'
      });
    }

    const eventData = {
      summary,
      description,
      startDateTime,
      endDateTime,
      location,
      timeZone
    };

    const result = await googleCalendarService.updateCalendarEvent(userId, eventId, eventData);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Calendar event updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in updateCalendarEvent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a Google Calendar event
 */
const deleteCalendarEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;

    const result = await googleCalendarService.deleteCalendarEvent(userId, eventId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in deleteCalendarEvent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get holiday events from Indonesian holiday calendar
 */
const getHolidayEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { calendarId, timeMin, timeMax, maxResults } = req.query;

    // Validate required parameters
    if (!calendarId) {
      return res.status(400).json({
        success: false,
        message: 'Calendar ID is required'
      });
    }

    const options = {
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: maxResults ? parseInt(maxResults) : 50,
      singleEvents: true,
      orderBy: 'startTime'
    };

    const result = await googleCalendarService.getHolidayEvents(userId, options);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in getHolidayEvents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Handle Google Calendar OAuth callback
 */
const handleCalendarCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const userId = state; // User ID passed in state parameter

    // Handle OAuth errors
    if (error) {
      console.log('OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/user/dashboard?calendar_error=${error}`;
      return res.redirect(redirectUrl);
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get tokens from Google
    const tokens = await googleCalendarService.getTokens(code);

    // Store tokens in database
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    await query(
      `UPDATE users
       SET google_access_token = $1,
           google_refresh_token = $2,
           google_token_expiry = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [tokens.access_token, tokens.refresh_token, expiryDate, userId]
    );

    console.log('✅ Google Calendar tokens stored successfully for user:', userId);

    // Redirect back to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/user/dashboard?openCalendar=true`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in handleCalendarCallback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/user/dashboard?calendar_error=true`);
  }
};

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarAuthUrl,
  handleCalendarCallback,
  getCalendarStatus,
  disconnectCalendar,
  getHolidayEvents
};