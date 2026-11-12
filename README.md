This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Inscripciones y administración

Las migraciones de `supabase/migrations` crean las inscripciones, los abonos, la auditoría y el bucket privado `registration-receipts`. El participante debe tener una sesión de Supabase y solo puede leer sus propios datos y comprobantes. Los administradores pueden revisar las inscripciones; solamente la cuenta maestra puede gestionar administradores.

La cuenta maestra debe existir en Supabase Auth y tener una fila con `role = 'master'` en `public.admin_users`. En el proyecto de producción se asignó a la cuenta del propietario existente. Para activar el acceso con contraseña, entra en `/admin`, selecciona **Crear o recuperar contraseña** y abre el enlace en el mismo navegador, o inicia sesión con esa cuenta de Google y usa **Mi contraseña** en el panel. Los demás administradores pueden crearse con contraseña inicial o concederse a cuentas existentes. Comparte las contraseñas por un canal seguro.

La gestión de administradores requiere `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`) disponible exclusivamente en el servidor. Nunca uses el prefijo `NEXT_PUBLIC_` para esa clave. La integración de Supabase en Vercel la proporciona en producción; para desarrollo local configúrala en `.env.local` si se necesita esa función. Los valores opcionales `NEXT_PUBLIC_YAPE_HOLDER` y `NEXT_PUBLIC_YAPE_PHONE` muestran el nombre y el teléfono reales de Yape; sin ellos se muestra solamente el QR. Verifica que el QR corresponda al titular correcto antes de recibir pagos.

En Supabase Auth, permite `https://radical2-0.vercel.app/auth/callback` y `http://localhost:3000/auth/callback` en Redirect URLs. La recuperación de contraseña debe iniciarse en el dominio de producción y el enlace debe abrirse en el mismo navegador. En Vercel, la protección estándar deja público el dominio de producción y protege los despliegues de vista previa.
