import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Pocketbase, { RecordModel } from "pocketbase";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.APP_USER, 
      pass: process.env.APP_PASSWORD, 
    },
  });

async function sendEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.APP_USER, 
      pass: process.env.APP_PASSWORD, 
    },
  });


  const mailOptions = {
    from: `<${process.env.APP_USER}>`,
    to: `<${process.env.APP_USER}>`, 
    subject: 'test mail from Node.js', 
    text: 'hello testๆ', 
    html: '<b>hi</b><p>this is HTML part</p>', 
  };


  try {
    console.log('sending mail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID: ' + info.messageId);
    console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error occurred while sending email:', error);
  }
}

async function sendNotifyMail(post: RecordModel, user: RecordModel) {
  if (!post || !user) {
    console.error('No user data found in expand.UserID');
    return;
  }

  const mailOptions = {
    from: `<${process.env.APP_USER}>`,
    to: `${user.email}`, // Send to user's actual email
    // to: `<${process.env.APP_USER}>`, // Send to developer for testing
    subject: `New ${post.Type || 'Untitled'} for ${post.Topic || 'Untitled'}! is registered to our platform`,
    text: `Hello User,\n\nYou have a new notification ${post.Type || 'Untitled'} for ${post.Topic || 'Untitled'}\n\nBest regards,\nRSA Team`,
    html: `
    <h1>Notify</h1>
    <p>Hello User,</p>
    <p>You have a new notification <strong>${post.Type || 'Untitled'}</strong> for <strong>${post.Topic || 'Untitled'}</strong></p>
    <p>The <strong>${post.Type || 'Untitled'}</strong> for <strong>${post.Topic || 'Untitled'}</strong> is ready for registration!</p>
  `, 
  };


  try {
    console.log('sending mail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID: ' + info.messageId);
    console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error occurred while sending email:', error);
  }
}

async function prepareNotifyMail(data: { PostList: RecordModel[]; UserList: RecordModel[] }) {
  if (!data || (data.PostList.length === 0 && data.UserList.length === 0)) {
    console.log('No data to send, skipping email.');
    return;
  }

  // send mail and then update status after send notify mail
  const pb = new Pocketbase(process.env.PB_URL || '');
  await pb.collection('_superusers').authWithPassword(
    process.env.PB_ADMIN_USER || '', 
    process.env.PB_ADMIN_PASS || ''
  );
  

  for (const post of data.PostList) {
    for (const user of data.UserList) {
      await sendNotifyMail(post, user);
      console.log(`Notify mail sent for post ${post.id} to user ${user.StudentNo}`);
  }
  await pb.collection('Posts').update(post.id, { Notify: true });
  console.log(`Updated Notify status for post ${post.id}`);
  }
}

export { prepareNotifyMail };

// เรียกใช้งานฟังก์ชัน
// sendEmail();