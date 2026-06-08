import { useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Paper,
  Snackbar, TextField, Typography,
} from '@mui/material';
import { AutoAwesome, Save, Tune } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import type { Project } from '../lib/types';

interface Props {
  project: Project;
  onUpdated: (project: Project) => void;
}

const RULE_PRESETS = [
  'Use a formal, professional tone',
  'Keep responses concise and direct',
  'Use a warm and conversational style',
  'Avoid technical jargon',
  'Focus on business value and ROI',
  'Emphasize risks and mitigations',
  'Tailor language to a non-technical audience',
  'Use plain language throughout',
];

export default function SettingsTab({ project, onUpdated }: Props) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [rules, setRules] = useState(project.rules ?? '');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        rules: rules.trim() || null,
      })
      .eq('id', project.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to save changes.', severity: 'error' });
    } else {
      onUpdated(data);
      setSnackbar({ open: true, message: 'Project updated.', severity: 'success' });
    }
  };

  const insertPreset = (preset: string) => {
    setRules(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n- ${preset}` : `- ${preset}`;
    });
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      {/* Project Details */}
      <Typography variant="h6" fontWeight={600} gutterBottom>Project Details</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your project name and description.
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Project name"
          fullWidth
          required
          variant="outlined"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={e => setDescription(e.target.value)}
          helperText="Briefly describe the purpose or context of this project."
        />
      </Box>

      {/* Project Rules */}
      <Box sx={{ mt: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Tune color="primary" fontSize="small" />
          <Typography variant="h6" fontWeight={600}>Project Rules</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set tone, style, and focus guidelines that the AI will follow across all interviews
          and insights in this project.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.5,
            border: '1px solid',
            borderColor: 'primary.200',
            borderRadius: 3,
            bgcolor: 'primary.50',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AutoAwesome sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={700} color="primary.main" textTransform="uppercase" letterSpacing={0.8}>
              Quick Presets
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {RULE_PRESETS.map(preset => (
              <Chip
                key={preset}
                label={preset}
                size="small"
                variant="outlined"
                onClick={() => insertPreset(preset)}
                sx={{
                  cursor: 'pointer',
                  borderColor: 'primary.300',
                  color: 'primary.700',
                  '&:hover': { bgcolor: 'primary.100', borderColor: 'primary.main' },
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </Box>
        </Paper>

        <TextField
          label="Rules &amp; Guidelines"
          fullWidth
          multiline
          rows={7}
          variant="outlined"
          value={rules}
          onChange={e => setRules(e.target.value)}
          placeholder={`Examples:\n- Use a formal, professional tone throughout all interviews\n- Focus questions on business outcomes and stakeholder influence\n- Avoid asking about internal politics or interpersonal conflicts\n- Tailor language to a non-technical audience`}
          helperText="Plain text or bullet points. Applied to AI interviews, profile generation, and insights."
          inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.7 } }}
        />
      </Box>

      <Box sx={{ mt: 3.5 }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={!name.trim() || saving}
          size="large"
        >
          Save Changes
        </Button>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
