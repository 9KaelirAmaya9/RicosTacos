import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RoleManagement } from "@/components/admin/RoleManagement";

const AdminRoles = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-3xl font-bold">User Role Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage admin and kitchen staff access permissions
          </p>
        </div>
        
        <RoleManagement />
      </div>
    </div>
  );
};

export default AdminRoles;
