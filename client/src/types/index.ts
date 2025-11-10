export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  studentId?: string;
  department?: string;
  phone?: string;
  createdAt: string;
}

export interface Equipment {
  _id: string;
  name: string;
  description: string;
  category: 'sports' | 'lab' | 'camera' | 'musical' | 'project' | 'other';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'under_maintenance';
  quantity: number;
  availableQuantity: number;
  location?: string;
  specifications?: Record<string, string>;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Borrowing {
  _id: string;
  user: User;
  equipment: Equipment;
  quantity: number;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'issued' | 'returned' | 'overdue';
  approvedBy?: User;
  approvedAt?: string;
  issuedAt?: string;
  conditionBefore: string;
  conditionAfter?: string;
  notes?: string;
  damageReport?: {
    description: string;
    reportedAt: string;
    reportedBy: string;
    repairStatus: 'reported' | 'under_repair' | 'repaired' | 'written_off';
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'staff' | 'admin';
  studentId?: string;
  department?: string;
  phone?: string;
}