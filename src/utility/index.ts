import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.ZOHO_MAIL,
        pass: process.env.ZOHO_PASSWORD,
    },
});



export const sendMail = async (email: string, html: string) => {
    try {

        const mailInfo = await transporter.sendMail({
            from: `"OFLEP CONNECT" <${process.env.ZOHO_MAIL}>`,
            to: email,
            subject: "Email Verification",
            html,
        });

        return mailInfo;

    } catch (error) {
        console.log("Error sending mail ==> ", error);
        throw error;
    }
}



const errorAndTheCodes: any = {
    "Not_Found": 404,
    "Missing_Credentials": 400,
    "Server_Error": 500,
    "Unauthorised": 403,
    "Unauthenticated": 401,
};

export const getErrorCode = (error: string) => {
    return errorAndTheCodes[error];
};




