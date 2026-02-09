const { google } = require('googleapis');
const { query } = require('../config/database');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Handle token refresh
    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        // Store new refresh token
        console.log('New refresh token received');
      }
      // Update access token in database if needed
      console.log('Tokens refreshed');
    });
  }

  /**
   * Format datetime string for Google Calendar API
   * Handles various input formats and ensures proper timezone offset
   * CRITICAL: Uses RFC3339 format which Google Calendar requires
   */
  formatDateTimeForGoogle(dateTimeStr, timeZone) {
    if (!dateTimeStr) return null;

    // If already has timezone (ends with Z or has +/- offset at the end), use as is
    if (dateTimeStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateTimeStr)) {
      return dateTimeStr;
    }

    try {
      // Parse the datetime string - handle both ISO format and date-only
      let dateObj;
      
      // If it's just a date (YYYY-MM-DD), add time if not present
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeStr)) {
        // Date only - assume start of day
        dateObj = new Date(dateTimeStr + 'T00:00:00');
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateTimeStr)) {
        // Date with time but no timezone
        dateObj = new Date(dateTimeStr);
      } else {
        // Try to parse as-is
        dateObj = new Date(dateTimeStr);
      }

      // Validate the date
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date string:', dateTimeStr);
        return dateTimeStr;
      }

      // Format to RFC3339 with timezone
      // Get timezone offset for Asia/Jakarta (UTC+7)
      const tz = timeZone || 'Asia/Jakarta';
      const offsetHours = tz === 'Asia/Jakarta' ? 7 : 0; // Hardcode for Indonesia
      const offsetString = offsetHours >= 0 
        ? `+${String(offsetHours).padStart(2, '0')}:00`
        : `-${String(Math.abs(offsetHours)).padStart(2, '0')}:00`;

      // Format: YYYY-MM-DDTHH:MM:SS+07:00
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');

      const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
      console.log('📅 Formatted datetime for Google:', { input: dateTimeStr, output: formattedDateTime });
      return formattedDateTime;
    } catch (error) {
      console.error('Error formatting datetime:', error, dateTimeStr);
      return dateTimeStr;
    }
  }

  /**
   * Generate Google Calendar authorization URL
   */
  getCalendarAuthUrl(userId) {
    try {
      console.log('🔗 Service: Generating auth URL for userId:', userId);
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: userId.toString() // Pass user ID in state parameter
      });

      console.log('🔗 Service: Generated auth URL with state:', authUrl.includes('state='));
      return authUrl;
    } catch (error) {
      console.error('🔗 Service: Error generating auth URL:', error);
      throw error;
    }
  }

  /**
   * Set credentials for a user and handle token refresh
   */
  async setCredentialsForUser(userId) {
    const userResult = await query(
      'SELECT google_access_token, google_refresh_token, google_token_expiry FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    if (!user.google_access_token) {
      throw new Error('User not connected to Google Calendar');
    }

    this.oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
      expiry_date: user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : null
    });

    // Handle token refresh
    this.oauth2Client.on('tokens', async (tokens) => {
      try {
        const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
        await query(
          `UPDATE users
           SET google_access_token = $1,
               google_refresh_token = COALESCE($2, google_refresh_token),
               google_token_expiry = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [tokens.access_token, tokens.refresh_token, expiryDate, userId]
        );
        console.log('Google tokens updated for user:', userId);
      } catch (error) {
        console.error('Error updating tokens:', error);
      }
    });

    return user;
  }

  /**
   * Get calendar events for a user
   */
  async getCalendarEvents(userId, options = {}) {
    try {
      // Set credentials and get user
      const user = await this.setCredentialsForUser(userId);

      // Check if token is expired and refresh if needed
      if (user.google_token_expiry && new Date(user.google_token_expiry) < new Date()) {
        console.log('Access token expired, refreshing...');
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          const expiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
          
          // Update tokens in database
          await query(
            `UPDATE users
             SET google_access_token = $1,
                 google_refresh_token = COALESCE($2, google_refresh_token),
                 google_token_expiry = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [credentials.access_token, credentials.refresh_token, expiryDate, userId]
          );
          
          // Update credentials
          this.oauth2Client.setCredentials(credentials);
          console.log('Token refreshed successfully');
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          // If refresh fails with invalid_grant, clear tokens from database
          if (refreshError.message === 'invalid_grant') {
            await query(
              `UPDATE users
               SET google_access_token = NULL,
                   google_refresh_token = NULL,
                   google_token_expiry = NULL,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $1`,
              [userId]
            );
          }
          throw new Error('invalid_grant');
        }
      }

      // Default options
      const defaultOptions = {
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      };

      const calendarOptions = { ...defaultOptions, ...options };

      // Get calendar events
      const response = await this.calendar.events.list(calendarOptions);

      return {
        success: true,
        data: {
          events: response.data.items || []
        }
      };

    } catch (error) {
      console.error('Error getting calendar events:', error);
      
      // Check for authentication errors
      if (error.message === 'invalid_grant' || 
          error.code === 401 || 
          (error.response && error.response.status === 401)) {
        return {
          success: false,
          message: 'invalid_grant',
          needsReconnect: true
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to get calendar events'
      };
    }
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(userId, eventData) {
    try {
      // Set credentials and get user
      await this.setCredentialsForUser(userId);

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: this.formatDateTimeForGoogle(eventData.startDateTime, eventData.timeZone),
          timeZone: eventData.timeZone || 'Asia/Jakarta'
        },
        end: {
          dateTime: this.formatDateTimeForGoogle(eventData.endDateTime, eventData.timeZone),
          timeZone: eventData.timeZone || 'Asia/Jakarta'
        },
        location: eventData.location
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        message: error.message || 'Failed to create calendar event'
      };
    }
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(userId, eventId, eventData) {
    try {
      // Set credentials and get user
      await this.setCredentialsForUser(userId);

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: this.formatDateTimeForGoogle(eventData.startDateTime, eventData.timeZone),
          timeZone: eventData.timeZone || 'Asia/Jakarta'
        },
        end: {
          dateTime: this.formatDateTimeForGoogle(eventData.endDateTime, eventData.timeZone),
          timeZone: eventData.timeZone || 'Asia/Jakarta'
        },
        location: eventData.location
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error updating calendar event:', error);
      return {
        success: false,
        message: error.message || 'Failed to update calendar event'
      };
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(userId, eventId) {
    try {
      // Set credentials and get user
      await this.setCredentialsForUser(userId);

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return {
        success: true,
        message: 'Event deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete calendar event'
      };
    }
  }

  /**
   * Get timezone offset in minutes
   */
  getTimezoneOffset(timeZone) {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const targetDate = new Date(now.toLocaleString('en-US', { timeZone }));
    return (targetDate - utcDate) / (1000 * 60);
  }

  /**
   * Get holiday events from a specific calendar
   */
  async getHolidayEvents(userId, options = {}) {
    try {
      // Set credentials and get user
      await this.setCredentialsForUser(userId);

      // Default options for holiday calendar
      const defaultOptions = {
        calendarId: 'id.indonesian#holiday@group.v.calendar.google.com',
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      };

      const calendarOptions = { ...defaultOptions, ...options };

      // Get holiday events
      const response = await this.calendar.events.list(calendarOptions);

      return {
        success: true,
        data: {
          events: response.data.items || []
        }
      };

    } catch (error) {
      console.error('Error getting holiday events:', error);
      return {
        success: false,
        message: error.message || 'Failed to get holiday events'
      };
    }
  }
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Test if refresh token is still valid by attempting to refresh
   */
  async testRefreshToken(userId) {
    try {
      // Set credentials
      await this.setCredentialsForUser(userId);

      // Try to refresh access token
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // If successful, update tokens
      const expiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
      await query(
        `UPDATE users
         SET google_access_token = $1,
             google_refresh_token = COALESCE($2, google_refresh_token),
             google_token_expiry = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [credentials.access_token, credentials.refresh_token, expiryDate, userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Refresh token test failed:', error);
      // If refresh fails, clear invalid tokens
      if (error.message === 'invalid_grant') {
        await query(
          `UPDATE users
           SET google_access_token = NULL,
               google_refresh_token = NULL,
               google_token_expiry = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [userId]
        );
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate calendar connection by making a simple API call
   * Also proactively refreshes token if it's about to expire
   */
  async validateConnection(userId) {
    try {
      const user = await this.setCredentialsForUser(userId);
      
      // Proactively refresh token if it expires within 5 minutes
      if (user.google_token_expiry) {
        const expiryTime = new Date(user.google_token_expiry).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (expiryTime - now < fiveMinutes) {
          console.log('🔄 Token expiring soon, refreshing proactively...');
          try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            const newExpiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
            
            await query(
              `UPDATE users
               SET google_access_token = $1,
                   google_refresh_token = COALESCE($2, google_refresh_token),
                   google_token_expiry = $3,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [credentials.access_token, credentials.refresh_token, newExpiryDate, userId]
            );
            
            this.oauth2Client.setCredentials(credentials);
            console.log('✅ Token refreshed proactively');
          } catch (refreshError) {
            console.error('❌ Proactive token refresh failed:', refreshError);
            if (refreshError.message === 'invalid_grant') {
              await query(
                `UPDATE users
                 SET google_access_token = NULL,
                     google_refresh_token = NULL,
                     google_token_expiry = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [userId]
              );
              return {
                success: false,
                connected: false,
                needsReconnect: true,
                message: 'Token refresh failed - please reconnect'
              };
            }
          }
        }
      }
      
      // Try to list calendars to validate connection
      const response = await this.calendar.calendarList.list({
        maxResults: 1
      });

      return {
        success: true,
        connected: true,
        userEmail: response.data.items && response.data.items[0] ? response.data.items[0].summary : null
      };
    } catch (error) {
      console.error('Error validating calendar connection:', error);
      
      if (error.message === 'invalid_grant' || 
          error.code === 401 || 
          error.message.includes('invalid_grant')) {
        // Clear invalid tokens
        try {
          await query(
            `UPDATE users
             SET google_access_token = NULL,
                 google_refresh_token = NULL,
                 google_token_expiry = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [userId]
          );
        } catch (dbError) {
          console.error('Error clearing tokens:', dbError);
        }
        
        return {
          success: false,
          connected: false,
          needsReconnect: true,
          message: 'Invalid credentials - please reconnect'
        };
      }

      return {
        success: false,
        connected: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get auth URL (alias for consistency)
   */
  getAuthUrl(userId) {
    return this.getCalendarAuthUrl(userId);
  }
}

module.exports = new GoogleCalendarService();