# XafeWallet - Certificate Management System

XafeWallet is a secure digital wallet for managing and sharing certificates and credentials.

## Features

- Secure certificate storage and management
- Certificate sharing via email and secure links
- Certificate expiry tracking and notifications
- User profile management
- Responsive design for all devices

## Email Sharing with SendGrid

XafeWallet uses SendGrid for reliable email delivery when sharing certificates. This ensures:

- Professional email delivery with tracking
- Support for file attachments
- Email open and click tracking
- Delivery analytics

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SENDGRID_API_KEY=your_sendgrid_api_key
VITE_EMAIL_FROM=your_verified_sender_email
VITE_EMAIL_FROM_NAME=XafeWallet
```

### 2. SendGrid Setup

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Verify a sender identity (domain or single sender)
3. Create an API key with "Mail Send" permissions
4. Add the API key to your `.env` file

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

## SendGrid Integration Details

The SendGrid integration provides:

1. **Reliable Email Delivery**: Professional email delivery with high deliverability rates
2. **Email Tracking**: Track when recipients open emails and click links
3. **Attachment Support**: Send certificates as file attachments
4. **Email Templates**: Customizable email templates for certificate sharing
5. **Analytics**: Track email performance and engagement

## Security Considerations

- SendGrid API keys should be kept secure and never exposed in client-side code
- All email sending happens server-side via Supabase Edge Functions
- Rate limiting is implemented to prevent abuse
- Email history is stored securely in the database

## Troubleshooting

If emails are not being sent:

1. Check that your SendGrid API key is correct
2. Verify that your sender email is verified in SendGrid
3. Check the SendGrid Activity Feed for any delivery issues
4. Ensure your account is not on SendGrid's probation/limitation