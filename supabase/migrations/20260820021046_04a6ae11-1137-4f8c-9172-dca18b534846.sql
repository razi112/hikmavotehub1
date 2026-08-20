
create schema if not exists private;
revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke all on function private.has_role(uuid, public.app_role) from public;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;

alter policy "positions admin write" on public.positions using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));
alter policy "candidates admin write" on public.candidates using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));
alter policy "settings admin write" on public.settings using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));
alter policy "students admin all" on public.students using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));
alter policy "votes admin read" on public.votes using (private.has_role(auth.uid(), 'admin'));

drop function if exists public.has_role(uuid, public.app_role);
