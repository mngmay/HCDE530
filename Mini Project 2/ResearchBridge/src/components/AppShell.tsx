import { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Alert, AppBar, Box, Button, CircularProgress, CssBaseline, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Snackbar, TextField, Toolbar, Typography, Avatar, Menu, MenuItem, Tooltip, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, FolderOpen, Logout, AccountCircle,
  ChevronLeft, ChevronRight, Person, Save,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const DRAWER_WIDTH = 240;
const DRAWER_MINI_WIDTH = 64;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Projects', icon: <FolderOpen />, path: '/dashboard' },
];

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppShell({ children, title = 'Research Bridge' }: AppShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSnackbar, setProfileSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
      if (data?.full_name) setProfileDisplayName(data.full_name);
    });
  }, [user]);

  const handleOpenProfile = () => {
    setAnchorEl(null);
    setProfileName(profileDisplayName ?? '');
    setProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileName.trim() || null })
      .eq('id', user.id);
    setProfileSaving(false);
    if (error) {
      setProfileSnackbar({ open: true, message: 'Failed to save profile.', severity: 'error' });
    } else {
      setProfileDisplayName(profileName.trim() || null);
      setProfileOpen(false);
      setProfileSnackbar({ open: true, message: 'Profile updated.', severity: 'success' });
    }
  };

  const currentWidth = sidebarOpen ? DRAWER_WIDTH : DRAWER_MINI_WIDTH;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const drawerContent = (collapsed: boolean) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Toolbar
        sx={{
          gap: 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 0 : 2,
          minHeight: '64px !important',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src="/logo.webp"
          alt="Research Bridge"
          sx={{ height: 28, width: 28, objectFit: 'contain', flexShrink: 0 }}
        />
        <Typography
          variant="h6"
          fontWeight={700}
          color="primary"
          noWrap
          sx={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 160,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: theme.transitions.create(['opacity', 'max-width'], transitionProps),
          }}
        >
          Research Bridge
        </Typography>
      </Toolbar>

      <Divider />

      <List sx={{ pt: 1, flex: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ px: 1, mb: 0.5 }}>
            <Tooltip title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  minHeight: 44,
                  px: collapsed ? 1.5 : 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 40,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : 120,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: theme.transitions.create(['opacity', 'max-width'], transitionProps),
                    m: 0,
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Collapse toggle — desktop only */}
      <Divider />
      <Box sx={{ p: 1 }}>
        <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} placement="right">
          <IconButton
            onClick={() => setSidebarOpen(o => !o)}
            size="small"
            sx={{
              width: '100%',
              borderRadius: 2,
              justifyContent: collapsed ? 'center' : 'flex-end',
              pr: collapsed ? 0 : 1,
              py: 0.75,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const mobilDrawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.5, minHeight: '64px !important' }}>
        <Box component="img" src="/logo.webp" alt="Research Bridge" sx={{ height: 32 }} />
        <Typography variant="h6" fontWeight={700} color="primary" noWrap>
          Research Bridge
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ px: 1, mb: 0.5 }}>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const transitionProps = {
    easing: theme.transitions.easing.sharp,
    duration: sidebarOpen
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentWidth}px)` },
          ml: { md: `${currentWidth}px` },
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
          transition: theme.transitions.create(['width', 'margin'], transitionProps),
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }} noWrap>
            {title}
          </Typography>
          <Tooltip title="Account">
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
                  fontSize: '0.875rem',
                }}
              >
                {(profileDisplayName ?? user?.email)?.[0]?.toUpperCase() ?? <AccountCircle />}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Box>
                {profileDisplayName && (
                  <Typography variant="body2" fontWeight={600}>{profileDisplayName}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleOpenProfile}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              Edit Profile
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {mobilDrawerContent}
      </Drawer>

      {/* Desktop drawer — collapsible */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: currentWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            overflowX: 'hidden',
            transition: theme.transitions.create('width', transitionProps),
          },
        }}
        open
      >
        {drawerContent(!sidebarOpen)}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentWidth}px)` },
          ml: { md: `${currentWidth}px` },
          mt: '64px',
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          transition: theme.transitions.create(['width', 'margin'], transitionProps),
        }}
      >
        {children}
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Display Name"
              fullWidth
              variant="outlined"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              helperText="How you want to be identified in the app."
              autoFocus
            />
            <TextField
              label="Email"
              fullWidth
              variant="outlined"
              value={user?.email ?? ''}
              disabled
              helperText="Email cannot be changed here."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setProfileOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={profileSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={handleSaveProfile}
            disabled={profileSaving}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={profileSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setProfileSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={profileSnackbar.severity} onClose={() => setProfileSnackbar(s => ({ ...s, open: false }))}>
          {profileSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
