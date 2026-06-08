import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import type { InfluenceLevel, InterestLevel, Stakeholder, Stance } from '../lib/types';

interface Props {
  open: boolean;
  stakeholder: Stakeholder;
  onClose: () => void;
  onUpdated: (stakeholder: Stakeholder) => void;
}

export default function EditStakeholderDialog({ open, stakeholder, onClose, onUpdated }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [influenceLevel, setInfluenceLevel] = useState<InfluenceLevel>('medium');
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('medium');
  const [stance, setStance] = useState<Stance>('unknown');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(stakeholder.name);
      setRole(stakeholder.role);
      setOrganization(stakeholder.organization ?? '');
      setInfluenceLevel(stakeholder.influence_level);
      setInterestLevel(stakeholder.interest_level);
      setStance(stakeholder.stance);
      setNotes(stakeholder.notes ?? '');
      setError('');
    }
  }, [open, stakeholder]);

  const handleSave = async () => {
    if (!name.trim() || !role.trim()) return;
    setSaving(true);
    setError('');
    const { data, error: err } = await supabase
      .from('stakeholders')
      .update({
        name: name.trim(),
        role: role.trim(),
        organization: organization.trim() || null,
        influence_level: influenceLevel,
        interest_level: interestLevel,
        stance,
        notes: notes.trim() || null,
      })
      .eq('id', stakeholder.id)
      .select()
      .single();
    setSaving(false);
    if (err) {
      setError('Failed to save changes. Please try again.');
    } else {
      onUpdated(data);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Stakeholder</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Full name"
              required
              fullWidth
              variant="outlined"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <TextField
              label="Role / Title"
              required
              fullWidth
              variant="outlined"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </Box>
          <TextField
            label="Organization / Department"
            fullWidth
            variant="outlined"
            value={organization}
            onChange={e => setOrganization(e.target.value)}
            helperText="Optional"
          />
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <FormControl>
              <FormLabel>Influence Level</FormLabel>
              <RadioGroup
                value={influenceLevel}
                onChange={e => setInfluenceLevel(e.target.value as InfluenceLevel)}
                row
              >
                <FormControlLabel value="high" control={<Radio size="small" />} label="High" />
                <FormControlLabel value="medium" control={<Radio size="small" />} label="Medium" />
                <FormControlLabel value="low" control={<Radio size="small" />} label="Low" />
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Interest Level</FormLabel>
              <RadioGroup
                value={interestLevel}
                onChange={e => setInterestLevel(e.target.value as InterestLevel)}
                row
              >
                <FormControlLabel value="high" control={<Radio size="small" />} label="High" />
                <FormControlLabel value="medium" control={<Radio size="small" />} label="Medium" />
                <FormControlLabel value="low" control={<Radio size="small" />} label="Low" />
              </RadioGroup>
            </FormControl>
          </Box>
          <FormControl>
            <FormLabel>Stance</FormLabel>
            <RadioGroup value={stance} onChange={e => setStance(e.target.value as Stance)}>
              <FormControlLabel value="supporter" control={<Radio size="small" />} label="Supporter — generally aligned and supportive" />
              <FormControlLabel value="neutral" control={<Radio size="small" />} label="Neutral — no strong position yet" />
              <FormControlLabel value="blocker" control={<Radio size="small" />} label="Blocker — likely to resist or oppose" />
              <FormControlLabel value="unknown" control={<Radio size="small" />} label="Unknown — not sure yet" />
            </RadioGroup>
          </FormControl>
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            helperText="Any additional context about this stakeholder."
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={!name.trim() || !role.trim() || saving}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
