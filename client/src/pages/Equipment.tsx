import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { equipmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Equipment } from '../types';
import EquipmentForm from '../components/EquipmentForm';

const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchTerm, categoryFilter]);

  const fetchEquipment = async () => {
    try {
      const response = await equipmentApi.getAll();
      setEquipment(response.data);
    } catch (err: any) {
      setError('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  };

  const filterEquipment = () => {
    let filtered = equipment;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredEquipment(filtered);
  };

  const handleCreate = () => {
    setSelectedEquipment(null);
    setOpenDialog(true);
  };

  const handleEdit = (item: Equipment) => {
    setSelectedEquipment(item);
    setOpenDialog(true);
  };

  const handleViewDetails = (item: Equipment) => {
    setSelectedEquipment(item);
    setDetailsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedEquipment(null);
  };

  const handleDetailsClose = () => {
    setDetailsDialogOpen(false);
    setSelectedEquipment(null);
  };

  const handleSave = () => {
    handleDialogClose();
    fetchEquipment();
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      case 'under_maintenance': return 'default';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sports': return 'primary';
      case 'lab': return 'secondary';
      case 'camera': return 'info';
      case 'musical': return 'success';
      case 'project': return 'warning';
      default: return 'default';
    }
  };

  // Default image if no image URL is provided
  const getImageUrl = (item: Equipment) => {
    if (item.imageUrl) return item.imageUrl;
    
    // Return default images based on category
    const defaultImages: Record<string, string> = {
      sports: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      lab: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=200&fit=crop',
      camera: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=200&fit=crop',
      musical: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=200&fit=crop',
      project: 'https://images.unsplash.com/photo-1581094794329-cd6d5d3c3c95?w=400&h=200&fit=crop',
      other: 'https://images.unsplash.com/photo-1581094794329-cd6d5d3c3c95?w=400&h=200&fit=crop'
    };
    
    return defaultImages[item.category] || defaultImages.other;
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
        <Typography variant="h4">Equipment Catalog</Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Add Equipment
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search Equipment"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="sports">Sports</MenuItem>
            <MenuItem value="lab">Lab Equipment</MenuItem>
            <MenuItem value="camera">Cameras</MenuItem>
            <MenuItem value="musical">Musical Instruments</MenuItem>
            <MenuItem value="project">Project Materials</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Equipment Grid */}
      <Grid container spacing={3}>
        {filteredEquipment.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={getImageUrl(item)}
                alt={item.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {item.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  gutterBottom 
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {item.description || 'No description available'}
                </Typography>
                <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                  <Chip
                    label={item.category}
                    size="small"
                    color={getCategoryColor(item.category) as any}
                  />
                  <Chip
                    label={item.condition}
                    size="small"
                    color={getConditionColor(item.condition) as any}
                  />
                </Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Available:</strong> {item.availableQuantity}/{item.quantity}
                </Typography>
                {item.location && (
                  <Typography variant="body2" color="textSecondary">
                    <strong>Location:</strong> {item.location}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleViewDetails(item)}
                  fullWidth
                >
                  View Details
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    size="small"
                    color="secondary"
                    onClick={() => handleEdit(item)}
                    fullWidth
                  >
                    Edit
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredEquipment.length === 0 && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            No equipment found
          </Typography>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}
        </DialogTitle>
        <DialogContent>
          <EquipmentForm
            equipment={selectedEquipment}
            onSave={handleSave}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      {/* Equipment Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={handleDetailsClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Equipment Details
        </DialogTitle>
        <DialogContent>
          {selectedEquipment && (
            <Box>
              <CardMedia
                component="img"
                height="300"
                image={getImageUrl(selectedEquipment)}
                alt={selectedEquipment.name}
                sx={{ objectFit: 'cover', mb: 2, borderRadius: 1 }}
              />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" gutterBottom>
                    {selectedEquipment.name}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    {selectedEquipment.description || 'No description available'}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={selectedEquipment.category}
                      color={getCategoryColor(selectedEquipment.category) as any}
                    />
                    <Chip
                      label={selectedEquipment.condition}
                      color={getConditionColor(selectedEquipment.condition) as any}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Total Quantity" 
                        secondary={selectedEquipment.quantity}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Available Quantity" 
                        secondary={selectedEquipment.availableQuantity}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Location" 
                        secondary={selectedEquipment.location || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Status" 
                        secondary={
                          selectedEquipment.isActive 
                            ? 'Active' 
                            : 'Inactive'
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>

              {selectedEquipment.specifications && 
               Object.keys(selectedEquipment.specifications).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Specifications
                  </Typography>
                  <List dense>
                    {Object.entries(selectedEquipment.specifications).map(([key, value]) => (
                      <ListItem key={key}>
                        <ListItemText 
                          primary={key} 
                          secondary={value}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose}>Close</Button>
          {user?.role === 'admin' && (
            <Button 
              onClick={() => {
                handleDetailsClose();
                handleEdit(selectedEquipment!);
              }}
              variant="contained"
            >
              Edit Equipment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipmentPage;