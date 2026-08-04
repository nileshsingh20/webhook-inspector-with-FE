import { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
  Container, Box, Typography, Chip, Stack, TextField, InputAdornment,
  Select, MenuItem, Button, CircularProgress, IconButton, Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { getTheme } from './theme';

const API_URL = import.meta.env.VITE_API_URL || '';

function EventCard({ event }) {
  const [open, setOpen] = useState(false);
  const preview = JSON.stringify(event.body);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: open ? 'primary.main' : 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        py={1.25}
        sx={{ cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" fontWeight={600} color="primary.main">
            {event.dateIST}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(event.receivedAt).toLocaleTimeString()}
          </Typography>
        </Stack>
        <IconButton size="small">
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>

      {!open && (
        <Typography
          px={2} pb={1.5}
          variant="caption"
          color="text.disabled"
          fontFamily="monospace"
          noWrap
          display="block"
        >
          {preview}
        </Typography>
      )}

      <Collapse in={open}>
        <Box
          component="pre"
          sx={{
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0a0b0f' : '#f4f4f5'),
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 2, py: 1.5,
            m: 0,
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(event.body, null, 2)}
        </Box>
      </Collapse>
    </Box>
  );
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('theme-mode') || 'dark');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const [events, setEvents] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('theme-mode', next);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set('date', selectedDate);
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/api/events?${params.toString()}`);
      setEvents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, search]);

  useEffect(() => {
    fetch(`${API_URL}/api/dates`).then((res) => res.json()).then(setDates).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 250);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
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

            <IconButton onClick={toggleMode} sx={{ border: '1px solid', borderColor: 'divider' }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1.5} mb={4} flexWrap="wrap" useFlexGap>
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

            <Select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All dates</MenuItem>
              {dates.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>

            {(selectedDate || search) && (
              <Button variant="outlined" onClick={() => { setSelectedDate(''); setSearch(''); }}>
                Clear
              </Button>
            )}
          </Stack>

          {loading && (
            <Stack alignItems="center" py={8}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {!loading && events.length === 0 && (
            <Stack alignItems="center" py={8} spacing={0.5}>
              <Typography color="text.secondary">No events yet</Typography>
              <Typography variant="body2" color="text.disabled">
                Send a POST request to <code>/webhook</code> to see it appear here.
              </Typography>
            </Stack>
          )}

          <Stack spacing={1}>
            {events.map((event) => <EventCard key={event._id} event={event} />)}
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;