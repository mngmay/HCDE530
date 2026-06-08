import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, LinearProgress, Paper,
  Skeleton, Snackbar, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from '@mui/material';
import {
  Add, Article, CheckCircle, Close, Delete, Edit,
  InsertDriveFile, Link as LinkIcon, Search, TableChart, UploadFile,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { supabase } from '../lib/supabase';
import type { ResearchDocument } from '../lib/types';

interface Props {
  projectId: string;
  onCountChange?: (count: number) => void;
}

type InputMode = 'write' | 'upload';
type ParseStatus = 'idle' | 'parsing' | 'done' | 'error';

const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.xlsm,.txt';
const CONTENT_PREVIEW_LENGTH = 220;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') return <TableChart />;
  return <InsertDriveFile />;
}

async function parseTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function parseExcelFile(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const parts = workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
    if (workbook.SheetNames.length > 1) return `=== Sheet: ${sheetName} ===\n${csv}`;
    return csv;
  });
  return parts.join('\n\n');
}

async function parseFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'txt' || ext === 'csv') return parseTextFile(file);
  if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') return parseExcelFile(file);
  throw new Error(`Unsupported file type: .${ext}`);
}

function nameWithoutExtension(filename: string) {
  return filename.replace(/\.[^.]+$/, '');
}

// ── Add Document Dialog ──────────────────────────────────────────────────────

function AddDocumentDialog({
  open, projectId, onClose, onAdded,
}: {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onAdded: (doc: ResearchDocument) => void;
}) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // File upload state
  const [parsedFile, setParsedFile] = useState<File | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>('idle');
  const [parseError, setParseError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setInputMode('write');
    setTitle(''); setContent(''); setSource(''); setError('');
    setParsedFile(null); setParseStatus('idle'); setParseError('');
  };

  const handleClose = () => { if (saving) return; reset(); onClose(); };

  const handleModeChange = (_: React.MouseEvent, next: InputMode | null) => {
    if (!next) return;
    setInputMode(next);
    if (next === 'write') {
      setParsedFile(null); setParseStatus('idle'); setParseError('');
    }
  };

  const processFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setParseError(`File is too large (${formatBytes(file.size)}). Maximum size is 10 MB.`);
      setParseStatus('error');
      return;
    }
    setParsedFile(file);
    setParseStatus('parsing');
    setParseError('');
    try {
      const parsed = await parseFile(file);
      setContent(parsed);
      if (!title) setTitle(nameWithoutExtension(file.name));
      if (!source) setSource(file.name);
      setParseStatus('done');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Failed to parse file.');
      setParseStatus('error');
      setParsedFile(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    setParsedFile(null); setParseStatus('idle'); setParseError('');
    setContent(''); setSource('');
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { setError('Title and content are required.'); return; }
    setSaving(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated.'); setSaving(false); return; }

    const { data, error: dbErr } = await supabase
      .from('research_documents')
      .insert({ project_id: projectId, user_id: user.id, title: title.trim(), content: content.trim(), source: source.trim() || null })
      .select()
      .single();

    if (dbErr || !data) {
      setError('Failed to save. Please try again.');
    } else {
      onAdded(data as ResearchDocument);
      reset(); onClose();
    }
    setSaving(false);
  };

  const lineCount = content.split('\n').filter(l => l.trim()).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Article color="primary" />
          <Typography variant="h6" fontWeight={700}>Add Research</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* Mode toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">How do you want to add your research?</Typography>
          <ToggleButtonGroup
            value={inputMode}
            exclusive
            onChange={handleModeChange}
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: 2, textTransform: 'none', fontWeight: 500 } }}
          >
            <ToggleButton value="write">
              <Edit sx={{ fontSize: 16, mr: 0.75 }} />
              Write / Paste
            </ToggleButton>
            <ToggleButton value="upload">
              <UploadFile sx={{ fontSize: 16, mr: 0.75 }} />
              Upload File
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Upload zone */}
        {inputMode === 'upload' && parseStatus !== 'done' && (
          <Box>
            {parseStatus === 'parsing' ? (
              <Paper elevation={0} sx={{ p: 4, border: '2px dashed', borderColor: 'primary.light', borderRadius: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <CircularProgress size={32} sx={{ mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">Parsing file…</Typography>
                <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />
              </Paper>
            ) : (
              <Box
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 5, border: '2px dashed', borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                  borderColor: dragOver ? 'primary.main' : 'divider',
                  bgcolor: dragOver ? 'action.selected' : 'background.default',
                  transition: theme.transitions.create(['border-color', 'background-color'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
                }}
              >
                <UploadFile sx={{ fontSize: 52, color: dragOver ? 'primary.main' : 'text.disabled', mb: 1.5, transition: theme.transitions.create('color', { duration: theme.transitions.duration.shorter }) }} />
                <Typography variant="body1" fontWeight={600} color={dragOver ? 'primary.main' : 'text.primary'}>
                  Drop a file here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Supports CSV · Excel (.xlsx, .xls) · Text (.txt) — up to 10 MB
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                  {['CSV', 'XLSX', 'XLS', 'TXT'].map(ext => (
                    <Chip key={ext} label={ext} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                  ))}
                </Box>
                <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} style={{ display: 'none' }} onChange={handleFileInput} />
              </Box>
            )}

            {parseStatus === 'error' && (
              <Alert severity="error" sx={{ mt: 1.5 }}>{parseError}</Alert>
            )}
          </Box>
        )}

        {/* Parsed file card */}
        {inputMode === 'upload' && parseStatus === 'done' && parsedFile && (
          <Paper
            elevation={0}
            sx={{ p: 2, border: '1px solid', borderColor: 'success.200', bgcolor: 'success.50', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
          >
            <Box sx={{ color: 'success.main', display: 'flex' }}>{fileIcon(parsedFile.name)}</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{parsedFile.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(parsedFile.size)} · {lineCount.toLocaleString()} lines parsed
              </Typography>
            </Box>
            <CheckCircle color="success" fontSize="small" />
            <Tooltip title="Remove file">
              <IconButton size="small" onClick={clearFile} sx={{ color: 'text.disabled' }}><Close fontSize="small" /></IconButton>
            </Tooltip>
          </Paper>
        )}

        {/* Always-visible fields — shown in write mode, or after a file is uploaded */}
        {(inputMode === 'write' || parseStatus === 'done') && (
          <>
            <TextField
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              required
              placeholder="e.g. User Interviews — Phase 1"
              InputLabelProps={{ shrink: Boolean(title) || undefined }}
            />

            <TextField
              label="Source (optional)"
              value={source}
              onChange={e => setSource(e.target.value)}
              fullWidth
              placeholder="e.g. Interview transcript, Survey results, URL…"
              InputProps={{
                startAdornment: <InputAdornment position="start"><LinkIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
              }}
              InputLabelProps={{ shrink: Boolean(source) || undefined }}
            />

            <TextField
              label={parseStatus === 'done' ? 'Parsed Content (editable)' : 'Research Content'}
              value={content}
              onChange={e => setContent(e.target.value)}
              fullWidth
              required
              multiline
              minRows={8}
              maxRows={20}
              placeholder="Paste interview notes, survey findings, observations, reports, or any relevant research data here…"
              InputLabelProps={{ shrink: Boolean(content) || undefined }}
              helperText={`${content.length.toLocaleString()} characters · ${lineCount.toLocaleString()} lines`}
            />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
        >
          {saving ? 'Saving…' : 'Add Research'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  doc, onClose, onDeleted,
}: {
  doc: ResearchDocument | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!doc) return;
    setDeleting(true);
    await supabase.from('research_documents').delete().eq('id', doc.id);
    onDeleted(doc.id);
    setDeleting(false);
    onClose();
  };

  return (
    <Dialog open={Boolean(doc)} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>Delete Research?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          "{doc?.title}" will be permanently removed. Insights that were generated using this document will not be affected.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Research Tab ─────────────────────────────────────────────────────────────

export default function ResearchTab({ projectId, onCountChange }: Props) {
  const theme = useTheme();
  const [docs, setDocs] = useState<ResearchDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResearchDocument | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    supabase
      .from('research_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as ResearchDocument[];
        setDocs(list);
        onCountChange?.(list.length);
        setLoading(false);
      });
  }, [projectId]);

  const handleAdded = (doc: ResearchDocument) => {
    const next = [doc, ...docs];
    setDocs(next);
    onCountChange?.(next.length);
    setSnackbar({ open: true, message: 'Research added successfully.' });
  };

  const handleDeleted = (id: string) => {
    const next = docs.filter(d => d.id !== id);
    setDocs(next);
    onCountChange?.(next.length);
    setSnackbar({ open: true, message: 'Research deleted.' });
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = docs.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Add interview notes, survey data, reports, or any findings to ground insights in real evidence.
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}>
          Add Research
        </Button>
      </Box>

      {/* Search */}
      {docs.length > 2 && (
        <TextField
          size="small"
          placeholder="Search research…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 3, maxWidth: 360 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
          }}
        />
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map(n => <Skeleton key={n} variant="rounded" height={110} sx={{ borderRadius: 3 }} />)}
        </Box>
      ) : docs.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center', py: 8,
            border: '2px dashed', borderColor: 'divider', borderRadius: 3,
            bgcolor: 'background.default',
          }}
        >
          <Article sx={{ fontSize: 52, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={500}>No research yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Add interview notes, survey data, reports, or upload CSV/Excel/text files.
          </Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setAddOpen(true)}>
            Add First Research
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">No research matches "{search}".</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(doc => {
            const isExpanded = expanded.has(doc.id);
            const isTruncated = doc.content.length > CONTENT_PREVIEW_LENGTH;
            const displayContent = isExpanded || !isTruncated
              ? doc.content
              : doc.content.slice(0, CONTENT_PREVIEW_LENGTH) + '…';
            const ext = doc.source?.split('.').pop()?.toLowerCase();
            const isFile = ext && ['csv', 'xlsx', 'xls', 'xlsm', 'txt'].includes(ext);

            return (
              <Card
                key={doc.id}
                elevation={0}
                sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 3,
                  transition: theme.transitions.create('box-shadow', { duration: theme.transitions.duration.shorter }),
                  '&:hover': { boxShadow: theme.shadows[2] },
                }}
              >
                <CardHeader
                  title={<Typography variant="subtitle1" fontWeight={700} noWrap>{doc.title}</Typography>}
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.25 }}>
                      <Typography variant="caption" color="text.disabled">{formatDate(doc.created_at)}</Typography>
                      {doc.source && (
                        <>
                          <Typography variant="caption" color="text.disabled">·</Typography>
                          <Chip
                            icon={isFile
                              ? <Box sx={{ display: 'flex', fontSize: '0.75rem !important', '& svg': { fontSize: 14 } }}>{fileIcon(doc.source)}</Box>
                              : <LinkIcon sx={{ fontSize: '0.75rem !important' }} />
                            }
                            label={doc.source}
                            size="small"
                            variant="outlined"
                            color={isFile ? 'primary' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem', maxWidth: 280, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                          />
                        </>
                      )}
                    </Box>
                  }
                  action={
                    <Tooltip title="Delete research">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(doc)}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, fontFamily: isFile ? 'monospace' : 'inherit', fontSize: isFile ? '0.75rem' : undefined }}>
                    {displayContent}
                  </Typography>
                  {isTruncated && (
                    <Button
                      size="small"
                      onClick={() => toggleExpanded(doc.id)}
                      sx={{ mt: 1, p: 0, minWidth: 0, fontWeight: 600, textTransform: 'none' }}
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <AddDocumentDialog
        open={addOpen}
        projectId={projectId}
        onClose={() => setAddOpen(false)}
        onAdded={handleAdded}
      />

      <DeleteConfirmDialog
        doc={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
