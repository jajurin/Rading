import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export const enviarCodigoVerificacion = async (email, codigo) => {
    await transporter.sendMail({
        from: `"RadingApp" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Tu código de verificación',
        html: `
            <div style="font-family:sans-serif;max-width:400px;margin:auto">
                <h2 style="color:#1565D8">Verificá tu email</h2>
                <p>Tu código de verificación es:</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1565D8;margin:20px 0">
                    ${codigo}
                </div>
                <p style="color:#666;font-size:13px">Expira en 10 minutos.</p>
            </div>
        `,
    })
}