import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Search, LayoutDashboard, Image, Settings, LogOut, User,
  MoreVertical, Pencil, Trash2, ExternalLink, Loader2, FolderOpen, Clock, Menu, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { projectsService } from '@/services/projects';
import { activityLogsService } from '@/services/activityLogs';
import type { Project } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog';
import SettingsDialog from '@/components/workspace/settings/SettingsDialog';
import ProfileDialog from '@/components/workspace/settings/ProfileDialog';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Create form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await projectsService.list(user.id);
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Filter
  const filtered = searchQuery
    ? projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  // Create
  const handleCreate = async () => {
    if (!user || !newName.trim()) { toast.error('Project name is required'); return; }
    setIsCreating(true);
    try {
      const project = await projectsService.create({
        user_id: user.id,
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setProjects(prev => [project, ...prev]);
      setCreateOpen(false);
      setNewName('');
      setNewDescription('');
      toast.success('Project created');
      activityLogsService.projectCreated(user.id, project.id, project.name);
      navigate(`/workspace/${project.id}`);
    } catch {
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  // Open — update last_opened_at optimistically
  const handleOpen = (project: Project) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, last_opened_at: new Date().toISOString() } : p));
    navigate(`/workspace/${project.id}`);
  };

  // Edit
  const openEdit = (project: Project) => {
    setEditProject(project);
    setEditName(project.name);
    setEditDescription(project.description ?? '');
  };

  const handleEdit = async () => {
    if (!editProject || !editName.trim()) { toast.error('Name is required'); return; }
    setIsSavingEdit(true);
    try {
      const updated = await projectsService.update(editProject.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditProject(null);
      toast.success('Project updated');
      activityLogsService.projectUpdated(user.id, updated.id, ['name', 'description']);
    } catch {
      toast.error('Failed to update project');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteProject) return;
    setIsDeleting(true);
    try {
      await projectsService.remove(deleteProject.id);
      setProjects(prev => prev.filter(p => p.id !== deleteProject.id));
      if (user) activityLogsService.projectDeleted(user.id, deleteProject.id);
      setDeleteProject(null);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'paused': return 'bg-amber-100 text-amber-700';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className={`h-full bg-card border-r border-border flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 -ml-64'}`}>
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="text-xl font-bold text-gradient">CampaignSync</Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-2">
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start font-medium">
              <LayoutDashboard className="mr-3 h-5 w-5" />Projects
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => setMediaLibraryOpen(true)}>
              <Image className="mr-3 h-5 w-5" />Media Library
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-3 h-5 w-5" />Settings
            </Button>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-4 cursor-pointer" onClick={() => setProfileOpen(true)}>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{user?.user_metadata?.full_name || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email || ''}</div>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="mr-3 h-4 w-4" />Logout
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold">My Projects</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />New Project
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search */}
            {projects.length > 0 && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {/* States */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading projects…</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Create your first project to start building ad campaigns visually.
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Create Your First Project
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No projects match "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(project => (
                  <Card
                    key={project.id}
                    className="group relative flex flex-col p-5 hover:shadow-md transition-shadow cursor-pointer border-border"
                    onClick={() => handleOpen(project)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleOpen(project)}>
                            <ExternalLink className="mr-2 h-4 w-4" />Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(project)}>
                            <Pencil className="mr-2 h-4 w-4" />Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteProject(project)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${statusColor(project.status)}`}>
                        {project.status}
                      </span>
                      <span className="flex items-center gap-1" title={`Updated ${format(new Date(project.updated_at), 'PPp')}`}>
                        <Clock className="h-3 w-3" />
                        {project.last_opened_at
                          ? `Opened ${formatDistanceToNow(new Date(project.last_opened_at), { addSuffix: true })}`
                          : `Updated ${formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}`
                        }
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Set up a new campaign project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="e.g. Q1 Spring Campaign"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief project description…"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={open => !open && setEditProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProject(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSavingEdit || !editName.trim()}>
              {isSavingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={open => !open && setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProject?.name}"? This will permanently remove the project and all its campaign data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shared Dialogs */}
      <MediaLibraryDialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen} onSelect={() => {}} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
};

export default Dashboard;
