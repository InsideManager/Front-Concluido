export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  org_role?: 'owner' | 'moderator' | 'member';
  organization_id?: number;
  organization_name?: string;
  avatar_url?: string;
  google_calendar_connected?: boolean;
  google_calendar_id?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  description?: string;
  primary_color?: string;
  logo_url?: string;
  banner_url?: string;
  created_at: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  description: string;
  image_url?: string;
  google_meet_url?: string;
  type: 'physical' | 'virtual';
}

export interface Resource {
  id: number;
  name: string;
  description: string;
  icon?: string;
}

export interface Reservation {
  id: number;
  room_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  title: string;
  room_name?: string;
  user_name?: string;
  user_avatar_url?: string;
  organization_id?: number;
  organization_name?: string;
  resources: Resource[];
}

export interface SystemNotification {
  id: number;
  user_id: number | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  is_read: number;
}
