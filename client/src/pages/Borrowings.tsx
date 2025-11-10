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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { borrowingApi, equipmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Borrowing, Equipment } from '../types';

const BorrowingsPage: React.FC = () => {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [returningBorrowing, setReturningBorrowing] = useState<Borrowing | null>(null);
  const [returnCondition, setReturnCondition] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [borrowingsRes, equipmentRes] = await Promise.all([
        borrowingApi.getAll(),
        equipmentApi.getAll({ available: true }),
      ]);
      
      // For students, the backend automatically filters their borrowings
      // For staff/admin, we get all borrowings
      setBorrowings(borrowingsRes.data);
      setEquipment(equipmentRes.data);
    } catch (err: any) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      await borrowingApi.create({
        equipmentId: selectedEquipment,
        quantity,
        dueDate: new Date(dueDate).toISOString(),
      });
      setOpenDialog(false);
      setSelectedEquipment('');
      setQuantity(1);
      setDueDate('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request');
    }
  };

  const handleReturn = (borrowing: Borrowing) => {
    setReturningBorrowing(borrowing);
    setReturnCondition(borrowing.conditionBefore);
    setReturnDialogOpen(true);
  };

  const confirmReturn = async () => {
    if (!returningBorrowing) return;

    try {
      await borrowingApi.return(returningBorrowing._id, { 
        conditionAfter: returnCondition 
      });
      setReturnDialogOpen(false);
      setReturningBorrowing(null);
      setReturnCondition('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to return equipment');
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

  const canCreateRequest = user?.role === 'student' || user?.role === 'staff';

  // Filter stats based on user role
  const userBorrowings = user?.role === 'student' 
    ? borrowings.filter(b => b.user._id === user._id)
    : borrowings;

  const stats = {
    total: userBorrowings.length,
    pending: userBorrowings.filter(b => b.status === 'pending').length,
    active: userBorrowings.filter(b => ['approved', 'issued'].includes(b.status)).length,
    overdue: userBorrowings.filter(b => b.status === 'overdue').length,
    returned: userBorrowings.filter(b => b.status === 'returned').length,
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {user?.role === 'student' ? 'My Borrowings' : 'All Borrowings'}
        </Typography>
        {canCreateRequest && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Request
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
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
                Active
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.active}
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
              {user?.role !== 'student' && <TableCell>User</TableCell>}
              <TableCell>Equipment</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Borrow Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              {user?.role !== 'student' && <TableCell>Approved By</TableCell>}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userBorrowings.map((borrowing) => (
              <TableRow key={borrowing._id}>
                {user?.role !== 'student' && (
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{borrowing.user.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {borrowing.user.email}
                      </Typography>
                      <Chip 
                        label={borrowing.user.role} 
                        size="small" 
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </TableCell>
                )}
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{borrowing.equipment.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {borrowing.equipment.category}
                    </Typography>
                  </Box>
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
                {user?.role !== 'student' && (
                  <TableCell>
                    {borrowing.approvedBy ? borrowing.approvedBy.name : '-'}
                  </TableCell>
                )}
                <TableCell>
                  {borrowing.status === 'issued' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleReturn(borrowing)}
                    >
                      Return
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {userBorrowings.length === 0 && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            No borrowing records found
          </Typography>
        </Box>
      )}

      {/* New Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Borrowing Request</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Equipment</InputLabel>
              <Select
                value={selectedEquipment}
                label="Equipment"
                onChange={(e) => setSelectedEquipment(e.target.value)}
              >
                {equipment.map((item) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.name} (Available: {item.availableQuantity})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              inputProps={{ 
                min: new Date().toISOString().split('T')[0],
                max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days max
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRequest}
            variant="contained"
            disabled={!selectedEquipment || !quantity || !dueDate}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Return Equipment</DialogTitle>
        <DialogContent>
          {returningBorrowing && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Equipment:</strong> {returningBorrowing.equipment.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Condition Before:</strong> {returningBorrowing.conditionBefore}
              </Typography>
              
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

              {returnCondition !== returningBorrowing.conditionBefore && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Condition change detected. This will be recorded in the damage report.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmReturn} variant="contained" color="primary">
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BorrowingsPage;