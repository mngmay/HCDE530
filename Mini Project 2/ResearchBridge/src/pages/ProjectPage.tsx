import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Breadcrumbs, Button, Container, Fab, Link,
  Skeleton, Tab, Tabs, Typography, Alert,
} from '@mui/material';
import { Add, ArrowBack } from '@mui/icons-material';
import AppShell from '../components/AppShell';
import StakeholdersTab from '../components/StakeholdersTab';
import InsightsTab from '../components/InsightsTab';
import ResearchTab from '../components/ResearchTab';
import SettingsTab from '../components/SettingsTab';
import AddStakeholderDialog from '../components/AddStakeholderDialog';
import { supabase } from '../lib/supabase';
import type { Project } from '../lib/types';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box>{children}</Box> : null;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [stakeholdersRefresh, setStakeholdersRefresh] = useState(0);
  const [researchCount, setResearchCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from('projects').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) {
        navigate('/dashboard');
      } else {
        setProject(data);
      }
      setLoading(false);
    });
  }, [id, navigate]);

  const handleStakeholderAdded = (stakeholderId: string) => {
    setAddOpen(false);
    setStakeholdersRefresh(r => r + 1);
    navigate(`/project/${id}/stakeholder/${stakeholderId}/interview`);
  };

  if (loading) {
    return (
      <AppShell title="Loading...">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rounded" height={48} sx={{ mt: 3, mb: 2 }} />
          <Skeleton variant="rounded" height={400} />
        </Container>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Project not found.</Alert>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell title={project.name}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/dashboard" underline="hover" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowBack fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary" fontWeight={500}>{project.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{project.name}</Typography>
            {project.description && (
              <Typography variant="body2" color="text.secondary" mt={0.5}>{project.description}</Typography>
            )}
          </Box>
          {tab === 0 && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              Add Stakeholder
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Stakeholders" />
            <Tab label="Research" />
            <Tab label="Insights" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tab} index={0}>
          <StakeholdersTab projectId={project.id} refresh={stakeholdersRefresh} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <ResearchTab projectId={project.id} onCountChange={setResearchCount} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <InsightsTab projectId={project.id} researchCount={researchCount} />
        </TabPanel>
        <TabPanel value={tab} index={3}>
          <SettingsTab project={project} onUpdated={setProject} />
        </TabPanel>

        {/* Mobile FAB */}
        {tab === 0 && (
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 24, right: 24, display: { sm: 'none' } }}
            onClick={() => setAddOpen(true)}
          >
            <Add />
          </Fab>
        )}
      </Container>

      <AddStakeholderDialog
        open={addOpen}
        projectId={project.id}
        onClose={() => setAddOpen(false)}
        onAdded={handleStakeholderAdded}
      />
    </AppShell>
  );
}
