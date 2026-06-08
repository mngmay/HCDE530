import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Link, Alert, CircularProgress,
} from '@mui/material';
import { supabase } from '../lib/supabase';

export default function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box component="img" src="/logo.webp" alt="Research Bridge" sx={{ height: 48, mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="primary">
            Research Bridge
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Sign in to your account
          </Typography>
        </Box>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email address"
              type="email"
              fullWidth
              required
              variant="outlined"
              value={email}
              onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              variant="outlined"
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            <Typography variant="body2" textAlign="center" color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/signup" underline="hover">
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link component={RouterLink} to="/" underline="hover" color="text.secondary" variant="body2">
            ← Back to home
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
