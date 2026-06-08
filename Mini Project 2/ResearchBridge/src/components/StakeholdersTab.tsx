import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Button, Card, CardActions, CardContent, CardHeader,
  Chip, Grid, IconButton, Skeleton, Tooltip, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
} from '@mui/material';
import { Chat, Delete, Edit, Person } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import type { Stakeholder } from '../lib/types';
import { stanceColor, levelColor, initials, avatarColor } from '../lib/utils';
import EditStakeholderDialog from './EditStakeholderDialog';

interface Props {
  projectId: string;
  refresh: number;
}

export default function StakeholdersTab({ projectId, refresh }: Props) {
  const navigate = useNavigate();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Stakeholder | null>(null);
  const [editTarget, setEditTarget] = useState<Stakeholder | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadStakeholders();
  }, [projectId, refresh]);

  const loadStakeholders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (!error && data) setStakeholders(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('stakeholders').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to delete stakeholder.', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Stakeholder deleted.', severity: 'success' });
      setStakeholders(prev => prev.filter(s => s.id !== deleteTarget!.id));
    }
  };

  const handleUpdated = (updated: Stakeholder) => {
    setStakeholders(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSnackbar({ open: true, message: 'Stakeholder updated.', severity: 'success' });
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map(n => (
          <Grid item xs={12} md={6} key={n}>
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (stakeholders.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No stakeholders yet
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Add your first stakeholder to begin the AI-guided interview.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {stakeholders.map(stakeholder => (
          <Grid item xs={12} md={6} key={stakeholder.id}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': { boxShadow: 3, borderColor: 'primary.light' },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: avatarColor(stakeholder.name), width: 44, height: 44, fontWeight: 600 }}>
                    {initials(stakeholder.name)}
                  </Avatar>
                }
                title={<Typography variant="subtitle1" fontWeight={600}>{stakeholder.name}</Typography>}
                subheader={
                  <Typography variant="body2" color="text.secondary">{stakeholder.role}{stakeholder.organization ? ` · ${stakeholder.organization}` : ''}</Typography>
                }
                action={
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="Edit stakeholder">
                      <IconButton size="small" onClick={() => setEditTarget(stakeholder)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete stakeholder">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(stakeholder)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <CardContent sx={{ pt: 0, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label={`Stance: ${stakeholder.stance}`}
                    size="small"
                    color={stanceColor(stakeholder.stance)}
                    variant="outlined"
                  />
                  <Chip
                    label={`Influence: ${stakeholder.influence_level}`}
                    size="small"
                    color={levelColor(stakeholder.influence_level)}
                    variant="outlined"
                  />
                  <Chip
                    label={`Interest: ${stakeholder.interest_level}`}
                    size="small"
                    color={levelColor(stakeholder.interest_level)}
                    variant="outlined"
                  />
                  {stakeholder.profile_data && (
                    <Chip label="Profile Generated" size="small" color="primary" />
                  )}
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(`/project/${projectId}/stakeholder/${stakeholder.id}`)}
                  sx={{ flex: 1 }}
                >
                  View Profile
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Chat />}
                  onClick={() => navigate(`/project/${projectId}/stakeholder/${stakeholder.id}/interview`)}
                >
                  Interview
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {editTarget && (
        <EditStakeholderDialog
          open={Boolean(editTarget)}
          stakeholder={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Stakeholder?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete <strong>{deleteTarget?.name}</strong> and all interview data. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
