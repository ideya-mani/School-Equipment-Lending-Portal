import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { equipmentApi } from '../services/api';
import { Equipment } from '../types';

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSave: () => void;
  onCancel: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ equipment, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other' as Equipment['category'],
    condition: 'good' as Equipment['condition'],
    quantity: 1,
    location: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        description: equipment.description,
        category: equipment.category,
        condition: equipment.condition,
        quantity: equipment.quantity,
        location: equipment.location || '',
        imageUrl: equipment.imageUrl || '',
      });
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (equipment) {
        await equipmentApi.update(equipment._id, formData);
      } else {
        await equipmentApi.create(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Equipment Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <MenuItem value="sports">Sports</MenuItem>
              <MenuItem value="lab">Lab Equipment</MenuItem>
              <MenuItem value="camera">Cameras</MenuItem>
              <MenuItem value="musical">Musical Instruments</MenuItem>
              <MenuItem value="project">Project Materials</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Condition</InputLabel>
            <Select
              value={formData.condition}
              label="Condition"
              onChange={(e) => handleChange('condition', e.target.value)}
            >
              <MenuItem value="excellent">Excellent</MenuItem>
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="poor">Poor</MenuItem>
              <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            type="number"
            label="Quantity"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Image URL"
            value={formData.imageUrl}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
          />
        </Grid>
      </Grid>

      {error && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          {error}
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {equipment ? 'Update' : 'Create'} Equipment
        </Button>
      </Box>
    </Box>
  );
};

export default EquipmentForm;