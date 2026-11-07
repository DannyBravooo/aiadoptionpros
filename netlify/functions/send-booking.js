// netlify/functions/send-booking.js
exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, phone, service, time, transcript } = JSON.parse(event.body);

    // Basic validation
    if (!name || !phone) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name and phone are required' }) };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
    }

    // Format the email body
    const emailBody = `
New Booking Request from Chatbot

Name: ${name}
Phone: ${phone}
Service: ${service}
Preferred Time: ${time}

--- Chat Transcript ---
${transcript}

---
Sent from AI Adoption Pros website chatbot
    `.trim();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AI Adoption Pros <bookings@aiadoptionpros.com>', // Use your verified domain once set up
        to: ['aiadoptionpros@outlook.com'],
        subject: `New Chatbot Booking: ${name} - ${service}`,
        text: emailBody
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend error:', errorData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Booking sent' })
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};