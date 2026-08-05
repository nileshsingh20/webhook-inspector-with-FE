import { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
  Container, Box, Typography, Chip, Stack, TextField, InputAdornment,
  Select, MenuItem, Button, CircularProgress, IconButton, Collapse,
  Checkbox, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, Alert, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, Tabs, Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AddIcon from '@mui/icons-material/Add';
import { getTheme } from './theme';

const API_URL = import.meta.env.VITE_API_URL || '';
const MAX_ENDPOINTS = 10;

function flatten(obj, prefix = '') {
  const out = {};
  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, path));
    } else {
      out[path] = Array.isArray(value) ? JSON.stringify(value) : String(value);
    }
  }
  return out;
}

function formatBytes(str) {
  const bytes = new Blob([str]).size;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


function EndpointBar({ endpoints, selectedId, onSelect, onCreate, onDelete, onCopy }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <Box mb={3}>
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        Your webhook URLs ({endpoints.length}/{MAX_ENDPOINTS})
      </Typography>
      <Tabs
        value={selectedId || 'all'}
        onChange={(e, val) => onSelect(val === 'all' ? '' : val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 40, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="All" value="all" sx={{ minHeight: 40 }} />
        {endpoints.map((ep) => (
          <Tab
            key={ep._id}
            value={ep._id}
            sx={{ minHeight: 40 }}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{ep.label}</span>
                <Chip label={ep.eventCount} size="small" sx={{ height: 18, fontSize: '0.68rem' }} />
                <Tooltip title="Copy URL">
                  <ContentCopyIcon
                    fontSize="inherit"
                    sx={{ fontSize: 14, '&:hover': { color: 'primary.main' } }}
                    onClick={(e) => { e.stopPropagation(); onCopy(ep._id); }}
                  />
                </Tooltip>
                <Tooltip title="Delete this URL and its events">
                  <DeleteIcon
                    fontSize="inherit"
                    sx={{ fontSize: 14, '&:hover': { color: 'error.main' } }}
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ep._id); }}
                  />
                </Tooltip>
              </Stack>
            }
          />
        ))}
        <Tab
          icon={<AddIcon fontSize="small" />}
          iconPosition="start"
          label="New"
          value="__new__"
          disabled={endpoints.length >= MAX_ENDPOINTS}
          onClick={(e) => { e.preventDefault(); onCreate(); }}
          sx={{ minHeight: 40 }}
        />
      </Tabs>

      {selectedId && (
        <Box mt={1.5} p={1.5} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all', flex: 1 }}>
              {`${API_URL}/webhook/${selectedId}`}
            </Typography>
            <Button size="small" startIcon={<ContentCopyIcon fontSize="small" />} onClick={() => onCopy(selectedId)}>
              Copy
            </Button>
          </Stack>
        </Box>
      )}

      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Delete this webhook URL?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This deletes the URL and all events received on it. This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EventCard({ event, selected, onToggleSelect, onDelete, onReplay, onCopy }) {
  const [open, setOpen] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const bodyStr = JSON.stringify(event.body);
  const fieldCount = event.body && typeof event.body === 'object' ? Object.keys(event.body).length : 0;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: open || selected ? 'primary.main' : 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      <Stack direction="row" alignItems="center" px={1} py={0.5}>
        <Checkbox
          size="small"
          checked={selected}
          onChange={() => onToggleSelect(event._id)}
          onClick={(e) => e.stopPropagation()}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flex={1}
          sx={{ cursor: 'pointer' }}
          onClick={() => setOpen(!open)}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {event.dateIST}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(event.receivedAt).toLocaleTimeString()}
            </Typography>
            {event.body?.event && (
              <Chip label={event.body.event} size="small" variant="outlined" />
            )}
            <Chip
              label="200 OK"
              size="small"
              sx={{ bgcolor: 'success.main', color: '#fff', height: 20, fontSize: '0.7rem' }}
            />
            <Typography variant="caption" color="text.disabled">
              {formatBytes(bodyStr)} · {fieldCount} fields
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Copy JSON">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onCopy(event.body); }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Replay webhook">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onReplay(event); }}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete([event._id]); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small">
              {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      {!open && (
        <Typography px={2} pb={1.5} variant="caption" color="text.disabled" fontFamily="monospace" noWrap display="block">
          {bodyStr}
        </Typography>
      )}

      <Collapse in={open}>
        <Box borderTop="1px solid" borderColor="divider" px={2} pt={1}>
          <Button size="small" onClick={() => setShowHeaders(!showHeaders)} sx={{ mb: 1 }}>
            {showHeaders ? 'Show body' : 'Show headers'}
          </Button>
        </Box>
        <Box
          component="pre"
          sx={{
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0a0b0f' : '#f4f4f5'),
            px: 2, pb: 2, m: 0,
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(showHeaders ? event.headers : event.body, null, 2)}
        </Box>
      </Collapse>
    </Box>
  );
}

function CompareDialog({ open, onClose, eventA, eventB }) {
  if (!eventA || !eventB) return null;
  const flatA = flatten(eventA.body);
  const flatB = flatten(eventB.body);
  const allKeys = Array.from(new Set([...Object.keys(flatA), ...Object.keys(flatB)])).sort();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Compare payloads</DialogTitle>
      <DialogContent dividers>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Field</TableCell>
              <TableCell>{new Date(eventA.receivedAt).toLocaleString()}</TableCell>
              <TableCell>{new Date(eventB.receivedAt).toLocaleString()}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allKeys.map((key) => {
              const valA = flatA[key] ?? '—';
              const valB = flatB[key] ?? '—';
              const differs = valA !== valB;
              return (
                <TableRow key={key} sx={{ bgcolor: differs ? 'rgba(244,63,94,0.08)' : 'transparent' }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{key}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{valA}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{valB}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('theme-mode') || 'dark');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState('');

  const [events, setEvents] = useState([]);
  const [dates, setDates] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [compareOpen, setCompareOpen] = useState(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('theme-mode', next);
  };

  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/endpoints`);
      setEndpoints(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEndpointId) params.set('endpointId', selectedEndpointId);
      if (selectedDate) params.set('date', selectedDate);
      if (selectedType) params.set('eventType', selectedType);
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/api/events?${params.toString()}`);
      setEvents(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, [selectedEndpointId, selectedDate, selectedType, search]);

  const fetchFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedEndpointId) params.set('endpointId', selectedEndpointId);
    fetch(`${API_URL}/api/dates?${params.toString()}`).then((res) => res.json()).then(setDates).catch(() => {});
    fetch(`${API_URL}/api/event-types?${params.toString()}`).then((res) => res.json()).then(setEventTypes).catch(() => {});
  }, [selectedEndpointId]);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);
  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  useEffect(() => {
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, [fetchEvents]);

  useEffect(() => {
    const timer = setTimeout(() => { setLoading(true); fetchEvents().finally(() => setLoading(false)); }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchEvents();
      fetchFilters();
      fetchEndpoints();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchEvents, fetchFilters, fetchEndpoints]);

  const createEndpoint = async () => {
    try {
      const res = await fetch(`${API_URL}/api/endpoints`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) return notify(data.error || 'Failed to create webhook URL', 'error');
      await fetchEndpoints();
      setSelectedEndpointId(data._id);
      notify('New webhook URL created');
    } catch (err) {
      notify('Failed to create webhook URL', 'error');
    }
  };

  const deleteEndpoint = async (id) => {
    try {
      await fetch(`${API_URL}/api/endpoints/${id}`, { method: 'DELETE' });
      if (selectedEndpointId === id) setSelectedEndpointId('');
      await fetchEndpoints();
      fetchEvents();
      notify('Webhook URL deleted');
    } catch (err) {
      notify('Failed to delete webhook URL', 'error');
    }
  };

  const copyEndpointUrl = async (id) => {
    try {
      await navigator.clipboard.writeText(`${API_URL}/webhook/${id}`);
      notify('Webhook URL copied');
    } catch (err) {
      notify('Copy failed', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === events.length ? new Set() : new Set(events.map((e) => e._id)));
  };

  const deleteEvents = async (ids) => {
    try {
      await fetch(`${API_URL}/api/events`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setSelectedIds(new Set());
      notify(`Deleted ${ids.length} event${ids.length !== 1 ? 's' : ''}`);
      fetchEvents();
      fetchFilters();
      fetchEndpoints();
    } catch (err) {
      notify('Failed to delete', 'error');
    }
  };

  const clearAll = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEndpointId) params.set('endpointId', selectedEndpointId);
      await fetch(`${API_URL}/api/events/all?${params.toString()}`, { method: 'DELETE' });
      setSelectedIds(new Set());
      setClearAllConfirmOpen(false);
      notify('Events cleared');
      fetchEvents();
      fetchFilters();
      fetchEndpoints();
    } catch (err) {
      notify('Failed to clear events', 'error');
    }
  };

  const replayEvent = async (event) => {
    const targetEndpoint = event.endpointId || selectedEndpointId;
    if (!targetEndpoint) return notify('Select a specific webhook URL to replay into', 'error');
    try {
      await fetch(`${API_URL}/webhook/${targetEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.body),
      });
      notify('Webhook replayed');
      fetchEvents();
      fetchEndpoints();
    } catch (err) {
      notify('Replay failed', 'error');
    }
  };

  const copyEvent = async (body) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(body, null, 2));
      notify('Copied to clipboard');
    } catch (err) {
      notify('Copy failed', 'error');
    }
  };

  const exportEvents = () => {
    const toExport = selectedIds.size > 0 ? events.filter((e) => selectedIds.has(e._id)) : events;
    downloadJSON(toExport, `webhook-events-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const selectedEvents = events.filter((e) => selectedIds.has(e._id));
  const canCompare = selectedEvents.length === 2;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em">
                  Webhook Inspector
                </Typography>
                <Chip
                  label={`${events.length} event${events.length !== 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Internal test dashboard · events auto-expire after 7 days
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <FormControlLabel
                control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
                label={<Typography variant="caption">Live</Typography>}
              />
              <IconButton onClick={toggleMode} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Stack>
          </Stack>

          <EndpointBar
            endpoints={endpoints}
            selectedId={selectedEndpointId}
            onSelect={setSelectedEndpointId}
            onCreate={createEndpoint}
            onDelete={deleteEndpoint}
            onCopy={copyEndpointUrl}
          />

          <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap" useFlexGap>
            <TextField
              placeholder="Search payloads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
            />

            <Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} displayEmpty size="small" sx={{ minWidth: 160 }}>
              <MenuItem value="">All dates</MenuItem>
              {dates.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>

            <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} displayEmpty size="small" sx={{ minWidth: 160 }}>
              <MenuItem value="">All event types</MenuItem>
              {eventTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>

            {(selectedDate || search || selectedType) && (
              <Button variant="outlined" onClick={() => { setSelectedDate(''); setSelectedType(''); setSearch(''); }}>
                Clear filters
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={1.5} mb={4} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={events.length > 0 && selectedIds.size === events.length}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < events.length}
                  onChange={toggleSelectAll}
                />
              }
              label={<Typography variant="body2">Select all</Typography>}
            />

            {selectedIds.size > 0 && (
              <>
                <Typography variant="body2" color="text.secondary">{selectedIds.size} selected</Typography>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => deleteEvents(Array.from(selectedIds))}>
                  Delete selected
                </Button>
                {canCompare && (
                  <Button size="small" startIcon={<CompareArrowsIcon />} onClick={() => setCompareOpen(true)}>
                    Compare
                  </Button>
                )}
              </>
            )}

            <Box flex={1} />

            <Button size="small" startIcon={<DownloadIcon />} onClick={exportEvents}>
              Export {selectedIds.size > 0 ? 'selected' : 'all'}
            </Button>
            <Button size="small" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearAllConfirmOpen(true)}>
              Clear all
            </Button>
          </Stack>

          {loading && (
            <Stack alignItems="center" py={8}><CircularProgress size={28} /></Stack>
          )}

          {!loading && events.length === 0 && (
            <Stack alignItems="center" py={8} spacing={0.5}>
              <Typography color="text.secondary">No events yet</Typography>
              <Typography variant="body2" color="text.disabled">
                {selectedEndpointId
                  ? 'POST to this webhook URL to see it appear here.'
                  : 'Generate a webhook URL above, then POST to it.'}
              </Typography>
            </Stack>
          )}

          <Stack spacing={1}>
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                selected={selectedIds.has(event._id)}
                onToggleSelect={toggleSelect}
                onDelete={deleteEvents}
                onReplay={replayEvent}
                onCopy={copyEvent}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      <CompareDialog open={compareOpen} onClose={() => setCompareOpen(false)} eventA={selectedEvents[0]} eventB={selectedEvents[1]} />

      <Dialog open={clearAllConfirmOpen} onClose={() => setClearAllConfirmOpen(false)}>
        <DialogTitle>Clear {selectedEndpointId ? 'this URL\'s' : 'all'} events?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This permanently deletes {events.length} stored events. This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={clearAll}>Clear</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;