import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box,
  Breadcrumbs, Button, Chip, CircularProgress, Container, Divider,
  Grid, Link, Paper, Skeleton, Snackbar, Typography,
} from '@mui/material';
import {
  ArrowBack, Assessment, Block, Chat, CheckCircle, Edit, ExpandMore,
  Forum, Lightbulb, PriorityHigh, Psychology, Refresh, Warning,
} from '@mui/icons-material';
import AppShell from '../components/AppShell';
import EditStakeholderDialog from '../components/EditStakeholderDialog';
import { supabase } from '../lib/supabase';
import type { Stakeholder, InterviewSession } from '../lib/types';
import { stanceColor, levelColor, initials, avatarColor } from '../lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function StakeholderProfilePage() {
  const { id: projectId, stakeholderId } = useParams<{ id: string; stakeholderId: string }>();
  const navigate = useNavigate();
  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!stakeholderId) return;
    Promise.all([
      supabase.from('stakeholders').select('*').eq('id', stakeholderId).single(),
      supabase.from('interview_sessions').select('*').eq('stakeholder_id', stakeholderId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]).then(([{ data: sh }, { data: sess }]) => {
      if (!sh) { navigate(`/project/${projectId}`); return; }
      setStakeholder(sh);
      if (sess) setSession(sess);
      setLoading(false);
    });
  }, [stakeholderId]);

  const handleGenerateBrief = async () => {
    if (!stakeholderId) return;
    setGeneratingBrief(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'generate-stakeholder-brief', stakeholderId }),
      });
      if (!res.ok) throw new Error('Failed');
      const { brief } = await res.json();
      setStakeholder(prev => prev ? { ...prev, stakeholder_brief: brief } : prev);
      setSnackbar({ open: true, message: 'Engagement brief generated.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to generate brief. Try again.', severity: 'error' });
    }
    setGeneratingBrief(false);
  };

  if (loading) {
    return (
      <AppShell title="Stakeholder Profile">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rounded" height={300} sx={{ mt: 3 }} />
        </Container>
      </AppShell>
    );
  }

  if (!stakeholder) return null;

  const profile = stakeholder.profile_data;
  const brief = stakeholder.stakeholder_brief;

  return (
    <AppShell title={stakeholder.name}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/dashboard" underline="hover" color="text.secondary">Dashboard</Link>
          <Link component={RouterLink} to={`/project/${projectId}`} underline="hover" color="text.secondary">Project</Link>
          <Typography color="text.primary" fontWeight={500}>{stakeholder.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={3}>
          {/* Left: Stakeholder Details */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 72, height: 72, bgcolor: avatarColor(stakeholder.name), fontSize: '1.5rem', fontWeight: 700, mb: 2 }}
                >
                  {initials(stakeholder.name)}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>{stakeholder.name}</Typography>
                <Typography variant="body2" color="text.secondary">{stakeholder.role}</Typography>
                {stakeholder.organization && (
                  <Typography variant="body2" color="text.secondary">{stakeholder.organization}</Typography>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Stance</Typography>
                  <Chip label={stakeholder.stance} size="small" color={stanceColor(stakeholder.stance)} variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Influence</Typography>
                  <Chip label={stakeholder.influence_level} size="small" color={levelColor(stakeholder.influence_level)} variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Interest</Typography>
                  <Chip label={stakeholder.interest_level} size="small" color={levelColor(stakeholder.interest_level)} variant="outlined" />
                </Box>
                {stakeholder.notes && (
                  <>
                    <Divider />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {stakeholder.notes}
                    </Typography>
                  </>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" startIcon={<Edit />} fullWidth onClick={() => setEditOpen(true)}>
                  Edit Stakeholder
                </Button>
                <Button variant="outlined" startIcon={<Chat />} fullWidth onClick={() => navigate(`/project/${projectId}/stakeholder/${stakeholderId}/interview`)}>
                  Continue Interview
                </Button>
                <Button variant="text" startIcon={<ArrowBack />} fullWidth component={RouterLink} to={`/project/${projectId}`}>
                  Back to Project
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Right: AI Profile + Engagement Brief */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Engagement Brief */}
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid', borderColor: 'secondary.200', borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                {/* Brief header */}
                <Box
                  sx={{
                    px: 3, py: 2, bgcolor: 'secondary.50',
                    borderBottom: '1px solid', borderBottomColor: 'secondary.200',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Forum color="secondary" />
                    <Typography variant="h6" fontWeight={700} color="secondary.main">Engagement Brief</Typography>
                    {brief && (
                      <Chip
                        label={`Updated ${new Date(brief.generated_at).toLocaleDateString()}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ ml: 0.5 }}
                      />
                    )}
                  </Box>
                  <Button
                    size="small"
                    variant={brief ? 'outlined' : 'contained'}
                    color="secondary"
                    startIcon={generatingBrief
                      ? <CircularProgress size={14} color="inherit" />
                      : brief ? <Refresh /> : <Forum />}
                    onClick={handleGenerateBrief}
                    disabled={generatingBrief}
                  >
                    {generatingBrief ? 'Generating…' : brief ? 'Regenerate' : 'Generate Brief'}
                  </Button>
                </Box>

                {/* Brief content */}
                {!brief ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Forum sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No engagement brief yet
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Generate a personalized brief with tailored key messages, communication approach, talking points, and things to avoid.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Executive Summary */}
                    <Box
                      sx={{
                        p: 2.5, borderRadius: 2,
                        bgcolor: 'secondary.50',
                        border: '1px solid', borderColor: 'secondary.200',
                      }}
                    >
                      <Typography variant="body2" color="secondary.dark" fontWeight={500} lineHeight={1.8}>
                        {brief.executive_summary}
                      </Typography>
                    </Box>

                    <Grid container spacing={2.5}>
                      {/* Key Messages */}
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                            <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Key Messages</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {brief.key_messages.map((msg, i) => (
                              <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box
                                  sx={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    bgcolor: 'secondary.main', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.6rem', fontWeight: 700, flexShrink: 0, mt: 0.25,
                                  }}
                                >
                                  {i + 1}
                                </Box>
                                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{msg}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Grid>

                      {/* Communication Approach */}
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                            <Psychology sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Communication Approach</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                            {brief.communication_approach}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Talking Points */}
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                            <Lightbulb sx={{ fontSize: 18, color: 'warning.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Talking Points</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {brief.talking_points.map((point, i) => (
                              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <PriorityHigh sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0, mt: 0.3 }} />
                                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{point}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Grid>

                      {/* Things to Avoid */}
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                            <Block sx={{ fontSize: 18, color: 'error.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Things to Avoid</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {brief.things_to_avoid.map((item, i) => (
                              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <Warning sx={{ fontSize: 14, color: 'error.main', flexShrink: 0, mt: 0.3 }} />
                                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{item}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>

              {/* AI Profile */}
              {!profile ? (
                <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
                  <Assessment sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>No Profile Generated Yet</Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                    Complete the AI-guided interview and click "Generate Profile" to create a structured stakeholder analysis.
                  </Typography>
                  <Button variant="contained" startIcon={<Chat />} onClick={() => navigate(`/project/${projectId}/stakeholder/${stakeholderId}/interview`)}>
                    Go to Interview
                  </Button>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Psychology color="primary" />
                      <Typography variant="h6" fontWeight={600}>Profile Summary</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{profile.summary}</Typography>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PriorityHigh color="secondary" />
                      <Typography variant="h6" fontWeight={600}>Key Priorities</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {profile.key_priorities.map((p, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, mt: 0.25 }}>
                            {i + 1}
                          </Box>
                          <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{p}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Warning color="warning" />
                      <Typography variant="h6" fontWeight={600}>Potential Concerns</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {profile.potential_concerns.map((c, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Warning sx={{ fontSize: 16, color: 'warning.main', flexShrink: 0, mt: 0.25 }} />
                          <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{c}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Lightbulb color="success" />
                      <Typography variant="h6" fontWeight={600}>Engagement Recommendations</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {profile.engagement_recommendations.map((r, i) => (
                        <Box key={i} sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                          <Typography variant="body2" lineHeight={1.7}>{r}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Assessment color="error" />
                      <Typography variant="h6" fontWeight={600}>Risk Assessment</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{profile.risk_assessment}</Typography>
                  </Paper>
                </Box>
              )}

              {/* Interview Transcript */}
              {session && session.messages.length > 0 && (
                <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chat fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={600}>
                        Interview Transcript ({session.messages.length} messages)
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {session.messages.map((msg, i) => (
                        <Box key={i}>
                          <Typography variant="caption" color="text.disabled" fontWeight={600} textTransform="uppercase">
                            {msg.role === 'assistant' ? 'AI Interviewer' : 'Researcher'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {msg.content}
                          </Typography>
                          {i < session.messages.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          </Grid>
        </Grid>

        {stakeholder && (
          <EditStakeholderDialog
            open={editOpen}
            stakeholder={stakeholder}
            onClose={() => setEditOpen(false)}
            onUpdated={updated => {
              setStakeholder(updated);
              setSnackbar({ open: true, message: 'Stakeholder updated.', severity: 'success' });
            }}
          />
        )}

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
      </Container>
    </AppShell>
  );
}
