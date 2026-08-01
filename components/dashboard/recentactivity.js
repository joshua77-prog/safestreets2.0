export { default } from './recentactivity';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  AlertTriangle, 
  Shield, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

const formatDate = (dateVal) => {
  if (!dateVal) return "Recently";
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return "Recently";
  try {
    return format(date, 'MMM d, h:mm a');
  } catch {
    return "Recently";
  }
};

const getStatusColor = (status, type) => {
  if (type === 'alerts') {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'false_alarm':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  } else {
    // Safety reports
    const rating = status; // safety_rating
    if (rating >= 4) return 'bg-green-100 text-green-800 border-green-200';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  }
};

const getReportTypeColor = (reportType) => {
  switch (reportType) {
    case 'incident':
    case 'suspicious_activity':
      return 'bg-red-100 text-red-800';
    case 'poor_lighting':
      return 'bg-yellow-100 text-yellow-800';
    case 'safe_zone':
    case 'well_lit':
    case 'police_presence':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

export default function RecentActivity({ title, items, type, loading }) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'alerts' ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <Shield className="w-5 h-5 text-emerald-500" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              {type === 'alerts' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm">
              {type === 'alerts' ? 'No recent alerts' : 'No safety reports yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id || index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.location || 'Unknown location'}
                      </p>
                    </div>
                    {type === 'alerts' ? (
                      <Badge className={getStatusColor(item.status, type)}>
                        {item.status}
                      </Badge>
                    ) : (
                      <div className="flex gap-1">
                        <Badge className={getStatusColor(item.safety_rating, type)}>
                          {item.safety_rating}/5
                        </Badge>
                        <Badge variant="outline" className={getReportTypeColor(item.report_type)}>
                          {item.report_type?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {type === 'alerts' && item.message && (
                    <p className="text-xs text-slate-600 mb-2">{item.message}</p>
                  )}
                  
                  {type === 'reports' && item.description && (
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{item.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.created_date || item.created_at || item.timestamp)}
                    {type === 'reports' && (
                      <span className="ml-2">• {item.time_of_day}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}