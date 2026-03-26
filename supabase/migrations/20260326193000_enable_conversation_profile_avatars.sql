drop policy if exists "Conversation participants can view related cargoo profiles" on public.cargoo_profiles;
create policy "Conversation participants can view related cargoo profiles"
on public.cargoo_profiles
for select
using (
  auth.uid() = user_id
  or is_public = true
  or exists (
    select 1
    from public.cargoo_conversations
    where (
      cargoo_conversations.participant_one_id = auth.uid()
      and cargoo_conversations.participant_two_id = cargoo_profiles.user_id
    ) or (
      cargoo_conversations.participant_two_id = auth.uid()
      and cargoo_conversations.participant_one_id = cargoo_profiles.user_id
    )
  )
);
