import { useState } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup,
  Step, StepContent, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import { supabase } from '../lib/supabase';
import type { InfluenceLevel, InterestLevel, Stance } from '../lib/types';

interface Props {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onAdded: (stakeholderId: string) => void;
}

const steps = ['Basic Information', 'Organization', 'Influence & Interest', 'Initial Stance'];

export default function AddStakeholderDialog({ open, projectId, onClose, onAdded }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [influenceLevel, setInfluenceLevel] = useState<InfluenceLevel>('medium');
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('medium');
  const [stance, setStance] = useState<Stance>('unknown');
  const [saving, setSaving] = useState(false);

  const handleReset = () => {
    setActiveStep(0);
    setName('');
    setRole('');
    setOrganization('');
    setInfluenceLevel('medium');
    setInterestLevel('medium');
    setStance('unknown');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleNext = () => setActiveStep(s => s + 1);
  const handleBack = () => setActiveStep(s => s - 1);

  const handleFinish = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('stakeholders')
      .insert({
        project_id: projectId,
        name: name.trim(),
        role: role.trim(),
        organization: organization.trim() || null,
        influence_level: influenceLevel,
        interest_level: interestLevel,
        stance,
      })
      .select()
      .single();

    if (!error && data) {
      // Create interview session
      await supabase.from('interview_sessions').insert({
        stakeholder_id: data.id,
        messages: [],
        status: 'active',
      });
      handleReset();
      onAdded(data.id);
    }
    setSaving(false);
  };

  const canNext = () => {
    if (activeStep === 0) return name.trim().length > 0 && role.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Stakeholder</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Complete the guided steps to add your stakeholder. You'll then be taken to an AI-guided
          interview to build a deeper profile.
        </Typography>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Basic Information</StepLabel>
            <StepContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Full name"
                  required
                  fullWidth
                  variant="outlined"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
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
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleNext} disabled={!canNext()}>Next</Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Organization</StepLabel>
            <StepContent>
              <Box sx={{ mt: 1 }}>
                <TextField
                  label="Organization / Department"
                  fullWidth
                  variant="outlined"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  helperText="Optional — helps the AI tailor the interview context."
                />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleNext}>Next</Button>
                <Button onClick={handleBack}>Back</Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Influence & Interest</StepLabel>
            <StepContent>
              <Box sx={{ display: 'flex', gap: 4, mt: 1, flexWrap: 'wrap' }}>
                <FormControl>
                  <FormLabel>Influence Level</FormLabel>
                  <RadioGroup value={influenceLevel} onChange={e => setInfluenceLevel(e.target.value as InfluenceLevel)}>
                    <FormControlLabel value="high" control={<Radio size="small" />} label="High" />
                    <FormControlLabel value="medium" control={<Radio size="small" />} label="Medium" />
                    <FormControlLabel value="low" control={<Radio size="small" />} label="Low" />
                  </RadioGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>Interest Level</FormLabel>
                  <RadioGroup value={interestLevel} onChange={e => setInterestLevel(e.target.value as InterestLevel)}>
                    <FormControlLabel value="high" control={<Radio size="small" />} label="High" />
                    <FormControlLabel value="medium" control={<Radio size="small" />} label="Medium" />
                    <FormControlLabel value="low" control={<Radio size="small" />} label="Low" />
                  </RadioGroup>
                </FormControl>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleNext}>Next</Button>
                <Button onClick={handleBack}>Back</Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Initial Stance</StepLabel>
            <StepContent>
              <Box sx={{ mt: 1 }}>
                <FormControl>
                  <FormLabel>How would you describe this stakeholder's current stance?</FormLabel>
                  <RadioGroup value={stance} onChange={e => setStance(e.target.value as Stance)}>
                    <FormControlLabel value="supporter" control={<Radio size="small" />} label="Supporter — generally aligned and supportive" />
                    <FormControlLabel value="neutral" control={<Radio size="small" />} label="Neutral — no strong position yet" />
                    <FormControlLabel value="blocker" control={<Radio size="small" />} label="Blocker — likely to resist or oppose" />
                    <FormControlLabel value="unknown" control={<Radio size="small" />} label="Unknown — not sure yet" />
                  </RadioGroup>
                </FormControl>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleFinish} disabled={saving}>
                  {saving ? <CircularProgress size={20} /> : 'Add & Start Interview'}
                </Button>
                <Button onClick={handleBack}>Back</Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
