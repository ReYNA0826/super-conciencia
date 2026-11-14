# Correos de Súper Conciencia (plantillas para Supabase)

Se pegan en Supabase → **Authentication → Emails → Templates**.
Salen desde `info@dreameducationus.com` con el nombre "Super Conciencia".
Son bilingües (español arriba, inglés abajo) porque la app tiene los dos idiomas y
Supabase solo permite una plantilla por tipo de correo.

No cambies `{{ .ConfirmationURL }}`: Supabase lo reemplaza por el enlace de cada persona.

---

## 1. Confirm signup (confirmar la cuenta)

**Subject:**

```
Confirma tu cuenta · Confirm your account — Súper Conciencia
```

**Body (HTML):**

```html
<div style="background:#0d0828;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#17113d;border:1px solid #3a2f73;border-radius:18px;padding:32px 28px;color:#efeaff;text-align:center;">
    <p style="margin:0;font-size:13px;letter-spacing:3px;color:#e8c56a;">SÚPER CONCIENCIA</p>
    <h1 style="margin:18px 0 10px;font-size:22px;color:#ffffff;">Te damos la bienvenida</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">Toca el botón desde tu teléfono para confirmar tu cuenta y empezar tu viaje.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e8c56a;color:#17113d;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 28px;border-radius:999px;">Confirmar mi cuenta</a>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#b9b0e0;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    <hr style="border:none;border-top:1px solid #3a2f73;margin:26px 0;">
    <h2 style="margin:0 0 10px;font-size:18px;color:#ffffff;">Welcome</h2>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">Tap the button on your phone to confirm your account and begin your journey.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e8c56a;color:#17113d;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 28px;border-radius:999px;">Confirm my account</a>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#b9b0e0;">If you did not create this account, you can ignore this email.</p>
    <p style="margin:26px 0 0;font-size:11px;color:#8f86b8;">Dream Education, Corp · contacto@dreameducationus.com</p>
  </div>
</div>
```

---

## 2. Reset password (restablecer la contraseña)

**Subject:**

```
Crea tu contraseña nueva · Reset your password — Súper Conciencia
```

**Body (HTML):**

```html
<div style="background:#0d0828;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#17113d;border:1px solid #3a2f73;border-radius:18px;padding:32px 28px;color:#efeaff;text-align:center;">
    <p style="margin:0;font-size:13px;letter-spacing:3px;color:#e8c56a;">SÚPER CONCIENCIA</p>
    <h1 style="margin:18px 0 10px;font-size:22px;color:#ffffff;">Crea tu contraseña nueva</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">Toca el botón desde tu teléfono. Se abrirá la app para que escribas tu contraseña nueva.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e8c56a;color:#17113d;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 28px;border-radius:999px;">Crear contraseña nueva</a>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#b9b0e0;">Si no pediste este cambio, puedes ignorar este correo. Tu contraseña seguirá igual.</p>
    <hr style="border:none;border-top:1px solid #3a2f73;margin:26px 0;">
    <h2 style="margin:0 0 10px;font-size:18px;color:#ffffff;">Create your new password</h2>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">Tap the button on your phone. The app will open so you can enter your new password.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e8c56a;color:#17113d;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 28px;border-radius:999px;">Create new password</a>
    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#b9b0e0;">If you did not request this change, you can ignore this email. Your password will stay the same.</p>
    <p style="margin:26px 0 0;font-size:11px;color:#8f86b8;">Dream Education, Corp · contacto@dreameducationus.com</p>
  </div>
</div>
```
