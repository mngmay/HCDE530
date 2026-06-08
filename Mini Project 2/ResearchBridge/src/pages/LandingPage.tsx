import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, CardHeader, Chip, Container,
  Divider, Grid, List, ListItem, ListItemIcon, ListItemText,
  Paper, Typography, useTheme,
} from '@mui/material';
import {
  Psychology, Lightbulb, Assessment, Chat,
  PersonAdd, CheckCircle, ArrowForward,
  DesignServices, ManageAccounts, Analytics, BusinessCenter,
  AutoAwesome, Speed, Tune,
} from '@mui/icons-material';

const features = [
  {
    icon: <AutoAwesome fontSize="large" />,
    title: 'Insights Tailored to Each Stakeholder',
    description:
      'Research Bridge generates a structured profile for every person you interview — capturing their key priorities, potential concerns, influence patterns, and a personalized engagement strategy based on exactly who they are and what they said.',
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Hours of Synthesis — Done in Minutes',
    description:
      'Skip the post-interview grind. AI turns your conversation into a complete stakeholder analysis automatically — so researchers spend less time on documentation and more time on decisions that move work forward.',
  },
  {
    icon: <Tune fontSize="large" />,
    title: 'A Landscape View Across Your Whole Project',
    description:
      'Aggregate insights across all stakeholders to get a strategic picture of your whole ecosystem — who to manage closely, where risks are hiding, and which engagement moves will build the most alignment.',
  },
];

const audiences = [
  {
    icon: <ManageAccounts fontSize="large" />,
    title: 'Project Managers',
    description:
      'Replace hours of manual synthesis with one click. Get tailored engagement plans for every stakeholder, plus a project-wide risk and alignment view — ready before your next standup.',
  },
  {
    icon: <DesignServices fontSize="large" />,
    title: 'Designers',
    description:
      'Know what actually motivates each decision-maker before you present. Research Bridge surfaces the unstated priorities and concerns that make or break design reviews.',
  },
  {
    icon: <Analytics fontSize="large" />,
    title: 'UX Researchers',
    description:
      'Your interview notes become structured, shareable insights automatically. Spend your time doing research — not reformatting it for a dozen different stakeholders.',
  },
  {
    icon: <BusinessCenter fontSize="large" />,
    title: 'Business Strategists',
    description:
      'Get a living map of influence, interest, and risk across your stakeholder ecosystem. Know who to engage, how, and when — backed by evidence from your own research.',
  },
];

const advantages = [
  {
    icon: <PersonAdd color="primary" />,
    step: '01',
    title: 'Define Your Stakeholders',
    description:
      'Add each stakeholder with their role, organization, influence level, and stance. Research Bridge uses this context to personalize every insight it generates for them.',
  },
  {
    icon: <Chat color="secondary" />,
    step: '02',
    title: 'Let the AI Interview Them',
    description:
      "The AI conducts a structured conversation, asking follow-up questions calibrated to each stakeholder's profile — surfacing priorities, concerns, and motivations you'd otherwise miss.",
  },
  {
    icon: <Psychology color="primary" />,
    step: '03',
    title: 'Get a Profile Built for Them',
    description:
      'One click turns the interview into a tailored profile — specific engagement recommendations, risk flags, and key priorities written for this person, not a generic template.',
  },
  {
    icon: <Lightbulb color="secondary" />,
    step: '04',
    title: 'See the Strategic Picture',
    description:
      'Aggregate all your stakeholders into a landscape analysis in seconds. Influence-interest matrix, risk hotspots, and project-wide engagement strategy — ready to act on.',
  },
];

export default function LandingPage() {
  const theme = useTheme();

  return (
    <Box>
      {/* Nav */}
      <Box
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(27, 10, 60, 0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box component="img" src="/logo.webp" alt="Research Bridge" sx={{ height: 36 }} />
              <Typography variant="h6" fontWeight={700} color="white">
                Research Bridge
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button component={RouterLink} to="/signin" variant="text" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                Sign In
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                color="secondary"
                size="small"
                sx={{ borderRadius: 10 }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `url(/hero-bg.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(59,15,140,0.88) 0%, rgba(91,33,182,0.78) 50%, rgba(109,40,217,0.72) 100%)',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pt: 12, pb: 8 }}>
          <Chip
            label="For Researchers, Designers & Strategists"
            size="small"
            sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)', border: '1px solid', backdropFilter: 'blur(4px)' }}
          />
          <Typography variant="h2" fontWeight={800} color="white" sx={{ mb: 3, lineHeight: 1.15 }}>
            Research Bridge
          </Typography>
          <Typography variant="h5" color="rgba(255,255,255,0.9)" fontWeight={400} sx={{ mb: 2, lineHeight: 1.6 }}>
            Turn stakeholder conversations into tailored insights — faster than you thought possible
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.72)" sx={{ mb: 5, maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
            Stop spending hours synthesizing notes. Research Bridge conducts AI-guided stakeholder
            interviews, then automatically generates a personalized profile and engagement strategy
            for each person — so your insights actually land.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                px: 4, py: 1.5, fontSize: '1rem', borderRadius: 10,
                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' },
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{ px: 4, py: 1.5, fontSize: '1rem', borderRadius: 10, borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}
            >
              See How It Works
            </Button>
          </Box>
        </Container>
      </Box>

      {/* What Is It */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="overline" color="secondary" fontWeight={600} letterSpacing={2}>
              The Platform
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1, mb: 2 }}>
              Insights that are built for the person in the room
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', lineHeight: 1.8 }}>
              Research Bridge doesn't just record what stakeholders say — it generates insights
              tailored to each person's role, influence, and stance, then surfaces the strategic
              picture across your entire project. Less time documenting. More time deciding.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {features.map((feature) => (
              <Grid item xs={12} md={4} key={feature.title}>
                <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, p: 1, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: theme.shadows[4] } }}>
                  <CardHeader
                    avatar={<Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>}
                    title={<Typography variant="h6" fontWeight={600}>{feature.title}</Typography>}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Who Is It For */}
      <Box sx={{ py: 10, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="overline" color="secondary" fontWeight={600} letterSpacing={2}>
              Who It's For
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              Save hours. Ship better work.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {audiences.map((audience) => (
              <Grid item xs={12} sm={6} key={audience.title}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', border: `1px solid ${theme.palette.divider}`, borderRadius: 3, display: 'flex', gap: 2, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: theme.shadows[3] } }}>
                  <Box sx={{ color: 'secondary.main', flexShrink: 0, mt: 0.5 }}>{audience.icon}</Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {audience.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                      {audience.description}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works / Advantages */}
      <Box id="how-it-works" sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="overline" color="secondary" fontWeight={600} letterSpacing={2}>
              The Workflow
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              From first conversation to strategic clarity
            </Typography>
          </Box>
          <Grid container spacing={4} alignItems="stretch">
            {advantages.map((adv, i) => (
              <Grid item xs={12} sm={6} md={3} key={adv.step}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '50%',
                      bgcolor: i % 2 === 0 ? 'primary.main' : 'secondary.main',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', flexShrink: 0,
                    }}>
                      {adv.icon}
                    </Box>
                    <Typography variant="h5" fontWeight={800} color="text.disabled">
                      {adv.step}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {adv.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                    {adv.description}
                  </Typography>
                  {i < advantages.length - 1 && (
                    <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 'auto', pt: 2, color: 'text.disabled' }}>
                      <ArrowForward />
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Demo Preview */}
      <Box sx={{ py: 10, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" color="secondary" fontWeight={600} letterSpacing={2}>
              Preview
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1, mb: 2 }}>
              See Research Bridge in Action
            </Typography>
            <Typography variant="body1" color="text.secondary">
              From your project dashboard to a full stakeholder insights view — in minutes, not hours.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={4}
                sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}
              >
                <Box sx={{ bgcolor: 'grey.200', px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#febc2e' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#28c840' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    Project Dashboard
                  </Typography>
                </Box>
                <Box component="img" src="/demo-dashboard.webp" alt="Project dashboard" sx={{ width: '100%', display: 'block' }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={4}
                sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}
              >
                <Box sx={{ bgcolor: 'grey.200', px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#febc2e' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#28c840' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    Stakeholder Insights — Tailored Per Person
                  </Typography>
                </Box>
                <Box component="img" src="/demo-chat.webp" alt="Stakeholder insights" sx={{ width: '100%', display: 'block' }} />
              </Paper>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4 }}>
            <List dense>
              {[
                'Add stakeholders in minutes — with just their name, role, and influence level',
                'AI interviews them and uncovers what matters most to each person specifically',
                'Get a tailored profile and engagement strategy for every stakeholder, instantly',
                'One-click landscape analysis across your entire project — risks, gaps, and all',
              ].map(item => (
                <ListItem key={item} disableGutters sx={{ justifyContent: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle color="secondary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} sx={{ flex: 'none' }} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ py: 10, background: 'linear-gradient(135deg, #3B0F8C 0%, #5B21B6 60%, #7C3AED 100%)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
            Stop synthesizing. Start deciding.
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.78)" sx={{ mb: 5, lineHeight: 1.8 }}>
            Research Bridge turns your stakeholder conversations into tailored insights and
            strategic recommendations — automatically. Spend less time on documentation and
            more time building the alignment that makes great work possible.
          </Typography>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              px: 5, py: 1.75, fontSize: '1.05rem', mb: 3, borderRadius: 10,
              background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' },
            }}
          >
            Try Now
          </Button>
          <Typography variant="caption" display="block" color="rgba(255,255,255,0.5)">
            This is a demo project — please do not enter real or sensitive information.
          </Typography>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: 'grey.900' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box component="img" src="/logo.webp" alt="Research Bridge" sx={{ height: 28, opacity: 0.8 }} />
              <Typography variant="body2" color="grey.500">
                Research Bridge — AI-Powered Stakeholder Insights
              </Typography>
            </Box>
            <Typography variant="body2" color="grey.600">
              © 2026 Research Bridge. Demo purposes only.
            </Typography>
          </Box>
          <Divider sx={{ my: 2, borderColor: 'grey.800' }} />
          <Typography variant="caption" color="grey.700">
            This is a demonstration application. Do not enter real, sensitive, or confidential information.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
