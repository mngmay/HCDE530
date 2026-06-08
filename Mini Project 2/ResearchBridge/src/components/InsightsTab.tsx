import { useEffect, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Checkbox, Chip,
  CircularProgress, Collapse, FormControlLabel, Grid, LinearProgress,
  Paper, Skeleton, Snackbar, Switch, Tooltip, Typography,
} from '@mui/material';
import {
  Assessment, CheckCircle, FilterList, Groups, Lightbulb,
  Person, Refresh, Warning,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { supabase } from '../lib/supabase';
import type { Insight, ResearchDocument, Stakeholder } from '../lib/types';
import { avatarColor, initials } from '../lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface Props {
  projectId: string;
  researchCount?: number;
}

const quadrants = [
  { label: 'Manage Closely', sub: 'High Influence · High Interest', influence: 'high', interest: 'high', color: 'error' as const },
  { label: 'Keep Satisfied', sub: 'High Influence · Low Interest', influence: 'high', interest: 'low', color: 'warning' as const },
  { label: 'Keep Informed', sub: 'Low Influence · High Interest', influence: 'low', interest: 'high', color: 'info' as const },
  { label: 'Monitor', sub: 'Low Influence · Low Interest', influence: 'low', interest: 'medium', color: 'default' as const },
];

function insightIcon(type: Insight['type']) {
  if (type === 'summary') return <Assessment />;
  if (type === 'recommendation') return <Lightbulb />;
  return <Warning />;
}

function insightColor(type: Insight['type']): 'primary' | 'success' | 'error' {
  if (type === 'summary') return 'primary';
  if (type === 'recommendation') return 'success';
  return 'error';
}

export default function InsightsTab({ projectId, researchCount = 0 }: Props) {
  const theme = useTheme();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [researchDocs, setResearchDocs] = useState<ResearchDocument[]>([]);
  const [selectedResearchIds, setSelectedResearchIds] = useState<Set<string>>(new Set());
  const [crossReference, setCrossReference] = useState(true);
  const [showResearchPicker, setShowResearchPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingBriefs, setGeneratingBriefs] = useState(false);
  const [briefProgress, setBriefProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    supabase
      .from('research_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const docs = (data ?? []) as ResearchDocument[];
        setResearchDocs(docs);
        setSelectedResearchIds(new Set(docs.map(d => d.id)));
      });
  }, [projectId, researchCount]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: ins }, { data: sh }, { data: rd }] = await Promise.all([
      supabase.from('insights').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('stakeholders').select('*').eq('project_id', projectId),
      supabase.from('research_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    ]);
    if (ins) setInsights(ins);
    if (sh) setStakeholders(sh);
    if (rd) {
      const docs = rd as ResearchDocument[];
      setResearchDocs(docs);
      setSelectedResearchIds(new Set(docs.map(d => d.id)));
    }
    setLoading(false);
  };

  const toggleResearch = (id: string) => {
    setSelectedResearchIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedResearchIds.size === researchDocs.length) {
      setSelectedResearchIds(new Set());
    } else {
      setSelectedResearchIds(new Set(researchDocs.map(d => d.id)));
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const body: Record<string, unknown> = { projectId };
      if (researchDocs.length > 0) {
        body.researchIds = selectedResearchIds.size > 0 ? Array.from(selectedResearchIds) : [];
        body.crossReference = crossReference;
      }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to generate insights');
      setSnackbar({ open: true, message: 'Insights generated successfully!', severity: 'success' });
      loadData();
    } catch {
      setError('Failed to generate insights. Make sure stakeholders have been added to this project.');
    }
    setGenerating(false);
  };

  const handleGenerateBriefs = async () => {
    setGeneratingBriefs(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const total = stakeholders.length;
    setBriefProgress({ current: 0, total });

    let succeeded = 0;
    for (const sh of stakeholders) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'generate-stakeholder-brief', stakeholderId: sh.id }),
        });
        if (res.ok) succeeded++;
      } catch {
        // continue on individual failure
      }
      setBriefProgress(p => p ? { ...p, current: p.current + 1 } : null);
    }

    setGeneratingBriefs(false);
    setBriefProgress(null);
    if (succeeded > 0) {
      setSnackbar({ open: true, message: `Generated briefs for ${succeeded} of ${total} stakeholders.`, severity: 'success' });
      loadData();
    } else {
      setError('Failed to generate any stakeholder briefs.');
    }
  };

  const groupedInsights = {
    summary: insights.filter(i => i.type === 'summary'),
    recommendation: insights.filter(i => i.type === 'recommendation'),
    risk: insights.filter(i => i.type === 'risk'),
  };

  const allSelected = selectedResearchIds.size === researchDocs.length && researchDocs.length > 0;
  const someSelected = selectedResearchIds.size > 0 && selectedResearchIds.size < researchDocs.length;
  const briefCount = stakeholders.filter(s => s.stakeholder_brief).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Generate a strategic analysis of your stakeholder landscape using AI.
            {researchDocs.length > 0 && ' Select research documents to ground insights in your evidence.'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <Assessment />}
          onClick={handleGenerate}
          disabled={generating || stakeholders.length === 0}
          size="large"
        >
          {generating ? 'Generating…' : 'Generate Insights'}
        </Button>
      </Box>

      {stakeholders.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Add stakeholders to this project before generating insights.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Research selector */}
      {researchDocs.length > 0 && (
        <Paper
          elevation={0}
          sx={{ mb: 4, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.default' }}
        >
          <Box
            onClick={() => setShowResearchPicker(p => !p)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}
          >
            <FilterList color="primary" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Research Scope</Typography>
            <Chip
              label={
                selectedResearchIds.size === 0
                  ? 'Stakeholder profiles only'
                  : selectedResearchIds.size === researchDocs.length
                  ? `All ${researchDocs.length} documents`
                  : `${selectedResearchIds.size} of ${researchDocs.length} documents`
              }
              size="small"
              color={selectedResearchIds.size > 0 ? 'primary' : 'default'}
              variant={selectedResearchIds.size > 0 ? 'filled' : 'outlined'}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {showResearchPicker ? '▲' : '▼'}
            </Typography>
          </Box>

          <Collapse in={showResearchPicker}>
            <Box sx={{ mt: 2, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={allSelected} indeterminate={someSelected} onChange={handleSelectAll} size="small" />}
                  label={<Typography variant="body2" fontWeight={600}>Select all</Typography>}
                />
                <Tooltip title="When enabled, the AI triangulates patterns and conflicts across all selected research and stakeholder data rather than analyzing each document in isolation.">
                  <FormControlLabel
                    control={<Switch checked={crossReference} onChange={e => setCrossReference(e.target.checked)} size="small" color="primary" />}
                    label={<Typography variant="body2">Cross-reference</Typography>}
                    sx={{ mr: 0 }}
                  />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {researchDocs.map(doc => (
                  <Box
                    key={doc.id}
                    onClick={() => toggleResearch(doc.id)}
                    sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25,
                      borderRadius: 2, cursor: 'pointer',
                      bgcolor: selectedResearchIds.has(doc.id) ? 'primary.50' : 'transparent',
                      border: '1px solid',
                      borderColor: selectedResearchIds.has(doc.id) ? 'primary.200' : 'transparent',
                      transition: theme.transitions.create(['background-color', 'border-color'], { duration: theme.transitions.duration.shorter }),
                      '&:hover': { bgcolor: selectedResearchIds.has(doc.id) ? 'primary.50' : 'action.hover' },
                    }}
                  >
                    <Checkbox
                      checked={selectedResearchIds.has(doc.id)}
                      size="small"
                      sx={{ p: 0, mt: 0.1 }}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleResearch(doc.id)}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{doc.title}</Typography>
                      {doc.source && <Typography variant="caption" color="text.disabled" noWrap display="block">{doc.source}</Typography>}
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                      {Math.ceil(doc.content.length / 1000)}k chars
                    </Typography>
                  </Box>
                ))}
              </Box>
              {selectedResearchIds.size === 0 && (
                <Alert severity="info" sx={{ mt: 1.5 }} icon={false}>
                  <Typography variant="caption">No research selected — insights will be generated from stakeholder profiles only.</Typography>
                </Alert>
              )}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Stakeholder matrix */}
      {stakeholders.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Groups color="primary" />
            <Typography variant="h6" fontWeight={600}>Stakeholder Matrix</Typography>
          </Box>
          <Grid container spacing={2}>
            {quadrants.map(q => {
              const qStakeholders = stakeholders.filter(s => {
                if (q.interest === 'medium') return s.influence_level !== 'high' && s.interest_level !== 'high';
                return s.influence_level === q.influence && s.interest_level === q.interest;
              });
              return (
                <Grid item xs={12} sm={6} key={q.label}>
                  <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, minHeight: 120 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{q.label}</Typography>
                        <Typography variant="caption" color="text.disabled">{q.sub}</Typography>
                      </Box>
                      <Chip label={qStakeholders.length} size="small" color={q.color} />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {qStakeholders.map(s => (
                        <Tooltip key={s.id} title={`${s.role}${s.organization ? ` · ${s.organization}` : ''}`}>
                          <Chip
                            avatar={
                              <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: avatarColor(s.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: 'white', fontWeight: 700 }}>
                                {initials(s.name)}
                              </Box>
                            }
                            label={s.name}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      ))}
                      {qStakeholders.length === 0 && <Typography variant="caption" color="text.disabled">No stakeholders</Typography>}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Stakeholder Engagement Briefs section */}
      {stakeholders.length > 0 && (
        <Paper
          elevation={0}
          sx={{ mb: 4, p: 3, border: '1px solid', borderColor: 'secondary.200', borderRadius: 3, bgcolor: 'secondary.50' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Person color="secondary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700} color="secondary.main">
                  Stakeholder Engagement Briefs
                </Typography>
                {briefCount > 0 && (
                  <Chip label={`${briefCount}/${stakeholders.length}`} size="small" color="secondary" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generate personalized engagement briefs for each stakeholder — tailored key messages, talking points, and communication approaches.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={generatingBriefs ? <CircularProgress size={16} color="inherit" /> : <Person />}
              onClick={handleGenerateBriefs}
              disabled={generatingBriefs}
            >
              {generatingBriefs
                ? briefProgress
                  ? `Generating ${briefProgress.current + 1}/${briefProgress.total}…`
                  : 'Generating…'
                : briefCount === stakeholders.length
                ? 'Regenerate All Briefs'
                : 'Generate All Briefs'}
            </Button>
          </Box>

          {generatingBriefs && briefProgress && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(briefProgress.current / briefProgress.total) * 100}
                color="secondary"
                sx={{ borderRadius: 1, height: 6 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                Processing stakeholder {briefProgress.current + 1} of {briefProgress.total}…
              </Typography>
            </Box>
          )}

          {!generatingBriefs && stakeholders.length > 0 && (
            <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stakeholders.map(s => (
                <Tooltip
                  key={s.id}
                  title={s.stakeholder_brief
                    ? `Brief generated ${new Date(s.stakeholder_brief.generated_at).toLocaleDateString()}`
                    : 'No brief yet — click Generate All Briefs'}
                >
                  <Chip
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: s.stakeholder_brief ? 'secondary.main' : 'grey.400',
                          width: 20,
                          height: 20,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                        }}
                      >
                        {initials(s.name)}
                      </Avatar>
                    }
                    label={s.name}
                    size="small"
                    variant={s.stakeholder_brief ? 'filled' : 'outlined'}
                    color={s.stakeholder_brief ? 'secondary' : 'default'}
                    icon={s.stakeholder_brief ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : undefined}
                    sx={{ '& .MuiChip-icon': { ml: '6px' } }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Insights list */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map(n => (
            <Grid item xs={12} key={n}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : insights.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Assessment sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">No insights generated yet.</Typography>
          <Typography variant="body2" color="text.disabled">
            Click "Generate Insights" to create your landscape analysis.
          </Typography>
        </Box>
      ) : (
        <Box>
          {(['summary', 'recommendation', 'risk'] as const).map(type => {
            const group = groupedInsights[type];
            if (group.length === 0) return null;
            const labels = { summary: 'Landscape Summary', recommendation: 'Engagement Recommendations', risk: 'Risk Areas' };
            return (
              <Box key={type} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ color: `${insightColor(type)}.main` }}>{insightIcon(type)}</Box>
                  <Typography variant="h6" fontWeight={600}>{labels[type]}</Typography>
                  <Chip label={group.length} size="small" color={insightColor(type)} sx={{ ml: 'auto' }} />
                </Box>
                <Grid container spacing={2}>
                  {group.map(insight => (
                    <Grid item xs={12} key={insight.id}>
                      <Card
                        elevation={0}
                        sx={{
                          border: '1px solid', borderColor: `${insightColor(insight.type)}.200`,
                          borderLeft: '4px solid', borderLeftColor: `${insightColor(insight.type)}.main`,
                        }}
                      >
                        <CardContent>
                          <Typography variant="body2" color="text.secondary" lineHeight={1.8} sx={{ whiteSpace: 'pre-wrap' }}>
                            {insight.content}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button startIcon={<Refresh />} onClick={handleGenerate} disabled={generating} variant="outlined" size="small">
              Regenerate Insights
            </Button>
          </Box>
        </Box>
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
    </Box>
  );
}
