const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post("/api/send-code", async (req, res) => {
  console.log('📥 OTRZYMANO REQUEST na /api/send-code'); // <-- LOG 1
  const { to, code } = req.body;
  console.log('✉️  Odbiorca:', to, 'Kod:', code); // <-- LOG 2

  if (!to || !code) {
    console.log('❌ BRAK adresu lub kodu'); // <-- LOG 3
    return res.status(400).json({ message: "Brak adresu lub kodu" });
  }

  console.log('🔧 Tworzę transporter SMTP...'); // <-- LOG 4
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Cascade Verification" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: "Twój kod weryfikacyjny",
    text: `Kod weryfikacyjny: ${code}`,
    html: `<div style="font-size:18px">Twój kod weryfikacyjny:<br><b>${code}</b></div>`
  };

  try {
    console.log('📤 Próbuję wysłać maila...'); // <-- LOG 5
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email wysłany pomyślnie! Info:', info.messageId); // <-- LOG 6
    res.json({ success: true });
  } catch (e) {
    console.error('❌ BŁĄD podczas wysyłki maila:'); // <-- LOG 7
    console.error('Error message:', e.message); // <-- LOG 8
    console.error('Pełny błąd:', e); // <-- LOG 9
    res.status(500).json({ success: false, message: "Nie udało się wysłać maila." });
  }
});

module.exports = router;
