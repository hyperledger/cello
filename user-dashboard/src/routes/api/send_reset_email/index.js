
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
import { Router } from 'express'
import config from "../../../modules/configuration"
import User from "../../../modules/user"
import nodemailer from 'nodemailer'

const router = new Router()
const smtp_server = process.env.SMTP_SERVER
const smtp_port = process.env.SMTP_PORT
const email_auth_user = process.env.SMTP_AUTH_USERNAME
const email_auth_password = process.env.SMTP_AUTH_PASSWORD
const from_email = process.env.FROM_EMAIL
const webRoot = process.env.WEBROOT

router.post("/", function(req, res) {
    const user = new User();
    user.search(req.body.email).then(function (result) {
        if (!result.user_exists) {
            res.json({
                success: false,
                userExists: false
            })
        } else {
            return result
        }
    }).then(function (result) {
        let transporter = nodemailer.createTransport({
            host: smtp_server,
            port: smtp_port,
            secure: smtp_port === 465,
            auth: {
                user: email_auth_user,
                pass: email_auth_password
            }});
        const resetCode = new Buffer(result.apikey).toString('base64')
        const mailOptions = {
            from: from_email,
            to: result.username,
            subject: 'Reset Password for User',
            text: `Reset password link is ${webRoot}/login#/reset-password?resetCode=${resetCode}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
            }
        });
        res.json({
            success: true
        })
    })
});

export default router
