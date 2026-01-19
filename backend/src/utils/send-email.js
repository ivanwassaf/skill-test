const { Resend } = require("resend");
const { env } = require("../config");
const { ApiError } = require("./api-error");

// Lazy initialization - only create Resend instance when needed
let resend = null;

const getResendInstance = () => {
  if (!resend) {
    // In test environment, if no API key is provided, return a mock
    if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_test_key_123456789') {
      console.warn('⚠️  Resend API key not configured - email sending will be mocked');
      return null;
    }
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
};

const sendMail = async (mailOptions) => {
  const resendInstance = getResendInstance();
  
  // Mock email sending in test/development without valid API key
  if (!resendInstance) {
    console.log('📧 Mock email would be sent:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      from: mailOptions.from
    });
    return; // Success (mocked)
  }

  const { error } = await resendInstance.emails.send(mailOptions);
  if (error) {
    throw new ApiError(500, "Unable to send email");
  }
};

module.exports = {
  sendMail,
};
