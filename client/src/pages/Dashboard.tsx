import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as EquipmentIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { equipmentApi, borrowingApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Equipment, Borrowing } from '../types';

const Dashboard: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, borrowingsRes] = await Promise.all([
        equipmentApi.getAll({ available: true }),
        borrowingApi.getAll({ status: user?.role === 'student' ? undefined : 'pending' }),
      ]);

      setEquipment(equipmentRes.data);
      setBorrowings(borrowingsRes.data);

      if (user?.role === 'admin') {
        const statsRes = await userApi.getStats();
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const availableEquipment = equipment.filter(eq => eq.availableQuantity > 0).length;
  const pendingRequests = borrowings.filter(b => b.status === 'pending').length;
  const myBorrowings = borrowings.filter(b => b.user._id === user?._id).length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EquipmentIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">Available Equipment</Typography>
                  <Typography variant="h4">{availableEquipment}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {(user?.role === 'staff' || user?.role === 'admin') && (
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <WarningIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Pending Requests</Typography>
                    <Typography variant="h4">{pendingRequests}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <HistoryIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">My Borrowings</Typography>
                  <Typography variant="h4">{myBorrowings}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {user?.role === 'admin' && (
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PeopleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Total Users</Typography>
                    <Typography variant="h4">{stats.totalUsers || 0}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Recent Activity Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Available Equipment
              </Typography>
              {equipment.slice(0, 5).map((item) => (
                <Box key={item._id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{item.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.category} • Available: {item.availableQuantity}/{item.quantity}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Borrowing Activity
              </Typography>
              {borrowings.slice(0, 5).map((borrowing) => (
                <Box key={borrowing._id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{borrowing.equipment.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {borrowing.user.name} • {borrowing.status}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;