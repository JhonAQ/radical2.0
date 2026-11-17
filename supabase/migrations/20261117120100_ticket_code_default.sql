-- Default para que el cliente no tenga que enviar ticket_code al insertar.
-- El trigger registrations_assign_ticket_code lo vuelve a generar igual (ignora lo enviado).
grant execute on function private.generate_ticket_code() to authenticated;
alter table public.registrations alter column ticket_code set default private.generate_ticket_code();
