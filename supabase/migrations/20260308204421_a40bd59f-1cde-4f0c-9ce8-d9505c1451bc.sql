
ALTER TABLE public.media_assets
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX idx_media_assets_project_id ON public.media_assets(project_id);
