/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  employeeId: string;
  joinDate: string;
  status: 'active' | 'inactive';
  position?: string;
  subject?: string;
  password?: string; // For management
  phone?: string;
  email?: string;
  bio?: string;
  address?: string;
  birthDate?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  education?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface LearningMedia {
  id: string;
  title: string;
  url: string;
  category: string;
  addedBy: string;
  date: string;
  description?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  category: string;
}

export interface SchoolSettings {
  radius: number; // in meters
  center: { lat: number, lng: number };
  locationName: string;
  runningText: string;
  workHours: {
    entryStart: string;
    entryEnd: string;
    exitStart: string;
    exitEnd: string;
  };
  isMaintenanceActive?: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: number;
}

export interface SchoolProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  vision: string;
  mission: string[];
  headmaster: string;
  headmasterPhoto?: string;
  history?: string;
  accreditation?: string;
  facilities?: string[];
  motto?: string;
  logo?: string;
  bannerPhoto?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'hadir' | 'izin' | 'alpha' | 'cuti' | 'late' | 'terlambat' | 'pulang_cepat';
  locationIn?: string;
  locationOut?: string;
  photoIn?: string;
  photoOut?: string;
  notes?: string;
  isMocked?: boolean;
  accuracy?: number;
  violationType?: 'fake_gps' | 'low_accuracy' | 'outside_radius';
}

export interface ActivityReport {
  id: string;
  userId: string;
  date: string;
  activityName: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'cuti' | 'izin' | 'sakit' | 'terlambat' | 'pulang_cepat';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  attachment?: string;
}

export interface OvertimeRequest {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ShiftRequest {
  id: string;
  userId: string;
  date: string;
  currentShift: string;
  requestedShift: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CalendarReminder {
  id: string;
  userId: string;
  date: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'news' | 'announcement' | 'alert';
}

export interface SalaryInfo {
  month: string;
  year: number;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  slipUrl?: string;
}

export interface PostReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: PostReply[];
}
