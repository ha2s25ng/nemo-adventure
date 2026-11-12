alter table public.nemo_forest_runs
  add column if not exists loadout jsonb;
alter table public.nemo_forest_runs
  add constraint nemo_forest_runs_loadout_shape check (
    loadout is null or (jsonb_typeof(loadout) = 'object' and octet_length(loadout::text) <= 1024)
  );
notify pgrst, 'reload schema';
