import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Alert, Avatar, Box, Breadcrumbs, Button, CircularProgress,
  Container, Divider, IconButton, Link, Paper, Skeleton,
  TextField, Toolbar, Typography,
} from '@mui/material';
import { ArrowBack, Send, SmartToy, Person, Assessment } from '@mui/icons-material';
import AppShell from '../components/AppShell';
import { supabase } from '../lib/supabase';
import type { Stakeholder, InterviewSession, ChatMessage } from '../lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function InterviewPage() {
  const { id: projectId, stakeholderId } = useParams<{ id: string; stakeholderId: string }>();
  const navigate = useNavigate();
  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [stakeholderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    if (!stakeholderId) return;
    setLoading(true);

    const [{ data: sh }, { data: existingSess }] = await Promise.all([
      supabase.from('stakeholders').select('*').eq('id', stakeholderId).single(),
      supabase.from('interview_sessions').select('*').eq('stakeholder_id', stakeholderId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (!sh) { navigate(`/project/${projectId}`); return; }
    setStakeholder(sh);

    let sess = existingSess;
    if (!sess) {
      const { data: newSess } = await supabase
        .from('interview_sessions')
        .insert({ stakeholder_id: sh.id, messages: [], status: 'active' })
        .select()
        .single();
      sess = newSess;
    }

    if (sess) {
      setSession(sess);
      const existingMessages: ChatMessage[] = sess.messages || [];
      if (existingMessages.length === 0) {
        const welcome = await getAIResponse(sh, [], 'start');
        const updated = [{ role: 'assistant' as const, content: welcome }];
        setMessages(updated);
        await supabase.from('interview_sessions').update({ messages: updated }).eq('id', sess.id);
      } else {
        setMessages(existingMessages);
      }
    }
    setLoading(false);
  };

  const getAIResponse = async (sh: Stakeholder, history: ChatMessage[], action: string): Promise<string> => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stakeholderId: sh.id, messages: history, action }),
      });
      if (!res.ok) throw new Error('AI request failed');
      const json = await res.json();
      return json.message as string;
    } catch {
      return 'I apologize — I encountered a technical issue. Please try sending your message again.';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session || !stakeholder) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    const aiText = await getAIResponse(stakeholder, updatedMessages, 'continue');
    const withAI = [...updatedMessages, { role: 'assistant' as const, content: aiText }];
    setMessages(withAI);
    await supabase.from('interview_sessions').update({ messages: withAI }).eq('id', session.id);
    setSending(false);
  };

  const handleGenerateProfile = async () => {
    if (!session || !stakeholder) return;
    setGeneratingProfile(true);
    setError('');
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stakeholderId: stakeholder.id, messages, action: 'generate-profile' }),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      await supabase.from('stakeholders').update({ profile_data: json.profile }).eq('id', stakeholder.id);
      await supabase.from('interview_sessions').update({ status: 'completed' }).eq('id', session.id);
      navigate(`/project/${projectId}/stakeholder/${stakeholderId}`);
    } catch {
      setError('Failed to generate profile. Please try again.');
    }
    setGeneratingProfile(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <AppShell title="Interview">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rounded" height={500} sx={{ mt: 3 }} />
        </Container>
      </AppShell>
    );
  }

  if (!stakeholder) return null;

  return (
    <AppShell title={`Interview — ${stakeholder.name}`}>
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3, flexShrink: 0 }}>
          <Link component={RouterLink} to="/dashboard" underline="hover" color="text.secondary">Dashboard</Link>
          <Link component={RouterLink} to={`/project/${projectId}`} underline="hover" color="text.secondary">Project</Link>
          <Typography color="text.primary" fontWeight={500}>Interview — {stakeholder.name}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{stakeholder.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stakeholder.role}{stakeholder.organization ? ` · ${stakeholder.organization}` : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                size="small"
                component={RouterLink}
                to={`/project/${projectId}`}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={generatingProfile ? <CircularProgress size={16} color="inherit" /> : <Assessment />}
                size="small"
                onClick={handleGenerateProfile}
                disabled={generatingProfile || messages.length < 3}
              >
                {generatingProfile ? 'Generating...' : 'Generate Profile'}
              </Button>
            </Box>
          </Box>
          {messages.length < 3 && (
            <Typography variant="caption" color="text.disabled" mt={1} display="block">
              Have a conversation first before generating the profile.
            </Typography>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>{error}</Alert>}

        {/* Messages */}
        <Paper
          elevation={0}
          sx={{
            flex: 1, overflow: 'auto', p: 2, mb: 2,
            border: '1px solid', borderColor: 'divider', borderRadius: 3,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}
        >
          {messages.map((msg, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                gap: 1.5,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  width: 32, height: 32, flexShrink: 0,
                  bgcolor: msg.role === 'assistant' ? 'secondary.main' : 'primary.main',
                }}
              >
                {msg.role === 'assistant' ? <SmartToy fontSize="small" /> : <Person fontSize="small" />}
              </Avatar>
              <Box
                sx={{
                  maxWidth: '75%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  border: msg.role !== 'user' ? '1px solid' : 'none',
                  borderColor: 'divider',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  px: 2, py: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {msg.content}
                </Typography>
              </Box>
            </Box>
          ))}
          {sending && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Box sx={{ display: 'flex', gap: 0.5, p: 1.5 }}>
                {[0, 1, 2].map(n => (
                  <Box
                    key={n}
                    sx={{
                      width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${n * 0.2}s`,
                      '@keyframes bounce': {
                        '0%, 80%, 100%': { transform: 'translateY(0)' },
                        '40%': { transform: 'translateY(-6px)' },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
          <div ref={bottomRef} />
        </Paper>

        {/* Input */}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your response…"
            variant="outlined"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            sx={{ alignSelf: 'flex-end', bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'action.disabledBackground' } }}
          >
            <Send />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.disabled" textAlign="center" mt={1}>
          Press Enter to send · Shift+Enter for new line
        </Typography>
      </Container>
    </AppShell>
  );
}
