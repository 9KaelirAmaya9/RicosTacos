import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, UserCog, Shield, ChefHat } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
}

export const RoleManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get current user's email for reference
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Fetch emails from orders table (users who have placed orders)
      const { data: ordersWithEmails } = await supabase
        .from("orders")
        .select("user_id, customer_email")
        .not("user_id", "is", null)
        .not("customer_email", "is", null);

      // Create a map of user_id -> email from orders
      const emailMap = new Map<string, string>();
      ordersWithEmails?.forEach(order => {
        if (order.user_id && order.customer_email) {
          emailMap.set(order.user_id, order.customer_email);
        }
      });

      // Combine the data - show users that have either profiles or roles
      const userIds = new Set([
        ...(profiles?.map(p => p.user_id) || []),
        ...(roles?.map(r => r.user_id) || [])
      ]);

      const usersWithRoles: UserWithRoles[] = Array.from(userIds).map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const userRoles = roles?.filter(r => r.user_id === userId).map(r => r.role) || [];
        
        // Get email from: current user, orders, or show user ID
        let email = "";
        if (userId === currentUser?.id) {
          email = currentUser.email || "";
        } else if (emailMap.has(userId)) {
          email = emailMap.get(userId)!;
        } else {
          // Show first 8 chars of user ID as fallback
          email = `${userId.substring(0, 8)}...`;
        }
        
        return {
          id: userId,
          email,
          name: profile?.name || null,
          roles: userRoles,
        };
      });

      // Sort by name, then email
      usersWithRoles.sort((a, b) => {
        const nameA = a.name || a.email;
        const nameB = b.name || b.email;
        return nameA.localeCompare(nameB);
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as AppRole });

      if (error) throw error;
      
      toast.success(`Role "${role}" added successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to add role");
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as AppRole);

      if (error) throw error;
      
      toast.success(`Role "${role}" removed successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove role");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "kitchen":
        return <ChefHat className="h-3 w-3" />;
      default:
        return <UserCog className="h-3 w-3" />;
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive" as const;
      case "kitchen":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          User Role Management
        </CardTitle>
        <CardDescription>
          Assign or remove admin and kitchen staff roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name || "No name"}</div>
                <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.roles.length === 0 ? (
                    <Badge variant="outline">No roles</Badge>
                  ) : (
                    user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant={getRoleVariant(role)}
                        className="flex items-center gap-1"
                      >
                        {getRoleIcon(role)}
                        {role}
                        <button
                          onClick={() => handleRemoveRole(user.id, role)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Select onValueChange={(role) => handleAddRole(user.id, role)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Add role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
