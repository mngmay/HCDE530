import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardActions, CardContent, CardHeader,
  Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent,
  DialogTitle, Fab, Grid, IconButton, Skeleton, Snackbar, Alert,
  TextField, Typography, Tooltip,
} from '@mui/material';
import { Add, FolderOpen, Delete, Folder } from '@mui/icons-material';
import AppShell from '../components/AppShell';
import { supabase } from '../lib/supabase';
import type { Project } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      name: name.trim(),
      description: description.trim() || null,
      user_id: user!.id,
    });
    setSaving(false);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to create project.', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Project created!', severity: 'success' });
      setCreateOpen(false);
      setName('');
      setDescription('');
      loadProjects();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('projects').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to delete project.', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Project deleted.', severity: 'success' });
      setProjects(prev => prev.filter(p => p.id !== deleteTarget!.id));
    }
  };

  return (
    <AppShell title="Dashboard">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Your Projects</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Select a project to manage stakeholders and generate insights.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            New Project
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map(n => (
              <Grid item xs={12} sm={6} lg={4} key={n}>
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Folder sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body2" color="text.disabled" mb={3}>
              Create your first project to start mapping stakeholders.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
              New Project
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {projects.map(project => (
              <Grid item xs={12} sm={6} lg={4} key={project.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    border: '1px solid', borderColor: 'divider',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    '&:hover': { boxShadow: 4, borderColor: 'primary.light' },
                  }}
                >
                  <CardHeader
                    avatar={<Box sx={{ width: 40, height: 40, bgcolor: 'primary.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FolderOpen sx={{ color: 'white', fontSize: 20 }} /></Box>}
                    title={<Typography variant="subtitle1" fontWeight={600} noWrap>{project.name}</Typography>}
                    subheader={
                      <Chip label={`Updated ${formatDate(project.updated_at)}`} size="small" variant="outlined" sx={{ mt: 0.5, fontSize: '0.7rem' }} />
                    }
                  />
                  <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description || 'No description provided.'}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/project/${project.id}`)}
                      sx={{ flex: 1 }}
                    >
                      Open
                    </Button>
                    <Tooltip title="Delete project">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(project)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Mobile FAB */}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24, display: { sm: 'none' } }}
          onClick={() => setCreateOpen(true)}
        >
          <Add />
        </Fab>
      </Container>

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Project</DialogTitle>
        <DialogContent>
          <TextField
            label="Project name"
            fullWidth
            required
            variant="outlined"
            value={name}
            onChange={e => setName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            autoFocus
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? <CircularProgress size={20} /> : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete <strong>{deleteTarget?.name}</strong> and all associated
            stakeholders and insights. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppShell>
  );
}
