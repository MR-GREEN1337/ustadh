"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Shield, UserCheck, Settings, UserPlus, Trash2, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/services/ProfileService";

interface Guardian {
  id: number;
  parent: {
    id: number;
    username: string;
    full_name: string;
    email: string;
  };
  student: {
    id: number;
    username: string;
    full_name: string;
  };
  relationship: string;
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
}

interface GuardianManagementProps {
  initialGuardians?: Guardian[];
  studentMode?: boolean;
}

export default function GuardianManagement({ initialGuardians = [], studentMode = true }: GuardianManagementProps) {
  const [guardians, setGuardians] = useState<Guardian[]>(initialGuardians);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({
    email: "",
    relationship: "parent",
    can_view: true,
    can_edit: false,
  });
  const { toast } = useToast();

  const fetchGuardians = async () => {
    setLoading(true);
    try {
      const data = await ProfileService.getGuardians();
      setGuardians(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch guardians. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = async () => {
    try {
      await ProfileService.addGuardian(
        newGuardian.email,
        newGuardian.relationship,
        newGuardian.can_view,
        newGuardian.can_edit
      );

      toast({
        title: "Guardian added",
        description: "The guardian has been added successfully.",
      });

      // Reset form and close dialog
      setNewGuardian({
        email: "",
        relationship: "parent",
        can_view: true,
        can_edit: false,
      });
      setAddDialogOpen(false);

      // Refresh guardians list
      fetchGuardians();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add guardian. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveGuardian = async (id: number) => {
    setDeleting(id);
    try {
      await ProfileService.removeGuardian(id);

      toast({
        title: "Guardian removed",
        description: "The guardian has been removed successfully.",
      });

      // Update guardians list
      setGuardians(guardians.filter(guardian => guardian.id !== id));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove guardian. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>
            {studentMode ? "Guardians & Monitors" : "Students You Monitor"}
          </CardTitle>
          <CardDescription>
            {studentMode
              ? "People who can monitor your learning progress"
              : "Students whose learning progress you can monitor"}
          </CardDescription>
        </div>
        {studentMode && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Add Guardian</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Guardian</DialogTitle>
                <DialogDescription>
                  Add a parent, teacher, or guardian to monitor your learning progress.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Guardian Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter their email address"
                    value={newGuardian.email}
                    onChange={(e) => setNewGuardian({...newGuardian, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select
                    value={newGuardian.relationship}
                    onValueChange={(value) => setNewGuardian({...newGuardian, relationship: value})}
                  >
                    <SelectTrigger id="relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="counselor">Counselor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="can-view">Can View Progress</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow this person to view your learning progress
                      </p>
                    </div>
                    <Switch
                      id="can-view"
                      checked={newGuardian.can_view}
                      onCheckedChange={(checked) => setNewGuardian({...newGuardian, can_view: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="can-edit">Can Edit Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow this person to edit your profile and settings
                      </p>
                    </div>
                    <Switch
                      id="can-edit"
                      checked={newGuardian.can_edit}
                      onCheckedChange={(checked) => setNewGuardian({...newGuardian, can_edit: checked})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddGuardian}>Add Guardian</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : guardians.length > 0 ? (
          <div className="space-y-4">
            {guardians.map((guardian) => (
              <div key={guardian.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                        studentMode ? guardian.parent.username : guardian.student.username
                      }`}
                    />
                    <AvatarFallback>
                      {studentMode
                        ? guardian.parent.full_name?.charAt(0) || guardian.parent.username?.charAt(0)
                        : guardian.student.full_name?.charAt(0) || guardian.student.username?.charAt(0)
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {studentMode ? guardian.parent.full_name : guardian.student.full_name}
                    </h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {guardian.relationship}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {guardian.can_view && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      <span>View</span>
                    </Badge>
                  )}
                  {guardian.can_edit && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      <span>Edit</span>
                    </Badge>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deleting === guardian.id}
                      >
                        {deleting === guardian.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {studentMode
                            ? `This will remove ${guardian.parent.full_name} as your guardian. They will no longer be able to monitor your progress.`
                            : `This will remove your connection to ${guardian.student.full_name}. You will no longer be able to monitor their progress.`
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleRemoveGuardian(guardian.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {studentMode
                ? "No Guardians Connected"
                : "No Students Connected"
              }
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {studentMode
                ? "Connect with a parent or guardian to allow them to monitor your learning progress."
                : "Connect with students to monitor their learning progress."
              }
            </p>
            {studentMode && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setAddDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Guardian</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
