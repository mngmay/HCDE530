import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Link, Alert, CircularProgress,
} from '@mui/material';
import { supabase } from '../lib/supabase';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box component="img" src="/logo.webp" alt="Research Bridge" sx={{ height: 48, mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="primary">
            Research Bridge
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Create your account
          </Typography>
        </Box>
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>Demo Project Notice</Typography>
          <Typography variant="body2">
            This project is for demonstration purposes only and is not secure. Please do not
            provide any real or sensitive information.
          </Typography>
        </Alert>
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
              sx={{ mb: 2 }}
            />
            <TextField
              label="Confirm password"
              type="password"
              fullWidth
              required
              variant="outlined"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/signin" underline="hover">
                Sign in
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
