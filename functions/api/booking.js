/**
 * Cloudflare Pages Function: Booking Form Handler
 * 
 * Receives form submissions and sends notification emails via Brevo.
 * No contact data is stored in Brevo (GDPR compliant).
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const formData = await request.json();
    
    // Validate required fields
    const { name, email, style, placement, size, ageConfirmation } = formData;
    
    if (!name || !email || !style || !placement || !size) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!ageConfirmation) {
      return new Response(
        JSON.stringify({ error: 'Age confirmation is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Send notification email to studio
    const emailResult = await sendNotificationEmail(env, formData);
    
    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send notification email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Booking request submitted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Booking submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit booking request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Send notification email to studio via Brevo Transactional Email API
 */
async function sendNotificationEmail(env, formData) {
  const { name, email, city, phone, style, artist, placement, size, description } = formData;

  // Format the email content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .label { font-weight: bold; color: #666; }
    .value { margin-left: 10px; }
    .description-box { background: #f5f5f5; padding: 15px; border-left: 3px solid #333; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>New Booking Request</h1>
    
    <div class="section">
      <h2>Contact Information</h2>
      <p><span class="label">Name:</span><span class="value">${escapeHtml(name)}</span></p>
      <p><span class="label">Email:</span><span class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></span></p>
      <p><span class="label">City:</span><span class="value">${city ? escapeHtml(city) : 'Not provided'}</span></p>
      <p><span class="label">Phone:</span><span class="value">${phone ? escapeHtml(phone) : 'Not provided'}</span></p>
    </div>
    
    <div class="section">
      <h2>Tattoo Details</h2>
      <p><span class="label">Style:</span><span class="value">${escapeHtml(style)}</span></p>
      <p><span class="label">Preferred Artist:</span><span class="value">${artist ? escapeHtml(artist) : 'No preference'}</span></p>
      <p><span class="label">Body Placement:</span><span class="value">${escapeHtml(placement)}</span></p>
      <p><span class="label">Approximate Size:</span><span class="value">${escapeHtml(size)} cm</span></p>
    </div>
    
    ${description ? `
    <div class="section">
      <h2>Description</h2>
      <div class="description-box">${escapeHtml(description).replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}
    
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
    <p style="color: #888; font-size: 12px;">
      This booking request was submitted via the High Contrast Tattoo website.
      Reply directly to this email to respond to the customer.
    </p>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
New Booking Request
===================

CONTACT INFORMATION
Name: ${name}
Email: ${email}
City: ${city || 'Not provided'}
Phone: ${phone || 'Not provided'}

TATTOO DETAILS
Style: ${style}
Preferred Artist: ${artist || 'No preference'}
Body Placement: ${placement}
Approximate Size: ${size} cm

${description ? `DESCRIPTION\n${description}` : ''}

---
This booking request was submitted via the High Contrast Tattoo website.
Reply directly to this email to respond to the customer.
  `.trim();

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { 
          name: 'High Contrast Tattoo Website', 
          email: env.BREVO_SENDER_EMAIL,
        },
        to: [{ 
          email: env.STUDIO_EMAIL,
          name: 'High Contrast Tattoo',
        }],
        replyTo: { 
          email: email, 
          name: name,
        },
        subject: `New Booking Request from ${name}`,
        htmlContent: htmlContent,
        textContent: textContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      return { success: false, error: errorData.message || 'Email sending failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
