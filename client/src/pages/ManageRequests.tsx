import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Chip,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Inventory as IssueIcon,
  AssignmentReturn as ReturnIcon,
} from '@mui/icons-material';
import { borrowingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Borrowing } from '../types';

const ManageRequestsPage: React.FC = () => {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'issue' | 'return' | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [returnCondition, setReturnCondition] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const fetchBorrowings = async () => {
    try {
      const response = await borrowingApi.getAll();
      setBorrowings(response.data);
    } catch (err: any) {
      setError('Failed to fetch borrowing requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (borrowing: Borrowing, action: 'approve' | 'reject' | 'issue' | 'return') => {
    setSelectedBorrowing(borrowing);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedBorrowing || !actionType) return;

    try {
      switch (actionType) {
        case 'approve':
          await borrowingApi.approve(selectedBorrowing._id);
          break;
        case 'reject':
          await borrowingApi.reject(selectedBorrowing._id, rejectNotes);
          break;
        case 'issue':
          await borrowingApi.issue(selectedBorrowing._id);
          break;
        case 'return':
          await borrowingApi.return(selectedBorrowing._id, { 
            conditionAfter: returnCondition 
          });
          break;
      }
      setActionDialogOpen(false);
      setRejectNotes('');
      setReturnCondition('');
      fetchBorrowings();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${actionType} request`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'issued': return 'primary';
      case 'returned': return 'success';
      case 'rejected': return 'error';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getActionButtons = (borrowing: Borrowing) => {
    switch (borrowing.status) {
      case 'pending':
        return (
          <>
            <Button
              size="small"
              startIcon={<ApproveIcon />}
              color="success"
              onClick={() => handleAction(borrowing, 'approve')}
            >
              Approve
            </Button>
            <Button
              size="small"
              startIcon={<RejectIcon />}
              color="error"
              onClick={() => handleAction(borrowing, 'reject')}
            >
              Reject
            </Button>
          </>
        );
      case 'approved':
        return (
          <Button
            size="small"
            startIcon={<IssueIcon />}
            color="primary"
            onClick={() => handleAction(borrowing, 'issue')}
          >
            Issue
          </Button>
        );
      case 'issued':
        return (
          <Button
            size="small"
            startIcon={<ReturnIcon />}
            color="secondary"
            onClick={() => handleAction(borrowing, 'return')}
          >
            Return
          </Button>
        );
      default:
        return null;
    }
  };

  const stats = {
    pending: borrowings.filter(b => b.status === 'pending').length,
    approved: borrowings.filter(b => b.status === 'approved').length,
    issued: borrowings.filter(b => b.status === 'issued').length,
    overdue: borrowings.filter(b => b.status === 'overdue').length,
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manage Borrowing Requests
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Requests
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Issued
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.issued}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.overdue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Request Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {borrowings.map((borrowing) => (
              <TableRow key={borrowing._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{borrowing.user.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {borrowing.user.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {borrowing.user.role}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{borrowing.equipment.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {borrowing.equipment.category}
                  </Typography>
                </TableCell>
                <TableCell>{borrowing.quantity}</TableCell>
                <TableCell>
                  {new Date(borrowing.borrowDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(borrowing.dueDate).toLocaleDateString()}
                  {borrowing.status === 'overdue' && (
                    <Chip label="Overdue" color="error" size="small" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={borrowing.status}
                    color={getStatusColor(borrowing.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {getActionButtons(borrowing)}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {borrowings.length === 0 && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            No borrowing requests found
          </Typography>
        </Box>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' && 'Approve Borrowing Request'}
          {actionType === 'reject' && 'Reject Borrowing Request'}
          {actionType === 'issue' && 'Issue Equipment'}
          {actionType === 'return' && 'Return Equipment'}
        </DialogTitle>
        <DialogContent>
          {selectedBorrowing && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>User:</strong> {selectedBorrowing.user.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Equipment:</strong> {selectedBorrowing.equipment.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Quantity:</strong> {selectedBorrowing.quantity}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Due Date:</strong> {new Date(selectedBorrowing.dueDate).toLocaleDateString()}
              </Typography>

              {actionType === 'reject' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}

              {actionType === 'return' && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Condition After Return</InputLabel>
                  <Select
                    value={returnCondition}
                    label="Condition After Return"
                    onChange={(e) => setReturnCondition(e.target.value)}
                  >
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="poor">Poor</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmAction} 
            variant="contained"
            color={
              actionType === 'reject' ? 'error' : 
              actionType === 'approve' ? 'success' : 'primary'
            }
          >
            {actionType === 'approve' && 'Approve'}
            {actionType === 'reject' && 'Reject'}
            {actionType === 'issue' && 'Issue'}
            {actionType === 'return' && 'Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageRequestsPage;