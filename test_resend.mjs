import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testMail() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  console.log('Testing Resend with key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  
  const recipient = process.env.CONTACT_FORM_RECEIVER || 'mennyparmar@gmail.com';
  console.log('Target recipient:', recipient);

  try {
    const { data, error } = await resend.emails.send({
      from: 'ProvenMRR <notifications@provenmrr.com>',
      to: [recipient],
      subject: 'Resend Debug Connection Test (Verified Domain)',
      text: 'If you see this, your Resend API key is working. If you don\'t see this in your inbox, check Spam or Resend dashboard for delivery errors.',
    });

    if (error) {
      console.error('Resend Error:', error);
    } else {
      console.log('Resend Success!', data);
    }
  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

testMail();
