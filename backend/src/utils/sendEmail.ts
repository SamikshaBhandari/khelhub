import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
    try {
        await transporter.sendMail({
            from: `"KhelHub Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Email sending error:', error);
    }
};