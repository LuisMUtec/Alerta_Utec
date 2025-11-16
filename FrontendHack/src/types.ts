export interface Incident {
  id: string;
  type: 'medical' | 'security' | 'infrastructure' | 'other';
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'in_progress' | 'resolved';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  email?: string;
}
