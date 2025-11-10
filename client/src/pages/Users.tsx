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
  Chip,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  School as StudentIcon,
  Work as StaffIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { userApi, borrowingApi } from '../services/api';
import { User, Borrowing } from '../types';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBorrowings, setUserBorrowings] = useState<Borrowing[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        userApi.getAll(),
        userApi.getStats(),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      setError('Failed to fetch users data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBorrowings = async (user: User) => {
    try {
      setSelectedUser(user);
      const response = await borrowingApi.getAll({ user: user._id });
      setUserBorrowings(response.data);
      setDialogOpen(true);
    } catch (err: any) {
      setError('Failed to fetch user borrowings');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'staff': return 'warning';
      case 'student': return 'primary';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'staff': return <StaffIcon />;
      case 'student': return <StudentIcon />;
      default: return <PersonIcon />;
    }
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
        Users Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.users?.total || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StudentIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Students
                  </Typography>
                  <Typography variant="h4">
                    {stats.users?.students || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StaffIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Staff
                  </Typography>
                  <Typography variant="h4">
                    {stats.users?.staff || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AdminIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Admins
                  </Typography>
                  <Typography variant="h4">
                    {stats.users?.admins || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {user.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.phone && (
                    <Typography variant="body2">{user.phone}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {user.studentId || '-'}
                </TableCell>
                <TableCell>
                  {user.department || '-'}
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewBorrowings(user)}
                  >
                    View Borrowings
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {users.length === 0 && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            No users found
          </Typography>
        </Box>
      )}

      {/* User Borrowings Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Borrowing History - {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Borrow Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Return Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userBorrowings.map((borrowing) => (
                  <TableRow key={borrowing._id}>
                    <TableCell>{borrowing.equipment.name}</TableCell>
                    <TableCell>{borrowing.quantity}</TableCell>
                    <TableCell>
                      {new Date(borrowing.borrowDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(borrowing.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {borrowing.returnDate 
                        ? new Date(borrowing.returnDate).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={borrowing.status}
                        color={
                          borrowing.status === 'returned' ? 'success' :
                          borrowing.status === 'overdue' ? 'error' :
                          borrowing.status === 'pending' ? 'warning' : 'primary'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {userBorrowings.length === 0 && (
            <Box textAlign="center" py={3}>
              <Typography color="textSecondary">
                No borrowing history found
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;