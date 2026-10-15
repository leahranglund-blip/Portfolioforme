create table if not exists public.admin_users (
    user_id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.certifications (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    provider text not null default '',
    description text not null default '',
    status text check (status in ('Fullført', 'Pågående')),
    completed_on date,
    credential_url text,
    sort_order integer not null default 0,
    is_published boolean not null default true,
    created_at timestamptz not null default now(),
    constraint certifications_title_provider_key unique (title, provider)
);

insert into public.certifications (title, sort_order, is_published)
values
    ('Google Skillshop', 10, true),
    ('Claude Academy', 20, true),
    ('HubSpot Academy', 30, true),
    ('Meta Blueprint', 40, true)
on conflict (title, provider) do nothing;

alter table public.admin_users enable row level security;
alter table public.certifications enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.admin_users
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

grant select on public.certifications to anon, authenticated;
grant insert, update, delete on public.certifications to authenticated;

drop policy if exists "Anyone can read published certifications" on public.certifications;
create policy "Anyone can read published certifications"
    on public.certifications for select
    to anon, authenticated
    using (is_published = true);

drop policy if exists "Admins can read all certifications" on public.certifications;
create policy "Admins can read all certifications"
    on public.certifications for select
    to authenticated
    using ((select public.is_admin()));

drop policy if exists "Admins can insert certifications" on public.certifications;
create policy "Admins can insert certifications"
    on public.certifications for insert
    to authenticated
    with check ((select public.is_admin()));

drop policy if exists "Admins can update certifications" on public.certifications;
create policy "Admins can update certifications"
    on public.certifications for update
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists "Admins can delete certifications" on public.certifications;
create policy "Admins can delete certifications"
    on public.certifications for delete
    to authenticated
    using ((select public.is_admin()));
