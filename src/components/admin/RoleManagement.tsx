import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, UserCog, Shield, ChefHat, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; role: string } | null>(null);

  // Incrementing this key forces each user's <Select> to unmount+remount after
  // a successful role add, resetting the displayed value back to the placeholder.
  const [selectEpoch, setSelectEpoch] = useState(0);

  // Grant-by-email state
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRole, setGrantRole] = useState<AppRole | "">("");
  const [isGranting, setIsGranting] = useState(false);

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

        // Email resolution priority: current user → orders → profile name hint → UUID prefix
        let email = "";
        if (userId === currentUser?.id) {
          email = currentUser.email || "";
        } else if (emailMap.has(userId)) {
          email = emailMap.get(userId)!;
        } else if (profile?.name) {
          // Profile name was auto-set from email prefix on signup — use it as hint
          email = `${profile.name} (email unknown)`;
        } else {
          email = `${userId.substring(0, 8)}…`;
        }

        return {
          id: userId,
          email,
          name: profile?.name || null,
          roles: userRoles,
        };
      });

      // Sort: users with roles first, then by name/email
      usersWithRoles.sort((a, b) => {
        if (b.roles.length !== a.roles.length) return b.roles.length - a.roles.length;
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
    if (isMutating) return;

    // Guard: prevent duplicate roles before hitting the DB
    const user = users.find(u => u.id === userId);
    if (user?.roles.includes(role)) {
      toast.info(`User already has the "${role}" role`);
      setSelectEpoch(e => e + 1); // still reset the Select
      return;
    }

    setIsMutating(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as AppRole });

      if (error) throw error;

      toast.success(`Role "${role}" added successfully`);
      setSelectEpoch(e => e + 1); // reset all Select dropdowns
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to add role");
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as AppRole);

      if (error) throw error;

      toast.success(`Role "${role}" removed successfully`);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove role");
    } finally {
      setIsMutating(false);
    }
  };

  // Grant a role by email address — looks the user up via their orders or profiles
  const handleGrantByEmail = async () => {
    const email = grantEmail.trim().toLowerCase();
    if (!email || !grantRole) {
      toast.error("Enter an email address and select a role");
      return;
    }

    setIsGranting(true);
    try {
      // Step 1: Find user_id from orders (most reliable email source)
      let userId: string | null = null;

      const { data: orderMatch } = await supabase
        .from("orders")
        .select("user_id")
        .ilike("customer_email", email)
        .not("user_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (orderMatch?.user_id) {
        userId = orderMatch.user_id;
      }

      if (!userId) {
        toast.error(
          "No account found with that email. The staff member must sign up first, then you can assign their role here or by searching their profile."
        );
        return;
      }

      // Step 2: Check for existing role
      const existingUser = users.find(u => u.id === userId);
      if (existingUser?.roles.includes(grantRole)) {
        toast.info(`That user already has the "${grantRole}" role`);
        return;
      }

      // Step 3: Insert role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: grantRole as AppRole });

      if (error) throw error;

      toast.success(`Role "${grantRole}" granted to ${email}`);
      setGrantEmail("");
      setGrantRole("");
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to grant role");
    } finally {
      setIsGranting(false);
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
    <div className="space-y-6">
      {/* Grant role by email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Grant Role by Email
          </CardTitle>
          <CardDescription>
            Assign a role to a staff member using their account email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="staff@example.com"
              value={grantEmail}
              onChange={e => setGrantEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGrantByEmail()}
              disabled={isGranting}
              className="flex-1"
            />
            <Select
              value={grantRole}
              onValueChange={v => setGrantRole(v as AppRole)}
              disabled={isGranting}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleGrantByEmail}
              disabled={isGranting || !grantEmail.trim() || !grantRole}
              className="shrink-0"
            >
              {isGranting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Granting…</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />Grant Role</>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The staff member must have an account before a role can be assigned.
          </p>
        </CardContent>
      </Card>

      {/* User list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            All registered accounts — assign or remove admin and kitchen roles
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
                  <div className="font-medium truncate">
                    {user.name || <span className="text-muted-foreground italic">No name</span>}
                  </div>
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
                            onClick={() => !isMutating && setRemoveTarget({ userId: user.id, role })}
                            className="ml-1 hover:text-destructive disabled:opacity-40"
                            disabled={isMutating}
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* key={selectEpoch} forces a remount after any successful add,
                      resetting the displayed value back to the placeholder */}
                  <Select
                    key={`${user.id}-${selectEpoch}`}
                    onValueChange={(role) => handleAddRole(user.id, role)}
                    disabled={isMutating}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={isMutating ? "Saving…" : "Add role"} />
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

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove role "{removeTarget?.role}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke {removeTarget?.role} access for this user. They will be redirected on their next action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) {
                  handleRemoveRole(removeTarget.userId, removeTarget.role);
                  setRemoveTarget(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
