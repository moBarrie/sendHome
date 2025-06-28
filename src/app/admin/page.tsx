"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Eye,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage transfers, monitor payouts, and oversee operations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Transfer Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Transfer Management
            </CardTitle>
            <CardDescription>
              View and manage all money transfers in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/transfers">
              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View All Transfers
              </Button>
            </Link>
            <p className="text-sm text-gray-600">
              Monitor transfer status, process pending transfers, and handle
              failed transactions
            </p>
          </CardContent>
        </Card>

        {/* Monime Monitoring */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              Monime Monitoring
            </CardTitle>
            <CardDescription>
              Real-time monitoring of Monime payouts and status sync
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/transfer-monitoring">
              <Button className="w-full" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Payout Monitoring
              </Button>
            </Link>
            <p className="text-sm text-gray-600">
              Track Monime payouts, sync transfer statuses, and view detailed
              payout information
            </p>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and KYC verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
            <p className="text-sm text-gray-600">
              User management features will be available in future updates
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Link href="/admin/transfers" className="flex-1">
                <Button variant="outline" className="w-full">
                  View Recent Transfers
                </Button>
              </Link>
              <Link href="/admin/transfer-monitoring" className="flex-1">
                <Button variant="outline" className="w-full">
                  Sync Monime Status
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Overview of system health and integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Stripe Integration</span>
                <span className="text-green-600 text-sm font-medium">
                  ✅ Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monime API</span>
                <span className="text-green-600 text-sm font-medium">
                  ✅ Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">XE Exchange Rates</span>
                <span className="text-green-600 text-sm font-medium">
                  ✅ Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Supabase Database</span>
                <span className="text-green-600 text-sm font-medium">
                  ✅ Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
